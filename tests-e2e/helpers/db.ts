import pg from "pg";
import { E2E_DATABASE_URL } from "./env";

/**
 * Direkter Zugriff auf die E2E-Datenbank — für Schritte, die es bewusst nur
 * out-of-band gibt (E-Mail-Verifikations-Token ohne SMTP) und für
 * Persistenz-Assertions.
 */
let pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({ connectionString: E2E_DATABASE_URL, max: 2 });
  }
  return pool;
}

/**
 * Liest den E-Mail-Verifikations-Token eines frisch registrierten Users.
 * Kurzes Polling, falls die Registrierung noch nicht committed ist.
 */
export async function getVerificationToken(email: string): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const { rows } = await getPool().query<{ email_verification_token: string | null }>(
      "SELECT email_verification_token FROM users WHERE email = $1",
      [email],
    );
    const token = rows[0]?.email_verification_token;
    if (token) return token;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Kein Verifikations-Token für ${email} gefunden — Registrierung fehlgeschlagen?`);
}

export interface LeadRow {
  name: string | null;
  email: string | null;
  funnel_id: number;
  answers: Record<string, unknown> | null;
}

export async function findLeadsByEmail(email: string): Promise<LeadRow[]> {
  const { rows } = await getPool().query<LeadRow>(
    "SELECT name, email, funnel_id, answers FROM leads WHERE email = $1",
    [email],
  );
  return rows;
}

/** Im test.afterAll aufrufen, sonst hält der Pool den Worker-Prozess offen. */
export async function closePool(): Promise<void> {
  await pool?.end();
  pool = null;
}
