/**
 * Gemeinsame E2E-Umgebung: Port und Datenbank-URL.
 *
 * Port 5137 statt 5000, weil macOS' AirPlay-Receiver (ControlCenter) Port 5000
 * belegt — Playwright würde sonst dessen 403-Antworten für den App-Server halten.
 */
export const E2E_PORT = Number(process.env.E2E_PORT ?? 5137);

export const E2E_BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${E2E_PORT}`;

/**
 * Separate Wegwerf-Datenbank — niemals die Dev-/Prod-DB. Lokal ohne Passwort
 * (Homebrew-Default: aktueller OS-User), in CI via Env auf den Service-Container
 * gesetzt (postgres:postgres@localhost).
 */
export const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  `postgresql://${process.env.USER ?? "postgres"}@localhost:5432/funnelsoftware_e2e`;
