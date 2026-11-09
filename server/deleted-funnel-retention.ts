import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, inArray, not, sql } from "drizzle-orm";
import { deletedFunnelRetention, funnels, users } from "@shared/schema";
import { DELETED_FUNNEL_STATES, deletedFunnelRetentionSchema, type DeletedFunnelRetentionInput, type DeletedFunnelRetentionPreview, type DeletedFunnelState } from "@shared/deleted-funnel-retention-contract";
import { retentionActivationSchema, type RetentionActivationInput } from "@shared/retention-contract";
import { db } from "./db";
import { RetentionError } from "./retention";
import { accountErasurePending, boundJournal, committedFunnelKeys, externalJournalReceipt, journalDirectory, lockErasureJournal, readJournal, recordErasure } from "./erasure-journal";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
const secret = process.env.SESSION_SECRET || randomBytes(32).toString("hex");
const sign = (ownerId: number, version: number, time: number) => `${time}.${createHmac("sha256", secret).update(`deleted-funnels.${ownerId}.${version}.${time}`).digest("hex")}`;
async function owner(tx: Tx, ownerId: number, lock = false) {
  const query = tx.select().from(users).where(and(eq(users.id, ownerId), sql`${users.emailVerifiedAt} IS NOT NULL AND ${users.deletedAt} IS NULL`));
  const [user] = await (lock ? query.for("update") : query);
  if (!user || await accountErasurePending(user)) throw new RetentionError(403, "Bestätigtes aktives Konto erforderlich");
}
const conflict = () => new RetentionError(409, "Die Angaben wurden inzwischen geändert. Bitte neu laden.");
async function backupReady() {
  const directory = journalDirectory();
  if (!directory) return false;
  try {
    const journal = await readJournal(directory), receipt = await externalJournalReceipt(directory, journal);
    return !!receipt && receipt.checkpoint.sequence === journal.checkpoint.sequence;
  } catch { return false; }
}
export async function saveDeletedFunnelRetention(ownerId: number, raw: DeletedFunnelRetentionInput) {
  const { expectedVersion, ...input } = deletedFunnelRetentionSchema.parse(raw);
  return db.transaction(async tx => {
    await lockErasureJournal(tx); await owner(tx, ownerId, true);
    const [rule] = await tx.select().from(deletedFunnelRetention).where(eq(deletedFunnelRetention.userId, ownerId));
    if ((rule?.version ?? 0) !== expectedVersion) throw conflict();
    const values = { ...input, version: expectedVersion + 1, activeVersion: null, activatedAt: null, updatedAt: new Date() };
    await tx.insert(deletedFunnelRetention).values({ userId: ownerId, ...values })
      .onConflictDoUpdate({ target: deletedFunnelRetention.userId, set: values });
    return { ...input, version: values.version };
  });
}
// Keep correlated identifiers qualified even when Drizzle maps a single-table
// SELECT projection (which otherwise strips column qualification inside SQL).
const leadCount = sql<number>`(SELECT count(*)::int FROM leads AS retained_lead WHERE retained_lead.funnel_id = "funnels"."id")`;
const domainCount = sql<number>`(SELECT count(*)::int FROM domains AS retained_domain WHERE retained_domain.funnel_id = "funnels"."id")`;
export async function previewDeletedFunnelRetention(ownerId: number, page = 0): Promise<DeletedFunnelRetentionPreview> {
  if (!Number.isSafeInteger(page) || page < 0 || page > 1_000_000) throw new RetentionError(400, "Ungültige Seite");
  return db.transaction(async tx => {
    await owner(tx, ownerId);
    const [stored] = await tx.select().from(deletedFunnelRetention).where(eq(deletedFunnelRetention.userId, ownerId));
    const draft = stored ? { version: stored.version, days: stored.days, purpose: stored.purpose } : null;
    const now = new Date();
    const pending = Array.from(await committedFunnelKeys());
    const state = sql`CASE WHEN ${pending.length ? inArray(funnels.uuid, pending) : sql`false`} THEN 'committed'
      WHEN ${leadCount} > 0 OR ${domainCount} > 0 THEN 'blocked'
      WHEN ${!draft} OR ${funnels.deletedAt} > ${now.toISOString()}::timestamptz AT TIME ZONE 'UTC' THEN 'unknown'
      WHEN ${funnels.deletedAt} + ${draft?.days ?? 0} * interval '24 hours' <= ${now.toISOString()}::timestamptz AT TIME ZONE 'UTC' THEN 'due'
      ELSE 'waiting' END`;
    const scope = and(eq(funnels.userId, ownerId), sql`${funnels.deletedAt} IS NOT NULL`);
    const grouped = await tx.select({ state: state.as("state"), count: sql<number>`count(*)::int` }).from(funnels).where(scope).groupBy(sql`1`);
    const counts = Object.fromEntries(DELETED_FUNNEL_STATES.map(key => [key, 0])) as Record<DeletedFunnelState, number>;
    for (const row of grouped) counts[row.state as DeletedFunnelState] = row.count;
    const pageSize = 50;
    const items = await tx.select({ id: funnels.id, name: funnels.name, state: state.as("state"), leads: leadCount, domains: domainCount,
      deletedAt: sql<string>`to_char(${funnels.deletedAt}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')` })
      .from(funnels).where(scope).orderBy(funnels.id).limit(pageSize).offset(page * pageSize);
    return { draft, automaticDeletion: !!stored && stored.activeVersion === stored.version, backupReady: await backupReady(),
      previewToken: draft ? sign(ownerId, draft.version, now.getTime()) : "", asOf: now.toISOString(),
      counts, total: Object.values(counts).reduce((a, b) => a + b, 0), page, pageSize,
      items: items.map(item => ({ ...item, state: item.state as DeletedFunnelState })) };
  }, { isolationLevel: "repeatable read", accessMode: "read only" });
}
export async function activateDeletedFunnelRetention(ownerId: number, raw: RetentionActivationInput) {
  const input = retentionActivationSchema.parse(raw);
  await db.transaction(async tx => {
    await lockErasureJournal(tx); await owner(tx, ownerId, true);
    const [rule] = await tx.select().from(deletedFunnelRetention).where(eq(deletedFunnelRetention.userId, ownerId));
    if (!rule || rule.version !== input.expectedVersion) throw conflict();
    if (input.active) {
      const received = input.previewToken ?? "", time = Number(received.split(".")[0]);
      const expected = sign(ownerId, rule.version, time);
      if (!input.confirmed || !Number.isSafeInteger(time) || Date.now() < time || Date.now() - time > 5 * 60_000
        || Buffer.byteLength(received) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(received), Buffer.from(expected))) {
        throw new RetentionError(409, "Bitte lade die Vorschau neu und bestätige die endgültige Funnel-Löschung ausdrücklich.");
      }
      if (!await backupReady()) throw new RetentionError(503, "Die externe Sicherung ist noch nicht bestätigt. Bitte später erneut versuchen.");
    }
    const version = rule.version + 1;
    await tx.update(deletedFunnelRetention).set({ version, activeVersion: input.active ? version : null,
      activatedAt: input.active ? new Date() : null, updatedAt: new Date() }).where(eq(deletedFunnelRetention.userId, ownerId));
  });
  return previewDeletedFunnelRetention(ownerId);
}

