import { and, eq, inArray, sql } from "drizzle-orm";
import { promises as fs } from "node:fs";
import { db } from "./db";
import { leads, ownedUploads, recruitingMailJobs, users } from "@shared/schema";
import { boundJournal, readJournal, externalJournalReceipt, filePath, journalDirectory, lockErasureJournal, recordErasure, type ErasureTarget } from "./erasure-journal";
import { collectAccountFiles } from "./account-files";
import { closeAccountBilling } from "./stripe";

// Same per-lead lock as the recruiting/retention workers, without an import cycle.
const MAIL_LOCK = 734193830;
type AccountTarget = Extract<ErasureTarget, { type: "queued_account" }>;
let nextCandidate = 0;

/** At most three accounts per tick. A failed account remains fenced and cannot
 * prevent subsequent accounts from being considered in the same tick. */
export async function runAccountErasureBatch(options: {
  root?: string; closeBilling?: typeof closeAccountBilling; removeFile?: typeof fs.unlink;
} = {}) {
  if ((options.closeBilling || options.removeFile || options.root) && process.env.NODE_ENV === "production") throw new Error("Testoptionen sind in Produktion gesperrt");
  const directory = journalDirectory();
  const result = { deleted: 0, waiting: 0, failed: 0 };
  if (!directory) return result;
  const latest = new Map<string, AccountTarget>();
  for (const { entry } of (await readJournal(directory)).entries) {
    if (entry.target.type === "queued_account") latest.set(entry.target.key, entry.target);
  }
  const keys = Array.from(latest.keys());
  if (!keys.length) return result;
  // Repair a SQL interruption independently of billing/file failures.
  await db.transaction(async tx => {
    await lockErasureJournal(tx);
    await boundJournal(tx, directory);
    await tx.update(users).set({ deletedAt: sql`COALESCE(${users.deletedAt}, now())` }).where(inArray(users.erasureKey, keys));
  });
  const present = new Set((await db.select({ key: users.erasureKey }).from(users).where(inArray(users.erasureKey, keys))).map(user => user.key));
  const candidates: string[] = [];
  for (const [key, target] of Array.from(latest)) {
    let filesRemain = false;
    if (!present.has(key) && target.billingClosed) {
      for (const file of target.files) {
        try { await fs.lstat(await filePath(options.root ?? process.cwd(), file)); filesRemain = true; break; }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
      }
    }
    if (present.has(key) || !target.billingClosed || filesRemain) candidates.push(key);
  }
  const start = nextCandidate % Math.max(candidates.length, 1);
  const batch = [...candidates.slice(start), ...candidates.slice(0, start)].slice(0, 3);
  nextCandidate = start + batch.length;
  for (const candidate of batch) {
    try {
      const deleted = await db.transaction(async tx => {
        await lockErasureJournal(tx);
        const journal = await boundJournal(tx, directory);
        const record = [...journal.entries].reverse().find(r => r.entry.target.type === "queued_account" && r.entry.target.key === candidate);
        if (!record) throw new Error("Kontoauftrag fehlt");
        const target = record.entry.target as AccountTarget;
        const [user] = await tx.select().from(users).where(eq(users.erasureKey, target.key)).for("update");
        // The journal preserves billing identity even if the restored dump
        // predates the Stripe customer or the entire account.
        if (!target.billingClosed) {
          const customers = Array.from(new Set([target.billingCustomerId, user?.stripeCustomerId].filter((id): id is string => !!id)));
          for (const customer of customers) await (options.closeBilling ?? closeAccountBilling)(customer);
          await recordErasure(tx, { ...target, billingClosed: true });
          return false; // The billing closure must reach the Mac as well.
        }
        const receipt = await externalJournalReceipt(directory, journal);
        if (!receipt || receipt.checkpoint.sequence < record.entry.sequence) return false;
        const ownedLeads = user ? await tx.select({ id: leads.id }).from(leads).where(eq(leads.userId, user.id)) : [];
        for (const lead of ownedLeads) {
          const locked = await tx.execute(sql`SELECT pg_try_advisory_xact_lock(${MAIL_LOCK}::int, ${lead.id}::int) AS locked`);
          if (!locked.rows[0]?.locked) return false;
        }
        if (user && (await tx.select({ id: recruitingMailJobs.id }).from(recruitingMailJobs).where(and(eq(recruitingMailJobs.ownerId, user.id), eq(recruitingMailJobs.status, "processing"))).limit(1)).length) return false;
        const currentFiles = user ? await collectAccountFiles(tx, user.id) : [];
        const known = new Set(target.files.map(file => file.area + "/" + file.filename));
        if (currentFiles.some(file => !known.has(file.area + "/" + file.filename))) {
          // Additional ownership from an interrupted writer is not covered by
          // the old external receipt. Publish an expanded manifest and wait.
          const files = Array.from(new Map([...target.files, ...currentFiles].map(file => [file.area + "/" + file.filename, file])).values());
          await recordErasure(tx, { ...target, files });
          return false;
        }
        const filenames = target.files.map(file => file.filename);
        if (filenames.length) {
          const owners = await tx.select({ id: ownedUploads.userId }).from(ownedUploads).where(inArray(ownedUploads.filename, filenames));
          if (owners.some(owner => owner.id !== user?.id)) throw new Error("Abweichende Dateizuordnung");
        }
        const paths = await Promise.all(target.files.map(file => filePath(options.root ?? process.cwd(), file)));
        for (const filename of Array.from(new Set(paths))) {
          try { await (options.removeFile ?? fs.unlink)(filename); }
          catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
        }
        if (user) await tx.execute(sql`DELETE FROM "session" WHERE sess->'passport'->>'user' = ${String(user.id)}`);
        await tx.delete(users).where(eq(users.erasureKey, target.key));
        return true;
      });
      if (deleted) result.deleted++; else result.waiting++;
    } catch { result.failed++; }
  }
  if (result.failed) console.error("[account-erasure] Konten bleiben gesperrt; Abrechnung oder Dateibereinigung wird erneut geprüft.");
  return result;
}

export function startAccountErasureWorker() {
  if (process.env.DISABLE_RETENTION_WORKER === "1" || process.env.DISABLE_SCHEDULER || !journalDirectory()) return;
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try { await runAccountErasureBatch(); }
    catch { console.error("[account-erasure] Prüfung fehlgeschlagen; Aufträge bleiben verbindlich."); }
    finally { running = false; }
  };
  void run();
  setInterval(() => void run(), 60_000).unref();
}
