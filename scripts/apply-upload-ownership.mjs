import { createHash } from "node:crypto";
import { lstat, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";

/** A private operator manifest records explicit ownership confirmations.
 * References in customer content never create approvals automatically. */
export async function applyUploadOwnership(client, root, approvals) {
  if (!Array.isArray(approvals)) throw new Error("Ungültige Eigentümerfreigaben");
  for (const item of approvals) {
    if (!item || !Number.isSafeInteger(item.userId) || item.userId < 1 ||
        typeof item.username !== "string" || !item.username ||
        typeof item.filename !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,254}$/.test(item.filename) || item.filename.includes("..") ||
        !["public", "support"].includes(item.area) || !/^[a-f0-9]{64}$/.test(item.sha256) ||
        typeof item.approval !== "string" || !item.approval.trim()) throw new Error("Unvollständige Eigentümerfreigabe");
  }
  let assigned = 0;
  await client.query("BEGIN");
  try {
    for (const item of approvals) {
      const recorded = (await client.query("SELECT user_id,area FROM owned_uploads WHERE filename=$1", [item.filename])).rows[0];
      if (recorded) {
        if (recorded.user_id !== item.userId || recorded.area !== item.area) throw new Error("Abweichender Dateieigentümer bleibt unverändert");
        // A committed attribution survives normal profile renames and later
        // file removal; an old manifest must not block every future release.
        assigned++;
        continue;
      }
      const file = path.join(root, item.area === "public" ? "uploads" : "private-uploads/bug-reports", item.filename);
      let info;
      try { info = await lstat(file); }
      catch (error) {
        // Later deployments must not resurrect files/accounts already deleted.
        if (error.code === "ENOENT") continue;
        throw error;
      }
      if (!info.isFile() || createHash("sha256").update(await readFile(file)).digest("hex") !== item.sha256) {
        throw new Error("Freigegebene Datei hat sich verändert");
      }
      const owner = await client.query("SELECT id FROM users WHERE id=$1 AND username=$2 AND deleted_at IS NULL FOR KEY SHARE", [item.userId, item.username]);
      if (!owner.rowCount) throw new Error("Freigegebenes Eigentümerkonto fehlt");
      await client.query("INSERT INTO owned_uploads (filename,user_id,area) VALUES ($1,$2,$3) ON CONFLICT (filename) DO NOTHING", [item.filename, item.userId, item.area]);
      const existing = (await client.query("SELECT user_id,area FROM owned_uploads WHERE filename=$1", [item.filename])).rows[0];
      if (existing.user_id !== item.userId || existing.area !== item.area) throw new Error("Abweichender Dateieigentümer bleibt unverändert");
      assigned++;
    }
    await client.query("COMMIT");
    return { verifiedAssignments: assigned };
  } catch (error) { await client.query("ROLLBACK"); throw error; }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await import("dotenv/config");
  const manifest = process.argv[2];
  if (!manifest || !process.env.DATABASE_URL) throw new Error("Freigabedatei und Datenbank erforderlich");
  let approvals;
  try { approvals = JSON.parse(await readFile(manifest, "utf8")); }
  catch (error) {
    if (error.code !== "ENOENT") throw error;
    approvals = [];
  }
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    console.log(JSON.stringify(await applyUploadOwnership(client, process.cwd(), approvals)));
  } catch (error) {
    console.error("Eigentümerfreigaben konnten nicht übernommen werden:", error.code || error.message);
    process.exitCode = 1;
  } finally { await client.end(); }
}
