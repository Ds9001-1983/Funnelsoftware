import { createHash, randomUUID } from "node:crypto";
import { constants, promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { eq, inArray, sql } from "drizzle-orm";
import { bugReports, erasureJournalIdentity, erasureJournalReceipts, funnels, leads, mediaAssets, ownedUploads, users } from "@shared/schema";
import { db } from "./db";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const hashSchema = z.string().regex(/^[a-f0-9]{64}$/);
const fileSchema = z.object({
  area: z.enum(["public", "support"]),
  filename: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,254}$/).refine(name => !name.includes("..")),
}).strict();
const targetSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("account"), key: z.string().uuid(), files: z.array(fileSchema) }).strict(),
  z.object({ type: z.literal("leads"), keys: z.array(z.string().uuid()).min(1) }).strict(),
  z.object({ type: z.literal("retention_leads"), keys: z.array(z.string().uuid()).min(1).max(20) }).strict(),
]);
export type ErasureTarget = z.infer<typeof targetSchema>;
const anchorSchema = z.object({ version: z.literal(1), instanceId: z.string().uuid() }).strict();
const entrySchema = z.object({
  version: z.literal(1), instanceId: z.string().uuid(), sequence: z.number().int().positive(),
  previousHash: hashSchema, requestedAt: z.string().datetime(), target: targetSchema,
}).strict();
const envelopeSchema = z.object({ entry: entrySchema, hash: hashSchema }).strict();
export const checkpointSchema = z.object({
  version: z.literal(1), instanceId: z.string().uuid(), sequence: z.number().int().nonnegative(), hash: hashSchema,
}).strict();
export type JournalCheckpoint = z.infer<typeof checkpointSchema>;
type Envelope = z.infer<typeof envelopeSchema>;

export class ErasureJournalError extends Error {
  constructor() { super("Löschjournal nicht vollständig abgeglichen. Wiederherstellung prüfen; Anwendung bleibt gesperrt."); }
}

export function journalDirectory(): string | undefined {
  const directory = process.env.ERASURE_JOURNAL_DIR ?? (process.env.NODE_ENV === "production" ? "/var/lib/funnelflow/erasure-journal" : undefined);
  if (!directory) {
    // Development and unrelated isolated tests do not operate production data.
    if (process.env.NODE_ENV === "production") throw new ErasureJournalError();
    return undefined;
  }
  if (!path.isAbsolute(directory)) throw new ErasureJournalError();
  const relative = path.relative(process.cwd(), directory);
  if (process.env.NODE_ENV === "production" && (!relative || (!relative.startsWith(`..${path.sep}`) && relative !== ".."))) throw new ErasureJournalError();
  return directory;
}

async function readPrivateJson(filename: string): Promise<unknown> {
  const handle = await fs.open(filename, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || (stat.mode & 0o077) !== 0) throw new ErasureJournalError();
    return JSON.parse(await handle.readFile("utf8"));
  } finally { await handle.close(); }
}

async function syncDirectory(directory: string) {
  const handle = await fs.open(directory, constants.O_RDONLY | constants.O_NOFOLLOW);
  try { await handle.sync(); } finally { await handle.close(); }
}

/** Publish a complete fsynced record without ever replacing an existing one.
 * A crash can leave an ignored temporary file, never a truncated visible entry. */
async function publish(directory: string, name: string, value: unknown) {
  const temporary = path.join(directory, `.tmp-${randomUUID()}`);
  const handle = await fs.open(temporary, "wx", 0o600);
  try { await handle.writeFile(JSON.stringify(value) + "\n"); await handle.sync(); }
  finally { await handle.close(); }
  try { await fs.link(temporary, path.join(directory, name)); await syncDirectory(directory); }
  finally { await fs.unlink(temporary).catch(() => undefined); }
}

export async function readJournal(directory: string) {
  try {
    const stat = await fs.lstat(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink() || (stat.mode & 0o077) !== 0) throw new ErasureJournalError();
    const anchor = anchorSchema.parse(await readPrivateJson(path.join(directory, "anchor.json")));
    const names = (await fs.readdir(directory)).filter(name => !name.startsWith(".tmp-")).sort();
    const entries: Envelope[] = [];
    let hash = digest(anchor);
    for (const name of names) {
      if (name === "anchor.json") continue;
      const sequence = entries.length + 1;
      if (name !== `${String(sequence).padStart(12, "0")}.json`) throw new ErasureJournalError();
      const record = envelopeSchema.parse(await readPrivateJson(path.join(directory, name)));
      if (record.entry.sequence !== sequence || record.entry.instanceId !== anchor.instanceId
        || record.entry.previousHash !== hash || digest(record.entry) !== record.hash) throw new ErasureJournalError();
      entries.push(record); hash = record.hash;
    }
    return { entries, checkpoint: { ...anchor, sequence: entries.length, hash } satisfies JournalCheckpoint };
  } catch { throw new ErasureJournalError(); }
}

