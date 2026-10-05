// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import pg from "pg";
import { randomUUID } from "node:crypto";
import type { storage as Storage } from "./storage";
import type { WriteControl } from "@shared/funnel-document";
import { insertFunnelSchema } from "@shared/schema";

const connection = process.env.ACTIVATION_TEST_DATABASE_URL;
describe.skipIf(!connection)("registration cohorts and first successful publication", () => {
  const schema = `activation_test_${randomUUID().replaceAll("-", "")}`;
  let fixture: pg.Pool, worker: pg.Pool, storage: typeof Storage;

  beforeAll(async () => {
    const url = new URL(connection!);
    if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) || url.search || url.hash || !["postgres:", "postgresql:"].includes(url.protocol) || !/^\/funnelsoftware_e2e(?:_[a-z0-9_]+)?$/.test(url.pathname)) throw new Error("Explicit local E2E database required");
    fixture = new pg.Pool({ connectionString: url.toString(), max: 1 });
    await fixture.query(`CREATE SCHEMA ${schema}`);
    for (const table of ["users", "funnels", "funnel_revisions", "signup_activations", "platform_visits"]) {
      await fixture.query(`CREATE TABLE ${schema}.${table} (LIKE public.${table} INCLUDING ALL)`);
    }
    // LIKE omits FKs; exercise the production privacy cascade explicitly.
    await fixture.query(`ALTER TABLE ${schema}.signup_activations ADD FOREIGN KEY (user_id) REFERENCES ${schema}.users(id) ON DELETE CASCADE`);
    url.searchParams.set("options", `-c search_path=${schema}`);
    vi.stubEnv("DATABASE_URL", url.toString()); vi.stubEnv("NODE_ENV", "test"); vi.resetModules();
    ({ pool: worker } = await import("./db")); ({ storage } = await import("./storage"));
  });
  afterAll(async () => {
    await worker?.end();
    if (fixture) { await fixture.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`); await fixture.end(); }
    vi.unstubAllEnvs();
  });
  beforeEach(async () => { await worker.query("TRUNCATE signup_activations, funnel_revisions, funnels, platform_visits, users"); });

  async function account(tracked = true, verified = true) {
    const unique = randomUUID();
    const owner = await storage.createUser({ username: unique, email: `${unique}@example.test`, password: "activation-test-password" }, tracked);
    if (verified) await worker.query("UPDATE users SET email_verified_at = NOW(), is_pro = true WHERE id = $1", [owner.id]);
    return owner;
  }
  const draft = (userId: number) => storage.createFunnel(insertFunnelSchema.parse({ name: "Example", pages: [{ id: "welcome", type: "welcome", title: "Welcome", elements: [] }] }), userId);
  const control = (expectedVersion = 0, publish = true): WriteControl => ({ expectedVersion, publish, documentVersion: 1, mutationId: randomUUID() });
  const activation = async (userId: number) => (await worker.query("SELECT * FROM signup_activations WHERE user_id = $1", [userId])).rows[0];

  it("records only instrumented signups, without backfilling existing accounts", async () => {
    const current = await account(); const legacy = await account(false);
    expect(await activation(current.id)).toMatchObject({ user_id: current.id, registered_at: current.createdAt, first_published_at: null });
    expect(await activation(legacy.id)).toBeUndefined();
    const funnel = await draft(legacy.id);
    await storage.updateFunnel(funnel.id, legacy.id, {}, control());
    expect(await activation(legacy.id)).toBeUndefined();
    expect((await storage.getPlatformStats(30)).activation).toMatchObject({ registrations: 1, firstPublished: 0, rate: 0 });
  });

  it("rolls back the account if its activation record cannot be committed", async () => {
    await worker.query("ALTER TABLE signup_activations ADD CONSTRAINT reject_test_registration CHECK (false)");
    try {
      await expect(account()).rejects.toThrow();
      expect((await worker.query("SELECT * FROM users")).rows).toEqual([]);
    } finally { await worker.query("ALTER TABLE signup_activations DROP CONSTRAINT reject_test_registration"); }
  });

  it("counts successful publication once, excluding drafts and failed publication", async () => {
    const owner = await account(true, false); const funnel = await draft(owner.id);
    await storage.updateFunnel(funnel.id, owner.id, { name: "Draft edit" }, control(0, false));
    expect((await activation(owner.id)).first_published_at).toBeNull();
    await expect(storage.updateFunnel(funnel.id, owner.id, {}, control(1))).rejects.toMatchObject({ code: "EMAIL_NOT_VERIFIED" });
    expect((await activation(owner.id)).first_published_at).toBeNull();
    await worker.query("UPDATE users SET email_verified_at = NOW() WHERE id = $1", [owner.id]);
    const request = control(1);
    await storage.updateFunnel(funnel.id, owner.id, {}, request);
    const first = (await activation(owner.id)).first_published_at;
    expect(first).toBeInstanceOf(Date);
    await storage.updateFunnel(funnel.id, owner.id, {}, request); // retry
    await storage.updateFunnel(funnel.id, owner.id, {}, control(2)); // republish
    expect((await activation(owner.id)).first_published_at).toEqual(first);
    await worker.query("DELETE FROM funnels WHERE id = $1", [funnel.id]);
    expect((await activation(owner.id)).first_published_at).toEqual(first);
  });

  it("counts one account when separate funnels are published concurrently", async () => {
    const owner = await account(); const a = await draft(owner.id); const b = await draft(owner.id);
    await Promise.all([a, b].map(funnel => storage.updateFunnel(funnel.id, owner.id, {}, control())));
    expect((await storage.getPlatformStats(30)).activation).toMatchObject({ registrations: 1, firstPublished: 1, rate: 100 });
    expect((await worker.query("SELECT * FROM signup_activations")).rows).toHaveLength(1);
  });

  it("uses registration cohorts, excludes admin/deleted accounts and cascades permanent deletion", async () => {
    expect((await storage.getPlatformStats(7)).activation).toEqual({ registrations: 0, firstPublished: 0, rate: null, measuredSince: null });
    const published = await account(); const unpublished = await account(); const old = await account();
    const admin = await account(); const deleted = await account();
    await worker.query("UPDATE signup_activations SET first_published_at = NOW() WHERE user_id = ANY($1)", [[published.id, old.id, admin.id, deleted.id]]);
    await worker.query("UPDATE signup_activations SET registered_at = NOW() - INTERVAL '40 days' WHERE user_id = $1", [old.id]);
    await worker.query("UPDATE users SET is_admin = true WHERE id = $1", [admin.id]);
    await worker.query("UPDATE users SET deleted_at = NOW() WHERE id = $1", [deleted.id]);
    expect((await storage.getPlatformStats(30)).activation).toMatchObject({ registrations: 2, firstPublished: 1, rate: 50 });
    expect((await storage.getPlatformStats(90)).activation).toMatchObject({ registrations: 3, firstPublished: 2 });
    await worker.query("DELETE FROM users WHERE id = $1", [published.id]);
    expect(await activation(published.id)).toBeUndefined();
    expect((await storage.getPlatformStats(30)).activation).toMatchObject({ registrations: 1, firstPublished: 0, rate: 0 });
    expect(await activation(unpublished.id)).toBeDefined();
  });

  it("deduplicates demo events per daily visitor hash and template, independently of accounts", async () => {
    for (const [visitorHash, eventType, label] of [["day-a", "demo_open", "termin-buchen"], ["day-a", "demo_open", "termin-buchen"], ["day-a", "demo_start", "termin-buchen"], ["day-b", "demo_open", "termin-buchen"], ["day-a", "demo_open", "express-bewerbung"]]) {
      await storage.createPlatformVisit({ visitorHash, eventType, label, path: `/vorlagen/${label}` });
    }
    const stats = await storage.getPlatformStats(30);
    expect(stats.demos).toEqual([{ slug: "termin-buchen", opened: 2, started: 1, completed: 0 }, { slug: "express-bewerbung", opened: 1, started: 0, completed: 0 }]);
    for (let i = 0; i < 2; i++) await storage.createPlatformVisit({ visitorHash: "day-a", eventType: "demo_complete", label: "termin-buchen", path: "/vorlagen/termin-buchen" });
    expect((await storage.getPlatformStats(30)).demos.find(demo => demo.slug === "termin-buchen")?.completed).toBe(1);
    expect(stats.activation.rate).toBeNull();
    expect(stats.totals.visitors).toBe(0); // demo events are not page views
  });
});
