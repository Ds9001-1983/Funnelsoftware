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
import { platformVisits, analyticsEvents, funnels, users } from "@shared/schema";

const connection = process.env.PLATFORM_RETENTION_TEST_DATABASE_URL;
if (connection) {
  const url = new URL(connection);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || !/^\/funnelsoftware_e2e(?:_[a-z0-9_]+)?$/.test(url.pathname)
    || !["postgres:", "postgresql:"].includes(url.protocol) || url.search || url.hash) throw new Error("Analytics tests require an isolated local E2E database");
}
const execute = promisify(execFile);
describe.skipIf(!connection)("platform retention with independently confirmed erasure", () => {
  let database: typeof import("./db"), api: typeof import("./erasure-journal"), worker: typeof import("./platform-retention");
  let admin: pg.Client, databaseUrl: string, base: string, journal: string;
  const databaseName = `funnelsoftware_e2e_analytics_${randomUUID().replaceAll("-", "")}`;
  const previous = { database: process.env.DATABASE_URL, journal: process.env.ERASURE_JOURNAL_DIR, days: process.env.PLATFORM_ANALYTICS_RETENTION_DAYS };
  beforeAll(async () => {
    admin = new pg.Client({ connectionString: connection }); await admin.connect();
    await admin.query(`CREATE DATABASE "${databaseName}"`);
    const url = new URL(connection!); url.pathname = `/${databaseName}`; databaseUrl = url.toString();
    await execute(process.execPath, ["node_modules/drizzle-kit/bin.cjs", "push", "--force"], {
      cwd: process.cwd(), env: { PATH: process.env.PATH, DATABASE_URL: databaseUrl }, timeout: 60_000,
    });
    process.env.DATABASE_URL = databaseUrl;
    database = await import("./db"); api = await import("./erasure-journal");
    worker = await import("./platform-retention");
    base = await fs.mkdtemp(path.join(os.tmpdir(), "analytics-retention-test-"));
  }, 90_000);
  beforeEach(async () => {
    await database.pool.query("TRUNCATE platform_visits, users, erasure_journal_identity, erasure_journal_receipts RESTART IDENTITY CASCADE");
    delete process.env.PLATFORM_ANALYTICS_RETENTION_DAYS;
    const root = await fs.mkdtemp(path.join(base, "case-"));
    journal = path.join(root, "journal"); process.env.ERASURE_JOURNAL_DIR = journal;
    await api.initializeErasureJournal(journal);
  });
  afterAll(async () => {
    if (database) await database.pool.end();
    if (admin) { await admin.query(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`); await admin.end(); }
    if (base) await fs.rm(base, { recursive: true, force: true });
    if (previous.days === undefined) delete process.env.PLATFORM_ANALYTICS_RETENTION_DAYS; else process.env.PLATFORM_ANALYTICS_RETENTION_DAYS = previous.days;
    if (previous.database === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = previous.database;
    if (previous.journal === undefined) delete process.env.ERASURE_JOURNAL_DIR; else process.env.ERASURE_JOURNAL_DIR = previous.journal;
  });
  async function acknowledge() {
    const directory = `${journal}-offsite`;
    await fs.mkdir(directory, { mode: 0o700, recursive: true });
    await fs.writeFile(path.join(directory, "receipt.json"), JSON.stringify({ version: 1, checkpoint: (await api.readJournal(journal)).checkpoint, confirmedAt: new Date().toISOString() }), { mode: 0o600 });
  }
  async function events(count = 1, timestamp = new Date(Date.now() - 100 * 86400000)) {
    return database.db.insert(platformVisits).values(Array.from({ length: count }, () => ({ visitorHash: randomUUID(), path: "/", timestamp }))).returning();
  }
  const rows = () => database.db.select().from(platformVisits);
  it("does not activate by default, previews read-only and waits for the exact receipt", async () => {
    await events();
    process.env.PLATFORM_ANALYTICS_RETENTION_DAYS = "90";
    expect(await worker.runPlatformRetentionBatch()).toMatchObject({ queued: 0, deleted: 0, waitingForBackup: true });
    delete process.env.PLATFORM_ANALYTICS_RETENTION_DAYS;
    await acknowledge();
    expect(await worker.previewPlatformRetention(90)).toMatchObject({ days: 90, count: 1 });
    expect(await worker.runPlatformRetentionBatch()).toMatchObject({ queued: 0, deleted: 0 });
    expect((await api.readJournal(journal)).entries).toHaveLength(0);
    process.env.PLATFORM_ANALYTICS_RETENTION_DAYS = "90";
    expect(await worker.runPlatformRetentionBatch()).toMatchObject({ queued: 1, deleted: 0 });
    expect(await worker.runPlatformRetentionBatch()).toMatchObject({ deleted: 0, waitingForBackup: true });
    expect(await rows()).toHaveLength(1);
    await acknowledge();
    expect(await worker.runPlatformRetentionBatch()).toMatchObject({ deleted: 1 });
    expect(await rows()).toHaveLength(0);
  });
  it("bounds and serializes batches; drains committed work after disabling the rule", async () => {
    await events(505); await acknowledge(); process.env.PLATFORM_ANALYTICS_RETENTION_DAYS = "90";
    const results = await Promise.all([worker.runPlatformRetentionBatch(), worker.runPlatformRetentionBatch()]);
    expect(results.reduce((n, r) => n + r.queued, 0)).toBe(505);
    expect((await api.readJournal(journal)).entries).toHaveLength(1);
    delete process.env.PLATFORM_ANALYTICS_RETENTION_DAYS;
    await acknowledge();
    expect(await worker.runPlatformRetentionBatch()).toMatchObject({ deleted: 500, queued: 0 });
    expect(await worker.runPlatformRetentionBatch()).toMatchObject({ deleted: 5, queued: 0 });
    expect(await worker.runPlatformRetentionBatch()).toMatchObject({ deleted: 0, queued: 0 });
  });
  it("preserves newer timestamps, higher IDs and customer analytics at a microsecond boundary", async () => {
    const now = new Date(), cutoff = new Date(now.getTime() - 90 * 86400000).toISOString();
    await database.pool.query("INSERT INTO platform_visits(visitor_hash,path,timestamp) VALUES ('old','/',($1::timestamptz AT TIME ZONE 'UTC')), ('new','/',($1::timestamptz AT TIME ZONE 'UTC') + interval '1 microsecond')", [cutoff]);
    const [owner] = await database.db.insert(users).values({ username: randomUUID(), email: `${randomUUID()}@example.test`, password: "synthetic" }).returning();
    const [funnel] = await database.db.insert(funnels).values({ userId: owner.id, name: "Protected" }).returning();
    await database.db.insert(analyticsEvents).values({ funnelId: funnel.id, eventType: "view", timestamp: new Date(0) });
    process.env.PLATFORM_ANALYTICS_RETENTION_DAYS = "90"; await acknowledge();
    expect(await worker.runPlatformRetentionBatch(now)).toMatchObject({ queued: 1 });
    const [later] = await events(); await acknowledge();
    expect(await worker.runPlatformRetentionBatch(now)).toMatchObject({ deleted: 1, queued: 0 });
    expect((await rows()).map(r => r.visitorHash)).toEqual(expect.arrayContaining(["new", later.visitorHash]));
    expect(await database.db.select().from(analyticsEvents)).toHaveLength(1);
  });
  it("replays a durable SQL rollback after a real backup restore, repeatedly", async () => {
    const [old] = await events(); const [current] = await events(1, new Date());
    const dump = path.join(base, "platform-before.dump");
    await execute("pg_dump", ["--format=custom", "--file", dump, databaseUrl]);
    await expect(database.db.transaction(async tx => {
      await api.lockErasureJournal(tx);
      await api.recordErasure(tx, { type: "platform_before", before: old.timestamp.toISOString(), maxId: old.id });
      throw new Error("SQL rollback");
    })).rejects.toThrow("SQL rollback");
    await acknowledge();
    expect(await worker.runPlatformRetentionBatch()).toMatchObject({ deleted: 1 });
    await execute("pg_restore", ["--clean", "--if-exists", "--no-owner", "--dbname", databaseUrl, dump]);
    expect(await rows()).toHaveLength(2);
    const checkpoint = (await api.readJournal(journal)).checkpoint;
    expect(await api.replayErasureJournal(journal, base, checkpoint)).toMatchObject({ platformAnalytics: 1 });
    expect(await api.replayErasureJournal(journal, base, checkpoint)).toMatchObject({ platformAnalytics: 0 });
    expect((await rows()).map(r => r.id)).toEqual([current.id]);
  });
  it("rejects invalid periods rather than silently enabling or disabling erasure", async () => {
    for (const value of ["0", "-1", "1.5", "NaN", "36501", "90days"]) {
      process.env.PLATFORM_ANALYTICS_RETENTION_DAYS = value;
      expect(() => worker.platformRetentionDays()).toThrow();
    }
    await expect(worker.previewPlatformRetention(0)).rejects.toThrow();
  });
});
