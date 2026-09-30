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
      INSERT INTO users VALUES (1, 'migration@example.test');
      INSERT INTO funnels (id,user_id,slug,pages) VALUES (1, 1, 'bestehender-funnel', '[{"id":"old-page","elements":[{"id":"old-field"}]}]');
      INSERT INTO leads VALUES (1, 1, 'qualified', '{"old-field":"Antwort bleibt"}');
    `);
  });
  afterAll(async () => {
    if (client) { await client.query(`DROP SCHEMA ${schema} CASCADE`); await client.end(); }
  });
  it("preserves existing identities, contents, answers and status, including on rerun", async () => {
    const before = (await client.query("SELECT id,user_id,slug,pages,name,description,status,theme,ab_tests,gtm_id,meta_pixel_id,impressum_url,datenschutz_url,og_image_url,updated_at FROM funnels")).rows;
    await migrate(client); await migrate(client);
    expect((await client.query("SELECT id,user_id,slug,pages,name,description,status,theme,ab_tests,gtm_id,meta_pixel_id,impressum_url,datenschutz_url,og_image_url,updated_at FROM funnels")).rows).toEqual(before);
    const revisions = (await client.query("SELECT content FROM funnel_revisions")).rows;
    expect(revisions[0].content.pages).toEqual(before[0].pages);
    await expect(client.query("UPDATE funnels SET name = 'Alter Client' WHERE id=1")).rejects.toMatchObject({ code: "40001" });
    expect((await client.query("SELECT * FROM leads")).rows).toEqual([{ id: 1, funnel_id: 1, status: "qualified", answers: { "old-field": "Antwort bleibt" }, stage_id: null, stage_version: 0 }]);
    expect((await client.query("SELECT * FROM recruiting_mail_jobs")).rows).toEqual([]);
    expect((await client.query("SELECT * FROM brand_styles")).rows).toEqual([]);
    expect((await client.query("SELECT count(*)::int AS count FROM app_migrations")).rows[0].count).toBe(3);
  });
  it("rejects changed migration checksums and rolls back", async () => {
    await client.query("UPDATE app_migrations SET checksum = 'changed'");
    await expect(migrate(client)).rejects.toThrow("Migration wurde verändert");
    expect((await client.query("SELECT count(*)::int AS count FROM leads")).rows[0].count).toBe(1);
  });
});
