import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "./db";
import { funnels, users, leads, funnelRetentionDrafts, leadRetentionExceptions, recruitingMailJobs } from "@shared/schema";
import { boundJournal, externalJournalReceipt, journalDirectory, lockErasureJournal, recordErasure } from "./erasure-journal";

export const RETENTION_BATCH_SIZE = 20;
export const RETENTION_MAIL_LOCK = 734193830;

/** A tick never waits for a Mac or SMTP transaction. It only acts on a proven
 * offsite prefix and commits at most 20 new intents / deletes at most 20 leads. */
export async function runRetentionBatch() {
  const directory = journalDirectory();
  if (!directory) return { queued: 0, deleted: 0, waitingForBackup: true };
  return db.transaction(async tx => {
    await lockErasureJournal(tx);
    const journal = await boundJournal(tx, directory);
    const receipt = await externalJournalReceipt(directory, journal);
    if (!receipt) return { queued: 0, deleted: 0, waitingForBackup: true };
    const pending = journal.entries.filter(r => r.entry.target.type === "retention_leads");
    const pendingKeys = pending.flatMap(r => r.entry.target.type === "retention_leads" ? r.entry.target.keys : []);
    let deleted = 0;
    // The intent is already irrevocable. Pausing a policy affects future intents,
    // not an authorized request that has been durably written to the journal.
    for (const record of pending) {
      if (record.entry.sequence > receipt.checkpoint.sequence || deleted >= RETENTION_BATCH_SIZE) break;
      if (record.entry.target.type !== "retention_leads") continue;
      const rows = await tx.select().from(leads).where(inArray(leads.uuid, record.entry.target.keys))
        .orderBy(leads.id).limit(RETENTION_BATCH_SIZE - deleted).for("update");
      for (const lead of rows) {
        const lock = await tx.execute(sql`SELECT pg_try_advisory_xact_lock(${RETENTION_MAIL_LOCK}::int, ${lead.id}::int) AS locked`);
        if (!lock.rows[0]?.locked) continue;
        const busy = await tx.select({ id: recruitingMailJobs.id }).from(recruitingMailJobs)
          .where(and(eq(recruitingMailJobs.leadId, lead.id), eq(recruitingMailJobs.status, "processing"))).limit(1);
        if (busy.length) continue;
        const removed = await tx.delete(leads).where(eq(leads.uuid, lead.uuid)).returning({ id: leads.id });
        if (!removed.length) continue;
        await tx.update(funnels).set({ leads: sql`GREATEST(${funnels.leads} - 1, 0)` }).where(eq(funnels.id, lead.funnelId));
        deleted++;
      }
    }
    // Do not add more irrevocable work while any journal tail is unconfirmed.
    if (receipt.checkpoint.sequence !== journal.checkpoint.sequence) return { queued: 0, deleted, waitingForBackup: true };
    const now = new Date().toISOString();
    const candidates = await tx.select({ lead: leads }).from(leads)
      .innerJoin(funnels, and(eq(funnels.id, leads.funnelId), eq(funnels.userId, leads.userId)))
      .innerJoin(users, eq(users.id, leads.userId))
      .innerJoin(funnelRetentionDrafts, eq(funnelRetentionDrafts.funnelId, leads.funnelId))
      .leftJoin(leadRetentionExceptions, eq(leadRetentionExceptions.leadId, leads.id))
      .where(and(
        sql`${funnelRetentionDrafts.activeVersion} = ${funnelRetentionDrafts.version}`,
        sql`${users.emailVerifiedAt} IS NOT NULL AND ${users.deletedAt} IS NULL AND ${funnels.deletedAt} IS NULL`,
        sql`${leadRetentionExceptions.reason} IS NULL`,
        sql`CASE WHEN ${funnelRetentionDrafts.mode} = 'general_leads'
          THEN ${leads.createdAt} <= ${now}::timestamptz AT TIME ZONE 'UTC' - ${funnelRetentionDrafts.days} * interval '24 hours'
          ELSE ${leads.status} IN ('converted', 'lost') AND ${leads.closedAt} IS NOT NULL
            AND ${leads.closedAt} <= ${now}::timestamptz AT TIME ZONE 'UTC' - ${funnelRetentionDrafts.days} * interval '24 hours' END`,
        pendingKeys.length ? sql`${leads.uuid} NOT IN (${sql.join(pendingKeys.map(key => sql`${key}`), sql`, `)})` : sql`true`,
        sql`NOT EXISTS (SELECT 1 FROM recruiting_mail_jobs busy WHERE busy.lead_id = ${leads.id} AND busy.status = 'processing')`,
      )).orderBy(leads.id).limit(RETENTION_BATCH_SIZE).for("update", { of: leads });
    const keys: string[] = [];
    for (const { lead } of candidates) {
      const lock = await tx.execute(sql`SELECT pg_try_advisory_xact_lock(${RETENTION_MAIL_LOCK}::int, ${lead.id}::int) AS locked`);
      if (!lock.rows[0]?.locked) continue;
      // Funnel removal does not take the journal lock, so lock/recheck it here.
      const [funnel] = await tx.select().from(funnels).where(eq(funnels.id, lead.funnelId)).for("update");
      if (!funnel || funnel.deletedAt || funnel.userId !== lead.userId) continue;
      keys.push(lead.uuid);
    }
    if (keys.length) await recordErasure(tx, { type: "retention_leads", keys });
    return { queued: keys.length, deleted, waitingForBackup: keys.length > 0 };
  });
}

export function startRetentionWorker() {
  if (process.env.DISABLE_RETENTION_WORKER === "1" || process.env.DISABLE_SCHEDULER || !journalDirectory()) return;
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try { await runRetentionBatch(); }
    catch { console.error("[retention] Lauf fehlgeschlagen; verbindliche Aufträge bleiben im Journal und werden erneut geprüft."); }
    finally { running = false; }
  };
  void run();
  setInterval(() => void run(), 60_000).unref();
}
