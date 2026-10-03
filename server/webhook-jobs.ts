import { createHash, randomUUID } from "node:crypto";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db, pool } from "./db";
import { funnels, leads, users, webhookJobs, FREE_MONTHLY_LEAD_LIMIT } from "@shared/schema";
import { buildWebhookPayload } from "./webhooks";
import { deliverWebhook, type WebhookTransport } from "./webhook-transport";
import type { WebhookDeliveryList } from "@shared/webhook-delivery";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type LeadRow = typeof leads.$inferSelect;
type FunnelRow = typeof funnels.$inferSelect;
type Owner = typeof users.$inferSelect;
export const MAX_WEBHOOK_ATTEMPTS = 5;
export const webhookConfigHash = (url: string, secret: string | null) => createHash("sha256").update(JSON.stringify([url, secret])).digest("hex");
export const webhookRetryDelay = (attempt: number) => [60, 300, 900, 3600][Math.min(Math.max(attempt - 1, 0), 3)] * 1000;

async function leadIsUnlocked(connection: Tx | typeof db, lead: LeadRow, owner: Owner) {
  if (owner.isAdmin || owner.isPro || (owner.trialEndsAt && owner.trialEndsAt.getTime() > Date.now())) return true;
  const date = lead.createdAt;
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  const [result] = await connection.select({ count: sql<number>`count(*)::int` }).from(leads).where(and(
    eq(leads.userId, owner.id), gte(leads.createdAt, start), lt(leads.createdAt, end),
    sql`(${leads.createdAt}, ${leads.id}) <= (SELECT created_at, id FROM leads WHERE id = ${lead.id})`,
  ));
  return result.count <= FREE_MONTHLY_LEAD_LIMIT;
}

/** Called in the lead transaction, after its owner-scoped intake lock. */
export async function queueLeadWebhook(tx: Tx, lead: LeadRow, funnel: FunnelRow) {
  if (!funnel.webhookEnabled || !funnel.webhookUrl || funnel.deletedAt) return;
  const [owner] = await tx.select().from(users).where(eq(users.id, funnel.userId));
  if (!owner || owner.deletedAt || !owner.emailVerifiedAt || !await leadIsUnlocked(tx, lead, owner)) return;
  const eventId = randomUUID();
  await tx.insert(webhookJobs).values({
    eventId, leadId: lead.id, funnelId: funnel.id, ownerId: owner.id,
    targetUrl: funnel.webhookUrl, configHash: webhookConfigHash(funnel.webhookUrl, funnel.webhookSecret),
    payload: { ...buildWebhookPayload(funnel, lead), event_id: eventId, timestamp: lead.createdAt.toISOString() },
  }).onConflictDoNothing({ target: webhookJobs.leadId });
}

interface ClaimedJob { id: number; event_id: string; lead_id: number; funnel_id: number; owner_id: number; target_url: string; config_hash: string; payload: unknown; attempts: number }

