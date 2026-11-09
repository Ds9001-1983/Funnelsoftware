import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, or, sql } from "drizzle-orm";
import { analyticsEvents, funnelAnalyticsRetention, funnels, users } from "@shared/schema";
import { analyticsRetentionDraftSchema, type AnalyticsRetentionDraftInput, type AnalyticsRetentionPreview } from "@shared/analytics-retention-contract";
import { retentionActivationSchema, type RetentionActivationInput } from "@shared/retention-contract";
import { db } from "./db";
import { RetentionError } from "./retention";
import { accountErasurePending, analyticsErasureScope, externalJournalReceipt, journalDirectory, lockErasureJournal, readJournal } from "./erasure-journal";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
const secret = process.env.SESSION_SECRET || randomBytes(32).toString("hex");
function sign(ownerId: number, funnelId: number, version: number, time: number) {
  return `${time}.${createHmac("sha256", secret).update(`analytics.${ownerId}.${funnelId}.${version}.${time}`).digest("hex")}`;
}
async function ownerFunnel(tx: Tx, funnelId: number, ownerId: number, lock = false) {
  const query = tx.select({ uuid: funnels.uuid, owner: users }).from(funnels)
    .innerJoin(users, eq(users.id, funnels.userId))
    .where(and(eq(funnels.id, funnelId), eq(funnels.userId, ownerId),
      sql`${funnels.deletedAt} IS NULL AND ${users.deletedAt} IS NULL AND ${users.emailVerifiedAt} IS NOT NULL`));
  const [funnel] = await (lock ? query.for("update", { of: funnels }) : query);
  if (!funnel || await accountErasurePending(funnel.owner)) throw new RetentionError(404, "Funnel nicht gefunden");
  return funnel;
}
function conflict(): never { throw new RetentionError(409, "Die Angaben wurden inzwischen geändert. Bitte neu laden."); }
async function backupReady() {
  const directory = journalDirectory();
  if (!directory) return false;
  try {
    const journal = await readJournal(directory), receipt = await externalJournalReceipt(directory, journal);
    return !!receipt && receipt.checkpoint.sequence === journal.checkpoint.sequence;
  } catch { return false; }
}

export async function saveAnalyticsRetention(funnelId: number, ownerId: number, raw: AnalyticsRetentionDraftInput) {
  const { expectedVersion, ...input } = analyticsRetentionDraftSchema.parse(raw);
  return db.transaction(async tx => {
    await lockErasureJournal(tx);
    await ownerFunnel(tx, funnelId, ownerId, true);
    const [current] = await tx.select().from(funnelAnalyticsRetention).where(eq(funnelAnalyticsRetention.funnelId, funnelId));
    if ((current?.version ?? 0) !== expectedVersion) conflict();
    const version = expectedVersion + 1;
    const value = { ...input, version, activeVersion: null, activatedAt: null, updatedAt: new Date() };
    await tx.insert(funnelAnalyticsRetention).values({ funnelId, ...value })
      .onConflictDoUpdate({ target: funnelAnalyticsRetention.funnelId, set: value });
    return { ...input, version };
  });
}

/** Counts only, never contact data or arbitrary tracking metadata. */
export async function previewAnalyticsRetention(funnelId: number, ownerId: number): Promise<AnalyticsRetentionPreview> {
  return db.transaction(async tx => {
    const funnel = await ownerFunnel(tx, funnelId, ownerId);
    const [stored] = await tx.select().from(funnelAnalyticsRetention).where(eq(funnelAnalyticsRetention.funnelId, funnelId));
    const draft = stored ? { version: stored.version, days: stored.days, purpose: stored.purpose } : null;
    const now = new Date();
    const cutoff = draft ? new Date(now.getTime() - draft.days * 86400000).toISOString() : null;
    const directory = journalDirectory();
    const targets = directory ? (await readJournal(directory)).entries.flatMap(({ entry }) =>
      entry.target.type === "analytics_before" && entry.target.key === funnel.uuid ? [entry.target] : []) : [];
    const committed = targets.length ? or(...targets.map(analyticsErasureScope))! : sql`false`;
    const state = sql`CASE WHEN ${committed} THEN 'committed'
      WHEN ${cutoff === null} OR ${analyticsEvents.timestamp} > ${now.toISOString()}::timestamptz AT TIME ZONE 'UTC' THEN 'unknown'
      WHEN ${analyticsEvents.timestamp} <= ${cutoff}::timestamptz AT TIME ZONE 'UTC' THEN 'due'
      ELSE 'waiting' END`;
    const rows = await tx.select({ eventType: analyticsEvents.eventType, state: state.as("state"), count: sql<number>`count(*)::int` })
      .from(analyticsEvents).where(eq(analyticsEvents.funnelId, funnelId)).groupBy(analyticsEvents.eventType, sql`2`);
    const counts: AnalyticsRetentionPreview["counts"] = { due: 0, waiting: 0, unknown: 0, committed: 0 };
    const types = new Map<string, AnalyticsRetentionPreview["eventTypes"][number]>();
    for (const row of rows) {
      const state = row.state as keyof typeof counts;
      counts[state] += row.count;
      const type = types.get(row.eventType) ?? { eventType: row.eventType, total: 0, due: 0, committed: 0 };
      type.total += row.count;
      if (state === "due" || state === "committed") type[state] += row.count;
      types.set(row.eventType, type);
    }
    return { draft, automaticDeletion: !!stored && stored.activeVersion === stored.version, backupReady: await backupReady(),
      previewToken: draft ? sign(ownerId, funnelId, draft.version, now.getTime()) : "", asOf: now.toISOString(), cutoff,
      total: Object.values(counts).reduce((sum, count) => sum + count, 0), counts,
      eventTypes: Array.from(types.values()).sort((a, b) => a.eventType.localeCompare(b.eventType)) };
  }, { isolationLevel: "repeatable read", accessMode: "read only" });
}

export async function activateAnalyticsRetention(funnelId: number, ownerId: number, raw: RetentionActivationInput) {
  const input = retentionActivationSchema.parse(raw);
  await db.transaction(async tx => {
    await lockErasureJournal(tx);
    await ownerFunnel(tx, funnelId, ownerId, true);
    const [rule] = await tx.select().from(funnelAnalyticsRetention).where(eq(funnelAnalyticsRetention.funnelId, funnelId));
    if (!rule || rule.version !== input.expectedVersion) conflict();
    if (input.active) {
      const received = input.previewToken ?? "", time = Number(received.split(".")[0]);
      const expected = sign(ownerId, funnelId, rule.version, time);
      if (!input.confirmed || !Number.isSafeInteger(time) || Date.now() < time || Date.now() - time > 5 * 60_000
        || Buffer.byteLength(received) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(received), Buffer.from(expected))) {
        throw new RetentionError(409, "Bitte lade die Statistik-Vorschau neu und bestätige die Löschung ausdrücklich.");
      }
      if (!await backupReady()) throw new RetentionError(503, "Die externe Sicherung ist noch nicht bestätigt. Bitte später erneut versuchen.");
    }
    const version = rule.version + 1;
    await tx.update(funnelAnalyticsRetention).set({ version, activeVersion: input.active ? version : null,
      activatedAt: input.active ? new Date() : null, updatedAt: new Date() }).where(eq(funnelAnalyticsRetention.funnelId, funnelId));
  });
  return previewAnalyticsRetention(funnelId, ownerId);
}
