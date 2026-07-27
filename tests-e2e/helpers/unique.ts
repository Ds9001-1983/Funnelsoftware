/**
 * Eindeutige Identifikatoren pro Testlauf — statt Cleanup zwischen Läufen.
 * Reruns und Retries kollidieren so weder bei Usernames noch bei Slugs.
 */
export function runId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export interface TestCredentials {
  username: string;
  email: string;
  password: string;
}

/**
 * Registrierungs-Daten, die registerSchema erfüllen (Passwort min. 10 Zeichen —
 * Zeichenklassen-Regeln gibt es seit der Policy-Vereinfachung nicht mehr).
 *
 * `username` bleibt gesetzt: Im Formular ist das Feld weg, über die API ist es
 * weiterhin erlaubt. So deckt `helpers/api.ts` den Zweig mit selbst gewähltem
 * Namen ab, während der Browser-Test die Ableitung aus der E-Mail durchläuft.
 */
export function makeCredentials(id: string = runId()): TestCredentials {
  return {
    username: `e2e-${id}`,
    email: `e2e-${id}@example.com`,
    password: "E2ePasswort1!",
  };
}

/** Slug im Format ^[a-z0-9]+(-[a-z0-9]+)*$ (base36 ist bereits lowercase). */
export function makeSlug(id: string = runId()): string {
  return `e2e-${id}`;
}
