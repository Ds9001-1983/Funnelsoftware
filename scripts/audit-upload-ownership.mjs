import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";

/** Read-only inventory. References are candidates, never proof of upload
 * ownership. No attribution, file removal or customer-content export here. */
export async function auditUploadOwnership(client, root) {
  const registered = new Set();
  if ((await client.query("SELECT to_regclass('owned_uploads') AS name")).rows[0].name) {
    for (const row of (await client.query("SELECT area, filename FROM owned_uploads")).rows) registered.add(`${row.area}/${row.filename}`);
  }
  for (const row of (await client.query("SELECT filename FROM media_assets")).rows) registered.add(`public/${row.filename}`);
  for (const row of (await client.query("SELECT screenshot_path, attachment_path FROM bug_reports")).rows) {
    for (const name of [row.screenshot_path, row.attachment_path]) if (name) registered.add(`support/${name}`);
  }
  const unresolved = [];
  let totalFiles = 0;
  for (const [area, directory] of [["public", "uploads"], ["support", "private-uploads/bug-reports"]]) {
    let entries;
    try { entries = await readdir(path.join(root, directory), { withFileTypes: true }); }
    catch (error) { if (error.code === "ENOENT") continue; throw error; }
    for (const entry of entries) {
      totalFiles++;
      if (!entry.isDirectory() && registered.has(`${area}/${entry.name}`)) continue;
      const references = area === "public" && !entry.isDirectory() ? await client.query(`
        SELECT DISTINCT user_id FROM (
          SELECT f.user_id FROM funnels f WHERE position($1 in to_jsonb(f)::text) > 0
          UNION SELECT f.user_id FROM funnel_revisions r JOIN funnels f ON f.id=r.funnel_id WHERE position($1 in r.content::text) > 0
          UNION SELECT user_id FROM content_templates WHERE position($1 in content::text) > 0
          UNION SELECT user_id FROM brand_styles WHERE position($1 in theme::text) > 0
        ) candidates ORDER BY user_id`, [entry.name]) : { rows: [] };
      unresolved.push({ area, filename: entry.name, directory: entry.isDirectory(), referenceAccountIds: references.rows.map(row => row.user_id) });
    }
  }
  return { totalFiles, unresolved };
}

if (!process.argv[1] || import.meta.url === pathToFileURL(process.argv[1]).href) {
  await import("dotenv/config");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL fehlt");
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const result = await auditUploadOwnership(client, process.cwd());
    console.log(JSON.stringify(result, null, 2));
    if (result.unresolved.length) process.exitCode = 2;
  } catch (error) {
    console.error("Upload-Inventar konnte nicht geprüft werden:", error.code || error.name);
    process.exitCode = 1;
  } finally { await client.end(); }
}
