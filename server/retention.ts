import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { assertRetentionEditable, committedRetentionKeys, externalJournalReceipt, journalDirectory, lockErasureJournal, readJournal } from "./erasure-journal";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "./db";
import { funnels, users, leads, funnelRetentionDrafts, leadRetentionExceptions } from "@shared/schema";
import {
  retentionDraftSchema, retentionExceptionSchema, retentionActivationSchema, RETENTION_STATES,
  type RetentionActivationInput, type RetentionDraft, type RetentionDraftInput, type RetentionExceptionInput, type RetentionPreview, type RetentionState,
} from "@shared/retention-contract";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export class RetentionError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
async function ownerFunnel(tx: Tx, funnelId: number, ownerId: number, lock = false) {
  const query = tx.select({ id: funnels.id }).from(funnels).innerJoin(users, eq(users.id, funnels.userId))
    .where(and(eq(funnels.id, funnelId), eq(funnels.userId, ownerId), sql`${funnels.deletedAt} IS NULL`, sql`${users.deletedAt} IS NULL`));
  const [funnel] = await (lock ? query.for("update", { of: funnels }) : query);
  if (!funnel) throw new RetentionError(404, "Funnel nicht gefunden");
}
function conflict() { throw new RetentionError(409, "Die Angaben wurden inzwischen geändert. Bitte neu laden."); }
export async function saveRetentionDraft(funnelId: number, ownerId: number, raw: RetentionDraftInput): Promise<RetentionDraft> {
  const { expectedVersion, ...input } = retentionDraftSchema.parse(raw);
  return db.transaction(async tx => {
    await lockErasureJournal(tx);
    await ownerFunnel(tx, funnelId, ownerId, true);
    const [current] = await tx.select().from(funnelRetentionDrafts).where(eq(funnelRetentionDrafts.funnelId, funnelId));
    if ((current?.version ?? 0) !== expectedVersion) conflict();
    const version = expectedVersion + 1;
    await tx.insert(funnelRetentionDrafts).values({ funnelId, ...input, version, activeVersion: null, activatedAt: null })
      .onConflictDoUpdate({ target: funnelRetentionDrafts.funnelId, set: { ...input, version, activeVersion: null, activatedAt: null, updatedAt: new Date() } });
    return { ...input, version };
  });
}
export async function saveRetentionException(leadId: number, ownerId: number, raw: RetentionExceptionInput) {
  const input = retentionExceptionSchema.parse(raw);
  if (input.exception && new Date(input.exception.reviewAt).getTime() <= Date.now()) {
    throw new RetentionError(400, "Der Prüftermin muss in der Zukunft liegen.");
  }
  return db.transaction(async tx => {
    await lockErasureJournal(tx);
    // Same ordering as stage changes: journal, lead, then funnel.
    const [lead] = await tx.select({ funnelId: leads.funnelId, uuid: leads.uuid }).from(leads)
      .where(and(eq(leads.id, leadId), eq(leads.userId, ownerId))).for("update");
    if (!lead) throw new RetentionError(404, "Lead nicht gefunden");
    await assertRetentionEditable(lead.uuid);
    await ownerFunnel(tx, lead.funnelId, ownerId, true);
    const [current] = await tx.select().from(leadRetentionExceptions).where(eq(leadRetentionExceptions.leadId, leadId));
    if ((current?.version ?? 0) !== input.expectedVersion) conflict();
    const value = { reason: input.exception?.reason ?? null, reviewAt: input.exception ? new Date(input.exception.reviewAt) : null, version: input.expectedVersion + 1 };
    await tx.insert(leadRetentionExceptions).values({ leadId, ...value })
      .onConflictDoUpdate({ target: leadRetentionExceptions.leadId, set: { ...value, updatedAt: new Date() } });
    return { ...value, reviewAt: value.reviewAt?.toISOString() ?? null };
  });
}

/** One read-only snapshot, aggregate counts across all rows and a bounded page.
 * Expired review dates never silently end an exception. */
