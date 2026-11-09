// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { eq, inArray, sql } from "drizzle-orm";
import { bugReports, funnels, mediaAssets, ownedUploads, users } from "@shared/schema";

const connection = process.env.FILE_DELETION_TEST_DATABASE_URL;
if (connection) {
  const url = new URL(connection);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || !/^\/funnelsoftware_e2e(?:_[a-z0-9_]+)?$/.test(url.pathname) || url.search || url.hash) throw new Error("File deletion tests require an isolated local E2E database");
}
const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
};

describe.skipIf(!connection)("account files and deletion", () => {
  let api: typeof import("./account-files"), database: typeof import("./db"), root: string;
  const ids: number[] = [], previous = process.env.DATABASE_URL;
  beforeAll(async () => {
    process.env.DATABASE_URL = connection;
    api = await import("./account-files"); database = await import("./db");
    root = await fs.mkdtemp(path.join(os.tmpdir(), "account-files-test-"));
    await fs.mkdir(path.join(root, "uploads"));
    await fs.mkdir(path.join(root, "private-uploads/bug-reports"), { recursive: true });
    await database.db.execute(sql`CREATE TABLE IF NOT EXISTS "session" (sid varchar PRIMARY KEY, sess json NOT NULL, expire timestamp NOT NULL)`);
  });
  afterAll(async () => {
    if (database) {
      for (const id of ids) await database.db.execute(sql`DELETE FROM "session" WHERE sess->'passport'->>'user' = ${String(id)}`);
      if (ids.length) await database.db.delete(users).where(inArray(users.id, ids));
      await database.pool.end();
    }
    if (root) await fs.rm(root, { recursive: true, force: true });
    if (previous === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = previous;
  });
  async function owner() {
    const suffix = randomUUID();
    const [row] = await database.db.insert(users).values({ username: suffix, email: `${suffix}@example.test`, password: "synthetic" }).returning({ id: users.id });
    ids.push(row.id); return row.id;
  }
  const exists = async (file: string) => fs.stat(file).then(() => true, () => false);
  const userExists = async (id: number) => (await database.db.select({ id: users.id }).from(users).where(eq(users.id, id))).length > 0;
  async function file(userId: number, area: "public" | "support", ext: string) {
    const filename = `${randomUUID()}.${ext}`, full = api.accountFilePath(root, area, filename);
    await api.withOwnedUpload(userId, area, filename, () => fs.writeFile(full, "synthetic"));
    return { filename, full };
  }

  it("removes images, audio, support files and every session while preserving another owner's files", async () => {
    const own = await owner(), other = await owner();
    const image = await file(own, "public", "webp"), audio = await file(own, "public", "mp3"), support = await file(own, "support", "webp"), foreign = await file(other, "public", "webp");
    const legacyImage = `${randomUUID()}.webp`, legacySupport = `screenshot-${randomUUID()}.webp`;
    await database.db.insert(mediaAssets).values({ userId: own, filename: legacyImage, originalName: "legacy", name: "legacy", mimeType: "image/webp", bytes: 9, width: 1, height: 1 });
    await database.db.insert(bugReports).values({ userId: own, description: "synthetic", pageUrl: "/settings", screenshotPath: legacySupport });
    await fs.writeFile(api.accountFilePath(root, "public", legacyImage), "synthetic");
    await fs.writeFile(api.accountFilePath(root, "support", legacySupport), "synthetic");
    for (const id of [own, own, other]) await database.db.execute(sql`INSERT INTO "session" (sid,sess,expire) VALUES (${randomUUID()}, ${JSON.stringify({ passport: { user: id } })}::json, now()+interval '1 day')`);
    expect(await api.deleteAccountWithFiles(own, { root })).toBe(true);
    for (const full of [image.full, audio.full, support.full, api.accountFilePath(root, "public", legacyImage), api.accountFilePath(root, "support", legacySupport)]) expect(await exists(full)).toBe(false);
    expect(await userExists(own)).toBe(false); expect(await userExists(other)).toBe(true); expect(await exists(foreign.full)).toBe(true);
    expect((await database.db.select().from(ownedUploads).where(eq(ownedUploads.userId, own)))).toEqual([]);
    expect((await database.db.select().from(bugReports).where(eq(bugReports.userId, own)))).toEqual([]);
    expect((await database.db.execute(sql`SELECT sid FROM "session" WHERE sess->'passport'->>'user' = ${String(own)}`)).rows).toEqual([]);
    expect((await database.db.execute(sql`SELECT sid FROM "session" WHERE sess->'passport'->>'user' = ${String(other)}`)).rows).toHaveLength(1);
    expect(await api.deleteAccountWithFiles(own, { root })).toBe(false);
  });

  it("retains the account and ownership after partial filesystem failure and safely retries missing files", async () => {
    const id = await owner(), a = await file(id, "public", "webp"), b = await file(id, "public", "mp3");
    let calls = 0;
    await expect(api.deleteAccountWithFiles(id, { root, removeFile: async filename => {
      if (++calls === 2) throw Object.assign(new Error("synthetic failure"), { code: "EACCES" });
      await fs.unlink(filename);
    } })).rejects.toBeInstanceOf(api.AccountFileError);
    expect(await userExists(id)).toBe(true);
    expect((await database.db.select().from(ownedUploads).where(eq(ownedUploads.userId, id)))).toHaveLength(2);
    expect([await exists(a.full), await exists(b.full)].filter(Boolean)).toHaveLength(1);
    expect(await api.deleteAccountWithFiles(id, { root })).toBe(true);
    expect(await exists(a.full)).toBe(false); expect(await exists(b.full)).toBe(false);
  });

  it("validates all stored paths before deleting anything", async () => {
    const id = await owner(), safe = await file(id, "public", "webp");
    await database.db.insert(ownedUploads).values({ userId: id, filename: `../${randomUUID()}.webp`, area: "public" });
    const removeFile = vi.fn();
    await expect(api.deleteAccountWithFiles(id, { root, removeFile })).rejects.toBeInstanceOf(api.AccountFileError);
    expect(removeFile).not.toHaveBeenCalled(); expect(await exists(safe.full)).toBe(true); expect(await userExists(id)).toBe(true);
  });

  it("waits for an already authorized upload before deleting its file", async () => {
    const id = await owner(), entered = deferred(), release = deferred(), filename = `${randomUUID()}.mp3`;
    const full = api.accountFilePath(root, "public", filename);
    const upload = api.withOwnedUpload(id, "public", filename, async () => { entered.resolve(); await release.promise; await fs.writeFile(full, "synthetic"); });
    await entered.promise;
    let finished = false;
    const deletion = api.deleteAccountWithFiles(id, { root }).then(value => { finished = true; return value; });
    try {
      await vi.waitFor(async () => {
        const waiting = await database.pool.query("SELECT 1 FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock'");
        expect(waiting.rowCount).toBeGreaterThan(0);
      });
      expect(finished).toBe(false);
    } finally { release.resolve(); }
    await upload; expect(await deletion).toBe(true); expect(await exists(full)).toBe(false);
  });

  it("does not write a file when deletion wins the race", async () => {
    const id = await owner(); await file(id, "public", "webp");
    const deleting = deferred(), release = deferred();
    const deletion = api.deleteAccountWithFiles(id, { root, removeFile: async full => { deleting.resolve(); await release.promise; await fs.unlink(full); } });
    await deleting.promise;
    const write = vi.fn(), late = api.withOwnedUpload(id, "public", `${randomUUID()}.mp3`, write);
    const rejected = expect(late).rejects.toThrow();
    release.resolve(); expect(await deletion).toBe(true); await rejected; expect(write).not.toHaveBeenCalled();
  });

  it("keeps a failed write attributable even if its local cleanup failed", async () => {
    const id = await owner(), filename = `${randomUUID()}.mp3`, full = api.accountFilePath(root, "public", filename);
    await expect(api.withOwnedUpload(id, "public", filename, async () => { await fs.writeFile(full, "partial"); throw new Error("interrupted"); })).rejects.toThrow("interrupted");
    expect((await database.db.select().from(ownedUploads).where(eq(ownedUploads.userId, id)))).toHaveLength(1);
    expect(await api.deleteAccountWithFiles(id, { root })).toBe(true); expect(await exists(full)).toBe(false);
  });

  it("reports unassigned legacy references without inventing ownership or deleting the file", async () => {
    const id = await owner(), filename = `${randomUUID()}.webp`, full = api.accountFilePath(root, "public", filename);
    await fs.writeFile(full, "legacy");
    await database.db.insert(funnels).values({ userId: id, name: "Inventory fixture", pages: [{ id: "legacy", type: "welcome", title: "Legacy", elements: [{ id: "picture", type: "image", imageUrl: `/uploads/${filename}` }] }] });
    const { auditUploadOwnership } = await import("../scripts/audit-upload-ownership.mjs");
    const result = await auditUploadOwnership(database.pool, root);
    expect(result.unresolved).toContainEqual({ area: "public", filename, directory: false, referenceAccountIds: [id] });
    expect((await database.db.select().from(ownedUploads).where(eq(ownedUploads.filename, filename)))).toEqual([]);
    expect(await exists(full)).toBe(true);
  });

  it("does not discard an expired support report while a failed file cleanup remains referenced", async () => {
    const id = await owner();
    const { storage } = await import("./storage");
    const [report] = await database.db.insert(bugReports).values({ userId: id, description: "retention fixture", pageUrl: "/settings", screenshotPath: `screenshot-${randomUUID()}.webp`, createdAt: new Date("2000-01-01") }).returning();
    await storage.deleteBugReportsBefore(new Date("2001-01-01"));
    expect(await storage.getBugReport(report.id)).toBeDefined();
    await storage.clearBugReportFiles([report.id]);
    await storage.deleteBugReportsBefore(new Date("2001-01-01"));
    expect(await storage.getBugReport(report.id)).toBeUndefined();
  });

  async function legacyApproval(userId: number) {
    const filename = `${randomUUID()}.webp`, content = "confirmed legacy image";
    const [user] = await database.db.select({ username: users.username }).from(users).where(eq(users.id, userId));
    await fs.writeFile(api.accountFilePath(root, "public", filename), content);
    return { userId, username: user.username, filename, area: "public", sha256: createHash("sha256").update(content).digest("hex"), approval: "Synthetic operator confirmation" };
  }
  async function applyApprovals(approvals: unknown[]) {
    const { applyUploadOwnership } = await import("../scripts/apply-upload-ownership.mjs");
    const client = await database.pool.connect();
    try { return await applyUploadOwnership(client, root, approvals); }
    finally { client.release(); }
  }
  it("attributes only a confirmed file and allows repeated rollout after account deletion", async () => {
    const id = await owner(), approval = await legacyApproval(id);
    expect(await applyApprovals([approval])).toEqual({ verifiedAssignments: 1 });
    expect(await applyApprovals([approval])).toEqual({ verifiedAssignments: 1 });
    expect((await database.db.select().from(ownedUploads).where(eq(ownedUploads.filename, approval.filename)))).toHaveLength(1);
    await database.db.update(users).set({ username: randomUUID() }).where(eq(users.id, id));
    expect(await applyApprovals([approval])).toEqual({ verifiedAssignments: 1 });
    await api.deleteAccountWithFiles(id, { root });
    expect(await exists(api.accountFilePath(root, "public", approval.filename))).toBe(false);
    expect(await applyApprovals([approval])).toEqual({ verifiedAssignments: 0 });
  });
  it("rolls back all approvals when one file's contents or owner proof changed", async () => {
    const id = await owner(), a = await legacyApproval(id), b = await legacyApproval(id);
    await expect(applyApprovals([a, { ...b, sha256: "0".repeat(64) }])).rejects.toThrow("verändert");
    expect((await database.db.select().from(ownedUploads).where(eq(ownedUploads.userId, id)))).toEqual([]);
    await expect(applyApprovals([{ ...a, username: "different-account" }])).rejects.toThrow("Eigentümerkonto");
    expect(await exists(api.accountFilePath(root, "public", a.filename))).toBe(true);
  });
  it("does not reassign another owner's registered file", async () => {
    const id = await owner(), other = await owner(), approval = await legacyApproval(id);
    await database.db.insert(ownedUploads).values({ filename: approval.filename, userId: other, area: "public" });
    await expect(applyApprovals([approval])).rejects.toThrow("Abweichender Dateieigentümer");
    expect((await database.db.select().from(ownedUploads).where(eq(ownedUploads.filename, approval.filename)))[0].userId).toBe(other);
  });
  it("rejects path traversal and symbolic links in ownership approvals", async () => {
    const id = await owner(), approval = await legacyApproval(id);
    await expect(applyApprovals([{ ...approval, filename: `../${approval.filename}` }])).rejects.toThrow("Eigentümerfreigabe");
    const symlink = `${randomUUID()}.webp`;
    await fs.symlink(api.accountFilePath(root, "public", approval.filename), api.accountFilePath(root, "public", symlink));
    await expect(applyApprovals([{ ...approval, filename: symlink }])).rejects.toThrow("verändert");
    expect((await database.db.select().from(ownedUploads).where(eq(ownedUploads.userId, id)))).toEqual([]);
  });
});
