// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { users, funnels, leads, leadRetentionExceptions } from "@shared/schema";
import type { RetentionDraftInput } from "@shared/retention-contract";

const connection = process.env.RETENTION_TEST_DATABASE_URL;
if (connection) {
  const url = new URL(connection);
  if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) || !/^\/funnelsoftware_e2e(?:_[a-z0-9_]+)?$/.test(url.pathname) || url.search || url.hash || !["postgres:", "postgresql:"].includes(url.protocol)) throw new Error("Retention tests require an isolated local e2e database");
}
describe.skipIf(!connection)("retention drafts, closure evidence and protected exceptions", () => {
  let database: typeof import("./db");
  let service: typeof import("./retention");
  let recruiting: typeof import("./recruiting");
  let exporter: typeof import("./subject-export");
  let storage: (typeof import("./storage"))["storage"];
  const ids: number[] = [];
  const oldConnection = process.env.DATABASE_URL;
  beforeAll(async () => {
    process.env.DATABASE_URL = connection;
    database = await import("./db");
    service = await import("./retention");
    recruiting = await import("./recruiting");
    exporter = await import("./subject-export");
    storage = (await import("./storage")).storage;
  });
  afterAll(async () => {
    if (database) { if (ids.length) await database.db.delete(users).where(inArray(users.id, ids)); await database.pool.end(); }
    if (oldConnection === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = oldConnection;
  });
  const draft: RetentionDraftInput = { expectedVersion: 0, mode: "closed_applications", days: 30, purpose: "Dokumentierter Testzweck" };
  async function fixture() {
    const suffix = randomUUID();
    const [owner, other] = await database.db.insert(users).values(["owner", "other"].map(role => ({ username: `${role}-${suffix}`, email: `${role}-${suffix}@example.invalid`, password: "fixture", emailVerifiedAt: new Date(), isPro: false, trialEndsAt: null }))).returning();
    ids.push(owner.id, other.id);
    const [funnel] = await database.db.insert(funnels).values({ userId: owner.id, name: "Aufbewahrung" }).returning();
    const [lead] = await database.db.insert(leads).values({ funnelId: funnel.id, userId: owner.id, email: `lead-${suffix}@example.invalid`, createdAt: new Date(Date.now() - 100 * 86400000) }).returning();
    return { owner, other, funnel, lead };
  }
  it("starts disabled and rejects foreign owners, invalid inputs and stale draft writes", async () => {
    const f = await fixture();
    expect(await service.previewRetention(f.funnel.id, f.owner.id)).toMatchObject({ draft: null, automaticDeletion: false, counts: { unknown: 1 } });
    await expect(service.previewRetention(f.funnel.id, f.other.id)).rejects.toMatchObject({ status: 404 });
    await expect(service.saveRetentionDraft(f.funnel.id, f.other.id, draft)).rejects.toMatchObject({ status: 404 });
    await expect(service.saveRetentionDraft(f.funnel.id, f.owner.id, { ...draft, days: 0 })).rejects.toBeDefined();
    const results = await Promise.allSettled([service.saveRetentionDraft(f.funnel.id, f.owner.id, draft), service.saveRetentionDraft(f.funnel.id, f.owner.id, draft)]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(results.find(r => r.status === "rejected")).toMatchObject({ reason: { status: 409 } });
    expect(await service.previewRetention(f.funnel.id, f.owner.id)).toMatchObject({ automaticDeletion: false, draft: { version: 1 } });
  });
  it("records real closure, preserves terminal transitions, and resets upon reopening", async () => {
    const f = await fixture();
    const base = { leadId: f.lead.id, ownerId: f.owner.id, actorId: f.owner.id };
    const closed = await recruiting.changeRecruitingStage({ ...base, stageId: "lost", expectedVersion: 0 });
    expect(closed.closedAt).toBeInstanceOf(Date);
    const switched = await recruiting.changeRecruitingStage({ ...base, stageId: "converted", expectedVersion: 1 });
    expect(switched.closedAt).toEqual(closed.closedAt);
    const reopened = await recruiting.changeRecruitingStage({ ...base, stageId: "new", expectedVersion: 2 });
    expect(reopened.closedAt).toBeNull();
    await service.saveRetentionDraft(f.funnel.id, f.owner.id, draft);
    expect((await service.previewRetention(f.funnel.id, f.owner.id)).counts.open).toBe(1);
    const reclosed = await recruiting.changeRecruitingStage({ ...base, stageId: "lost", expectedVersion: 3 });
    expect(new Date(reclosed.closedAt!).getTime()).toBeGreaterThanOrEqual(new Date(closed.closedAt!).getTime());
    expect((await service.previewRetention(f.funnel.id, f.owner.id)).counts.waiting).toBe(1);
    await expect(storage.updateLead(f.lead.id, f.owner.id, { status: "new" })).rejects.toThrow("changeRecruitingStage");
  });
  it("keeps legacy terminal dates unknown, even after moving to another terminal stage", async () => {
    const f = await fixture();
    await database.db.update(leads).set({ status: "lost" }).where(eq(leads.id, f.lead.id));
    const moved = await recruiting.changeRecruitingStage({ leadId: f.lead.id, ownerId: f.owner.id, actorId: f.owner.id, stageId: "converted", expectedVersion: 0 });
    expect(moved.closedAt).toBeNull();
    await service.saveRetentionDraft(f.funnel.id, f.owner.id, draft);
    expect((await service.previewRetention(f.funnel.id, f.owner.id)).counts.unknown).toBe(1);
  });
  it("counts due, future, open, unproven and protected rows without deleting any", async () => {
    const f = await fixture();
    const now = Date.now();
    const age = (days: number) => new Date(now - days * 86400000);
    const rows = await database.db.insert(leads).values([
      { status: "lost", closedAt: age(31) }, { status: "converted", closedAt: age(29) },
      { status: "lost", closedAt: null }, { status: "lost", closedAt: age(-1) },
      { status: "lost", closedAt: age(60) }, { status: "lost", closedAt: age(60) },
    ].map(row => ({ ...row, userId: f.owner.id, funnelId: f.funnel.id }))).returning();
    await database.db.insert(leadRetentionExceptions).values([
      { leadId: rows[4].id, reason: "Frist gesondert prüfen", reviewAt: age(-1) },
      { leadId: rows[5].id, reason: "Prüfung ist überfällig", reviewAt: age(1) },
    ]);
    await service.saveRetentionDraft(f.funnel.id, f.owner.id, draft);
    const preview = await service.previewRetention(f.funnel.id, f.owner.id);
    expect(preview.counts).toEqual({ due: 1, waiting: 1, open: 1, unknown: 2, excluded: 1, review: 1, committed: 0 });
    expect(preview.total).toBe(7);
    expect((await database.db.select().from(leads).where(eq(leads.funnelId, f.funnel.id)))).toHaveLength(7);
    expect(preview.items.find(item => item.id === rows[0].id)?.dueAt).toBe(new Date(age(31).getTime() + 30 * 86400000).toISOString());
  });
  it("supports general leads only through explicit mode selection and bounds pages", async () => {
    const f = await fixture();
    await service.saveRetentionDraft(f.funnel.id, f.owner.id, { ...draft, mode: "general_leads" });
    await database.db.insert(leads).values(Array.from({ length: 51 }, () => ({ userId: f.owner.id, funnelId: f.funnel.id })));
    const first = await service.previewRetention(f.funnel.id, f.owner.id);
    const second = await service.previewRetention(f.funnel.id, f.owner.id, 1);
    expect(first).toMatchObject({ total: 52, counts: { due: 1, waiting: 51 } });
    expect(first.items).toHaveLength(50); expect(second.items).toHaveLength(2);
    expect(new Set([...first.items, ...second.items].map(item => item.id)).size).toBe(52);
    await expect(service.previewRetention(f.funnel.id, f.owner.id, -1)).rejects.toMatchObject({ status: 400 });
  });
  it("versions exceptions, keeps overdue holds, exports them and cascades on manual deletion", async () => {
    const f = await fixture();
    const exception = { reason: "Nachweis bis zur Prüfung erforderlich", reviewAt: new Date(Date.now() + 86400000).toISOString() };
    await expect(service.saveRetentionException(f.lead.id, f.other.id, { expectedVersion: 0, exception })).rejects.toMatchObject({ status: 404 });
    await expect(service.saveRetentionException(f.lead.id, f.owner.id, { expectedVersion: 0, exception: { ...exception, reviewAt: "2020-01-01T00:00:00Z" } })).rejects.toMatchObject({ status: 400 });
    await service.saveRetentionDraft(f.funnel.id, f.owner.id, { ...draft, mode: "general_leads" });
    await service.saveRetentionException(f.lead.id, f.owner.id, { expectedVersion: 0, exception });
    await expect(service.saveRetentionException(f.lead.id, f.owner.id, { expectedVersion: 0, exception })).rejects.toMatchObject({ status: 409 });
    expect((await service.previewRetention(f.funnel.id, f.owner.id)).counts.excluded).toBe(1);
    const exported = await exporter.exportSubjectData(f.owner.id, f.lead.email!);
    expect(exported.leads[0].retentionException).toMatchObject({ reason: exception.reason });
    await service.saveRetentionException(f.lead.id, f.owner.id, { expectedVersion: 1, exception: null });
    expect((await service.previewRetention(f.funnel.id, f.owner.id)).counts.due).toBe(1);
    await expect(service.saveRetentionException(f.lead.id, f.owner.id, { expectedVersion: 1, exception })).rejects.toMatchObject({ status: 409 });
    await service.saveRetentionException(f.lead.id, f.owner.id, { expectedVersion: 2, exception });
    expect(await storage.deleteLead(f.lead.id, f.owner.id)).toBe(true);
    expect(await database.db.select().from(leadRetentionExceptions).where(eq(leadRetentionExceptions.leadId, f.lead.id))).toHaveLength(0);
  });
  it("rejects planning against a deleted funnel without touching its data", async () => {
    const f = await fixture();
    await database.db.update(funnels).set({ deletedAt: new Date() }).where(eq(funnels.id, f.funnel.id));
    await expect(service.previewRetention(f.funnel.id, f.owner.id)).rejects.toMatchObject({ status: 404 });
    await expect(service.saveRetentionDraft(f.funnel.id, f.owner.id, draft)).rejects.toMatchObject({ status: 404 });
    await expect(service.saveRetentionException(f.lead.id, f.owner.id, { expectedVersion: 0, exception: null })).rejects.toMatchObject({ status: 404 });
    expect(await database.db.select().from(leads).where(eq(leads.id, f.lead.id))).toHaveLength(1);
  });
});
