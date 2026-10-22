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
    expect(await storage.deleteLeadsByEmail(subject.owner.id, ` ${subject.lead.email!.toUpperCase()} `)).toBe(2);
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
    await storage.deleteLead(a.lead.id, a.owner.id); await account.deleteAccountWithFiles(b.owner.id, { root });
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
});
