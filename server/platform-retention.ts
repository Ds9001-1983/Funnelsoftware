import { and, inArray, not, or, sql } from "drizzle-orm";
import { platformVisits } from "@shared/schema";
import { db } from "./db";
import { boundJournal, externalJournalReceipt, journalDirectory, lockErasureJournal, platformErasureScope, recordErasure } from "./erasure-journal";

export const PLATFORM_RETENTION_BATCH_SIZE = 500;
/** No activation or deletion period inferred from customer rules. */
export function platformRetentionDays(): number | null {
  const raw = process.env.PLATFORM_ANALYTICS_RETENTION_DAYS;
  if (!raw) return null;
  if (!/^[1-9][0-9]*$/.test(raw) || Number(raw) > 36500) throw new Error("PLATFORM_ANALYTICS_RETENTION_DAYS muss 1 bis 36500 sein");
  return Number(raw);
}

export async function previewPlatformRetention(days: number, now = new Date()) {
  if (!Number.isInteger(days) || days < 1 || days > 36500) throw new Error("Ungültige Aufbewahrungsfrist");
  const before = new Date(now.getTime() - days * 86400000).toISOString();
  const [result] = await db.select({ count: sql<number>`count(*)::int`, maxId: sql<number | null>`max(${platformVisits.id})` })
    .from(platformVisits).where(sql`${platformVisits.timestamp} <= ${before}::timestamptz AT TIME ZONE 'UTC'`);
  return { days, before, ...result };
}

/** Durable intents survive SQL rollback and drain even after the rule is disabled. */
export async function runPlatformRetentionBatch(now = new Date()) {
  const days = platformRetentionDays(), directory = journalDirectory();
  if (!directory) return { queued: 0, deleted: 0, waitingForBackup: true };
  return db.transaction(async tx => {
    await lockErasureJournal(tx);
    const journal = await boundJournal(tx, directory), receipt = await externalJournalReceipt(directory, journal);
    if (!receipt) return { queued: 0, deleted: 0, waitingForBackup: true };
    const records = journal.entries.filter(record => record.entry.target.type === "platform_before");
    let deleted = 0;
    for (const record of records) {
      if (record.entry.sequence > receipt.checkpoint.sequence || deleted >= PLATFORM_RETENTION_BATCH_SIZE) break;
      if (record.entry.target.type !== "platform_before") continue;
      const rows = await tx.select({ id: platformVisits.id }).from(platformVisits).where(platformErasureScope(record.entry.target))
        .orderBy(platformVisits.id).limit(PLATFORM_RETENTION_BATCH_SIZE - deleted).for("update");
      if (rows.length) {
        await tx.delete(platformVisits).where(inArray(platformVisits.id, rows.map(row => row.id)));
        deleted += rows.length;
      }
    }
    if (receipt.checkpoint.sequence !== journal.checkpoint.sequence) return { queued: 0, deleted, waitingForBackup: true };
    const today = `${now.toISOString().slice(0, 10)}T00:00:00.000Z`;
    if (!days || records.some(record => record.entry.requestedAt >= today)) return { queued: 0, deleted, waitingForBackup: false };
    const before = new Date(now.getTime() - days * 86400000).toISOString();
    const targets = records.flatMap(record => record.entry.target.type === "platform_before" ? [record.entry.target] : []);
    const [range] = await tx.select({ count: sql<number>`count(*)::int`, maxId: sql<number | null>`max(${platformVisits.id})` }).from(platformVisits)
      .where(and(sql`${platformVisits.timestamp} <= ${before}::timestamptz AT TIME ZONE 'UTC'`,
        targets.length ? not(or(...targets.map(platformErasureScope))!) : sql`true`));
    if (range?.maxId) await recordErasure(tx, { type: "platform_before", before, maxId: range.maxId });
    return { queued: range?.count ?? 0, deleted, waitingForBackup: !!range?.count };
  });
}

export function startPlatformRetentionWorker() {
  // Validate before starting, even when no records are currently due.
  platformRetentionDays();
  if (process.env.DISABLE_RETENTION_WORKER === "1" || process.env.DISABLE_SCHEDULER || !journalDirectory()) return;
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try { await runPlatformRetentionBatch(); }
    catch { console.error("[platform-retention] Lauf fehlgeschlagen; gesicherte Aufträge werden erneut geprüft."); }
    finally { running = false; }
  };
  void run();
  setInterval(() => void run(), 60_000).unref();
}
