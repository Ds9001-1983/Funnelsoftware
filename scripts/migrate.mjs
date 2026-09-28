import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import pg from "pg";

export async function migrate(client) {
  await client.query("BEGIN");
  try {
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '60s'");
    await client.query("SELECT pg_advisory_xact_lock(734193827)");
    await client.query(`CREATE TABLE IF NOT EXISTS app_migrations (
      name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    const directory = new URL("../migrations/", import.meta.url);
    for (const name of (await readdir(directory)).filter(name => /^[0-9]{8}_[a-z0-9_]+\.sql$/.test(name)).sort()) {
      const sql = await readFile(new URL(name, directory), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const { rows } = await client.query("SELECT checksum FROM app_migrations WHERE name = $1", [name]);
      if (rows.length) {
        if (rows[0].checksum !== checksum) throw new Error(`Bereits angewendete Migration wurde verändert: ${name}`);
        continue;
      }
      await client.query(sql);
      await client.query("INSERT INTO app_migrations(name, checksum) VALUES ($1, $2)", [name, checksum]);
      console.log(`Migration geprüft: ${name}`);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await import("dotenv/config");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL fehlt");
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  try { await client.connect(); await migrate(client); }
  catch (error) { console.error("Migration abgebrochen:", error.code || error.name); process.exitCode = 1; }
  finally { await client.end(); }
}