/** Leases allow recovery after crashes; stable event IDs support receiver deduplication. */
export async function processWebhookJobs(options: { transport?: WebhookTransport; shouldStop?: () => boolean } = {}) {
  if (options.transport && process.env.NODE_ENV !== "test") throw new Error("Webhook test transport requires NODE_ENV=test");
  const transport = options.transport ?? deliverWebhook;
  await pool.query(`WITH recovered AS (
    UPDATE webhook_jobs SET status = CASE WHEN attempts >= $1 THEN 'failed' ELSE 'pending' END,
      processing_at = NULL, next_attempt_at = NOW(), error_code = 'lease_expired'
    WHERE status = 'processing' AND processing_at < NOW() - INTERVAL '2 minutes'
    RETURNING id, attempts
  ) UPDATE webhook_attempts a SET outcome = 'interrupted', error_code = 'lease_expired', finished_at = NOW()
    FROM recovered r WHERE a.job_id = r.id AND a.attempt = r.attempts`, [MAX_WEBHOOK_ATTEMPTS]);
  let claimed = 0;
  while (claimed < 10 && !options.shouldStop?.()) {
    const result = await pool.query<ClaimedJob>(`WITH candidate AS (
      SELECT id FROM webhook_jobs WHERE status = 'pending' AND next_attempt_at <= NOW() AND attempts < $1
      ORDER BY next_attempt_at, id FOR UPDATE SKIP LOCKED LIMIT 1
    ), claimed AS (
      UPDATE webhook_jobs j SET status = 'processing', attempts = attempts + 1, processing_at = NOW()
      FROM candidate c WHERE j.id = c.id RETURNING j.*
    ), recorded AS (
      INSERT INTO webhook_attempts (job_id, attempt) SELECT id, attempts FROM claimed RETURNING job_id
    ) SELECT claimed.* FROM claimed JOIN recorded ON recorded.job_id = claimed.id`, [MAX_WEBHOOK_ATTEMPTS]);
    const job = result.rows[0];
    if (!job) break;
    claimed++;
    const [resources] = await db.select({ owner: users, funnel: funnels, lead: leads }).from(leads)
      .innerJoin(funnels, eq(leads.funnelId, funnels.id)).innerJoin(users, eq(funnels.userId, users.id))
      .where(and(eq(leads.id, job.lead_id), eq(funnels.id, job.funnel_id), eq(users.id, job.owner_id)));
    let cancelled: string | null = null;
    if (!resources || resources.owner.deletedAt || resources.funnel.deletedAt) cancelled = "resource_unavailable";
    else if (!resources.owner.emailVerifiedAt) cancelled = "owner_not_verified";
    else if (!resources.funnel.webhookEnabled || !resources.funnel.webhookUrl) cancelled = "webhook_disabled";
    else if (webhookConfigHash(resources.funnel.webhookUrl, resources.funnel.webhookSecret) !== job.config_hash) cancelled = "config_changed";
    else if (!await leadIsUnlocked(db, resources.lead, resources.owner)) cancelled = "lead_locked";
    let status: string;
    let errorCode: string | null = cancelled;
    let statusCode: number | null = null;
    if (cancelled) status = "cancelled";
    else {
      const outcome = await transport({ url: job.target_url, body: JSON.stringify(job.payload), eventId: job.event_id, secret: resources.funnel.webhookSecret })
        .catch(() => ({ kind: "retry" as const, errorCode: "network_error", statusCode: undefined }));
      statusCode = outcome.statusCode ?? null;
      errorCode = outcome.errorCode ?? null;
      status = outcome.kind === "delivered" ? "delivered" : outcome.kind === "retry" && job.attempts < MAX_WEBHOOK_ATTEMPTS ? "pending" : "failed";
    }
    // Guard against a late result from a worker whose lease was already recovered.
    await pool.query(`WITH finished AS (
      UPDATE webhook_jobs SET status = $3, processing_at = NULL, error_code = $4,
        next_attempt_at = NOW() + ($5 * INTERVAL '1 millisecond'),
        delivered_at = CASE WHEN $3 = 'delivered' THEN NOW() ELSE NULL END
      WHERE id = $1 AND status = 'processing' AND attempts = $2 RETURNING id
    ) UPDATE webhook_attempts a SET outcome = $6, status_code = $7, error_code = $4, finished_at = NOW()
      FROM finished f WHERE a.job_id = f.id AND a.attempt = $2`,
    [job.id, job.attempts, status, errorCode, webhookRetryDelay(job.attempts), status === "pending" ? "retry" : status, statusCode]);
  }
  return { claimed };
}

export function startWebhookWorker(): () => Promise<void> {
  let stopped = false;
  let running: Promise<unknown> | undefined;
  const tick = () => {
    if (stopped || running) return;
    running = processWebhookJobs({ shouldStop: () => stopped })
      .catch(() => console.error("[Webhook] Warteschlange derzeit nicht verarbeitbar"))
      .finally(() => { running = undefined; });
  };
  if (process.env.DISABLE_WEBHOOK_WORKER === "1") return async () => {};
  const timer = setInterval(tick, 10_000); timer.unref(); tick();
  return async () => { stopped = true; clearInterval(timer); await running; };
}

export async function listWebhookDeliveries(funnelId: number, ownerId: number, before?: number): Promise<WebhookDeliveryList> {
  const jobs = await pool.query(`SELECT id, event_id, lead_id, status, attempts, next_attempt_at, created_at, delivered_at, error_code
    FROM webhook_jobs WHERE funnel_id = $1 AND owner_id = $2 AND ($3::int IS NULL OR id < $3)
    ORDER BY id DESC LIMIT 26`, [funnelId, ownerId, before ?? null]);
  const page = jobs.rows.slice(0, 25);
  const history = page.length ? (await pool.query(`SELECT job_id, attempt, outcome, status_code, error_code, started_at, finished_at
    FROM webhook_attempts WHERE job_id = ANY($1::int[]) ORDER BY attempt`, [page.map(job => job.id)])).rows : [];
  return {
    items: page.map(job => ({ id: job.id, eventId: job.event_id, leadId: job.lead_id, status: job.status, attempts: job.attempts,
      nextAttemptAt: job.next_attempt_at.toISOString(), createdAt: job.created_at.toISOString(), deliveredAt: job.delivered_at?.toISOString() ?? null, errorCode: job.error_code,
      history: history.filter(item => item.job_id === job.id).map(item => ({ attempt: item.attempt, outcome: item.outcome, statusCode: item.status_code,
        errorCode: item.error_code, startedAt: item.started_at.toISOString(), finishedAt: item.finished_at?.toISOString() ?? null })),
    })),
    nextCursor: jobs.rows.length > 25 ? page[page.length - 1].id : null,
  };
}
