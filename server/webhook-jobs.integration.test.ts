// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import pg from "pg";
import { randomUUID } from "node:crypto";
import type { processWebhookJobs, queueLeadWebhook, listWebhookDeliveries } from "./webhook-jobs";
import type { db as Database } from "./db";
import { funnels, leads } from "@shared/schema";
import type { storage as Storage } from "./storage";

const connection = process.env.WEBHOOK_TEST_DATABASE_URL;
describe.skipIf(!connection)("durable webhook outbox", () => {
  const schema = `webhook_test_${randomUUID().replaceAll("-", "")}`;
  let fixture: pg.Pool, workerPool: pg.Pool, db: typeof Database, storage: typeof Storage;
  let processJobs: typeof processWebhookJobs, queue: typeof queueLeadWebhook, list: typeof listWebhookDeliveries;
  beforeAll(async () => {
    const url = new URL(connection!);
    if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) || url.search || url.hash || !["postgres:", "postgresql:"].includes(url.protocol) || !/^funnelsoftware_e2e(?:_[a-z0-9_]+)?$/.test(url.pathname.slice(1))) throw new Error("Explicit local E2E database required");
    fixture = new pg.Pool({ connectionString: url.toString(), max: 1 });
    await fixture.query(`CREATE SCHEMA ${schema}`);
    for (const table of ["users", "funnels", "leads", "webhook_jobs", "webhook_attempts", "recruiting_mail_rules", "recruiting_mail_jobs"]) await fixture.query(`CREATE TABLE ${schema}.${table} (LIKE public.${table} INCLUDING ALL)`);
    // LIKE intentionally omits FKs; add the privacy-relevant cascade to exercise deletion.
    await fixture.query(`ALTER TABLE ${schema}.webhook_jobs ADD FOREIGN KEY (lead_id) REFERENCES ${schema}.leads(id) ON DELETE CASCADE; ALTER TABLE ${schema}.webhook_attempts ADD FOREIGN KEY (job_id) REFERENCES ${schema}.webhook_jobs(id) ON DELETE CASCADE`);
    url.searchParams.set("options", `-c search_path=${schema}`);
    vi.stubEnv("DATABASE_URL", url.toString()); vi.stubEnv("NODE_ENV", "test"); vi.stubEnv("DISABLE_WEBHOOK_WORKER", "1");
    vi.resetModules();
    ({ processWebhookJobs: processJobs, queueLeadWebhook: queue, listWebhookDeliveries: list } = await import("./webhook-jobs"));
    ({ pool: workerPool, db } = await import("./db")); ({ storage } = await import("./storage"));
  });
  afterAll(async () => { await workerPool?.end(); if (fixture) { await fixture.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`); await fixture.end(); } vi.unstubAllEnvs(); });
  beforeEach(async () => {
    await workerPool.query("TRUNCATE webhook_attempts, webhook_jobs, recruiting_mail_jobs, recruiting_mail_rules, leads, funnels, users");
    await workerPool.query(`INSERT INTO users (id,username,email,password,is_pro,email_verified_at) VALUES (1,'webhook-test','owner@example.test','unused',true,NOW());
      INSERT INTO funnels (id,user_id,name,webhook_enabled,webhook_url,webhook_secret) VALUES (1,1,'Funnel',true,'https://hooks.example.com/lead','test-secret')`);
  });
  async function createLead(index = 0) { return storage.createLead({ funnelId: 1, email: `person${index}@example.test`, answers: { original: "answer" } }, 1); }
  const delivered = () => vi.fn().mockResolvedValue({ kind: "delivered", statusCode: 204 });
  const all = async () => (await workerPool.query("SELECT * FROM webhook_jobs ORDER BY id")).rows;
  it("commits lead and outbox together, deduplicates intake, and rolls back both on failure", async () => {
    await Promise.all([createLead(), createLead()]);
    expect(await all()).toHaveLength(1);
    expect((await workerPool.query("SELECT * FROM leads")).rows).toHaveLength(1);
    await expect(db.transaction(async tx => {
      const [lead] = await tx.insert(leads).values({ userId: 1, funnelId: 1, email: "rollback@example.test" }).returning();
      const [funnel] = await tx.select().from(funnels); await queue(tx, lead, funnel); throw new Error("rollback");
    })).rejects.toThrow("rollback");
    expect(await all()).toHaveLength(1); expect((await workerPool.query("SELECT * FROM leads")).rows).toHaveLength(1);
  });
  it("claims each job once across simultaneous workers and preserves the payload snapshot", async () => {
    for (let i = 0; i < 15; i++) await createLead(i);
    await workerPool.query("UPDATE leads SET email = 'edited@example.test'");
    const transport = delivered(); await Promise.all([processJobs({ transport }), processJobs({ transport })]);
    expect(transport).toHaveBeenCalledTimes(15);
    expect(new Set(transport.mock.calls.map(([request]) => request.eventId)).size).toBe(15);
    expect(transport.mock.calls.every(([request]) => JSON.parse(request.body).data.email !== "edited@example.test")).toBe(true);
    expect((await all()).every(job => job.status === "delivered")).toBe(true);
    expect((await processJobs({ transport })).claimed).toBe(0);
  });
  it("retries later with the same signed body/event ID and stops after five attempts", async () => {
    await createLead(); const transport = vi.fn().mockResolvedValue({ kind: "retry", statusCode: 503, errorCode: "http_503" });
    await processJobs({ transport }); expect((await processJobs({ transport })).claimed).toBe(0);
    expect(new Date((await all())[0].next_attempt_at).getTime()).toBeGreaterThan(Date.now() + 50_000);
    for (let i = 1; i < 5; i++) { await workerPool.query("UPDATE webhook_jobs SET next_attempt_at = NOW()"); await processJobs({ transport }); }
    expect((await all())[0]).toMatchObject({ status: "failed", attempts: 5, error_code: "http_503" });
    expect(new Set(transport.mock.calls.map(([request]) => request.body)).size).toBe(1);
    expect((await list(1, 1)).items[0].history).toHaveLength(5);
    expect((await processJobs({ transport })).claimed).toBe(0);
  });
  it("can recover an interrupted delivery after restart, preserving its event ID", async () => {
    await createLead();
    const transport = delivered(); const realQuery = workerPool.query.bind(workerPool);
    const spy = vi.spyOn(workerPool, "query").mockImplementation(((...args: unknown[]) => {
      if (typeof args[0] === "string" && args[0].includes("WITH finished AS")) return Promise.reject(new Error("DB unavailable after accepted"));
      return (realQuery as (...args: unknown[]) => unknown)(...args);
    }) as typeof workerPool.query);
    try { await expect(processJobs({ transport })).rejects.toThrow("DB unavailable"); } finally { spy.mockRestore(); }
    expect((await processJobs({ transport })).claimed).toBe(0);
    await workerPool.query("UPDATE webhook_jobs SET processing_at = NOW() - INTERVAL '3 minutes'");
    await processJobs({ transport });
    expect(transport).toHaveBeenCalledTimes(2); expect(transport.mock.calls[0][0]).toEqual(transport.mock.calls[1][0]);
    expect((await list(1, 1)).items[0].history.map(item => item.outcome)).toEqual(["interrupted", "delivered"]);
  });
  it.each([
    ["UPDATE funnels SET webhook_enabled = false", "webhook_disabled"],
    ["UPDATE funnels SET webhook_url = 'https://other.example.com/lead'", "config_changed"],
    ["UPDATE funnels SET webhook_secret = 'rotated'", "config_changed"],
    ["UPDATE users SET email_verified_at = NULL", "owner_not_verified"],
    ["UPDATE funnels SET deleted_at = NOW()", "resource_unavailable"],
    ["UPDATE users SET deleted_at = NOW()", "resource_unavailable"],
  ])("cancels obsolete configuration before connecting: %s", async (mutation, reason) => {
    await createLead(); await workerPool.query(mutation); const transport = delivered(); await processJobs({ transport });
    expect(transport).not.toHaveBeenCalled(); expect((await all())[0]).toMatchObject({ status: "cancelled", error_code: reason });
  });
  it("protects the free monthly quota, including parallel intake at its boundary", async () => {
    await workerPool.query("UPDATE users SET is_pro = false, trial_ends_at = NULL");
    await workerPool.query("INSERT INTO leads (user_id,funnel_id,created_at) SELECT 1,1,date_trunc('month',now()) FROM generate_series(1,99)");
    await Promise.all([createLead(100), createLead(101)]);
    expect(await all()).toHaveLength(1);
    const transport = delivered(); await processJobs({ transport }); expect(transport).toHaveBeenCalledOnce();
  });
  it("rechecks the quota after a plan downgrade", async () => {
    await workerPool.query("INSERT INTO leads (user_id,funnel_id,created_at) SELECT 1,1,date_trunc('month',now()) FROM generate_series(1,100)");
    await createLead(); await workerPool.query("UPDATE users SET is_pro = false, trial_ends_at = NULL");
    const transport = delivered(); await processJobs({ transport }); expect(transport).not.toHaveBeenCalled();
    expect((await all())[0]).toMatchObject({ status: "cancelled", error_code: "lead_locked" });
  });
  it("paginates history without secrets and removes snapshots when deleting a lead", async () => {
    for (let i = 0; i < 26; i++) await createLead(i);
    const first = await list(1, 1); expect(first.items).toHaveLength(25); expect(first.nextCursor).not.toBeNull();
    expect((await list(1, 1, first.nextCursor!)).items).toHaveLength(1); expect((await list(1, 2)).items).toEqual([]);
    expect(JSON.stringify(first)).not.toMatch(/test-secret|hooks.example.com|person0@example.test|answer/);
    await processJobs({ transport: delivered() });
    await workerPool.query("DELETE FROM leads"); expect(await all()).toEqual([]);
    expect((await workerPool.query("SELECT * FROM webhook_attempts")).rows).toEqual([]);
  });
});
