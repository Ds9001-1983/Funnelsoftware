// Nur auf der wegwerfbaren Restore-Kopie aufrufen. Vergleicht alle bisherigen
// Spalten jeder Tabelle, einschließlich Funnel-JSON, Tokens und Eigentümern.
// Keine Inhalte oder Hashes verlassen die Datenbank/den Prozess.
import pg from "pg";
import { migrate } from "./migrate.mjs";
const target = new URL(process.env.DATABASE_URL || "");
if (!/^tw_restore_[a-z0-9_]+$/.test(target.pathname.slice(1)) ||
    !["", "localhost", "127.0.0.1"].includes(target.hostname)) throw new Error("Restore-Test braucht eine lokale tw_restore_ Datenbank");
const client = new pg.Client({ connectionString: target.toString() });
const quote = name => '"' + name.replaceAll('"', '""') + '"';
try {
  await client.connect();
  const { rows } = await client.query(`SELECT table_name, array_agg(column_name::text ORDER BY ordinal_position) AS columns
    FROM information_schema.columns WHERE table_schema = 'public' AND table_name <> 'app_migrations'
    GROUP BY table_name ORDER BY table_name`);
  async function snapshot() {
    const values = [];
    for (const table of rows) {
      const result = await client.query(`SELECT count(*)::text AS count,
        md5(COALESCE(string_agg(md5(row_to_json(row)::text), '' ORDER BY md5(row_to_json(row)::text)), '')) AS digest
        FROM (SELECT ${table.columns.map(quote).join(",")} FROM public.${quote(table.table_name)}) row`);
      values.push(result.rows[0]);
    }
    return JSON.stringify(values);
  }
  const before = await snapshot();
  await migrate(client);
  await migrate(client); // Auch erneutes Deploy muss unverändert funktionieren.
  if (before !== await snapshot()) throw new Error("Bestehende Daten unterscheiden sich nach Migration");
  console.log(`Restore und wiederholte Migration: ${rows.length} bestehende Tabellen unverändert.`);
} finally { await client.end(); }
