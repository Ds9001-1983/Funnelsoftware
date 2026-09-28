import { pool } from "./db";
import { hasProFeatures } from "./auth";
import {
  assertRecruitingTestTransportAllowed,
  sendRecruitingEmail,
  type RecruitingEmailTransport,
} from "./email";

export const RECRUITING_MAIL_BATCH_SIZE = 10;
export const RECRUITING_MAIL_MAX_ATTEMPTS = 3;
export const RECRUITING_MAIL_LEASE_MS = 5 * 60_000;
const POLL_INTERVAL_MS = 10_000;

interface ClaimedJob {
  id: number;
  lead_id: number;
  rule_id: number;
  owner_id: number;
  stage_id: string | null;
  recipient: string;
  reply_to: string;
  sender_name: string;
  subject: string;
  body: string;
  attempts: number;
}

interface CurrentContext {
  owner_email: string;
  owner_verified: Date | null;
  owner_deleted: Date | null;
  owner_pro: boolean;
  owner_admin: boolean;
  owner_trial: Date | null;
  funnel_deleted: Date | null;
  rule_enabled: boolean;
  rule_trigger: string;
  rule_stage: string | null;
  lead_stage: string;
}

export interface RecruitingMailRunResult {
  claimed: number;
  sent: number;
  retried: number;
  failed: number;
  uncertain: number;
  cancelled: number;
}

async function cancellationReason(job: ClaimedJob): Promise<string | null> {
  // Alle Zuordnungen erneut prüfen: Ein Snapshot ist keine Zugriffsfreigabe.
  // Leads werden hart gelöscht; Owner und Funnels besitzen Soft-Delete-Felder.
  const { rows } = await pool.query<CurrentContext>(`
    SELECT u.email AS owner_email, u.email_verified_at AS owner_verified,
           u.deleted_at AS owner_deleted, u.is_pro AS owner_pro,
           u.is_admin AS owner_admin, u.trial_ends_at AS owner_trial,
           f.deleted_at AS funnel_deleted, r.enabled AS rule_enabled,
           r.trigger AS rule_trigger, r.stage_id AS rule_stage,
           COALESCE(l.stage_id, l.status) AS lead_stage
      FROM leads l
      JOIN funnels f ON f.id = l.funnel_id AND f.user_id = l.user_id
      JOIN users u ON u.id = f.user_id
      JOIN recruiting_mail_rules r ON r.id = $2 AND r.funnel_id = f.id
     WHERE l.id = $1 AND u.id = $3
  `, [job.lead_id, job.rule_id, job.owner_id]);
  const context = rows[0];
  if (!context || context.owner_deleted || context.funnel_deleted) return "resource_unavailable";
  if (!context.owner_verified) return "owner_not_verified";
  if (!hasProFeatures({
    isAdmin: context.owner_admin,
    isPro: context.owner_pro,
    trialEndsAt: context.owner_trial,
  })) return "owner_plan_inactive";
  if (context.owner_email.toLowerCase() !== job.reply_to.toLowerCase()) return "reply_address_changed";
  if (!context.rule_enabled) return "rule_disabled";
  if (job.stage_id !== null) {
    if (context.rule_trigger !== "stage_entered" || context.rule_stage !== job.stage_id) return "rule_changed";
    if (context.lead_stage !== job.stage_id) return "stage_obsolete";
  } else if (context.rule_trigger !== "created") {
    return "rule_changed";
  }
  return null;
}

/**
 * Bounded Verarbeitung. Jeder Job wird erst unmittelbar vor seinem Versand
 * geclaimt; so verbrauchen wartende Batch-Einträge keinen SMTP-Lease.
 * SKIP LOCKED koordiniert mehrere Prozesse, die Status-/Versuchsklausel
 * verhindert das Überschreiben eines inzwischen abgelaufenen Leases.
 */
