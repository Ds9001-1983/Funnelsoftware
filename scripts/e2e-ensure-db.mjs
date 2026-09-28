// Legt die E2E-Datenbank an, falls sie fehlt (idempotent). Läuft als erster
// Schritt des Playwright-webServer-Commands (siehe package.json test:e2e:server),
// damit der Dev-Server nur mit existierender, migrierter DB hochkommen kann.
// In CI ist das ein No-op — der Postgres-Service-Container erstellt die DB selbst.
import pg from "pg";
import { validateE2EDatabaseUrl } from "./e2e-env.mjs";

// Never accept DATABASE_URL as a fallback: it may refer to production.
const url = validateE2EDatabaseUrl(process.env.E2E_DATABASE_URL);
const target = new URL(url);
const dbName = target.pathname.replace(/^\//, "");

// Verbindung zur Maintenance-DB "postgres" auf demselben Host.
const admin = new URL(url);
admin.pathname = "/postgres";

// Explicit fields prevent inherited PGHOST/PGPORT/PGUSER values from supplying
// missing URL parts. The isolated runner additionally drops all PG* variables.
const client = new pg.Client({
  connectionString: admin.toString(),
  port: Number(admin.port || 5432),
  password: decodeURIComponent(admin.password),
  connectionTimeoutMillis: 5000,
});
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
