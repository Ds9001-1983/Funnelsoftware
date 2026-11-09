import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { pool } from "../server/db";
import { assertErasureJournalReady, checkpointSchema, initializeErasureJournal, journalDirectory, readJournal, replayErasureJournal } from "../server/erasure-journal";

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const directory = journalDirectory();
  if (!directory) throw new Error("ERASURE_JOURNAL_DIR muss ausdrücklich gesetzt sein.");
  if (command === "prepare-release" && args.length === 2) {
    // Called only with the app stopped. The pre-migration release backup is
    // retained; this second snapshot carries stable identities and the binding.
    process.umask(0o077);
    const backup = await fs.realpath(args[0]), root = await fs.realpath(args[1]);
    await fs.mkdir(path.dirname(directory), { recursive: true, mode: 0o700 });
    await initializeErasureJournal(directory);
    await assertErasureJournalReady(root);
    const target = new URL(process.env.DATABASE_URL || "");
    if (!["localhost", "127.0.0.1"].includes(target.hostname) || target.search || target.hash) throw new Error("Release-Sicherung benötigt eine lokale Datenbank.");
    const execute = promisify(execFile);
    const dump = path.join(backup, "journal-baseline.dump"), files = path.join(backup, "journal-baseline-uploads.tar.gz");
    for (const filename of [dump, files]) {
      try { await fs.lstat(filename); throw new Error("Sicherungsdatei existiert bereits."); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    }
    await execute("pg_dump", ["--format=custom", "--file", dump], { env: {
      PATH: process.env.PATH, PGHOST: target.hostname, PGPORT: target.port || "5432",
      PGUSER: decodeURIComponent(target.username), PGPASSWORD: decodeURIComponent(target.password), PGDATABASE: target.pathname.slice(1),
    } });
    await execute("tar", ["-czf", files, "-C", root, "uploads", "private-uploads"]);
    const { checkpoint } = await readJournal(directory);
    const checkpointFile = path.join(backup, "journal-baseline-checkpoint.json");
    await fs.writeFile(checkpointFile, JSON.stringify(checkpoint) + "\n", { flag: "wx", mode: 0o600 });
    const hashes = [];
    for (const filename of [dump, files, checkpointFile]) {
      const hash = createHash("sha256"), handle = await fs.open(filename);
      try { for await (const part of handle.createReadStream()) hash.update(part); }
      finally { await handle.close(); }
      hashes.push(`${hash.digest("hex")}  ${path.basename(filename)}\n`);
    }
    await fs.writeFile(path.join(backup, "journal-baseline-SHA256SUMS"), hashes.join(""), { flag: "wx", mode: 0o600 });
    console.log(JSON.stringify({ journalReady: true, baselineCreated: true, checkpoint }));
  } else if (command === "initialize" && !args.length) {
    console.log(JSON.stringify(await initializeErasureJournal(directory)));
  } else if (command === "check" && args.length <= 1) {
    await assertErasureJournalReady(args[0] ? await fs.realpath(args[0]) : process.cwd());
    console.log(JSON.stringify({ ready: true }));
  } else if (command === "checkpoint" && args.length === 1) {
    const { checkpoint } = await readJournal(directory);
    const handle = await fs.open(path.resolve(args[0]), "wx", 0o600);
    try { await handle.writeFile(JSON.stringify(checkpoint) + "\n"); await handle.sync(); }
    finally { await handle.close(); }
    console.log(JSON.stringify(checkpoint));
  } else if (command === "replay" && args.length === 2) {
    const target = new URL(process.env.DATABASE_URL || "");
    if (!["localhost", "127.0.0.1"].includes(target.hostname) || !/^\/tw_restore_[a-z0-9_]+$/.test(target.pathname)) {
      throw new Error("Replay benötigt eine isolierte lokale tw_restore_ Datenbank.");
    }
    const root = await fs.realpath(args[0]);
    const relative = path.relative(process.cwd(), root);
    if (!relative || (!relative.startsWith(`..${path.sep}`) && relative !== "..")) throw new Error("Restore-Dateien müssen außerhalb der Anwendung liegen.");
    const active = await pool.query("SELECT 1 FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid() AND backend_type = 'client backend'");
    if (active.rowCount) throw new Error("Restore-Datenbank hat weitere Verbindungen; Anwendung und Worker müssen gestoppt sein.");
    const checkpoint = checkpointSchema.parse(JSON.parse(await fs.readFile(args[1], "utf8")));
    console.log(JSON.stringify(await replayErasureJournal(directory, root, checkpoint)));
  } else {
    throw new Error("Aufruf: initialize | check [Dateiroot] | checkpoint <neue-Datei> | replay <isolierter-Dateiroot> <aktueller-Checkpoint>");
  }
}

try { await main(); }
catch (error) { console.error(error instanceof Error ? error.message : "Löschjournal-Prüfung fehlgeschlagen"); process.exitCode = 1; }
finally { await pool.end(); }
