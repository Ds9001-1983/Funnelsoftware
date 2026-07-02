/**
 * Erkennung und Selbstheilung von fehlgeschlagenen Lazy-Chunk-Imports.
 *
 * Hintergrund: Jeder Deploy baut alle Hash-Chunks neu und löscht die alten
 * (vite emptyOutDir). Ein Browser-Tab, der vor dem Deploy geladen wurde,
 * fordert beim nächsten Routenwechsel einen inzwischen gelöschten Chunk an —
 * der Dynamic Import wirft, React.lazy cached die Rejection dauerhaft und
 * die ErrorBoundary zeigt eine Sackgassen-Meldung. Einzige echte Heilung ist
 * ein voller Seiten-Reload, der den frischen Build holt.
 */

const CHUNK_ERROR_PATTERNS: readonly RegExp[] = [
  // Chrome/Edge
  /failed to fetch dynamically imported module/i,
  // Firefox
  /error loading dynamically imported module/i,
  // Safari (inkl. iOS)
  /importing a module script failed/i,
  // Vite-Preload von CSS-Abhängigkeiten eines Chunks
  /unable to preload css/i,
  // Defensiv: Loader-Varianten
  /loading chunk [\w-]+ failed/i,
  // SPA-Fallback lieferte HTML statt des (gelöschten) JS-Chunks
  /'text\/html' is not a valid javascript mime type/i,
];

/** Prüft, ob ein Fehler von einem fehlgeschlagenen Chunk-/Modul-Import stammt. */
export function isChunkLoadError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

// sessionStorage statt localStorage: Der Guard gilt pro Tab und überlebt den
// Reload — genau die Lebensdauer, die wir brauchen.
const RELOAD_GUARD_KEY = "tw-chunk-reload-at";
const RELOAD_GUARD_WINDOW_MS = 60_000;

// Belt-and-braces innerhalb derselben Seiten-Lebensdauer (deckt das Fenster
// zwischen reload()-Aufruf und tatsächlichem Unload sowie Lese-Fehler ab).
let inMemoryLastReloadAt = 0;

function readLastReloadAt(): number {
  try {
    const stored = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) ?? 0);
    return Math.max(stored || 0, inMemoryLastReloadAt);
  } catch {
    return inMemoryLastReloadAt;
  }
}

/**
 * True, wenn gerade (< Guard-Fenster) ein Auto-Reload ausgelöst wurde.
 * Wichtig für die ErrorBoundary: Nach preventDefault() im
 * vite:preloadError-Handler resolvet der Import mit undefined und React
 * wirft kurz vor dem Reload einen Folgefehler, der die Chunk-Patterns
 * nicht matcht — kein echter App-Bug.
 */
export function isAutoReloadPending(): boolean {
  return Date.now() - readLastReloadAt() < RELOAD_GUARD_WINDOW_MS;
}

/**
 * Lädt die Seite neu, um nach einem Deploy den frischen Build zu holen —
 * höchstens einmal pro Guard-Fenster, damit ein dauerhaft kaputter Chunk
 * keinen Reload-Loop auslöst.
 *
 * @returns true, wenn der Reload ausgelöst wurde; false, wenn der Guard
 *          greift, der Browser offline ist oder sessionStorage fehlt (dann
 *          soll der Aufrufer den Fehler mit manuellem Reload-Button zeigen).
 */
export function tryRecoverFromChunkError(): boolean {
  // Offline würde der Reload auf der Browser-Fehlerseite enden (kompletter
  // SPA-Verlust) — dann lieber die ErrorBoundary stehen lassen.
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return false;
  }
  if (isAutoReloadPending()) {
    return false;
  }
  const now = Date.now();
  try {
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(now));
  } catch {
    // Ohne sessionStorage überlebt der Guard den Reload nicht — dann lieber
    // nicht automatisch neu laden (Reload-Loop-Gefahr).
    return false;
  }
  inMemoryLastReloadAt = now;
  window.location.reload();
  return true;
}
