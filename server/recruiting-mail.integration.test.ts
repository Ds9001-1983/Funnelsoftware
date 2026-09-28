// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import pg from "pg";
import { randomUUID } from "node:crypto";
import type { RecruitingEmailTransport } from "./email";
import type { processRecruitingMailJobs as ProcessJobs } from "./recruiting-mail";

// Opt-in, nur eine explizite lokale Test-DB. Jedes Suite-Run bekommt ein eigenes
// Schema; andere Agenten/E2E-Fixtures und öffentliche Tabellen bleiben unberührt.
const runIntegration = process.env.RECRUITING_MAIL_INTEGRATION === "1";
describe.skipIf(!runIntegration)("Bewerbermail-Worker mit PostgreSQL und Memorytransport", () => {
  let fixture: pg.Pool;
  let workerPool: pg.Pool;
  let processJobs: typeof ProcessJobs;
  const schema = `recruiting_mail_test_${randomUUID().replaceAll("-", "")}`;

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL || "");
    const database = decodeURIComponent(url.pathname.slice(1));
    if (!(["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
      && !url.search && !url.hash && ["postgres:", "postgresql:"].includes(url.protocol)
      && (database === "funnelsoftware_e2e" || /^[a-zA-Z0-9_]+_test$/.test(database)))) {
      throw new Error("Integrationstest braucht eine explizite lokale Testdatenbank");
    }
    fixture = new pg.Pool({ connectionString: url.toString(), max: 1 });
    await fixture.query(`CREATE SCHEMA ${schema}`);
    for (const table of ["users", "funnels", "leads", "recruiting_mail_rules", "recruiting_mail_jobs"]) {
      await fixture.query(`CREATE TABLE ${schema}.${table} (LIKE public.${table} INCLUDING ALL)`);
    }
    url.searchParams.set("options", `-c search_path=${schema}`);
    vi.stubEnv("DATABASE_URL", url.toString());
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("SMTP_HOST", "");
    vi.stubEnv("SMTP_USER", "");
    vi.stubEnv("SMTP_PASS", "");
    vi.stubEnv("DISABLE_RECRUITING_MAIL_WORKER", "1");
    vi.resetModules();
    ({ processRecruitingMailJobs: processJobs } = await import("./recruiting-mail"));
    ({ pool: workerPool } = await import("./db"));
  });

  afterAll(async () => {
    await workerPool?.end();
    if (fixture) {
      await fixture.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await fixture.end();
    }
    vi.unstubAllEnvs();
  });

  beforeEach(async () => {
    await workerPool.query("TRUNCATE recruiting_mail_jobs, recruiting_mail_rules, leads, funnels, users");
    await workerPool.query(`
      INSERT INTO users (id, username, email, password, is_pro, email_verified_at)
      VALUES (1, 'worker-test', 'owner@example.test', 'unused-test-password', true, NOW());
      INSERT INTO funnels (id, user_id, name) VALUES (1, 1, 'Bewerbung');
      INSERT INTO recruiting_mail_rules (id, funnel_id, rule_key, trigger, stage_id, subject, body, sender_name, enabled)
      VALUES (1, 1, 'created', 'created', NULL, 'Aktuelle Vorlage', 'Aktueller Text', 'Aktuelles Team', true),
             (2, 1, 'stage:lost', 'stage_entered', 'lost', 'Absage', 'Absagetext', 'Team', true);
    `);
  });

  async function addJob(id: number, stageId: string | null = null) {
    await workerPool.query(`
      INSERT INTO leads (id, funnel_id, user_id, email, status, stage_id)
      VALUES ($1, 1, 1, $2, $3, $4)
    `, [id, `candidate${id}@example.test`, stageId || "new", stageId]);
    await workerPool.query(`
      INSERT INTO recruiting_mail_jobs (id, lead_id, rule_id, owner_id, stage_id, recipient, reply_to, sender_name, subject, body)
      VALUES ($1, $1, $2, 1, $3, $4, 'owner@example.test', 'Gespeichertes Team', 'Gespeicherter Betreff', 'Gespeicherter Inhalt')
    `, [id, stageId ? 2 : 1, stageId, `candidate${id}@example.test`]);
  }

  function memoryTransport() {
    return { sendMail: vi.fn().mockImplementation(async (mail) => ({
      accepted: [mail.to.address], messageId: mail.messageId,
    })) } satisfies RecruitingEmailTransport;
  }

  it("claimt bei zwei parallelen Workern jeden Job genau einmal und versendet gespeicherte Snapshots", async () => {
    for (let id = 1; id <= 15; id++) await addJob(id);
    const transport = memoryTransport();
    const runs = await Promise.all([processJobs({ transport }), processJobs({ transport })]);
    expect(runs.every(run => run.claimed <= 10)).toBe(true);
    expect(runs.reduce((count, run) => count + run.sent, 0)).toBe(15);
    expect(transport.sendMail).toHaveBeenCalledTimes(15);
    const mails = transport.sendMail.mock.calls.map(([mail]) => mail);
    expect(new Set(mails.map(mail => mail.to.address)).size).toBe(15);
    expect(mails.every(mail => mail.subject === "Gespeicherter Betreff" && mail.text === "Gespeicherter Inhalt")).toBe(true);
    expect((await workerPool.query("SELECT DISTINCT status FROM recruiting_mail_jobs")).rows).toEqual([{ status: "sent" }]);
    expect((await processJobs({ transport })).claimed).toBe(0);
  });

  it("wiederholt nur eindeutig abgelehnte Mails zeitversetzt und beendet nach drei Versuchen", async () => {
    await addJob(1);
    const transport = { sendMail: vi.fn().mockRejectedValue({ responseCode: 451 }) };
    expect((await processJobs({ transport })).retried).toBe(1);
    expect((await processJobs({ transport })).claimed).toBe(0);
    await workerPool.query("UPDATE recruiting_mail_jobs SET next_attempt_at = NOW()");
    expect((await processJobs({ transport })).retried).toBe(1);
    await workerPool.query("UPDATE recruiting_mail_jobs SET next_attempt_at = NOW()");
    expect((await processJobs({ transport })).failed).toBe(1);
    expect(transport.sendMail).toHaveBeenCalledTimes(3);
    expect((await workerPool.query("SELECT status, attempts, error_code FROM recruiting_mail_jobs")).rows[0])
      .toEqual({ status: "failed", attempts: 3, error_code: "smtp_451" });
    expect((await processJobs({ transport })).claimed).toBe(0);
  });

  it("versendet bei Timeout nach möglicher Annahme niemals automatisch erneut", async () => {
    await addJob(1);
    const transport = { sendMail: vi.fn().mockRejectedValue({ code: "ETIMEDOUT", command: "CONN" }) };
    expect((await processJobs({ transport })).uncertain).toBe(1);
    await workerPool.query("UPDATE recruiting_mail_jobs SET next_attempt_at = NOW()");
    expect((await processJobs({ transport })).claimed).toBe(0);
    expect(transport.sendMail).toHaveBeenCalledOnce();
  });

  it("markiert abgelaufene Processing-Leases unklar und übernimmt keine noch aktiven Leases", async () => {
    await addJob(1);
    await addJob(2);
    await workerPool.query("UPDATE recruiting_mail_jobs SET status = 'processing', attempts = 1, processing_at = NOW()");
    await workerPool.query("UPDATE recruiting_mail_jobs SET processing_at = NOW() - INTERVAL '6 minutes' WHERE id = 1");
    const transport = memoryTransport();
    expect(await processJobs({ transport })).toMatchObject({ claimed: 0, uncertain: 1 });
    expect(transport.sendMail).not.toHaveBeenCalled();
    expect((await workerPool.query("SELECT id, status FROM recruiting_mail_jobs ORDER BY id")).rows)
      .toEqual([{ id: 1, status: "uncertain" }, { id: 2, status: "processing" }]);
  });

  it.each([
    ["UPDATE users SET email_verified_at = NULL", "owner_not_verified"],
    ["UPDATE users SET is_pro = false, trial_ends_at = NULL", "owner_plan_inactive"],
    ["UPDATE users SET email = 'changed@example.test'", "reply_address_changed"],
    ["UPDATE users SET deleted_at = NOW()", "resource_unavailable"],
    ["UPDATE funnels SET deleted_at = NOW()", "resource_unavailable"],
    ["UPDATE recruiting_mail_rules SET enabled = false", "rule_disabled"],
    ["UPDATE leads SET stage_id = 'contacted', status = 'contacted'", "stage_obsolete"],
    ["UPDATE recruiting_mail_rules SET stage_id = 'qualified' WHERE id = 2", "rule_changed"],
    ["DELETE FROM leads", "resource_unavailable"],
  ])("storniert veraltete Jobs vor dem SMTP-Aufruf: %s", async (mutation, reason) => {
    await addJob(1, "lost");
    await workerPool.query(mutation);
    const transport = memoryTransport();
    expect((await processJobs({ transport })).cancelled).toBe(1);
    expect(transport.sendMail).not.toHaveBeenCalled();
    expect((await workerPool.query("SELECT error_code FROM recruiting_mail_jobs")).rows[0].error_code).toBe(reason);
  });

  it("behandelt einen DB-Ausfall nach SMTP-Annahme nach Wiederanlauf als unklar", async () => {
    await addJob(1);
    const transport = memoryTransport();
    const realQuery = workerPool.query.bind(workerPool);
    const querySpy = vi.spyOn(workerPool, "query").mockImplementation(((...args: unknown[]) => {
      if (typeof args[0] === "string" && args[0].includes("SET status = 'sent'")) {
        return Promise.reject(new Error("simulated database outage after SMTP accepted"));
      }
      return (realQuery as (...args: unknown[]) => unknown)(...args);
    }) as typeof workerPool.query);
    try { await expect(processJobs({ transport })).rejects.toThrow("simulated database outage"); }
    finally { querySpy.mockRestore(); }
    expect(transport.sendMail).toHaveBeenCalledOnce();
    await workerPool.query("UPDATE recruiting_mail_jobs SET processing_at = NOW() - INTERVAL '6 minutes'");
    expect((await processJobs({ transport })).uncertain).toBe(1);
    expect(transport.sendMail).toHaveBeenCalledOnce();
  });
});
