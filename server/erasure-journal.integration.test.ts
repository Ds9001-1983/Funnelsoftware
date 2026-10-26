// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import pg from "pg";
import { eq, sql } from "drizzle-orm";
import { erasureJournalIdentity, erasureJournalReceipts, funnels, leads, leadStageEvents, ownedUploads, recruitingMailJobs, recruitingMailRules, users } from "@shared/schema";

const connection = process.env.ERASURE_TEST_DATABASE_URL;
if (connection) {
  const url = new URL(connection);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || !/^\/funnelsoftware_e2e(?:_[a-z0-9_]+)?$/.test(url.pathname)
    || !["postgres:", "postgresql:"].includes(url.protocol) || url.search || url.hash) throw new Error("Journal tests need an isolated local E2E database");
}
const execute = promisify(execFile);

describe.skipIf(!connection)("independent erasure journal and real backup replay", () => {
  let database: typeof import("./db"), api: typeof import("./erasure-journal"), account: typeof import("./account-files"), storage: (typeof import("./storage"))["storage"];
  let admin: pg.Client, databaseUrl: string, root: string, journal: string, base: string;
  const databaseName = `funnelsoftware_e2e_erasure_${randomUUID().replaceAll("-", "")}`;
  const previous = { database: process.env.DATABASE_URL, journal: process.env.ERASURE_JOURNAL_DIR };

  beforeAll(async () => {
    admin = new pg.Client({ connectionString: connection }); await admin.connect();
    await admin.query(`CREATE DATABASE "${databaseName}"`);
    const url = new URL(connection!); url.pathname = `/${databaseName}`; databaseUrl = url.toString();
    // Never push/restore the caller's database. This suite owns its new DB.
    await execute(process.execPath, ["node_modules/drizzle-kit/bin.cjs", "push", "--force"], {
      cwd: process.cwd(), env: { PATH: process.env.PATH, DATABASE_URL: databaseUrl }, timeout: 60_000,
    });
    process.env.DATABASE_URL = databaseUrl;
    database = await import("./db"); api = await import("./erasure-journal"); account = await import("./account-files");
    ({ storage } = await import("./storage"));
    base = await fs.mkdtemp(path.join(os.tmpdir(), "erasure-replay-test-"));
    await database.pool.query('CREATE TABLE IF NOT EXISTS "session" (sid varchar PRIMARY KEY, sess json NOT NULL, expire timestamp NOT NULL)');
  }, 90_000);

  beforeEach(async () => {
    await database.pool.query('TRUNCATE users, erasure_journal_identity, erasure_journal_receipts, "session" RESTART IDENTITY CASCADE');
    root = await fs.mkdtemp(path.join(base, "files-"));
    await fs.mkdir(path.join(root, "uploads")); await fs.mkdir(path.join(root, "private-uploads/bug-reports"), { recursive: true });
    journal = path.join(root, "independent-journal"); process.env.ERASURE_JOURNAL_DIR = journal;
    await api.initializeErasureJournal(journal);
  });

  afterAll(async () => {
    if (database) await database.pool.end();
    if (admin) { await admin.query(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`); await admin.end(); }
    if (base) await fs.rm(base, { recursive: true, force: true });
    if (previous.database === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = previous.database;
    if (previous.journal === undefined) delete process.env.ERASURE_JOURNAL_DIR; else process.env.ERASURE_JOURNAL_DIR = previous.journal;
  });

  async function fixture() {
    const token = randomUUID();
    const [owner] = await database.db.insert(users).values({ username: token, email: `${token}@example.test`, password: "synthetic", emailVerifiedAt: new Date() }).returning();
    const [funnel] = await database.db.insert(funnels).values({ userId: owner.id, name: "synthetic", leads: 1 }).returning();
    const [lead] = await database.db.insert(leads).values({ userId: owner.id, funnelId: funnel.id, email: `${token}-applicant@example.test`, answers: { private: "synthetic answer" } }).returning();
    return { owner, funnel, lead };
  }
  async function upload(ownerId: number, area: "public" | "support" = "public") {
    const filename = `${randomUUID()}.webp`, full = account.accountFilePath(root, area, filename);
    await account.withOwnedUpload(ownerId, area, filename, () => fs.writeFile(full, "synthetic-file"));
    return { filename, full };
  }
  const exists = async (file: string) => fs.lstat(file).then(() => true, () => false);
  const checkpoint = async () => (await api.readJournal(journal)).checkpoint;
  const count = async (table: string) => Number((await database.pool.query(`SELECT count(*) FROM ${table}`)).rows[0].count);

  it("replays real pg_dump/pg_restore and restored files, including cascades and sessions, twice", async () => {
    const subject = await fixture(), erased = await fixture(), survivor = await fixture();
    const [duplicate] = await database.db.insert(leads).values({ userId: subject.owner.id, funnelId: subject.funnel.id, email: ` ${subject.lead.email!.toUpperCase()} ` }).returning();
    await database.db.update(funnels).set({ leads: 2 }).where(eq(funnels.id, subject.funnel.id));
    const [rule] = await database.db.insert(recruitingMailRules).values({ funnelId: subject.funnel.id, ruleKey: "synthetic", trigger: "created", subject: "test", body: "test", senderName: "test", enabled: false }).returning();
    await database.db.insert(recruitingMailJobs).values({ ownerId: subject.owner.id, leadId: subject.lead.id, ruleId: rule.id, recipient: subject.lead.email!, replyTo: "synthetic@example.test", senderName: "test", subject: "test", body: "private-mail", status: "cancelled" });
    await database.db.insert(leadStageEvents).values({ leadId: subject.lead.id, actorId: subject.owner.id, fromStageId: "new", toStageId: "lost", version: 1 });
    const publicFile = await upload(erased.owner.id), supportFile = await upload(erased.owner.id, "support"), foreignFile = await upload(survivor.owner.id);
    await database.pool.query('INSERT INTO "session" VALUES ($1,$2,now()+interval \'1 day\')', ["synthetic", JSON.stringify({ passport: { user: erased.owner.id } })]);
    const dump = path.join(root, "before.dump"), filesBackup = path.join(root, "before-files");
    await execute("pg_dump", ["--format=custom", "--file", dump, databaseUrl]);
    await fs.cp(path.join(root, "uploads"), path.join(filesBackup, "uploads"), { recursive: true });
    await fs.cp(path.join(root, "private-uploads"), path.join(filesBackup, "private-uploads"), { recursive: true });
    expect(await storage.deleteLeadsByEmail(subject.owner.id, ` ${subject.lead.email!.toUpperCase()} `)).toMatchObject({ status: "queued", queuedCount: 2, deletedCount: 0 });
    await acknowledge();
    expect(await (await import("./retention-worker")).runRetentionBatch()).toMatchObject({ deleted: 2 });
    expect(await account.deleteAccountWithFiles(erased.owner.id, { root })).toBe(true);
    await api.assertErasureJournalReady(root);
    const head = await checkpoint();
    const log = JSON.stringify((await api.readJournal(journal)).entries);
    for (const content of [subject.lead.email!, erased.owner.email, "synthetic answer", "private-mail", "password"]) expect(log).not.toContain(content);
    expect(log).toContain(duplicate.uuid);

    await execute("pg_restore", ["--clean", "--if-exists", "--no-owner", "--no-acl", "--exit-on-error", "--dbname", databaseUrl, dump]);
    await fs.cp(path.join(filesBackup, "uploads"), path.join(root, "uploads"), { recursive: true });
    await fs.cp(path.join(filesBackup, "private-uploads"), path.join(root, "private-uploads"), { recursive: true });
    await expect(api.assertErasureJournalReady(root)).rejects.toThrow();
    expect(await api.replayErasureJournal(journal, root, head)).toMatchObject({ accounts: 1, leads: 2 });
    expect(await count("users")).toBe(2); expect(await count("leads")).toBe(1);
    expect(await count("lead_stage_events")).toBe(0); expect(await count("recruiting_mail_jobs")).toBe(0); expect(await count('"session"')).toBe(0);
    expect((await database.db.select().from(funnels).where(eq(funnels.id, subject.funnel.id)))[0].leads).toBe(0);
    expect(await exists(publicFile.full)).toBe(false); expect(await exists(supportFile.full)).toBe(false); expect(await exists(foreignFile.full)).toBe(true);
    expect(await api.replayErasureJournal(journal, root, head)).toMatchObject({ accounts: 0, leads: 0 });
    await api.assertErasureJournalReady(root);
  }, 30_000);

  it("preserves new accounts and leads with reused numeric IDs", async () => {
    const a = await fixture(), b = await fixture();
    await storage.deleteLead(a.lead.id, a.owner.id);
    await acknowledge();
    await (await import("./retention-worker")).runRetentionBatch();
    await account.deleteAccountWithFiles(b.owner.id, { root });
    const [replacement] = await database.db.insert(users).values({ id: b.owner.id, username: "replacement", email: "replacement@example.test", password: "synthetic" }).returning();
    const [replacementLead] = await database.db.insert(leads).values({ id: a.lead.id, funnelId: a.funnel.id, userId: a.owner.id }).returning();
    await api.replayErasureJournal(journal, root, await checkpoint());
    expect((await database.db.select().from(users).where(eq(users.id, replacement.id)))[0].erasureKey).toBe(replacement.erasureKey);
    expect((await database.db.select().from(leads).where(eq(leads.id, replacementLead.id)))[0].uuid).toBe(replacementLead.uuid);
  });

  it("keeps a durable intent after a partial file failure and blocks startup until replay", async () => {
    const f = await fixture(), a = await upload(f.owner.id), b = await upload(f.owner.id);
    let calls = 0;
    await expect(account.deleteAccountWithFiles(f.owner.id, { root, removeFile: async file => {
      if (++calls === 2) throw Object.assign(new Error("synthetic"), { code: "EACCES" });
      await fs.unlink(file);
    } })).rejects.toThrow();
    expect(await count("users")).toBe(1); expect(await count("erasure_journal_receipts")).toBe(0);
    expect((await checkpoint()).sequence).toBe(1);
    await expect(api.assertErasureJournalReady(root)).rejects.toThrow();
    await api.replayErasureJournal(journal, root, await checkpoint());
    expect(await exists(a.full)).toBe(false); expect(await exists(b.full)).toBe(false); expect(await count("users")).toBe(0);
    await api.assertErasureJournalReady(root);
  });

  it("does not delete when the independent journal cannot be validated or written", async () => {
    const f = await fixture(), file = await upload(f.owner.id);
    await fs.chmod(path.join(journal, "anchor.json"), 0o644);
    await expect(storage.deleteLead(f.lead.id, f.owner.id)).rejects.toThrow();
    await expect(account.deleteAccountWithFiles(f.owner.id, { root })).rejects.toThrow();
    expect(await count("leads")).toBe(1); expect(await count("users")).toBe(1); expect(await exists(file.full)).toBe(true);
  });

  it("rejects a truncated tail, changed contents, and a stale external checkpoint", async () => {
    const f = await fixture(), stale = await checkpoint();
    await storage.deleteLead(f.lead.id, f.owner.id);
    const filename = path.join(journal, "000000000001.json"), original = await fs.readFile(filename);
    await fs.unlink(filename);
    await expect(api.assertErasureJournalReady(root)).rejects.toThrow();
    await fs.writeFile(filename, original, { mode: 0o600 });
    await expect(api.replayErasureJournal(journal, root, stale)).rejects.toThrow();
    const changed = JSON.parse(original.toString()); changed.entry.target.keys[0] = randomUUID();
    await fs.writeFile(filename, JSON.stringify(changed));
    await expect(api.assertErasureJournalReady(root)).rejects.toThrow();
  });

  it("serializes concurrent deletion writers into a complete chain", async () => {
    const fixtures = await Promise.all([fixture(), fixture(), fixture(), fixture()]);
    await Promise.all(fixtures.map(f => storage.deleteLead(f.lead.id, f.owner.id)));
    expect((await checkpoint()).sequence).toBe(4); expect(await count("erasure_journal_receipts")).toBe(4);
    await api.assertErasureJournalReady(root);
    await fs.unlink(path.join(journal, "000000000002.json"));
    await expect(api.readJournal(journal)).rejects.toThrow();
  });

  it("refuses missing binding or journal instead of initializing over lost history", async () => {
    await expect(api.initializeErasureJournal(path.join(root, "missing-journal"))).rejects.toThrow();
    await database.db.delete(erasureJournalIdentity);
    await expect(api.assertErasureJournalReady(root)).rejects.toThrow();
    await expect(api.replayErasureJournal(journal, root, await checkpoint())).rejects.toThrow();
  });

  it("blocks a symlinked upload directory without touching its destination", async () => {
    const f = await fixture(), file = await upload(f.owner.id);
    await account.deleteAccountWithFiles(f.owner.id, { root });
    const outside = await fs.mkdtemp(path.join(base, "outside-"));
    await fs.writeFile(path.join(outside, file.filename), "must-survive");
    await fs.rmdir(path.join(root, "uploads")); await fs.symlink(outside, path.join(root, "uploads"));
    await expect(api.replayErasureJournal(journal, root, await checkpoint())).rejects.toThrow();
    expect(await fs.readFile(path.join(outside, file.filename), "utf8")).toBe("must-survive");
  });

  it("does not record absent or foreign targets", async () => {
    const f = await fixture(), other = await fixture();
    expect(await storage.deleteLead(f.lead.id, other.owner.id)).toBe(false);
    expect(await storage.deleteLeadsByEmail(other.owner.id, f.lead.email!)).toBe(0);
    expect((await checkpoint()).sequence).toBe(0);
  });

  it("reconciles an interrupted response after SQL commit without permitting resurrected files", async () => {
    const f = await fixture(), file = await upload(f.owner.id);
    await account.deleteAccountWithFiles(f.owner.id, { root });
    await database.db.delete(erasureJournalReceipts);
    await api.assertErasureJournalReady(root); expect(await count("erasure_journal_receipts")).toBe(1);
    await fs.writeFile(file.full, "restored-old-upload");
    await expect(api.assertErasureJournalReady(root)).rejects.toThrow();
    await api.replayErasureJournal(journal, root, await checkpoint());
    expect(await exists(file.full)).toBe(false);
  });

  it("refuses a restored filename now attributed to a different account", async () => {
    const erased = await fixture(), survivor = await fixture(), file = await upload(erased.owner.id);
    await account.deleteAccountWithFiles(erased.owner.id, { root });
    await database.db.insert(ownedUploads).values({ filename: file.filename, userId: survivor.owner.id, area: "public" });
    await fs.writeFile(file.full, "foreign-owner");
    await expect(api.replayErasureJournal(journal, root, await checkpoint())).rejects.toThrow();
    expect(await fs.readFile(file.full, "utf8")).toBe("foreign-owner");
    expect(await count("users")).toBe(1);
  });

  it("creates the deployment baseline through the real CLI without replacing an existing backup", async () => {
    const f = await fixture(), file = await upload(f.owner.id);
    const backup = await fs.mkdtemp(path.join(base, "release-backup-"));
    const args = ["--import", "tsx", "scripts/erasure-journal.ts", "prepare-release", backup, root];
    const options = { env: { PATH: process.env.PATH, NODE_ENV: "production", DOTENV_CONFIG_PATH: "/dev/null", DATABASE_URL: databaseUrl, ERASURE_JOURNAL_DIR: journal } };
    const result = await execute(process.execPath, args, options);
    expect(JSON.parse(result.stdout)).toMatchObject({ journalReady: true, baselineCreated: true });
    expect((await execute("pg_restore", ["--list", path.join(backup, "journal-baseline.dump")])).stdout).toContain("erasure_journal_identity");
    expect(JSON.parse(await fs.readFile(path.join(backup, "journal-baseline-checkpoint.json"), "utf8"))).toEqual(await checkpoint());
    expect((await fs.stat(path.join(backup, "journal-baseline.dump"))).mode & 0o077).toBe(0);
    await expect(execute(process.execPath, args, options)).rejects.toThrow();

    await account.deleteAccountWithFiles(f.owner.id, { root });
    const restoreName = `tw_restore_journal_${randomUUID().replaceAll("-", "")}`;
    const restoreUrl = new URL(databaseUrl); restoreUrl.pathname = `/${restoreName}`;
    const restoredFiles = await fs.mkdtemp(path.join(base, "restored-cli-"));
    await admin.query(`CREATE DATABASE "${restoreName}"`);
    try {
      await execute("pg_restore", ["--no-owner", "--no-acl", "--exit-on-error", "--dbname", restoreUrl.toString(), path.join(backup, "journal-baseline.dump")]);
      await execute("tar", ["-xzf", path.join(backup, "journal-baseline-uploads.tar.gz"), "-C", restoredFiles]);
      const currentHead = path.join(backup, "fresh-head.json");
      await execute(process.execPath, ["--import", "tsx", "scripts/erasure-journal.ts", "checkpoint", currentHead], options);
      const replayArgs = ["--import", "tsx", "scripts/erasure-journal.ts", "replay", restoredFiles, currentHead];
      // Source DB name is not a restore target.
      await expect(execute(process.execPath, replayArgs, options)).rejects.toThrow();
      const restoreOptions = { env: { ...options.env, DATABASE_URL: restoreUrl.toString() } };
      await expect(execute(process.execPath, [...replayArgs.slice(0, -1), path.join(backup, "journal-baseline-checkpoint.json")], restoreOptions)).rejects.toThrow();
      expect(await exists(path.join(restoredFiles, "uploads", file.filename))).toBe(true);
      expect(JSON.parse((await execute(process.execPath, replayArgs, restoreOptions)).stdout)).toMatchObject({ accounts: 1 });
      expect(JSON.parse((await execute(process.execPath, replayArgs, restoreOptions)).stdout)).toMatchObject({ accounts: 0 });
      expect(await exists(path.join(restoredFiles, "uploads", file.filename))).toBe(false);
      expect(JSON.parse((await execute(process.execPath, ["--import", "tsx", "scripts/erasure-journal.ts", "check", restoredFiles], restoreOptions)).stdout)).toEqual({ ready: true });
    } finally { await admin.query(`DROP DATABASE "${restoreName}" WITH (FORCE)`); }
  }, 30_000);
  async function acknowledge(overrides: Record<string, unknown> = {}) {
    const destination = `${journal}-offsite`;
    await fs.mkdir(destination, { mode: 0o700, recursive: true });
    await fs.writeFile(path.join(destination, "receipt.json"), JSON.stringify({ version: 1, checkpoint: await checkpoint(), confirmedAt: new Date().toISOString(), ...overrides }), { mode: 0o600 });
  }

  it("queues manual deletion offline, survives restart and retries, freezes edits and exposes pending status", async () => {
    const f = await fixture();
    const worker = await import("./retention-worker");
    const result = { status: "queued", queuedCount: 1, deletedCount: 0 };
    expect(await storage.deleteLead(f.lead.id, f.owner.id)).toEqual(result);
    expect(await count("leads")).toBe(1);
    expect(await worker.runRetentionBatch()).toMatchObject({ deleted: 0, waitingForBackup: true });
    await api.assertErasureJournalReady(root);
    expect(await storage.deleteLead(f.lead.id, f.owner.id)).toEqual(result);
    expect(await storage.deleteLeadsByEmail(f.owner.id, f.lead.email!)).toEqual(result);
    expect((await checkpoint()).sequence).toBe(1);
    expect(await storage.getLead(f.lead.id, f.owner.id)).toMatchObject({ erasureRequested: true });
    expect((await storage.getLeads(f.owner.id))[0]).toMatchObject({ erasureRequested: true });
    expect((await storage.getLeadsByFunnel(f.funnel.id, f.owner.id))[0]).toMatchObject({ erasureRequested: true });
    await expect(storage.updateLead(f.lead.id, f.owner.id, { email: "changed@example.test" })).rejects.toMatchObject({ code: "RETENTION_COMMITTED" });
    const exporter = await import("./subject-export");
    expect((await exporter.exportSubjectData(f.owner.id, f.lead.email!)).leads[0].erasureRequested).toBe(true);
    await acknowledge({ confirmedAt: new Date(Date.now() - 16 * 60_000).toISOString() });
    expect(await worker.runRetentionBatch()).toMatchObject({ deleted: 0 });
    await acknowledge({ checkpoint: { ...await checkpoint(), hash: "0".repeat(64) } });
    expect(await worker.runRetentionBatch()).toMatchObject({ deleted: 0 });
    await acknowledge();
    expect(await worker.runRetentionBatch()).toMatchObject({ deleted: 1 });
    expect(await storage.deleteLead(f.lead.id, f.owner.id)).toBe(false);
    expect(await storage.deleteLeadsByEmail(f.owner.id, f.lead.email!)).toBe(0);
    expect((await database.db.select().from(funnels))[0].leads).toBe(0);
  });
  it("chunks manual bulk requests, preserves foreign and later leads, and executes only the confirmed prefix", async () => {
    const f = await fixture(), foreign = await fixture();
    const worker = await import("./retention-worker");
    await database.db.update(leads).set({ email: f.lead.email }).where(eq(leads.id, foreign.lead.id));
    await database.db.insert(leads).values(Array.from({ length: 44 }, () => ({ userId: f.owner.id, funnelId: f.funnel.id, email: f.lead.email })));
    await database.db.update(funnels).set({ leads: 45, deletedAt: new Date() }).where(eq(funnels.id, f.funnel.id));
    expect(await storage.deleteLeadsByEmail(f.owner.id, ` ${f.lead.email!.toUpperCase()} `)).toMatchObject({ queuedCount: 45, deletedCount: 0 });
    const journalState = await api.readJournal(journal);
    expect(journalState.entries.map(r => r.entry.target.type === "retention_leads" ? r.entry.target.keys.length : -1)).toEqual([20, 20, 5]);
    expect(await storage.deleteLeadsByEmail(f.owner.id, f.lead.email!)).toMatchObject({ queuedCount: 45 });
    expect((await checkpoint()).sequence).toBe(3);
    const [later] = await database.db.insert(leads).values({ userId: f.owner.id, funnelId: f.funnel.id, email: f.lead.email }).returning();
    await database.db.update(funnels).set({ leads: 46 }).where(eq(funnels.id, f.funnel.id));
    await acknowledge({ checkpoint: { ...journalState.checkpoint, sequence: 1, hash: journalState.entries[0].hash } });
    expect(await worker.runRetentionBatch()).toMatchObject({ deleted: 20, waitingForBackup: true });
    expect(await worker.runRetentionBatch()).toMatchObject({ deleted: 0, waitingForBackup: true });
    await acknowledge();
    expect(await worker.runRetentionBatch()).toMatchObject({ deleted: 20 });
    expect(await worker.runRetentionBatch()).toMatchObject({ deleted: 5 });
    expect(await count("leads")).toBe(2);
    expect(await storage.getLead(later.id, f.owner.id)).toMatchObject({ erasureRequested: false });
    expect(await storage.getLead(foreign.lead.id, foreign.owner.id)).toBeDefined();
    expect((await database.db.select().from(funnels).where(eq(funnels.id, f.funnel.id)))[0].leads).toBe(1);
  });
  it("deduplicates manual intents persisted before SQL rollback and rejects an invalid database binding", async () => {
    const f = await fixture();
    await expect(database.db.transaction(async tx => {
      await api.lockErasureJournal(tx);
      await api.queueLeadErasure(tx, [f.lead.uuid]);
      throw new Error("simulated SQL rollback");
    })).rejects.toThrow("simulated SQL rollback");
    expect(await count("erasure_journal_receipts")).toBe(0);
    expect(await storage.deleteLead(f.lead.id, f.owner.id)).toMatchObject({ queuedCount: 1 });
    expect((await checkpoint()).sequence).toBe(1);
    await api.assertErasureJournalReady(root);
    expect(await count("erasure_journal_receipts")).toBe(1);
    await database.db.delete(erasureJournalIdentity);
    await expect(storage.deleteLead(f.lead.id, f.owner.id)).rejects.toThrow();
    expect(await count("leads")).toBe(1);
  });
  it("keeps manual targets until in-flight mail completes and cancels unsent mail", async () => {
    const f = await fixture(), worker = await import("./retention-worker");
    const [rule] = await database.db.insert(recruitingMailRules).values({ funnelId: f.funnel.id, ruleKey: "manual", trigger: "created", subject: "test", body: "test", senderName: "test", enabled: true }).returning();
    await database.db.insert(recruitingMailJobs).values({ ownerId: f.owner.id, leadId: f.lead.id, ruleId: rule.id, recipient: f.lead.email!, replyTo: f.owner.email, senderName: "test", subject: "test", body: "test" });
    await storage.deleteLead(f.lead.id, f.owner.id);
    await acknowledge();
    const client = await database.pool.connect();
    try {
      await client.query("SELECT pg_advisory_lock($1::int,$2::int)", [worker.RETENTION_MAIL_LOCK, f.lead.id]);
      expect(await worker.runRetentionBatch()).toMatchObject({ deleted: 0 });
    } finally { await client.query("SELECT pg_advisory_unlock($1::int,$2::int)", [worker.RETENTION_MAIL_LOCK, f.lead.id]); client.release(); }
    const mail = await import("./recruiting-mail");
    expect(await mail.processRecruitingMailJobs()).toMatchObject({ cancelled: 1, sent: 0 });
    expect(await worker.runRetentionBatch()).toMatchObject({ deleted: 1 });
    expect(await count("recruiting_mail_jobs")).toBe(0);
  });

  async function retentionFixture() {
    const f = await fixture();
    await database.db.update(leads).set({ status: "lost", stageId: "lost", closedAt: new Date(Date.now() - 31 * 86400000) }).where(eq(leads.id, f.lead.id));
    const retention = await import("./retention");
    const worker = await import("./retention-worker");
    await retention.saveRetentionDraft(f.funnel.id, f.owner.id, { expectedVersion: 0, mode: "closed_applications", days: 30, purpose: "Synthetic retention test" });
    const activate = async () => {
      const preview = await retention.previewRetention(f.funnel.id, f.owner.id);
      return retention.setRetentionActivation(f.funnel.id, f.owner.id, { expectedVersion: preview.draft!.version, active: true, confirmed: true, previewToken: preview.previewToken });
    };
    return { ...f, retention, worker, activate };
  }
  it("requires an owned, confirmed fresh preview and external backup before activation", async () => {
    const f = await retentionFixture(), stranger = await fixture();
    await expect(f.activate()).rejects.toMatchObject({ status: 503 });
    await acknowledge();
    await expect(f.retention.setRetentionActivation(f.funnel.id, stranger.owner.id, { expectedVersion: 1, active: true })).rejects.toMatchObject({ status: 404 });
    for (const input of [{ confirmed: false }, { confirmed: true, previewToken: "forged" }]) {
      await expect(f.retention.setRetentionActivation(f.funnel.id, f.owner.id, { expectedVersion: 1, active: true, ...input })).rejects.toMatchObject({ status: 409 });
    }
    expect(await f.activate()).toMatchObject({ automaticDeletion: true, draft: { version: 2 } });
    await f.retention.saveRetentionDraft(f.funnel.id, f.owner.id, { expectedVersion: 2, mode: "closed_applications", days: 60, purpose: "Changed rule must be confirmed again" });
    expect(await f.retention.previewRetention(f.funnel.id, f.owner.id)).toMatchObject({ automaticDeletion: false });
    expect(await f.worker.runRetentionBatch()).toMatchObject({ queued: 0, deleted: 0 });
  });
  it("waits for the exact external prefix across restart, freezes committed data, then cascades exactly once", async () => {
    const f = await retentionFixture(); await acknowledge(); await f.activate();
    const [rule] = await database.db.insert(recruitingMailRules).values({ funnelId: f.funnel.id, ruleKey: "auto", trigger: "created", subject: "test", body: "test", senderName: "test", enabled: true }).returning();
    await database.db.insert(recruitingMailJobs).values({ ownerId: f.owner.id, leadId: f.lead.id, ruleId: rule.id, recipient: f.lead.email!, replyTo: f.owner.email, senderName: "test", subject: "test", body: "test" });
    await database.db.insert(leadStageEvents).values({ leadId: f.lead.id, actorId: f.owner.id, fromStageId: "new", toStageId: "lost", version: 1 });
    expect(await f.worker.runRetentionBatch()).toEqual({ queued: 1, deleted: 0, waitingForBackup: true });
    expect(await f.worker.runRetentionBatch()).toEqual({ queued: 0, deleted: 0, waitingForBackup: true });
    await api.assertErasureJournalReady(root); // restart accepts a durable waiting intent
    expect(await f.retention.previewRetention(f.funnel.id, f.owner.id)).toMatchObject({ counts: { committed: 1 }, backupReady: false });
    await expect(storage.updateLead(f.lead.id, f.owner.id, { name: "changed" })).rejects.toMatchObject({ code: "RETENTION_COMMITTED" });
    await expect(f.retention.saveRetentionException(f.lead.id, f.owner.id, { expectedVersion: 0, exception: null })).rejects.toMatchObject({ code: "RETENTION_COMMITTED" });
    const recruiting = await import("./recruiting");
    await expect(recruiting.changeRecruitingStage({ leadId: f.lead.id, ownerId: f.owner.id, actorId: f.owner.id, expectedVersion: 0, stageId: "new" })).rejects.toMatchObject({ code: "RETENTION_COMMITTED" });
    const exporter = await import("./subject-export");
    expect((await exporter.exportSubjectData(f.owner.id, f.lead.email!)).leads[0].erasureRequested).toBe(true);
    const mail = await import("./recruiting-mail");
    expect(await mail.processRecruitingMailJobs()).toMatchObject({ cancelled: 1, sent: 0 });
    // Pausing remains possible but does not revoke a durable deletion request.
    await f.retention.setRetentionActivation(f.funnel.id, f.owner.id, { expectedVersion: 2, active: false });
    await acknowledge();
    expect(await f.worker.runRetentionBatch()).toEqual({ queued: 0, deleted: 1, waitingForBackup: false });
    expect(await count("leads")).toBe(0); expect(await count("lead_stage_events")).toBe(0); expect(await count("recruiting_mail_jobs")).toBe(0);
    expect((await database.db.select().from(funnels))[0].leads).toBe(0);
    expect(await f.worker.runRetentionBatch()).toMatchObject({ queued: 0, deleted: 0 });
  });
  it("fails closed on missing, stale, future, malformed or mismatched receipts", async () => {
    const f = await retentionFixture(); await acknowledge(); await f.activate();
    for (const overrides of [
      { confirmedAt: new Date(Date.now() - 16 * 60_000).toISOString() },
      { confirmedAt: new Date(Date.now() + 60_000).toISOString() },
      { checkpoint: { ...await checkpoint(), hash: "0".repeat(64) } },
      { checkpoint: { ...await checkpoint(), instanceId: randomUUID() } },
      { unexpected: true },
    ]) {
      await acknowledge(overrides);
      expect(await f.worker.runRetentionBatch()).toEqual({ queued: 0, deleted: 0, waitingForBackup: true });
    }
    await fs.unlink(path.join(`${journal}-offsite`, "receipt.json"));
    expect(await f.worker.runRetentionBatch()).toMatchObject({ queued: 0, deleted: 0 });
    await acknowledge(); expect(await f.worker.runRetentionBatch()).toMatchObject({ queued: 1, deleted: 0 });
    await acknowledge({ confirmedAt: new Date(Date.now() - 16 * 60_000).toISOString() });
    expect(await f.worker.runRetentionBatch()).toMatchObject({ queued: 0, deleted: 0 });
    expect(await count("leads")).toBe(1);
  });
  it("protects exceptions, reopened and unproven cases before commitment", async () => {
    const f = await retentionFixture(); await acknowledge(); await f.activate();
    await f.retention.saveRetentionException(f.lead.id, f.owner.id, { expectedVersion: 0, exception: { reason: "Protected case", reviewAt: new Date(Date.now() + 86400000).toISOString() } });
    await database.pool.query("UPDATE lead_retention_exceptions SET review_at=now()-interval '1 day'");
    expect(await f.worker.runRetentionBatch()).toMatchObject({ queued: 0 });
    await f.retention.saveRetentionException(f.lead.id, f.owner.id, { expectedVersion: 1, exception: null });
    const recruiting = await import("./recruiting");
    await recruiting.changeRecruitingStage({ leadId: f.lead.id, ownerId: f.owner.id, actorId: f.owner.id, expectedVersion: 0, stageId: "new" });
    expect(await f.worker.runRetentionBatch()).toMatchObject({ queued: 0 });
    await database.db.update(leads).set({ status: "lost", closedAt: null }).where(eq(leads.id, f.lead.id));
    expect(await f.worker.runRetentionBatch()).toMatchObject({ queued: 0 });
    expect(await count("leads")).toBe(1);
  });
  it("skips removed funnels and unavailable owners while honoring explicitly activated general-lead rules", async () => {
    const removed = await retentionFixture(), unverified = await retentionFixture(), deletedOwner = await retentionFixture(), general = await retentionFixture();
    await acknowledge();
    for (const f of [removed, unverified, deletedOwner]) await f.activate();
    await database.db.update(funnels).set({ deletedAt: new Date() }).where(eq(funnels.id, removed.funnel.id));
    await database.db.update(users).set({ emailVerifiedAt: null }).where(eq(users.id, unverified.owner.id));
    await database.db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, deletedOwner.owner.id));
    await general.retention.saveRetentionDraft(general.funnel.id, general.owner.id, { expectedVersion: 1, mode: "general_leads", days: 30, purpose: "Explicit general lead retention" });
    await database.db.update(leads).set({ status: "new", closedAt: null, createdAt: new Date(Date.now() - 31 * 86400000) }).where(eq(leads.id, general.lead.id));
    await general.activate();
    expect(await general.worker.runRetentionBatch()).toMatchObject({ queued: 1, deleted: 0 });
    expect((await api.readJournal(journal)).entries[0].entry.target).toEqual({ type: "retention_leads", keys: [general.lead.uuid] });
    await acknowledge(); expect(await general.worker.runRetentionBatch()).toMatchObject({ deleted: 1 });
    expect(await count("leads")).toBe(3);
  });
  it("bounds concurrent runs to 20 intents and waits before advancing the next batch", async () => {
    const f = await retentionFixture(); await acknowledge(); await f.activate();
    await database.db.insert(leads).values(Array.from({ length: 24 }, () => ({ userId: f.owner.id, funnelId: f.funnel.id, status: "lost", closedAt: new Date(Date.now() - 40 * 86400000) })));
    await database.db.update(funnels).set({ leads: 25 }).where(eq(funnels.id, f.funnel.id));
    const first = await Promise.all([f.worker.runRetentionBatch(), f.worker.runRetentionBatch()]);
    expect(first.reduce((sum, run) => sum + run.queued, 0)).toBe(20);
    expect(await count("leads")).toBe(25);
    await acknowledge();
    expect(await f.worker.runRetentionBatch()).toEqual({ queued: 5, deleted: 20, waitingForBackup: true });
    expect(await count("leads")).toBe(5);
    await acknowledge(); expect(await f.worker.runRetentionBatch()).toMatchObject({ deleted: 5 });
    expect((await database.db.select().from(funnels))[0].leads).toBe(0);
  });
  it("skips a lead held by an in-flight SMTP lock without waiting", async () => {
    const f = await retentionFixture(); await acknowledge(); await f.activate();
    const client = await database.pool.connect();
    try {
      await client.query("SELECT pg_advisory_lock($1::int,$2::int)", [f.worker.RETENTION_MAIL_LOCK, f.lead.id]);
      expect(await f.worker.runRetentionBatch()).toMatchObject({ queued: 0, deleted: 0 });
    } finally { await client.query("SELECT pg_advisory_unlock($1::int,$2::int)", [f.worker.RETENTION_MAIL_LOCK, f.lead.id]); client.release(); }
    expect(await f.worker.runRetentionBatch()).toMatchObject({ queued: 1 });
  });
  it("recovers an intent persisted before SQL rollback and replays it on a real restored dump", async () => {
    const f = await retentionFixture();
    const dump = path.join(root, "retention-before.dump");
    await execute("pg_dump", ["--format=custom", "--file", dump, databaseUrl]);
    await expect(database.db.transaction(async tx => {
      await api.lockErasureJournal(tx);
      await api.recordErasure(tx, { type: "retention_leads", keys: [f.lead.uuid] });
      throw new Error("simulated commit interruption");
    })).rejects.toThrow("simulated");
    await api.assertErasureJournalReady(root);
    expect(await f.worker.runRetentionBatch()).toMatchObject({ deleted: 0 });
    await acknowledge(); expect(await f.worker.runRetentionBatch()).toMatchObject({ deleted: 1 });
    const head = await checkpoint();
    await execute("pg_restore", ["--clean", "--if-exists", "--no-owner", "--no-acl", "--exit-on-error", "--dbname", databaseUrl, dump]);
    expect(await count("leads")).toBe(1);
    expect(await api.replayErasureJournal(journal, root, head)).toMatchObject({ leads: 1 });
    expect(await api.replayErasureJournal(journal, root, head)).toMatchObject({ leads: 0 });
    expect(await count("leads")).toBe(0);
  });

});
