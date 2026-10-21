// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { validateE2EDatabaseUrl } from "../scripts/e2e-env.mjs";

const connection = process.env.DOMAINS_TEST_DATABASE_URL;
if (connection) validateE2EDatabaseUrl(connection);
const script = readFileSync(new URL("./domain-provisioner.sh", import.meta.url), "utf8");
// Execute the production function itself, without running certificate issuance,
// nginx reloads or cleanup. Real psql + PostgreSQL must perform the substitution.
function shellFunction(name) {
  const match = script.match(new RegExp(`^${name}\\(\\) \\{[\\s\\S]*?^}`, "m"));
  if (!match) throw new Error(`Missing production function: ${name}`);
  return match[0];
}

describe.skipIf(!connection)("domain provisioner status updates with real psql", () => {
  const schema = `domain_ssl_test_${randomUUID().replaceAll("-", "")}`;
  let client;

  function update(host, status, { dryRun = false } = {}) {
    const env = {
      PATH: process.env.PATH,
      DATABASE_URL: connection,
      PGOPTIONS: `-c search_path=${schema} -c statement_timeout=5000`,
      DRY_RUN: dryRun ? "1" : "0",
      // Log and legacy run wrapper also come from the production script.
    };
    const log = script.match(/^log\(\).*$/m)?.[0];
    const run = script.match(/^run\(\).*$/m)?.[0];
    return spawnSync("bash", ["-c", `set -euo pipefail\n${log}\n${run}\n${shellFunction("set_status")}\nset_status "$1" "$2"\nprintf 'STATUS_UPDATE_COMPLETED\\n'`, "domain-status-test", host, status], {
      env, encoding: "utf8", timeout: 10_000,
    });
  }

  beforeAll(async () => {
    expect(spawnSync("psql", ["--version"], { encoding: "utf8" }).status).toBe(0);
    client = new pg.Client({ connectionString: connection });
    await client.connect();
    await client.query(`CREATE SCHEMA ${schema}; SET search_path TO ${schema}`);
    await client.query("CREATE TABLE domains (hostname text PRIMARY KEY, ssl_status text NOT NULL CHECK (ssl_status IN ('pending','active','error')))");
  });
  beforeEach(async () => {
    await client.query("TRUNCATE domains");
    await client.query("INSERT INTO domains VALUES ('funnel.example.test','pending'), ('other.example.test','pending')");
  });
  afterAll(async () => {
    if (client) { await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`); await client.end(); }
  });

  it.each(["active", "error"])("persists %s only on the specified domain", async status => {
    const result = update("funnel.example.test", status);
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("STATUS_UPDATE_COMPLETED");
    expect((await client.query("SELECT * FROM domains ORDER BY hostname")).rows).toEqual([
      { hostname: "funnel.example.test", ssl_status: status },
      { hostname: "other.example.test", ssl_status: "pending" },
    ]);
  });
  it("quotes hostname values instead of interpreting SQL", async () => {
    const host = "quote' OR TRUE; --.example.test";
    await client.query("INSERT INTO domains VALUES ($1,'pending')", [host]);
    expect(update(host, "active").status).toBe(0);
    expect((await client.query("SELECT hostname FROM domains WHERE ssl_status='active'")).rows).toEqual([{ hostname: host }]);
  });
  it("exits before claiming success if PostgreSQL rejects the update", async () => {
    const result = update("funnel.example.test", "invalid-status");
    expect(result.status).not.toBe(0);
    expect(result.stdout).not.toContain("STATUS_UPDATE_COMPLETED");
    expect((await client.query("SELECT ssl_status FROM domains WHERE hostname='funnel.example.test'")).rows[0].ssl_status).toBe("pending");
  });
  it("keeps records unchanged in dry run and does not log connection credentials", async () => {
    const result = update("funnel.example.test", "active", { dryRun: true });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("DRY-RUN:");
    expect(result.stdout + result.stderr).not.toContain(connection);
    expect(result.stdout + result.stderr).not.toMatch(/postgres(?:ql)?:\/\//);
    expect((await client.query("SELECT count(*)::int AS count FROM domains WHERE ssl_status='pending'")).rows[0].count).toBe(2);
  });
});
