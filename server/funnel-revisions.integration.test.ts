// @vitest-environment node
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { users, funnels, leads, analyticsEvents, funnelRevisions, type Funnel } from "@shared/schema";
import type { WriteControl } from "@shared/funnel-document";
import { enablePageLayout } from "@shared/funnel-layout-edit";

const connection = process.env.REVISION_TEST_DATABASE_URL;
if (connection) {
  const url = new URL(connection);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || !/^\/funnelsoftware_e2e(?:_[a-z0-9_]+)?$/.test(url.pathname) || url.search || url.hash) throw new Error("Revision tests require a dedicated local database");
}
describe.skipIf(!connection)("versioned drafts, live content and recovery", () => {
  let database: typeof import("./db");
  let storage: (typeof import("./storage"))["storage"];
  let service: typeof import("./funnel-revisions");
  const owners: number[] = [];
  const previous = process.env.DATABASE_URL;
  beforeAll(async () => {
    process.env.DATABASE_URL = connection;
    database = await import("./db"); storage = (await import("./storage")).storage;
    service = await import("./funnel-revisions");
  });
  afterAll(async () => {
    if (database) { if (owners.length) await database.db.delete(users).where(inArray(users.id, owners)); await database.pool.end(); }
    if (previous === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = previous;
  });
  const control = (version = 0, publish = false): WriteControl => ({ expectedVersion: version, documentVersion: 1, mutationId: randomUUID(), publish });
  async function fixture(pro = true) {
    const id = randomUUID();
    const [owner] = await database.db.insert(users).values({ username: id, email: `${id}@example.test`, password: "fixture", isPro: pro, emailVerifiedAt: new Date() }).returning();
    owners.push(owner.id);
    const funnel = await storage.createFunnel({ name: "Live A", status: "draft", pages: [{ id: "welcome", type: "welcome", title: "Bestehender Inhalt", elements: [] }], theme: { primaryColor: "#123456", backgroundColor: "#ffffff", textColor: "#000000", fontFamily: "Inter" } }, owner.id);
    return { owner, funnel };
  }
  it("keeps public content stable until an explicit version is published", async () => {
    const f = await fixture();
    const live = (await storage.updateFunnel(f.funnel.id, f.owner.id, {}, control(0, true)))!;
    const draft = (await storage.updateFunnel(f.funnel.id, f.owner.id, { name: "Entwurf B" }, control(1)))!;
    expect(draft.name).toBe("Entwurf B");
    expect((await storage.getFunnelByUuid(f.funnel.uuid))?.name).toBe("Live A");
    expect(draft.publishedRevisionId).toBe(live.publishedRevisionId);
    await storage.updateFunnel(f.funnel.id, f.owner.id, {}, control(2, true));
    expect((await storage.getFunnelByUuid(f.funnel.uuid))?.name).toBe("Entwurf B");
  });
  it("publishes layout snapshots atomically and rejects incompatible editors or broken references", async () => {
    const f = await fixture();
    const page = enablePageLayout({ ...f.funnel.pages[0], elements: [{ id: "field", type: "input", required: true }] });
    const modern = (version: number, publish = false): WriteControl => ({ ...control(version, publish), documentVersion: 2 });
    const live = (await storage.updateFunnel(f.funnel.id, f.owner.id, { pages: [page] }, modern(0, true)))!;
    expect(live.documentVersion).toBe(2);
    expect((await storage.getFunnelByUuid(live.uuid))?.pages).toEqual([page]);
    await expect(storage.updateFunnel(live.id, f.owner.id, { name: "Alter Tab" }, control(1))).rejects.toMatchObject({ code: "EDITOR_UPDATE_REQUIRED" });
    const broken = structuredClone(page);
    broken.layout!.sections[0].columns[0].elementIds = [];
    await expect(storage.updateFunnel(live.id, f.owner.id, { pages: [broken] }, modern(1, true))).rejects.toMatchObject({ code: "INVALID_LAYOUT" });
    await expect(storage.updateFunnel(live.id, f.owner.id, { pages: [{ ...page, nextPageId: "deleted" }] }, modern(1, true))).rejects.toMatchObject({ code: "INVALID_REFERENCES" });
    const current = await storage.getFunnel(live.id, f.owner.id);
    expect(current?.editVersion).toBe(1);
    expect(current?.publishedRevisionId).toBe(live.publishedRevisionId);
    expect(await service.listFunnelRevisions(live.id, f.owner.id)).toHaveLength(2);
  });
  it("accepts old clients only until a funnel adopts the new editor protocol", async () => {
    const f = await fixture();
    const legacy = (await storage.updateFunnel(f.funnel.id, f.owner.id, { status: "published", name: "Alter Editor" }))!;
    expect(legacy.editorProtocol).toBe(false);
    expect((await storage.getFunnelByUuid(f.funnel.uuid))?.name).toBe("Alter Editor");
    await storage.updateFunnel(f.funnel.id, f.owner.id, { name: "Neuer Entwurf" }, control(legacy.editVersion));
    await expect(storage.updateFunnel(f.funnel.id, f.owner.id, { name: "Alter Tab" })).rejects.toMatchObject({ status: 409, code: "EDITOR_UPDATE_REQUIRED" });
    expect((await storage.getFunnelByUuid(f.funnel.uuid))?.name).toBe("Alter Editor");
  });
  it("publishes visitor rules as version 3 and retains answer snapshots across content restoration", async () => {
    const f = await fixture();
    const modern = (version: number, publish = false): WriteControl => ({ ...control(version, publish), documentVersion: 3 });
    const pages: Funnel["pages"] = [
      { id: "question", type: "question", title: "Bedarf", elements: [{ id: "answer", type: "radio", choices: [{ id: "option-id", label: "Jetzt" }] }], routing: { version: 1, rules: [], fallbackPageId: "thanks" } },
      { id: "thanks", type: "thankyou", title: "Danke", elements: [] },
    ];
    const live = (await storage.updateFunnel(f.funnel.id, f.owner.id, { pages }, modern(0, true)))!;
    expect(live.documentVersion).toBe(3);
    expect((await storage.getFunnelByUuid(live.uuid))?.pages).toEqual(pages);
    await expect(storage.updateFunnel(live.id, f.owner.id, { name: "Alter Editor" }, { ...control(1), documentVersion: 2 })).rejects.toMatchObject({ code: "EDITOR_UPDATE_REQUIRED" });
    const broken = structuredClone(pages); broken[0].routing!.fallbackPageId = "question";
    await expect(storage.updateFunnel(live.id, f.owner.id, { pages: broken }, modern(1, true))).rejects.toMatchObject({ code: "INVALID_ROUTING" });
    expect((await storage.getFunnel(live.id, f.owner.id))?.editVersion).toBe(1);
    const snapshot = { version: 1 as const, documentVersion: 3 as const, contentRevisionId: live.publishedRevisionId!, path: ["question"], fields: [{ pageId: "question", elementId: "answer", label: "Bedarf", value: "option-id", optionId: "option-id", optionText: "Jetzt" }] };
    const lead = await storage.createLead({ funnelId: live.id, status: "new", answers: { Bedarf: "Jetzt" }, answerSnapshot: snapshot }, f.owner.id);
    const revision = (await service.listFunnelRevisions(live.id, f.owner.id)).find(revision => revision.version === 0)!;
    const restored = await storage.restoreFunnelRevision(live.id, f.owner.id, revision.id, modern(1));
    expect(restored?.documentVersion).toBe(3);
    expect((await storage.getLead(lead.id, f.owner.id))?.answerSnapshot).toEqual(snapshot);
    expect((await storage.getLead(lead.id, f.owner.id))?.answers).toEqual({ Bedarf: "Jetzt" });
    expect((await storage.getFunnelByUuid(live.uuid))?.pages).toEqual(pages);
  });
  it("publishes explicit personalization as v4 and preserves templates and older lead answers", async () => {
    const f = await fixture();
    const modern = (version: number, publish = false): WriteControl => ({ ...control(version, publish), documentVersion: 4 });
    const pages: Funnel["pages"] = [
      { id: "start", type: "question", title: "Ort", elements: [{ id: "place", type: "input", label: "Ort" }] },
      { id: "done", type: "thankyou", title: "Danke", elements: [{ id: "title", type: "heading", content: "Angebot {{Ort}}", personalization: { version: 1, bindings: [{ id: "p", token: "Ort", source: { kind: "answer", fieldId: "place" }, fallback: "deine Region" }] } }] },
    ];
    const historical = await storage.createLead({ funnelId: f.funnel.id, status: "new", answers: { Ort: "Historisch" } }, f.owner.id);
    const live = (await storage.updateFunnel(f.funnel.id, f.owner.id, { pages }, modern(0, true)))!;
    expect(live.documentVersion).toBe(4);
    expect((await storage.getFunnelByUuid(live.uuid))?.pages).toEqual(pages);
    await expect(storage.updateFunnel(live.id, f.owner.id, { name: "Alter Tab" }, { ...control(1), documentVersion: 3 })).rejects.toMatchObject({ code: "EDITOR_UPDATE_REQUIRED" });
    const broken = structuredClone(pages); broken[0].elements = [];
    await expect(storage.updateFunnel(live.id, f.owner.id, { pages: broken }, modern(1, true))).rejects.toMatchObject({ code: "INVALID_PERSONALIZATION" });
    expect((await storage.getFunnel(live.id, f.owner.id))?.editVersion).toBe(1);
    const snapshot = { version: 1 as const, documentVersion: 4 as const, contentRevisionId: live.publishedRevisionId!, path: ["start"], fields: [{ pageId: "start", elementId: "place", label: "Ort", value: "Köln" }] };
    const lead = await storage.createLead({ funnelId: live.id, status: "new", answers: { Ort: "Köln" }, answerSnapshot: snapshot }, f.owner.id);
    const initial = (await service.listFunnelRevisions(live.id, f.owner.id)).find(revision => revision.version === 0)!;
    expect((await storage.restoreFunnelRevision(live.id, f.owner.id, initial.id, modern(1)))?.documentVersion).toBe(4);
    expect((await storage.getFunnelByUuid(live.uuid))?.pages).toEqual(pages);
    expect((await storage.getLead(lead.id, f.owner.id))?.answerSnapshot).toEqual(snapshot);
    expect((await storage.getLead(historical.id, f.owner.id))?.answers).toEqual({ Ort: "Historisch" });
  });
  it("publishes v5 local themes and restores content without changing newer answers", async () => {
    const f = await fixture();
    const modern = (version: number, publish = false): WriteControl => ({ ...control(version, publish), documentVersion: 5 });
    const page = enablePageLayout({ ...f.funnel.pages[0], themeOverride: { ...f.funnel.theme, primaryColor: "#aa1122" }, elements: [{ id: "place", type: "input", label: "Ort" }] });
    page.layout!.sections[0].themeOverride = { ...f.funnel.theme, textColor: "#1122aa" };
    const live = (await storage.updateFunnel(f.funnel.id, f.owner.id, { pages: [page] }, modern(0, true)))!;
    expect(live.documentVersion).toBe(5);
    await expect(storage.updateFunnel(live.id, f.owner.id, { name: "Alter Tab" }, { ...control(1), documentVersion: 4 })).rejects.toMatchObject({ code: "EDITOR_UPDATE_REQUIRED" });
    const snapshot = { version: 1 as const, documentVersion: 5 as const, contentRevisionId: live.publishedRevisionId!, path: [page.id], fields: [{ pageId: page.id, elementId: "place", label: "Ort", value: "Köln" }] };
    const lead = await storage.createLead({ funnelId: live.id, status: "new", answers: { Ort: "Köln" }, answerSnapshot: snapshot }, f.owner.id);
    const initial = (await service.listFunnelRevisions(live.id, f.owner.id)).find(revision => revision.version === 0)!;
    expect((await storage.restoreFunnelRevision(live.id, f.owner.id, initial.id, modern(1)))?.documentVersion).toBe(5);
    expect((await storage.getFunnelByUuid(live.uuid))?.pages).toEqual([page]);
    expect((await storage.getLead(lead.id, f.owner.id))?.answerSnapshot).toEqual(snapshot);
  });
  it("serializes competing saves and handles an identical request retry once", async () => {
    const f = await fixture();
    const retryControl = control();
    const first = await storage.updateFunnel(f.funnel.id, f.owner.id, { name: "Einmal" }, retryControl);
    const retry = await storage.updateFunnel(f.funnel.id, f.owner.id, { name: "Einmal" }, retryControl);
    expect(retry?.editVersion).toBe(first?.editVersion);
    const results = await Promise.allSettled([
      storage.updateFunnel(f.funnel.id, f.owner.id, { name: "Tab A" }, control(1)),
      storage.updateFunnel(f.funnel.id, f.owner.id, { name: "Tab B" }, control(1)),
    ]);
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter(result => result.status === "rejected")).toHaveLength(1);
  });
  it("restores content as a draft while retaining newer leads, measurements and private settings", async () => {
    const f = await fixture();
    const live = (await storage.updateFunnel(f.funnel.id, f.owner.id, { webhookSecret: "keep-private", metaCapiToken: "private-token" }, control(0, true)))!;
    const history = await service.listFunnelRevisions(f.funnel.id, f.owner.id);
    await storage.updateFunnel(f.funnel.id, f.owner.id, { name: "Neuer Live-Inhalt" }, control(1, true));
    const [lead] = await database.db.insert(leads).values({ funnelId: f.funnel.id, userId: f.owner.id, name: "Später eingegangen", answers: { welcome: "Behalten" } }).returning();
    const [event] = await database.db.insert(analyticsEvents).values({ funnelId: f.funnel.id, eventType: "view" }).returning();
    const restored = await storage.restoreFunnelRevision(f.funnel.id, f.owner.id, history[0].id, control(2));
    expect(restored?.name).toBe(live.name);
    expect(restored?.webhookSecret).toBe("keep-private");
    expect((await storage.getFunnelByUuid(f.funnel.uuid))?.name).toBe("Neuer Live-Inhalt");
    expect((await database.db.select().from(leads).where(eq(leads.id, lead.id)))[0].answers).toEqual({ welcome: "Behalten" });
    expect(await database.db.select().from(analyticsEvents).where(eq(analyticsEvents.id, event.id))).toHaveLength(1);
    const all = await database.db.select().from(funnelRevisions).where(eq(funnelRevisions.funnelId, f.funnel.id));
    expect(JSON.stringify(all)).not.toContain("private-token");
    expect(JSON.stringify(all)).not.toContain("keep-private");
  });
  it("rejects foreign history/restore and a malformed publication without moving live content", async () => {
    const a = await fixture(); const b = await fixture();
    const live = await storage.updateFunnel(a.funnel.id, a.owner.id, {}, control(0, true));
    await expect(service.listFunnelRevisions(a.funnel.id, b.owner.id)).rejects.toMatchObject({ status: 404 });
    expect(await storage.restoreFunnelRevision(a.funnel.id, b.owner.id, live!.publishedRevisionId!, control(1))).toBeUndefined();
    await expect(storage.updateFunnel(a.funnel.id, a.owner.id, { pages: [] }, control(1, true))).rejects.toMatchObject({ code: "INVALID_DOCUMENT" });
    expect((await storage.getFunnel(a.funnel.id, a.owner.id))?.publishedRevisionId).toBe(live?.publishedRevisionId);
  });
  it("allows only one of two concurrent Free publications", async () => {
    const f = await fixture(false);
    const other = await storage.createFunnel({ name: "Zweiter", pages: f.funnel.pages, theme: f.funnel.theme, status: "draft" }, f.owner.id);
    const results = await Promise.allSettled([
      storage.updateFunnel(f.funnel.id, f.owner.id, {}, control(0, true)),
      storage.updateFunnel(other.id, f.owner.id, {}, control(0, true)),
    ]);
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
    expect((await database.db.select().from(funnels).where(eq(funnels.userId, f.owner.id))).filter(row => row.status === "published")).toHaveLength(1);
  });
});