// Lock BEFORE account/lead rows. This serializes deletion writers and startup
// checks across app processes. Restored copies only read the independent log.
export async function lockErasureJournal(tx: Transaction) {
  if (journalDirectory()) await tx.execute(sql`SELECT pg_advisory_xact_lock(734193829)`);
}

export async function boundJournal(tx: Transaction, directory: string) {
  const journal = await readJournal(directory);
  const [identity] = await tx.select().from(erasureJournalIdentity).where(eq(erasureJournalIdentity.id, 1));
  if (!identity || identity.instanceId !== journal.checkpoint.instanceId) throw new ErasureJournalError();
  const receipts = await tx.select().from(erasureJournalReceipts);
  for (const receipt of receipts) {
    if (journal.entries[receipt.sequence - 1]?.hash !== receipt.hash) throw new ErasureJournalError();
  }
  return journal;
}

/** Explicit, one-time initialization. Never recreate a missing journal for an
 * already-bound database: that could silently forget past erasures. */
export async function initializeErasureJournal(directory: string) {
  return db.transaction(async tx => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(734193829)`);
    const [identity] = await tx.select().from(erasureJournalIdentity).where(eq(erasureJournalIdentity.id, 1));
    if (identity) return (await boundJournal(tx, directory)).checkpoint;
    if ((await tx.select().from(erasureJournalReceipts)).length) throw new ErasureJournalError();
    await fs.mkdir(directory, { mode: 0o700 });
    await syncDirectory(path.dirname(directory));
    const anchor = { version: 1 as const, instanceId: randomUUID() };
    await publish(directory, "anchor.json", anchor);
    await tx.insert(erasureJournalIdentity).values({ id: 1, instanceId: anchor.instanceId });
    return (await readJournal(directory)).checkpoint;
  });
}

/** Write-ahead intent: once durable, this authorized request is irrevocable.
 * If SQL/file cleanup fails, replay still removes these exact identities. */
export async function recordErasure(tx: Transaction, target: ErasureTarget) {
  const directory = journalDirectory();
  if (!directory) return;
  try {
    const { checkpoint } = await boundJournal(tx, directory);
    const entry = entrySchema.parse({
      version: 1, instanceId: checkpoint.instanceId, sequence: checkpoint.sequence + 1,
      previousHash: checkpoint.hash, requestedAt: new Date().toISOString(), target,
    });
    const hash = digest(entry);
    await publish(directory, `${String(entry.sequence).padStart(12, "0")}.json`, { entry, hash });
    await tx.insert(erasureJournalReceipts).values({ sequence: entry.sequence, hash });
  } catch { throw new ErasureJournalError(); }
}

async function filePath(root: string, file: z.infer<typeof fileSchema>) {
  const parts = file.area === "public" ? ["uploads"] : ["private-uploads", "bug-reports"];
  let parent = root;
  for (const part of parts) {
    parent = path.join(parent, part);
    try {
      const stat = await fs.lstat(parent);
      if (!stat.isDirectory() || stat.isSymbolicLink()) throw new ErasureJournalError();
    } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  }
  return path.join(parent, file.filename);
}

async function assertNoErasedData(tx: Transaction, entries: Envelope[], root: string, allowWaitingRetention = false) {
  for (const { entry } of entries) {
    const target = entry.target;
    if (target.type === "retention_leads" && allowWaitingRetention) continue;
    if (target.type === "leads" || target.type === "retention_leads") {
      if ((await tx.select({ id: leads.id }).from(leads).where(inArray(leads.uuid, target.keys)).limit(1)).length) throw new ErasureJournalError();
    } else {
      if ((await tx.select({ id: users.id }).from(users).where(eq(users.erasureKey, target.key)).limit(1)).length) throw new ErasureJournalError();
      for (const file of target.files) {
        try { await fs.lstat(await filePath(root, file)); }
        catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") continue; throw error; }
        throw new ErasureJournalError();
      }
    }
  }
}

/** Runs before routes, schedulers and mail workers. Receipts alone are not
 * sufficient: an independently restored upload archive can resurrect files. */
export async function assertErasureJournalReady(root = process.cwd()) {
  const directory = journalDirectory();
  if (!directory) return;
  await db.transaction(async tx => {
    await lockErasureJournal(tx);
    const journal = await boundJournal(tx, directory);
    await assertNoErasedData(tx, journal.entries, root, true);
    // Resolve an interrupted response/commit or an already retried deletion.
    for (const record of journal.entries) {
      await tx.insert(erasureJournalReceipts).values({ sequence: record.entry.sequence, hash: record.hash }).onConflictDoNothing();
    }
  });
}

/** Offline restore only; the caller pins a fresh, independently obtained head.
 * Numeric IDs never select targets. Reapplying is safe and repairs counters. */
export async function replayErasureJournal(directory: string, root: string, expected: JournalCheckpoint) {
  const checkpoint = checkpointSchema.parse(expected);
  return db.transaction(async tx => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(734193829)`);
    const journal = await boundJournal(tx, directory);
    if (JSON.stringify(journal.checkpoint) !== JSON.stringify(checkpoint)) throw new ErasureJournalError();
    let accounts = 0, leadCount = 0;
    for (const { entry, hash } of journal.entries) {
      const target = entry.target;
      if (target.type === "leads" || target.type === "retention_leads") {
        const removed = await tx.delete(leads).where(inArray(leads.uuid, target.keys)).returning({ funnelId: leads.funnelId });
        const counts = new Map<number, number>();
        for (const lead of removed) counts.set(lead.funnelId, (counts.get(lead.funnelId) ?? 0) + 1);
        for (const [funnelId, count] of Array.from(counts)) await tx.update(funnels).set({ leads: sql`GREATEST(${funnels.leads} - ${count}, 0)` }).where(eq(funnels.id, funnelId));
        leadCount += removed.length;
      } else {
        const [owner] = await tx.select({ id: users.id }).from(users).where(eq(users.erasureKey, target.key)).for("update");
        const files = [...target.files];
        if (owner) {
          // A snapshot taken after an interrupted request may include further
          // files. Recover their recorded ownership before the FK cascade.
          files.push(...await tx.select({ filename: ownedUploads.filename, area: ownedUploads.area }).from(ownedUploads).where(eq(ownedUploads.userId, owner.id)));
          const images = await tx.select({ filename: mediaAssets.filename }).from(mediaAssets).where(eq(mediaAssets.userId, owner.id));
          files.push(...images.map(file => ({ ...file, area: "public" as const })));
          const reports = await tx.select({ screenshot: bugReports.screenshotPath, attachment: bugReports.attachmentPath }).from(bugReports).where(eq(bugReports.userId, owner.id));
          for (const report of reports) for (const filename of [report.screenshot, report.attachment]) if (filename) files.push({ filename, area: "support" });
        }
        // Validate ALL paths before deleting the first file.
        const paths = await Promise.all(files.map(file => filePath(root, fileSchema.parse(file))));
        if (files.length) {
          const ownership = await tx.select({ key: users.erasureKey }).from(ownedUploads)
            .innerJoin(users, eq(users.id, ownedUploads.userId))
            .where(inArray(ownedUploads.filename, files.map(file => file.filename)));
          if (ownership.some(owner => owner.key !== target.key)) throw new ErasureJournalError();
        }
        for (const filename of Array.from(new Set(paths))) {
          try { await fs.unlink(filename); }
          catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
        }
        const removed = await tx.delete(users).where(eq(users.erasureKey, target.key)).returning({ id: users.id });
        for (const user of removed) await tx.execute(sql`DELETE FROM "session" WHERE sess->'passport'->>'user' = ${String(user.id)}`);
        accounts += removed.length;
      }
      await tx.insert(erasureJournalReceipts).values({ sequence: entry.sequence, hash }).onConflictDoNothing();
    }
    await assertNoErasedData(tx, journal.entries, root);
    // No approval survives a concurrently advancing source journal.
    if (JSON.stringify((await readJournal(directory)).checkpoint) !== JSON.stringify(checkpoint)) throw new ErasureJournalError();
    return { accounts, leads: leadCount, checkpoint };
  });
}