export async function previewRetention(funnelId: number, ownerId: number, page = 0): Promise<RetentionPreview> {
  if (!Number.isSafeInteger(page) || page < 0 || page > 1_000_000) throw new RetentionError(400, "Ungültige Seite");
  return db.transaction(async tx => {
    await ownerFunnel(tx, funnelId, ownerId);
    const now = new Date();
    const [stored] = await tx.select().from(funnelRetentionDrafts).where(eq(funnelRetentionDrafts.funnelId, funnelId));
    const draft: RetentionDraft | null = stored ? { ...retentionDraftSchema.omit({ expectedVersion: true }).parse({ mode: stored.mode, days: stored.days, purpose: stored.purpose }), version: stored.version } : null;
    const base = draft?.mode === "general_leads" ? sql`${leads.createdAt}` : sql`${leads.closedAt}`;
    // UTC timestamps and a duration of 24h per day, independent of server/DST timezone.
    const dueAt = draft ? sql`(${base} + ${draft.days} * interval '24 hours')` : sql`NULL::timestamp`;
    const pending = Array.from(await committedRetentionKeys());
    const state = sql`CASE
      WHEN ${pending.length ? inArray(leads.uuid, pending) : sql`false`} THEN 'committed'
      WHEN ${leadRetentionExceptions.reason} IS NOT NULL THEN
        CASE WHEN ${leadRetentionExceptions.reviewAt} <= ${now.toISOString()}::timestamptz AT TIME ZONE 'UTC' THEN 'review' ELSE 'excluded' END
      WHEN ${draft === null} THEN 'unknown'
      WHEN ${draft?.mode === "closed_applications"} AND ${leads.status} NOT IN ('converted', 'lost') THEN 'open'
      WHEN ${base} IS NULL OR ${base} > ${now.toISOString()}::timestamptz AT TIME ZONE 'UTC' THEN 'unknown'
      WHEN ${dueAt} <= ${now.toISOString()}::timestamptz AT TIME ZONE 'UTC' THEN 'due'
      ELSE 'waiting' END`;
    const scope = and(eq(leads.funnelId, funnelId), eq(leads.userId, ownerId));
    const counts = Object.fromEntries(RETENTION_STATES.map(key => [key, 0])) as Record<RetentionState, number>;
    const grouped = await tx.select({ state: state.as("state"), count: sql<number>`count(*)::int` }).from(leads)
      .leftJoin(leadRetentionExceptions, eq(leadRetentionExceptions.leadId, leads.id)).where(scope).groupBy(sql`1`);
    for (const row of grouped) counts[row.state as RetentionState] = row.count;
    const pageSize = 50;
    const rows = await tx.select({ id: leads.id, state: state.as("state"),
      dueAt: sql<string | null>`to_char(${dueAt}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`,
      reason: leadRetentionExceptions.reason, reviewAt: leadRetentionExceptions.reviewAt, version: leadRetentionExceptions.version,
    }).from(leads).leftJoin(leadRetentionExceptions, eq(leadRetentionExceptions.leadId, leads.id))
      .where(scope).orderBy(leads.id).limit(pageSize).offset(page * pageSize);
    return { draft, automaticDeletion: !!stored && stored.activeVersion === stored.version,
      backupReady: await backupReady(), previewToken: draft ? signPreview(ownerId, funnelId, draft.version, now.getTime()) : "", asOf: now.toISOString(), counts, total: Object.values(counts).reduce((a, b) => a + b, 0), page, pageSize,
      items: rows.map(row => ({ id: row.id, state: row.state as RetentionState, dueAt: row.dueAt,
        exception: { reason: row.reason, reviewAt: row.reviewAt?.toISOString() ?? null, version: row.version ?? 0 } })) };
  }, { isolationLevel: "repeatable read", accessMode: "read only" });
}

const previewSecret = process.env.SESSION_SECRET || randomBytes(32).toString("hex");
function signPreview(ownerId: number, funnelId: number, version: number, time: number) {
  const message = `${ownerId}.${funnelId}.${version}.${time}`;
  return `${time}.${createHmac("sha256", previewSecret).update(message).digest("hex")}`;
}
async function backupReady() {
  const directory = journalDirectory();
  if (!directory) return false;
  try {
    const journal = await readJournal(directory), receipt = await externalJournalReceipt(directory, journal);
    return !!receipt && receipt.checkpoint.sequence === journal.checkpoint.sequence;
  } catch { return false; }
}
export async function setRetentionActivation(funnelId: number, ownerId: number, raw: RetentionActivationInput) {
  const input = retentionActivationSchema.parse(raw);
  await db.transaction(async tx => {
    await lockErasureJournal(tx);
    await ownerFunnel(tx, funnelId, ownerId, true);
    const [rule] = await tx.select().from(funnelRetentionDrafts).where(eq(funnelRetentionDrafts.funnelId, funnelId));
    if (!rule || rule.version !== input.expectedVersion) conflict();
    if (input.active) {
      const time = Number(input.previewToken?.split(".")[0]);
      const expected = signPreview(ownerId, funnelId, rule.version, time);
      const received = input.previewToken || "";
      if (!input.confirmed || !Number.isSafeInteger(time) || Date.now() - time < 0 || Date.now() - time > 5 * 60_000
        || Buffer.byteLength(received) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(received), Buffer.from(expected))) {
        throw new RetentionError(409, "Bitte lade die Vorschau neu und bestätige den Löschauftrag ausdrücklich.");
      }
      if (!await backupReady()) throw new RetentionError(503, "Die externe Sicherung ist noch nicht bestätigt. Bitte später erneut versuchen.");
    }
    const version = rule.version + 1;
    await tx.update(funnelRetentionDrafts).set({ version, activeVersion: input.active ? version : null,
      activatedAt: input.active ? new Date() : null, updatedAt: new Date() }).where(eq(funnelRetentionDrafts.funnelId, funnelId));
  });
  return previewRetention(funnelId, ownerId);
}
