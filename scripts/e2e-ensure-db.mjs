// Legt die E2E-Datenbank an, falls sie fehlt (idempotent). Läuft als erster
// Schritt des Playwright-webServer-Commands (siehe package.json test:e2e:server),
// damit der Dev-Server nur mit existierender, migrierter DB hochkommen kann.
// In CI ist das ein No-op — der Postgres-Service-Container erstellt die DB selbst.
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("e2e-ensure-db: DATABASE_URL ist nicht gesetzt.");
  process.exit(1);
}

const target = new URL(url);
const dbName = target.pathname.replace(/^\//, "");
if (!dbName) {
  console.error(`e2e-ensure-db: Kein Datenbankname in DATABASE_URL (${target.host}).`);
  process.exit(1);
}

// Verbindung zur Maintenance-DB "postgres" auf demselben Host.
const admin = new URL(url);
admin.pathname = "/postgres";

const client = new pg.Client({ connectionString: admin.toString() });
try {
  await client.connect();
  const { rows } = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
  if (rows.length === 0) {
    // Bezeichner können nicht parametrisiert werden — dbName kommt aus der
    // eigenen Env-Var, wird aber trotzdem defensiv gequotet.
    await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
    console.log(`e2e-ensure-db: Datenbank "${dbName}" angelegt.`);
  } else {
    console.log(`e2e-ensure-db: Datenbank "${dbName}" existiert bereits.`);
  }
} finally {
  await client.end();
}