/** Durable automatic intents are authoritative even if their SQL transaction
 * failed. No DB-only pending flag can miss a filesystem/commit interruption. */
export async function committedRetentionKeys(): Promise<Set<string>> {
  const directory = journalDirectory();
  if (!directory) return new Set();
  const journal = await readJournal(directory);
  return new Set(journal.entries.flatMap(({ entry }) => entry.target.type === "retention_leads" ? entry.target.keys : []));
}
export class RetentionCommittedError extends Error {
  status = 409;
  code = "RETENTION_COMMITTED";
  constructor() { super("Die Löschung ist bereits verbindlich beauftragt und wartet auf ihre gesicherte Ausführung. Änderungen sind nicht mehr möglich."); }
}
export async function assertRetentionEditable(key: string) {
  if ((await committedRetentionKeys()).has(key)) throw new RetentionCommittedError();
}
/** A receipt covers an immutable prefix; freshness never substitutes for the
 * exact sequence/hash comparison made while holding the journal writer lock. */
export async function externalJournalReceipt(directory: string, journal: Awaited<ReturnType<typeof readJournal>>) {
  try {
    const root = `${path.resolve(directory)}-offsite`;
    const stat = await fs.lstat(root);
    if (!stat.isDirectory() || stat.isSymbolicLink() || (stat.mode & 0o077)) return null;
    const receipt = z.object({ version: z.literal(1), checkpoint: checkpointSchema, confirmedAt: z.string().datetime() }).strict()
      .parse(await readPrivateJson(path.join(root, "receipt.json")));
    const head = receipt.checkpoint;
    const hash = head.sequence ? journal.entries[head.sequence - 1]?.hash : digest({ version: 1, instanceId: journal.checkpoint.instanceId });
    const age = Date.now() - Date.parse(receipt.confirmedAt);
    if (head.instanceId !== journal.checkpoint.instanceId || hash !== head.hash || age < 0 || age > 15 * 60_000) return null;
    return receipt;
  } catch { return null; }
}
