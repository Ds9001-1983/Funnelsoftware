import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Ohne error-Listener crasht ein Fehler auf einer idle Connection
// (z.B. DB-Neustart, Netzwerk-Drop) den gesamten Node-Prozess.
pool.on("error", (err) => {
  console.error("Unerwarteter PostgreSQL-Pool-Fehler:", err.message);
});

// Create drizzle instance with schema
export const db = drizzle(pool, { schema });

// Export pool for session store
export { pool };
