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
      CREATE TABLE funnels (id serial PRIMARY KEY, user_id integer REFERENCES users(id), slug text, pages jsonb);
      CREATE TABLE leads (id serial PRIMARY KEY, funnel_id integer REFERENCES funnels(id), status text, answers jsonb);
      INSERT INTO users VALUES (1, 'migration@example.test');
      INSERT INTO funnels VALUES (1, 1, 'bestehender-funnel', '[{"id":"old-page","elements":[{"id":"old-field"}]}]');
      INSERT INTO leads VALUES (1, 1, 'qualified', '{"old-field":"Antwort bleibt"}');
    `);
  });
  afterAll(async () => {
    if (client) { await client.query(`DROP SCHEMA ${schema} CASCADE`); await client.end(); }
  });
  it("preserves existing identities, contents, answers and status, including on rerun", async () => {
    const before = (await client.query("SELECT row_to_json(f) AS funnel FROM funnels f")).rows;
    await migrate(client); await migrate(client);
    expect((await client.query("SELECT row_to_json(f) AS funnel FROM funnels f")).rows).toEqual(before);
    expect((await client.query("SELECT * FROM leads")).rows).toEqual([{ id: 1, funnel_id: 1, status: "qualified", answers: { "old-field": "Antwort bleibt" }, stage_id: null, stage_version: 0 }]);
    expect((await client.query("SELECT * FROM recruiting_mail_jobs")).rows).toEqual([]);
    expect((await client.query("SELECT count(*)::int AS count FROM app_migrations")).rows[0].count).toBe(1);
  });
  it("rejects changed migration checksums and rolls back", async () => {
    await client.query("UPDATE app_migrations SET checksum = 'changed'");
    await expect(migrate(client)).rejects.toThrow("Migration wurde verändert");
    expect((await client.query("SELECT count(*)::int AS count FROM leads")).rows[0].count).toBe(1);
  });
});