export async function processRecruitingMailJobs(
  options: { transport?: RecruitingEmailTransport } = {},
): Promise<RecruitingMailRunResult> {
  if (options.transport) assertRecruitingTestTransportAllowed();
  const result: RecruitingMailRunResult = {
    claimed: 0, sent: 0, retried: 0, failed: 0, uncertain: 0, cancelled: 0,
  };
  // Nach Absturz ist unbekannt, ob SMTP bereits angenommen hat. Niemals blind
  // neu versenden: Der Status bleibt zur manuellen Klärung sichtbar.
  const expired = await pool.query(`
    UPDATE recruiting_mail_jobs
       SET status = 'uncertain', error_code = 'processing_lease_expired', processing_at = NULL
     WHERE status = 'processing'
       AND (processing_at IS NULL OR processing_at < NOW() - ($1 * INTERVAL '1 millisecond'))
  `, [RECRUITING_MAIL_LEASE_MS]);
  result.uncertain += expired.rowCount || 0;

  for (let index = 0; index < RECRUITING_MAIL_BATCH_SIZE; index++) {
    const { rows } = await pool.query<ClaimedJob>(`
      WITH next_job AS (
        SELECT id FROM recruiting_mail_jobs
         WHERE status = 'pending' AND next_attempt_at <= NOW() AND attempts < $1
         ORDER BY next_attempt_at, id
         FOR UPDATE SKIP LOCKED
         LIMIT 1
      )
      UPDATE recruiting_mail_jobs AS job
         SET status = 'processing', attempts = job.attempts + 1,
             processing_at = NOW(), error_code = NULL
        FROM next_job
       WHERE job.id = next_job.id
      RETURNING job.*
    `, [RECRUITING_MAIL_MAX_ATTEMPTS]);
    const job = rows[0];
    if (!job) break;
    result.claimed++;

    const obsolete = await cancellationReason(job);
    if (obsolete) {
      const cancelled = await pool.query(`
        UPDATE recruiting_mail_jobs
           SET status = 'cancelled', error_code = $3, processing_at = NULL
         WHERE id = $1 AND status = 'processing' AND attempts = $2
      `, [job.id, job.attempts, obsolete]);
      if (cancelled.rowCount) result.cancelled++;
      continue;
    }

    const outcome = await sendRecruitingEmail({
      recipient: job.recipient,
      replyTo: job.reply_to,
      senderName: job.sender_name,
      subject: job.subject,
      body: job.body,
      messageId: `<recruiting-${job.id}@trichterwerk.de>`,
    }, options);
    if (outcome.status === "sent") {
      const saved = await pool.query(`
        UPDATE recruiting_mail_jobs
           SET status = 'sent', sent_at = NOW(), message_id = $3,
               error_code = NULL, processing_at = NULL
         WHERE id = $1 AND status = 'processing' AND attempts = $2
      `, [job.id, job.attempts, outcome.messageId]);
      if (saved.rowCount) result.sent++;
      continue;
    }

    const retry = outcome.status === "retryable" && job.attempts < RECRUITING_MAIL_MAX_ATTEMPTS;
    const status = retry ? "pending" : outcome.status === "uncertain" ? "uncertain" : "failed";
    const saved = await pool.query(`
      UPDATE recruiting_mail_jobs
         SET status = $3, error_code = $4, processing_at = NULL,
             next_attempt_at = NOW() + ($5 * INTERVAL '1 millisecond')
       WHERE id = $1 AND status = 'processing' AND attempts = $2
    `, [job.id, job.attempts, status, outcome.errorCode, retry ? 60_000 * (2 ** (job.attempts - 1)) : 0]);
    if (saved.rowCount) {
      if (retry) result.retried++;
      else if (status === "uncertain") result.uncertain++;
      else result.failed++;
    }
  }
  return result;
}

/** Start nach erfolgreicher Migration; Rückgabe stoppt weitere Polls. */
export function startRecruitingMailWorker(): () => void {
  if (process.env.DISABLE_RECRUITING_MAIL_WORKER === "1") return () => {};
  let running = false;
  let stopped = false;
  const run = async () => {
    if (running || stopped) return;
    running = true;
    try { await processRecruitingMailJobs(); }
    catch { console.error("[RecruitingMail] Verarbeitung fehlgeschlagen; offene Leases werden geprüft."); }
    finally { running = false; }
  };
  const timer = setInterval(() => { void run(); }, POLL_INTERVAL_MS);
  timer.unref();
  void run();
  return () => { stopped = true; clearInterval(timer); };
}
