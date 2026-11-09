import { and, eq, inArray, not, or, sql } from "drizzle-orm";
import { analyticsEvents, funnelAnalyticsRetention, funnels, users } from "@shared/schema";
import { db } from "./db";
import { analyticsErasureScope, boundJournal, externalJournalReceipt, journalDirectory, lockErasureJournal, recordErasure } from "./erasure-journal";

export const ANALYTICS_RETENTION_BATCH_SIZE = 500;
const FUNNELS_PER_BATCH = 10;

export async function runAnalyticsRetentionBatch() {
  const directory = journalDirectory();
  if (!directory) return { queued: 0, deleted: 0, waitingForBackup: true };
  return db.transaction(async tx => {
    await lockErasureJournal(tx);
    const journal = await boundJournal(tx, directory);
    const receipt = await externalJournalReceipt(directory, journal);
    if (!receipt) return { queued: 0, deleted: 0, waitingForBackup: true };
    const records = journal.entries.filter(record => record.entry.target.type === "analytics_before");
    let deleted = 0;
    for (const record of records) {
      if (record.entry.sequence > receipt.checkpoint.sequence || deleted >= ANALYTICS_RETENTION_BATCH_SIZE) break;
      if (record.entry.target.type !== "analytics_before") continue;
      const rows = await tx.select({ id: analyticsEvents.id }).from(analyticsEvents).where(analyticsErasureScope(record.entry.target))
        .orderBy(analyticsEvents.id).limit(ANALYTICS_RETENTION_BATCH_SIZE - deleted).for("update");
      if (rows.length) {
        await tx.delete(analyticsEvents).where(inArray(analyticsEvents.id, rows.map(row => row.id)));
        deleted += rows.length;
      }
    }
    if (receipt.checkpoint.sequence !== journal.checkpoint.sequence) return { queued: 0, deleted, waitingForBackup: true };
    const targets = records.flatMap(record => record.entry.target.type === "analytics_before" ? [record.entry.target] : []);
    const accountKeys = journal.entries.flatMap(record => record.entry.target.type === "queued_account" ? [record.entry.target.key] : []);
    const now = new Date();
    // One range per funnel/UTC day avoids writing a permanent journal record
    // every minute for a busy funnel. Confirmed work still drains every minute.
    const dayStart = `${now.toISOString().slice(0, 10)}T00:00:00.000Z`;
    const queuedToday = records.flatMap(({ entry }) => entry.target.type === "analytics_before" && entry.requestedAt >= dayStart ? [entry.target.key] : []);
    const due = sql`${analyticsEvents.timestamp} <= ${now.toISOString()}::timestamptz AT TIME ZONE 'UTC' - ${funnelAnalyticsRetention.days} * interval '24 hours'`;
    const rules = await tx.select({ funnelId: funnels.id, key: funnels.uuid, days: funnelAnalyticsRetention.days })
      .from(funnelAnalyticsRetention).innerJoin(funnels, eq(funnels.id, funnelAnalyticsRetention.funnelId)).innerJoin(users, eq(users.id, funnels.userId))
      .where(and(sql`${funnelAnalyticsRetention.activeVersion} = ${funnelAnalyticsRetention.version}`,
        sql`${funnels.deletedAt} IS NULL AND ${users.deletedAt} IS NULL AND ${users.emailVerifiedAt} IS NOT NULL`,
        accountKeys.length ? not(inArray(users.erasureKey, accountKeys)) : sql`true`,
        queuedToday.length ? not(inArray(funnels.uuid, queuedToday)) : sql`true`,
        sql`EXISTS (SELECT 1 FROM ${analyticsEvents} WHERE ${analyticsEvents.funnelId} = ${funnels.id} AND ${due}
          AND ${targets.length ? not(or(...targets.map(analyticsErasureScope))!) : sql`true`})`,
      )).orderBy(funnels.id).limit(FUNNELS_PER_BATCH).for("update", { of: funnels });
    let queued = 0;
    for (const rule of rules) {
      const before = new Date(now.getTime() - rule.days * 86400000).toISOString();
      const [range] = await tx.select({ maxId: sql<number>`max(${analyticsEvents.id})`, count: sql<number>`count(*)::int` })
        .from(analyticsEvents).where(and(eq(analyticsEvents.funnelId, rule.funnelId),
          sql`${analyticsEvents.timestamp} <= ${before}::timestamptz AT TIME ZONE 'UTC'`,
          targets.length ? not(or(...targets.map(analyticsErasureScope))!) : sql`true`));
      if (range?.maxId) {
        await recordErasure(tx, { type: "analytics_before", key: rule.key, before, maxId: range.maxId });
        queued += range.count;
      }
    }
    return { queued, deleted, waitingForBackup: queued > 0 };
  });
}

export function startAnalyticsRetentionWorker() {
  if (process.env.DISABLE_RETENTION_WORKER === "1" || process.env.DISABLE_SCHEDULER || !journalDirectory()) return;
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try { await runAnalyticsRetentionBatch(); }
    catch { console.error("[analytics-retention] Lauf fehlgeschlagen; gesicherte Aufträge werden erneut geprüft."); }
    finally { running = false; }
  };
  void run();
  setInterval(() => void run(), 60_000).unref();
}
