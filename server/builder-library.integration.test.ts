// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import { users } from "@shared/schema";
import type { LibraryContent } from "@shared/builder-library";

const connection = process.env.LIBRARY_TEST_DATABASE_URL;
if (connection) {
  const url = new URL(connection);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || !/^\/funnelsoftware_e2e(?:_[a-z0-9_]+)?$/.test(url.pathname) || url.search || url.hash) throw new Error("Library tests require an isolated local E2E database");
}
const content = (): LibraryContent => ({ format: 1, documentVersion: 1, page: { id: "page", type: "question", title: "Original", elements: [{ id: "picture", type: "image", imageUrl: "/uploads/old.webp" }] }, theme: { primaryColor: "#123456", backgroundColor: "#ffffff", textColor: "#111111", fontFamily: "Inter" }, origin: { funnelUuid: "source", pages: [], fields: [] } });
describe.skipIf(!connection)("private reusable content and media metadata", () => {
  let api: typeof import("./builder-library"), database: typeof import("./db");
  const owners: number[] = [], previous = process.env.DATABASE_URL;
  beforeAll(async () => {
    process.env.DATABASE_URL = connection;
    api = await import("./builder-library"); database = await import("./db");
    const suffix = randomUUID();
    const rows = await database.db.insert(users).values([0, 1].map(index => ({ username: `library-${suffix}-${index}`, email: `library-${suffix}-${index}@example.test`, password: "fixture" }))).returning();
    owners.push(...rows.map(row => row.id));
  });
  afterAll(async () => {
    if (database) { if (owners.length) await database.db.delete(users).where(inArray(users.id, owners)); await database.pool.end(); }
    if (previous === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = previous;
  });
  const createMedia = () => api.registerMediaAsset(owners[0], { filename: `${randomUUID()}.webp`, originalName: "Projekt.webp", bytes: 123, width: 400, height: 300 });
  it("scopes template listing, replacement, archive and restore to the owner", async () => {
    const saved = await api.createContentTemplate(owners[0], { name: "Private Vorlage", kind: "page", content: content() });
    expect(saved).not.toHaveProperty("userId");
    expect((await api.listContentTemplates(owners[1], {})).items).toEqual([]);
    for (const data of [{ content: content() }, { archived: true }, { archived: false }, { name: "Takeover" }]) await expect(api.updateContentTemplate(owners[1], saved.id, { ...data, expectedVersion: 1 })).rejects.toMatchObject({ status: 404 });
    const snapshot = structuredClone(saved.content);
    await api.updateContentTemplate(owners[0], saved.id, { content: { ...content(), page: { ...content().page, title: "Geändert" } }, expectedVersion: 1 });
    const archived = await api.updateContentTemplate(owners[0], saved.id, { archived: true, expectedVersion: 2 });
    expect((await api.listContentTemplates(owners[0], {})).items.some(item => item.id === saved.id)).toBe(false);
    expect((await api.listContentTemplates(owners[0], { archived: "true" })).items).toContainEqual(archived);
    const restored = await api.updateContentTemplate(owners[0], saved.id, { archived: false, expectedVersion: 3 });
    expect(restored.content.page.title).toBe("Geändert");
    expect(snapshot.page.title).toBe("Original"); expect(saved.content).toEqual(snapshot);
  });
  it("serializes competing template writes and rejects invalid content or ownership fields", async () => {
    const saved = await api.createContentTemplate(owners[0], { name: "Versioniert", kind: "page", content: content() });
    const results = await Promise.allSettled(["A", "B"].map(name => api.updateContentTemplate(owners[0], saved.id, { name, expectedVersion: 1 })));
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
    expect(results.find(result => result.status === "rejected")).toMatchObject({ reason: { status: 409 } });
    await expect(api.createContentTemplate(owners[0], { name: "Falsch", kind: "section", content: content() })).rejects.toMatchObject({ status: 400 });
    await expect(api.createContentTemplate(owners[0], { name: "Falsch", kind: "page", content: { ...content(), documentVersion: 99 } })).rejects.toThrow();
    await expect(api.createContentTemplate(owners[0], { name: "Falsch", kind: "page", content: content(), userId: owners[1] })).rejects.toThrow();
  });
  it("rejects foreign folder/media mutations and preserves stable URLs across archive and restore", async () => {
    const asset = await createMedia();
    const ownFolder = await api.createMediaFolder(owners[0], { name: "Sommer" }), foreignFolder = await api.createMediaFolder(owners[1], { name: "Privat" });
    expect((await api.listMediaAssets(owners[1], {})).items).toEqual([]);
    expect(await api.listMediaFolders(owners[1])).not.toEqual(expect.arrayContaining([ownFolder]));
    await expect(api.updateMediaAsset(owners[1], asset.id, { archived: true, expectedVersion: 1 })).rejects.toMatchObject({ status: 404 });
    await expect(api.updateMediaAsset(owners[0], asset.id, { folderId: foreignFolder.id, expectedVersion: 1 })).rejects.toMatchObject({ status: 404 });
    await expect(api.updateMediaFolder(owners[1], ownFolder.id, { name: "Takeover", expectedVersion: 1 })).rejects.toMatchObject({ status: 404 });
    const moved = await api.updateMediaAsset(owners[0], asset.id, { folderId: ownFolder.id, name: "Kampagne", expectedVersion: 1 });
    const renamed = await api.updateMediaFolder(owners[0], ownFolder.id, { name: "Herbst", expectedVersion: 1 });
    expect(renamed.version).toBe(2);
    expect((await api.listMediaAssets(owners[0], { folderId: String(ownFolder.id) })).items).toContainEqual(moved);
    const archived = await api.updateMediaAsset(owners[0], asset.id, { archived: true, expectedVersion: 2 });
    expect((await api.listMediaAssets(owners[0], {})).items.some(item => item.id === asset.id)).toBe(false);
    expect((await api.listMediaAssets(owners[0], { archived: "true" })).items).toContainEqual(archived);
    const restored = await api.updateMediaAsset(owners[0], asset.id, { archived: false, folderId: null, expectedVersion: 3 });
    expect(restored.url).toBe(asset.url); expect(restored.originalName).toBe(asset.originalName);
    expect((await api.listMediaAssets(owners[0], { folderId: "none" })).items).toContainEqual(restored);
  });
  it("keeps immutable file metadata and handles concurrent media/folder updates", async () => {
    const asset = await createMedia(), folder = await api.createMediaFolder(owners[0], { name: "Concurrent" });
    for (const data of [{ filename: "other.webp" }, { url: "/uploads/other.webp" }, { userId: owners[1] }, { width: 999 }]) await expect(api.updateMediaAsset(owners[0], asset.id, { ...data, expectedVersion: 1 })).rejects.toThrow();
    for (const mutate of [(name: string) => api.updateMediaAsset(owners[0], asset.id, { name, expectedVersion: 1 }), (name: string) => api.updateMediaFolder(owners[0], folder.id, { name, expectedVersion: 1 })]) {
      const results = await Promise.allSettled(["A", "B"].map(mutate));
      expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
      expect(results.find(result => result.status === "rejected")).toMatchObject({ reason: { status: 409 } });
    }
  });
  it("paginates without leaking owners and searches literal wildcard characters", async () => {
    await Promise.all(Array.from({ length: 22 }, (_, index) => api.createContentTemplate(owners[0], { name: `Pagination ${index}%`, kind: "page", content: content() })));
    const first = await api.listContentTemplates(owners[0], { q: "Pagination" });
    expect(first.items).toHaveLength(20); expect(first.nextCursor).toBeTruthy();
    const second = await api.listContentTemplates(owners[0], { q: "Pagination", cursor: String(first.nextCursor) });
    expect(second.items).toHaveLength(2); expect(second.nextCursor).toBeNull();
    expect(new Set([...first.items, ...second.items].map(item => item.id)).size).toBe(22);
    expect((await api.listContentTemplates(owners[1], { q: "Pagination", cursor: String(first.nextCursor) })).items).toEqual([]);
    expect((await api.listContentTemplates(owners[0], { q: "1%" })).items).toHaveLength(3);
    await expect(api.listMediaAssets(owners[0], { cursor: "bad" })).rejects.toThrow();
  });
});