/** Only explicitly soft-deleted, empty funnels qualify. Lead exceptions are
 * protected by blocking on every remaining lead, including queued lead erasures.
 * Domains must be detached through their existing managed removal workflow. */
export async function runDeletedFunnelRetentionBatch() {
  const directory = journalDirectory();
  if (!directory) return { queued: 0, deleted: 0, waitingForBackup: true };
  return db.transaction(async tx => {
    await lockErasureJournal(tx);
    const journal = await boundJournal(tx, directory), receipt = await externalJournalReceipt(directory, journal);
    if (!receipt) return { queued: 0, deleted: 0, waitingForBackup: true };
    let deleted = 0;
    const pending = journal.entries.flatMap(({ entry }) => entry.target.type === "queued_funnels" ? entry.target.keys : []);
    for (const { entry } of journal.entries) {
      if (entry.sequence > receipt.checkpoint.sequence || deleted >= 3) break;
      if (entry.target.type !== "queued_funnels") continue;
      const rows = await tx.select({ id: funnels.id }).from(funnels).where(and(inArray(funnels.uuid, entry.target.keys), sql`${funnels.deletedAt} IS NOT NULL`, sql`${leadCount} = 0 AND ${domainCount} = 0`))
        .orderBy(funnels.id).limit(3 - deleted).for("update");
      // FK inserts serialize on these locks. A recheck handles dependencies that
      // committed while the first SELECT was waiting for a row lock.
      for (const row of rows) {
        const removed = await tx.delete(funnels).where(and(eq(funnels.id, row.id), sql`${leadCount} = 0 AND ${domainCount} = 0`)).returning({ id: funnels.id });
        deleted += removed.length;
      }
    }
    if (receipt.checkpoint.sequence !== journal.checkpoint.sequence) return { queued: 0, deleted, waitingForBackup: true };
    const accountKeys = journal.entries.flatMap(({ entry }) => entry.target.type === "queued_account" ? [entry.target.key] : []);
    const candidates = await tx.select({ id: funnels.id, key: funnels.uuid }).from(funnels)
      .innerJoin(deletedFunnelRetention, eq(deletedFunnelRetention.userId, funnels.userId)).innerJoin(users, eq(users.id, funnels.userId))
      .where(and(sql`${deletedFunnelRetention.activeVersion} = ${deletedFunnelRetention.version}`,
        sql`${users.deletedAt} IS NULL AND ${users.emailVerifiedAt} IS NOT NULL AND ${funnels.deletedAt} IS NOT NULL`,
        sql`${funnels.deletedAt} <= ${new Date().toISOString()}::timestamptz AT TIME ZONE 'UTC' - ${deletedFunnelRetention.days} * interval '24 hours'`,
        sql`${leadCount} = 0 AND ${domainCount} = 0`,
        pending.length ? not(inArray(funnels.uuid, pending)) : sql`true`,
        accountKeys.length ? not(inArray(users.erasureKey, accountKeys)) : sql`true`,
      )).orderBy(funnels.id).limit(3).for("update", { of: funnels });
    const keys: string[] = [];
    for (const candidate of candidates) {
      const [current] = await tx.select({ leads: leadCount, domains: domainCount, deletedAt: funnels.deletedAt }).from(funnels).where(eq(funnels.id, candidate.id));
      if (current?.deletedAt && !current.leads && !current.domains) keys.push(candidate.key);
    }
    if (keys.length) await recordErasure(tx, { type: "queued_funnels", keys });
    return { queued: keys.length, deleted, waitingForBackup: keys.length > 0 };
  });
}
export function startDeletedFunnelRetentionWorker() {
  if (process.env.DISABLE_RETENTION_WORKER === "1" || process.env.DISABLE_SCHEDULER || !journalDirectory()) return;
  let running = false;
  const run = async () => {
    if (running) return; running = true;
    try { await runDeletedFunnelRetentionBatch(); }
    catch { console.error("[funnel-retention] Lauf fehlgeschlagen; gesicherte Aufträge werden erneut geprüft."); }
    finally { running = false; }
  };
  void run(); setInterval(() => void run(), 60_000).unref();
}
