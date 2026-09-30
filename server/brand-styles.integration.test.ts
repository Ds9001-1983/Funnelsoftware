// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import { users } from "@shared/schema";
import { DEFAULT_DESIGN } from "@shared/funnel-design";

const connection = process.env.BRAND_STYLE_TEST_DATABASE_URL;
if (connection) {
  const url = new URL(connection);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || !/^\/funnelsoftware_e2e(?:_[a-z0-9_]+)?$/.test(url.pathname) || url.search) throw new Error("Brand tests require an isolated local E2E database");
}
describe.skipIf(!connection)("private versioned brand styles", () => {
  let api: typeof import("./brand-styles");
  let database: typeof import("./db");
  const ids: number[] = [];
  const before = process.env.DATABASE_URL;
  const theme = { primaryColor: "#123456", backgroundColor: "#ffffff", textColor: "#111111", fontFamily: "Inter", design: DEFAULT_DESIGN };
  beforeAll(async () => {
    process.env.DATABASE_URL = connection;
    api = await import("./brand-styles"); database = await import("./db");
    const suffix = randomUUID();
    const rows = await database.db.insert(users).values([0, 1].map(index => ({ username: `brand-${suffix}-${index}`, email: `brand-${suffix}-${index}@example.test`, password: "fixture" }))).returning();
    ids.push(...rows.map(row => row.id));
  });
  afterAll(async () => {
    if (database) { if (ids.length) await database.db.delete(users).where(inArray(users.id, ids)); await database.pool.end(); }
    if (before === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = before;
  });
  it("scopes all access to the authenticated owner", async () => {
    const brand = await api.createBrandStyle(ids[0], { name: "Studio", theme });
    expect(brand).not.toHaveProperty("userId");
    expect(await api.listBrandStyles(ids[1])).toEqual([]);
    await expect(api.updateBrandStyle(ids[1], brand.id, { name: "Takeover", expectedVersion: 1 })).rejects.toMatchObject({ status: 404 });
    await expect(api.updateBrandStyle(ids[1], brand.id, { archived: true, expectedVersion: 1 })).rejects.toMatchObject({ status: 404 });
    expect(await api.listBrandStyles(ids[0])).toEqual(expect.arrayContaining([expect.objectContaining({ id: brand.id, name: "Studio" })]));
  });
  it("rejects concurrent replacement and increments the version only once", async () => {
    const brand = await api.createBrandStyle(ids[0], { name: "Concurrent", theme });
    const results = await Promise.allSettled(["A", "B"].map(name => api.updateBrandStyle(ids[0], brand.id, { name, expectedVersion: 1 })));
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
    expect(results.find(result => result.status === "rejected")).toMatchObject({ reason: { status: 409 } });
    const saved = (await api.listBrandStyles(ids[0])).find(row => row.id === brand.id)!;
    expect(saved.version).toBe(2);
    expect(brand.theme).toEqual(theme);
  });
  it("archives only the template and prevents subsequent writes", async () => {
    const brand = await api.createBrandStyle(ids[0], { name: "Archived", theme });
    await api.updateBrandStyle(ids[0], brand.id, { archived: true, expectedVersion: 1 });
    expect(await api.listBrandStyles(ids[0])).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: brand.id })]));
    await expect(api.updateBrandStyle(ids[0], brand.id, { name: "Again", expectedVersion: 2 })).rejects.toMatchObject({ status: 404 });
  });
  it("rejects arbitrary owner and theme fields before persistence", async () => {
    await expect(api.createBrandStyle(ids[0], { name: "Wrong", theme, userId: ids[1] })).rejects.toThrow();
    await expect(api.createBrandStyle(ids[0], { name: "Wrong", theme: { ...theme, fontFamily: "External font" } })).rejects.toThrow();
  });
});
