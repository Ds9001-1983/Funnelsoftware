// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import pg from "pg";
import { eq } from "drizzle-orm";
import { analyticsEvents, domains, funnelRevisions, funnels, leads, leadRetentionExceptions, ownedUploads, users } from "@shared/schema";

const connection = process.env.ANALYTICS_RETENTION_TEST_DATABASE_URL;
if (connection) {
  const url = new URL(connection);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || !/^\/funnelsoftware_e2e(?:_[a-z0-9_]+)?$/.test(url.pathname)
    || !["postgres:", "postgresql:"].includes(url.protocol) || url.search || url.hash) throw new Error("Analytics tests require an isolated local E2E database");
}
const execute = promisify(execFile);
describe.skipIf(!connection)("analytics retention with independently confirmed erasure", () => {
  let database: typeof import("./db"), api: typeof import("./erasure-journal"), service: typeof import("./analytics-retention"), worker: typeof import("./analytics-retention-worker");
  let admin: pg.Client, databaseUrl: string, base: string, journal: string;
  const databaseName = `funnelsoftware_e2e_analytics_${randomUUID().replaceAll("-", "")}`;
  const previous = { database: process.env.DATABASE_URL, journal: process.env.ERASURE_JOURNAL_DIR };
  beforeAll(async () => {
    admin = new pg.Client({ connectionString: connection }); await admin.connect();
    await admin.query(`CREATE DATABASE "${databaseName}"`);
    const url = new URL(connection!); url.pathname = `/${databaseName}`; databaseUrl = url.toString();
    await execute(process.execPath, ["node_modules/drizzle-kit/bin.cjs", "push", "--force"], {
      cwd: process.cwd(), env: { PATH: process.env.PATH, DATABASE_URL: databaseUrl }, timeout: 60_000,
    });
    process.env.DATABASE_URL = databaseUrl;
    database = await import("./db"); api = await import("./erasure-journal");
    service = await import("./analytics-retention"); worker = await import("./analytics-retention-worker");
    base = await fs.mkdtemp(path.join(os.tmpdir(), "analytics-retention-test-"));
  }, 90_000);
  beforeEach(async () => {
    await database.pool.query("TRUNCATE users, erasure_journal_identity, erasure_journal_receipts RESTART IDENTITY CASCADE");
    const root = await fs.mkdtemp(path.join(base, "case-"));
    journal = path.join(root, "journal"); process.env.ERASURE_JOURNAL_DIR = journal;
    await api.initializeErasureJournal(journal);
  });
  afterAll(async () => {
    if (database) await database.pool.end();
    if (admin) { await admin.query(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`); await admin.end(); }
    if (base) await fs.rm(base, { recursive: true, force: true });
    if (previous.database === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = previous.database;
    if (previous.journal === undefined) delete process.env.ERASURE_JOURNAL_DIR; else process.env.ERASURE_JOURNAL_DIR = previous.journal;
  });
  const draft = { expectedVersion: 0, days: 30, purpose: "Zeitlich begrenzte Auswertung" };
  async function fixture(count = 1) {
    const key = randomUUID();
    const [owner] = await database.db.insert(users).values({ username: key, email: `${key}@example.invalid`, password: "synthetic", emailVerifiedAt: new Date() }).returning();
    const [funnel] = await database.db.insert(funnels).values({ userId: owner.id, name: "Statistik-Test", views: count, leads: 1 }).returning();
    const [lead] = await database.db.insert(leads).values({ userId: owner.id, funnelId: funnel.id, name: "Bleibt erhalten" }).returning();
    const events = await database.db.insert(analyticsEvents).values(Array.from({ length: count }, () => ({ funnelId: funnel.id, eventType: "view", timestamp: new Date(Date.now() - 40 * 86400000), metadata: { private: "synthetic metadata" } }))).returning();
    return { owner, funnel, lead, events };
  }
  async function acknowledge(time = new Date()) {
    const directory = `${journal}-offsite`;
    await fs.mkdir(directory, { mode: 0o700, recursive: true });
    await fs.writeFile(path.join(directory, "receipt.json"), JSON.stringify({ version: 1, checkpoint: (await api.readJournal(journal)).checkpoint, confirmedAt: time.toISOString() }), { mode: 0o600 });
  }
  async function activate(f: Awaited<ReturnType<typeof fixture>>) {
    await service.saveAnalyticsRetention(f.funnel.id, f.owner.id, draft);
    await acknowledge();
    const preview = await service.previewAnalyticsRetention(f.funnel.id, f.owner.id);
    return service.activateAnalyticsRetention(f.funnel.id, f.owner.id, { expectedVersion: 1, active: true, confirmed: true, previewToken: preview.previewToken });
  }
  const eventsFor = (id: number) => database.db.select().from(analyticsEvents).where(eq(analyticsEvents.funnelId, id));
  async function deletedFixture() {
    const f = await fixture();
    await database.db.delete(leads).where(eq(leads.id, f.lead.id));
    await database.db.update(funnels).set({ deletedAt: new Date(Date.now() - 40 * 86400000) }).where(eq(funnels.id, f.funnel.id));
    return f;
  }
  async function activateDeleted(ownerId: number) {
    const deleted = await import("./deleted-funnel-retention");
    await deleted.saveDeletedFunnelRetention(ownerId, draft); await acknowledge();
    const preview = await deleted.previewDeletedFunnelRetention(ownerId);
    await deleted.activateDeletedFunnelRetention(ownerId, { expectedVersion: 1, active: true, confirmed: true, previewToken: preview.previewToken });
    return deleted;
  }

  it("previews only the owner's soft-deleted funnels and protects all leads and attached domains", async () => {
    const f = await deletedFixture(), other = await deletedFixture();
    const [withLead, withDomain, archived] = await database.db.insert(funnels).values([
      { userId: f.owner.id, name: "Bewerbungen", deletedAt: new Date(Date.now() - 50 * 86400000) },
      { userId: f.owner.id, name: "Domain", deletedAt: new Date(Date.now() - 50 * 86400000) },
      { userId: f.owner.id, name: "Nur archiviert", status: "archived" },
    ]).returning();
    const [lead] = await database.db.insert(leads).values({ userId: f.owner.id, funnelId: withLead.id }).returning();
    await database.db.insert(leadRetentionExceptions).values({ leadId: lead.id, reason: "Geschützter Nachweis", reviewAt: new Date(Date.now() + 86400000) });
    await database.db.insert(domains).values({ funnelId: withDomain.id, userId: f.owner.id, hostname: "synthetic.example.invalid", verificationToken: "test" });
    const deleted = await import("./deleted-funnel-retention");
    expect(await deleted.previewDeletedFunnelRetention(f.owner.id)).toMatchObject({ automaticDeletion: false, total: 3, counts: { blocked: 2, unknown: 1 } });
    await activateDeleted(f.owner.id);
    expect(await deleted.previewDeletedFunnelRetention(f.owner.id)).toMatchObject({ total: 3, counts: { blocked: 2, due: 1 } });
    expect(await deleted.runDeletedFunnelRetentionBatch()).toMatchObject({ queued: 1, deleted: 0 });
    await acknowledge(); expect(await deleted.runDeletedFunnelRetentionBatch()).toMatchObject({ deleted: 1 });
    expect(await database.db.select().from(leads).where(eq(leads.id, lead.id))).toHaveLength(1);
    expect(await database.db.select().from(domains).where(eq(domains.funnelId, withDomain.id))).toHaveLength(1);
    for (const id of [withLead.id, withDomain.id, archived.id, other.funnel.id]) expect(await database.db.select().from(funnels).where(eq(funnels.id, id))).toHaveLength(1);
  });

  it("allows restore before commitment, blocks it afterwards, and preserves shared media", async () => {
    const f = await deletedFixture(), deleted = await activateDeleted(f.owner.id), storage = (await import("./storage")).storage;
    expect(await storage.restoreFunnel(f.funnel.id, f.owner.id)).toBe(true);
    expect(await deleted.runDeletedFunnelRetentionBatch()).toMatchObject({ queued: 0 });
    await storage.deleteFunnel(f.funnel.id, f.owner.id);
    expect(await deleted.runDeletedFunnelRetentionBatch()).toMatchObject({ queued: 0 });
    await database.db.update(funnels).set({ deletedAt: new Date(Date.now() - 40 * 86400000) }).where(eq(funnels.id, f.funnel.id));
    const filename = "shared-synthetic.webp", file = path.join(base, filename);
    await fs.writeFile(file, "shared media");
    await database.db.insert(ownedUploads).values({ userId: f.owner.id, area: "public", filename });
    await database.db.insert(funnelRevisions).values({ funnelId: f.funnel.id, version: 1, action: "synthetic", content: {} });
    expect(await deleted.runDeletedFunnelRetentionBatch()).toMatchObject({ queued: 1, deleted: 0 });
    expect(await storage.restoreFunnel(f.funnel.id, f.owner.id)).toBe(false);
    await expect(storage.createLead({ funnelId: f.funnel.id, status: "new" }, f.owner.id)).rejects.toThrow("nicht mehr verfügbar");
    expect((await deleted.previewDeletedFunnelRetention(f.owner.id)).counts.committed).toBe(1);
    await deleted.saveDeletedFunnelRetention(f.owner.id, { ...draft, expectedVersion: 2, days: 100 });
    expect(await deleted.runDeletedFunnelRetentionBatch()).toMatchObject({ deleted: 0 });
    await acknowledge(); expect(await deleted.runDeletedFunnelRetentionBatch()).toMatchObject({ deleted: 1, queued: 0 });
    expect(await eventsFor(f.funnel.id)).toHaveLength(0);
    expect(await database.db.select().from(funnelRevisions).where(eq(funnelRevisions.funnelId, f.funnel.id))).toHaveLength(0);
    expect(await database.db.select().from(ownedUploads).where(eq(ownedUploads.filename, filename))).toHaveLength(1);
    expect(await fs.readFile(file, "utf8")).toBe("shared media");
  });

  it("bounds funnel batches, rejects stale/foreign previews and supports pause without backup", async () => {
    const f = await deletedFixture(), other = await deletedFixture();
    const deleted = await activateDeleted(f.owner.id);
    await database.db.insert(funnels).values(Array.from({ length: 4 }, (_, index) => ({ userId: f.owner.id, name: `Alt ${index}`, deletedAt: new Date(Date.now() - 40 * 86400000) })));
    const preview = await deleted.previewDeletedFunnelRetention(f.owner.id);
    await deleted.saveDeletedFunnelRetention(other.owner.id, draft);
    await expect(deleted.activateDeletedFunnelRetention(other.owner.id, { expectedVersion: 1, active: true, confirmed: true, previewToken: preview.previewToken })).rejects.toMatchObject({ status: 409 });
    await expect(deleted.saveDeletedFunnelRetention(f.owner.id, draft)).rejects.toMatchObject({ status: 409 });
    const results = await Promise.all([deleted.runDeletedFunnelRetentionBatch(), deleted.runDeletedFunnelRetentionBatch()]);
    expect(results.reduce((sum, result) => sum + result.queued, 0)).toBe(3);
    await acknowledge(); expect(await deleted.runDeletedFunnelRetentionBatch()).toMatchObject({ deleted: 3, queued: 2 });
    await deleted.activateDeletedFunnelRetention(f.owner.id, { expectedVersion: 2, active: false });
    expect((await deleted.previewDeletedFunnelRetention(f.owner.id)).automaticDeletion).toBe(false);
    await acknowledge(); expect(await deleted.runDeletedFunnelRetentionBatch()).toMatchObject({ deleted: 2, queued: 0 });
  });

  it("replays committed funnel removal against a real old dump only after lead erasure, protecting reused IDs", async () => {
    const f = await fixture(), storage = (await import("./storage")).storage;
    const dump = path.join(base, "before-funnel-removal.dump");
    await execute("pg_dump", ["--format=custom", "--file", dump, databaseUrl]);
    await storage.deleteLead(f.lead.id, f.owner.id); await acknowledge();
    await (await import("./retention-worker")).runRetentionBatch();
    await database.db.update(funnels).set({ deletedAt: new Date(Date.now() - 40 * 86400000) }).where(eq(funnels.id, f.funnel.id));
    const deleted = await activateDeleted(f.owner.id);
    await deleted.runDeletedFunnelRetentionBatch(); await acknowledge(); await deleted.runDeletedFunnelRetentionBatch();
    const head = (await api.readJournal(journal)).checkpoint;
    await execute("pg_restore", ["--clean", "--if-exists", "--no-owner", "--no-acl", "--exit-on-error", "--dbname", databaseUrl, dump]);
    await api.assertErasureJournalReady(base);
    expect((await database.db.select().from(funnels).where(eq(funnels.id, f.funnel.id)))[0].deletedAt).not.toBeNull();
    expect(await api.replayErasureJournal(journal, base, head)).toMatchObject({ leads: 1, funnels: 1 });
    await database.db.insert(funnels).values({ id: f.funnel.id, userId: f.owner.id, name: "Neu" });
    expect(await api.replayErasureJournal(journal, base, head)).toMatchObject({ leads: 0, funnels: 0 });
    expect(await database.db.select().from(funnels).where(eq(funnels.id, f.funnel.id))).toHaveLength(1);
  }, 30_000);

  it("keeps unexpected dependent leads safe even after an interrupted durable funnel request", async () => {
    const f = await deletedFixture(), deleted = await activateDeleted(f.owner.id);
    await expect(database.db.transaction(async tx => {
      await api.lockErasureJournal(tx); await api.recordErasure(tx, { type: "queued_funnels", keys: [f.funnel.uuid] });
      throw new Error("interrupted");
    })).rejects.toThrow("interrupted");
    // A legacy/import path must not let the final FK cascade erase a new lead.
    const [unexpected] = await database.db.insert(leads).values({ userId: f.owner.id, funnelId: f.funnel.id }).returning();
    await acknowledge(); expect(await deleted.runDeletedFunnelRetentionBatch()).toMatchObject({ deleted: 0 });
    await expect(api.replayErasureJournal(journal, base, (await api.readJournal(journal)).checkpoint)).rejects.toThrow();
    expect(await database.db.select().from(leads).where(eq(leads.id, unexpected.id))).toHaveLength(1);
  });

  it("rechecks a public lead request that was already waiting when the funnel was deleted", async () => {
    const f = await fixture(), storage = (await import("./storage")).storage;
    const blocker = await database.pool.connect();
    try {
      await blocker.query("BEGIN");
      await blocker.query("SELECT id FROM funnels WHERE id=$1 FOR UPDATE", [f.funnel.id]);
      const outcome = storage.createLead({ funnelId: f.funnel.id, status: "new", name: "Late request" }, f.owner.id)
        .then(() => null, (error: Error) => error);
      let waiting = false;
      const deadline = Date.now() + 2000;
      while (!waiting && Date.now() < deadline) {
        waiting = (await database.pool.query("SELECT 1 FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock' AND query LIKE '%\"funnels\"%' LIMIT 1")).rowCount === 1;
        if (!waiting) await new Promise(resolve => setTimeout(resolve, 10));
      }
      expect(waiting).toBe(true);
      await blocker.query("UPDATE funnels SET deleted_at=now() AT TIME ZONE 'UTC' WHERE id=$1", [f.funnel.id]);
      await blocker.query("COMMIT");
      expect(await outcome).toMatchObject({ message: "Funnel nicht mehr verfügbar" });
      expect(await database.db.select().from(leads).where(eq(leads.funnelId, f.funnel.id))).toHaveLength(1);
    } finally { await blocker.query("ROLLBACK"); blocker.release(); }
  });

  it("pauses restored rules instead of resurrecting an old automation approval", async () => {
    const f = await fixture(); await activate(f); const deleted = await activateDeleted(f.owner.id);
    const head = (await api.readJournal(journal)).checkpoint;
    await api.replayErasureJournal(journal, base, head);
    expect(await service.previewAnalyticsRetention(f.funnel.id, f.owner.id)).toMatchObject({ automaticDeletion: false, draft: { version: 3 } });
    expect(await deleted.previewDeletedFunnelRetention(f.owner.id)).toMatchObject({ automaticDeletion: false, draft: { version: 3 } });
    await api.replayErasureJournal(journal, base, head);
    expect((await deleted.previewDeletedFunnelRetention(f.owner.id)).draft?.version).toBe(3);
  });

  it("starts disabled, bounds input, rejects foreign owners and serializes conflicting edits", async () => {
    const f = await fixture(), other = await fixture();
    expect(await service.previewAnalyticsRetention(f.funnel.id, f.owner.id)).toMatchObject({ draft: null, automaticDeletion: false, counts: { unknown: 1 } });
    await expect(service.previewAnalyticsRetention(f.funnel.id, other.owner.id)).rejects.toMatchObject({ status: 404 });
    await expect(service.saveAnalyticsRetention(f.funnel.id, other.owner.id, draft)).rejects.toMatchObject({ status: 404 });
    for (const days of [0, -1, 1.5, 36501]) await expect(service.saveAnalyticsRetention(f.funnel.id, f.owner.id, { ...draft, days })).rejects.toBeDefined();
    const edits = await Promise.allSettled([service.saveAnalyticsRetention(f.funnel.id, f.owner.id, draft), service.saveAnalyticsRetention(f.funnel.id, f.owner.id, draft)]);
    expect(edits.filter(result => result.status === "fulfilled")).toHaveLength(1);
    expect(edits.find(result => result.status === "rejected")).toMatchObject({ reason: { status: 409 } });
    await acknowledge();
    expect(await worker.runAnalyticsRetentionBatch()).toMatchObject({ queued: 0, deleted: 0 });
    expect(await eventsFor(f.funnel.id)).toHaveLength(1);
  });

  it("previews UTC boundaries, future timestamps and event types without exposing metadata", async () => {
    const f = await fixture();
    const now = Date.now(), cutoff = new Date(now - 30 * 86400000).toISOString();
    await database.pool.query("INSERT INTO analytics_events (funnel_id,event_type,timestamp) VALUES ($1,'pageView',$2::timestamp),($1,'click',$2::timestamp + interval '1 microsecond'),($1,'submit',$3::timestamp)", [f.funnel.id, cutoff, new Date(now + 86400000).toISOString()]);
    await service.saveAnalyticsRetention(f.funnel.id, f.owner.id, draft);
    vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(now);
    try {
      const preview = await service.previewAnalyticsRetention(f.funnel.id, f.owner.id);
      expect(preview.counts).toEqual({ due: 2, waiting: 1, unknown: 1, committed: 0 });
      expect(preview.eventTypes.find(row => row.eventType === "pageView")).toMatchObject({ due: 1 });
      expect(JSON.stringify(preview)).not.toContain("synthetic metadata");
    } finally { vi.useRealTimers(); }
    expect(await eventsFor(f.funnel.id)).toHaveLength(4);
  });

  it("requires current scoped preview, explicit confirmation and a current complete receipt", async () => {
    const f = await fixture(), other = await fixture();
    await service.saveAnalyticsRetention(f.funnel.id, f.owner.id, draft);
    await service.saveAnalyticsRetention(other.funnel.id, other.owner.id, draft);
    const preview = await service.previewAnalyticsRetention(f.funnel.id, f.owner.id);
    const input = { expectedVersion: 1, active: true, confirmed: true, previewToken: preview.previewToken };
    await expect(service.activateAnalyticsRetention(f.funnel.id, f.owner.id, input)).rejects.toMatchObject({ status: 503 });
    await acknowledge();
    await expect(service.activateAnalyticsRetention(f.funnel.id, f.owner.id, { ...input, confirmed: false })).rejects.toMatchObject({ status: 409 });
    await expect(service.activateAnalyticsRetention(other.funnel.id, other.owner.id, input)).rejects.toMatchObject({ status: 409 });
    const leadPreview = await import("./retention");
    await leadPreview.saveRetentionDraft(f.funnel.id, f.owner.id, { ...draft, mode: "general_leads" });
    await expect(service.activateAnalyticsRetention(f.funnel.id, f.owner.id, { ...input, previewToken: (await leadPreview.previewRetention(f.funnel.id, f.owner.id)).previewToken })).rejects.toMatchObject({ status: 409 });
    vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(Date.now() + 301_000);
    try { await expect(service.activateAnalyticsRetention(f.funnel.id, f.owner.id, input)).rejects.toMatchObject({ status: 409 }); }
    finally { vi.useRealTimers(); }
    expect(await service.activateAnalyticsRetention(f.funnel.id, f.owner.id, input)).toMatchObject({ automaticDeletion: true, draft: { version: 2 } });
    await expect(service.activateAnalyticsRetention(f.funnel.id, f.owner.id, input)).rejects.toMatchObject({ status: 409 });
  });

  it("waits for the precise receipt, preserves leads and lifetime counters, and tolerates retries", async () => {
    const f = await fixture(), other = await fixture();
    await activate(f);
    expect(await worker.runAnalyticsRetentionBatch()).toMatchObject({ queued: 1, deleted: 0, waitingForBackup: true });
    expect(await worker.runAnalyticsRetentionBatch()).toMatchObject({ queued: 0, deleted: 0, waitingForBackup: true });
    expect((await service.previewAnalyticsRetention(f.funnel.id, f.owner.id)).counts.committed).toBe(1);
    expect((await api.readJournal(journal)).entries).toHaveLength(1);
    expect(JSON.stringify((await api.readJournal(journal)).entries)).not.toContain("synthetic metadata");
    await acknowledge(new Date(Date.now() - 901_000));
    expect(await worker.runAnalyticsRetentionBatch()).toMatchObject({ deleted: 0 });
    await acknowledge();
    expect(await worker.runAnalyticsRetentionBatch()).toMatchObject({ deleted: 1, queued: 0 });
    expect(await worker.runAnalyticsRetentionBatch()).toMatchObject({ deleted: 0, queued: 0 });
    expect(await eventsFor(f.funnel.id)).toHaveLength(0); expect(await eventsFor(other.funnel.id)).toHaveLength(1);
    expect(await database.db.select().from(leads).where(eq(leads.id, f.lead.id))).toHaveLength(1);
    expect((await database.db.select().from(funnels).where(eq(funnels.id, f.funnel.id)))[0]).toMatchObject({ views: 1, leads: 1 });
  });

  it("pauses on save and still executes committed work while preserving later events", async () => {
    const f = await fixture(); await activate(f); await worker.runAnalyticsRetentionBatch();
    await service.saveAnalyticsRetention(f.funnel.id, f.owner.id, { ...draft, expectedVersion: 2, days: 100 });
    expect((await service.previewAnalyticsRetention(f.funnel.id, f.owner.id)).automaticDeletion).toBe(false);
    await database.db.insert(analyticsEvents).values([{ funnelId: f.funnel.id, eventType: "view" }, { funnelId: f.funnel.id, eventType: "view", timestamp: f.events[0].timestamp }]);
    await acknowledge();
    expect(await worker.runAnalyticsRetentionBatch()).toMatchObject({ deleted: 1, queued: 0 });
    expect(await eventsFor(f.funnel.id)).toHaveLength(2);
  });

  it("bounds and serializes parallel execution without duplicate intents", async () => {
    const f = await fixture(505); await activate(f);
    const runs = await Promise.all([worker.runAnalyticsRetentionBatch(), worker.runAnalyticsRetentionBatch()]);
    expect(runs.reduce((sum, run) => sum + run.queued, 0)).toBe(505);
    expect((await api.readJournal(journal)).entries).toHaveLength(1);
    await acknowledge();
    expect(await worker.runAnalyticsRetentionBatch()).toMatchObject({ deleted: 500 });
    expect(await eventsFor(f.funnel.id)).toHaveLength(5);
    expect(await worker.runAnalyticsRetentionBatch()).toMatchObject({ deleted: 5 });
  });

  it("limits permanent analytics intents to one per funnel per UTC day", async () => {
    const f = await fixture(); await activate(f); await worker.runAnalyticsRetentionBatch();
    await acknowledge(); await worker.runAnalyticsRetentionBatch();
    await database.db.insert(analyticsEvents).values({ funnelId: f.funnel.id, eventType: "view", timestamp: f.events[0].timestamp });
    expect(await worker.runAnalyticsRetentionBatch()).toMatchObject({ queued: 0, deleted: 0 });
    const nextDay = Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`) + 86400000;
    vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(nextDay);
    try {
      await acknowledge();
      expect(await worker.runAnalyticsRetentionBatch()).toMatchObject({ queued: 1, deleted: 0 });
      expect((await api.readJournal(journal)).entries).toHaveLength(2);
    } finally { vi.useRealTimers(); }
  });

  it("honors account fences, unverified owners and soft-deleted funnels before queuing", async () => {
    const f = await fixture(); await activate(f);
    await database.db.update(users).set({ emailVerifiedAt: null }).where(eq(users.id, f.owner.id));
    expect(await worker.runAnalyticsRetentionBatch()).toMatchObject({ queued: 0 });
    await database.db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, f.owner.id));
    await database.db.update(funnels).set({ deletedAt: new Date() }).where(eq(funnels.id, f.funnel.id));
    expect(await worker.runAnalyticsRetentionBatch()).toMatchObject({ queued: 0 });
    await expect(service.previewAnalyticsRetention(f.funnel.id, f.owner.id)).rejects.toMatchObject({ status: 404 });
    await database.db.update(funnels).set({ deletedAt: null }).where(eq(funnels.id, f.funnel.id));
    await expect(database.db.transaction(async tx => {
      await api.lockErasureJournal(tx);
      await api.recordErasure(tx, { type: "queued_account", key: f.owner.erasureKey, files: [], billingCustomerId: null, billingClosed: true });
      throw new Error("SQL rollback");
    })).rejects.toThrow("SQL rollback");
    await acknowledge();
    expect(await worker.runAnalyticsRetentionBatch()).toMatchObject({ queued: 0 });
    await expect(service.saveAnalyticsRetention(f.funnel.id, f.owner.id, { ...draft, expectedVersion: 2 })).rejects.toMatchObject({ status: 404 });
  });

  it("retains durable intent after SQL rollback and applies it on offline replay without a receipt", async () => {
    const f = await fixture();
    await expect(database.db.transaction(async tx => {
      await api.lockErasureJournal(tx);
      await api.recordErasure(tx, { type: "analytics_before", key: f.funnel.uuid, before: new Date(Date.now() - 30 * 86400000).toISOString(), maxId: f.events[0].id });
      throw new Error("SQL rollback");
    })).rejects.toThrow("SQL rollback");
    expect(await worker.runAnalyticsRetentionBatch()).toMatchObject({ deleted: 0 });
    await api.assertErasureJournalReady(base);
    expect((await service.previewAnalyticsRetention(f.funnel.id, f.owner.id)).counts.committed).toBe(1);
    const head = (await api.readJournal(journal)).checkpoint;
    expect(await api.replayErasureJournal(journal, base, head)).toMatchObject({ analytics: 1 });
    expect(await api.replayErasureJournal(journal, base, head)).toMatchObject({ analytics: 0 });
  });

  it("replays a real older dump, preserves new identities and remains idempotent", async () => {
    const f = await fixture(), other = await fixture();
    const dump = path.join(base, "before.dump");
    await execute("pg_dump", ["--format=custom", "--file", dump, databaseUrl]);
    await activate(f); await worker.runAnalyticsRetentionBatch(); await acknowledge(); await worker.runAnalyticsRetentionBatch();
    const head = (await api.readJournal(journal)).checkpoint;
    await execute("pg_restore", ["--clean", "--if-exists", "--no-owner", "--no-acl", "--exit-on-error", "--dbname", databaseUrl, dump]);
    expect(await api.replayErasureJournal(journal, base, head)).toMatchObject({ analytics: 1 });
    expect(await eventsFor(other.funnel.id)).toHaveLength(1);
    // Reused event ID with a new timestamp is outside the old time fence.
    await database.db.insert(analyticsEvents).values({ id: f.events[0].id, funnelId: f.funnel.id, eventType: "view" });
    expect(await api.replayErasureJournal(journal, base, head)).toMatchObject({ analytics: 0 });
    await database.db.delete(funnels).where(eq(funnels.id, f.funnel.id));
    await database.db.insert(funnels).values({ id: f.funnel.id, userId: f.owner.id, name: "Neue Identität" });
    await database.db.insert(analyticsEvents).values({ id: f.events[0].id, funnelId: f.funnel.id, eventType: "view", timestamp: f.events[0].timestamp });
    expect(await api.replayErasureJournal(journal, base, head)).toMatchObject({ analytics: 0 });
    expect(await eventsFor(f.funnel.id)).toHaveLength(1);
  }, 30_000);

  it("fails closed on a corrupt journal and cannot activate with a partial receipt", async () => {
    const f = await fixture(); await activate(f); await worker.runAnalyticsRetentionBatch();
    await service.activateAnalyticsRetention(f.funnel.id, f.owner.id, { expectedVersion: 2, active: false });
    const preview = await service.previewAnalyticsRetention(f.funnel.id, f.owner.id);
    await expect(service.activateAnalyticsRetention(f.funnel.id, f.owner.id, { expectedVersion: 3, active: true, confirmed: true, previewToken: preview.previewToken })).rejects.toMatchObject({ status: 503 });
    await fs.chmod(path.join(journal, "000000000001.json"), 0o644);
    await expect(worker.runAnalyticsRetentionBatch()).rejects.toThrow();
    expect(await eventsFor(f.funnel.id)).toHaveLength(1);
  });
});
