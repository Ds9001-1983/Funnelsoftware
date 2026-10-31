// @vitest-environment node
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { validateE2EDatabaseUrl } from "./e2e-env.mjs";
import { migrate } from "./migrate.mjs";

const connection = process.env.MIGRATION_TEST_DATABASE_URL;
if (connection) validateE2EDatabaseUrl(connection);
describe.skipIf(!connection)("additive migration on existing funnels and leads", () => {
  const schema = `migration_test_${randomUUID().replaceAll("-", "")}`;
  let client;
  beforeAll(async () => {
    client = new pg.Client({ connectionString: connection });
    await client.connect();
    await client.query(`CREATE SCHEMA ${schema}; SET search_path TO ${schema}`);
    await client.query(`
      CREATE TABLE users (id serial PRIMARY KEY, email text);
      CREATE TABLE funnels (id serial PRIMARY KEY, user_id integer REFERENCES users(id), slug text, pages jsonb,
        name text DEFAULT 'Bestand', description text, status text DEFAULT 'published', theme jsonb DEFAULT '{}',
        ab_tests jsonb DEFAULT '[]', gtm_id text, meta_pixel_id text, impressum_url text, datenschutz_url text,
        og_image_url text, updated_at timestamp DEFAULT now());
      CREATE TABLE leads (id serial PRIMARY KEY, funnel_id integer REFERENCES funnels(id), status text, answers jsonb);
      CREATE TABLE platform_visits (id serial PRIMARY KEY, timestamp timestamp DEFAULT now());
      CREATE TABLE analytics_events (id serial PRIMARY KEY, funnel_id integer REFERENCES funnels(id), event_type text, timestamp timestamp DEFAULT now());
      INSERT INTO users VALUES (1, 'migration@example.test');
      INSERT INTO funnels (id,user_id,slug,pages) VALUES (1, 1, 'bestehender-funnel', '[{"id":"old-page","elements":[{"id":"old-field"}]}]');
      INSERT INTO leads VALUES (1, 1, 'qualified', '{"old-field":"Antwort bleibt"}');
      INSERT INTO analytics_events (funnel_id,event_type,timestamp) VALUES (1,'view','2026-01-01 12:00:00.123456');
    `);
  });
  afterAll(async () => {
    if (client) { await client.query(`DROP SCHEMA ${schema} CASCADE`); await client.end(); }
  });
  it("preserves existing identities, contents, answers and status, including on rerun", async () => {
    const before = (await client.query("SELECT id,user_id,slug,pages,name,description,status,theme,ab_tests,gtm_id,meta_pixel_id,impressum_url,datenschutz_url,og_image_url,updated_at FROM funnels")).rows;
    const eventsBefore = (await client.query("SELECT id,funnel_id,event_type,timestamp::text FROM analytics_events")).rows;
    await migrate(client); await migrate(client);
    expect((await client.query("SELECT id,funnel_id,event_type,timestamp::text FROM analytics_events")).rows).toEqual(eventsBefore);
    await client.query("SET TIME ZONE 'Europe/Berlin'");
    expect((await client.query("INSERT INTO analytics_events(funnel_id,event_type) VALUES(1,'view') RETURNING abs(extract(epoch FROM (timestamp - (now() AT TIME ZONE 'UTC')))) < 1 AS utc")).rows[0].utc).toBe(true);
    expect((await client.query("SELECT id,user_id,slug,pages,name,description,status,theme,ab_tests,gtm_id,meta_pixel_id,impressum_url,datenschutz_url,og_image_url,updated_at FROM funnels")).rows).toEqual(before);
    const revisions = (await client.query("SELECT content FROM funnel_revisions")).rows;
    expect(revisions[0].content.pages).toEqual(before[0].pages);
    await expect(client.query("UPDATE funnels SET name = 'Alter Client' WHERE id=1")).rejects.toMatchObject({ code: "40001" });
    expect((await client.query("SELECT * FROM leads")).rows).toEqual([{ id: 1, funnel_id: 1, status: "qualified", answers: { "old-field": "Antwort bleibt" }, stage_id: null, stage_version: 0, answer_snapshot: null, consent_version: null, closed_at: null }]);
    expect((await client.query("SELECT * FROM recruiting_mail_jobs")).rows).toEqual([]);
    expect((await client.query("SELECT * FROM brand_styles")).rows).toEqual([]);
    for (const table of ["content_templates", "media_folders", "media_assets", "marketing_consents", "owned_uploads", "funnel_retention_drafts", "lead_retention_exceptions", "funnel_analytics_retention", "deleted_funnel_retention"]) expect((await client.query(`SELECT * FROM ${table}`)).rows).toEqual([]);
    expect((await client.query("INSERT INTO platform_visits DEFAULT VALUES RETURNING abs(extract(epoch FROM (timestamp - (now() AT TIME ZONE 'UTC')))) < 1 AS utc")).rows[0].utc).toBe(true);
    expect((await client.query("SELECT count(*)::int AS count FROM app_migrations")).rows[0].count).toBe(13);
  });
  it("preserves an existing retention draft without activating deletion", async () => {
    await client.query("DELETE FROM app_migrations WHERE name='20261023_retention_activation.sql'");
    await client.query("ALTER TABLE funnel_retention_drafts DROP COLUMN active_version, DROP COLUMN activated_at");
    await client.query("INSERT INTO funnel_retention_drafts (funnel_id, mode, days, purpose, version) VALUES (1, 'closed_applications', 30, 'Existing reviewed draft', 4)");
    const before = (await client.query("SELECT * FROM funnel_retention_drafts")).rows[0];
    await migrate(client); await migrate(client);
    expect((await client.query("SELECT * FROM funnel_retention_drafts")).rows).toEqual([{ ...before, active_version: null, activated_at: null }]);
  });
  it("backfills only recorded media/support ownership and remains idempotent", async () => {
    await client.query("DELETE FROM app_migrations WHERE name='20261014_owned_uploads.sql'; DROP TABLE owned_uploads");
    await client.query(`
      INSERT INTO media_assets (user_id,filename,original_name,name,mime_type,bytes,width,height)
      VALUES (1,'recorded.webp','recorded','recorded','image/webp',10,2,2);
      CREATE TABLE bug_reports (user_id integer REFERENCES users(id), screenshot_path text, attachment_path text, created_at timestamp DEFAULT now());
      INSERT INTO bug_reports (user_id,screenshot_path,attachment_path) VALUES (1,'screenshot-recorded.webp',NULL);
    `);
    await migrate(client); await migrate(client);
    expect((await client.query("SELECT filename,user_id,area FROM owned_uploads ORDER BY filename")).rows).toEqual([
      { filename: "recorded.webp", user_id: 1, area: "public" },
      { filename: "screenshot-recorded.webp", user_id: 1, area: "support" },
    ]);
    expect((await client.query("SELECT filename FROM media_assets")).rows).toEqual([{ filename: "recorded.webp" }]);
  });
  it("rejects changed migration checksums and rolls back", async () => {
    await client.query("UPDATE app_migrations SET checksum = 'changed'");
    await expect(migrate(client)).rejects.toThrow("Migration wurde verändert");
    expect((await client.query("SELECT count(*)::int AS count FROM leads")).rows[0].count).toBe(1);
  });
});
