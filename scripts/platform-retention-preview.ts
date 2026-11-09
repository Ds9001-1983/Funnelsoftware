// Explicit DATABASE_URL required; no dotenv loading and no mutations.
import { previewPlatformRetention } from "../server/platform-retention";
import { pool } from "../server/db";
try {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL fehlt");
  const days = Number(process.argv[2]);
  console.log(JSON.stringify(await previewPlatformRetention(days), null, 2));
} catch { console.error("Vorschau fehlgeschlagen. Explizite Datenbank und Tagesfrist prüfen."); process.exitCode = 1; }
finally { await pool.end(); }
