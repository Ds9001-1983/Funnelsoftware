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

/** Registrierungs-Daten, die registerSchema erfüllen (min 8, Großbuchstabe, Ziffer). */
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
