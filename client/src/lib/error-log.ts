/**
 * Kleiner Ringpuffer für Browser-Fehler, damit eine Fehlermeldung aus dem
 * Produkt (siehe components/support/BugReportWidget) mehr liefert als
 * „geht nicht": die letzten Ausnahmen, die vor dem Melden aufgetreten sind.
 *
 * Bewusst kein Telemetrie-Versand: Die Einträge verlassen den Browser nur,
 * wenn der Nutzer selbst eine Meldung abschickt, und sie werden ihm im Dialog
 * vorher angezeigt.
 */

const MAX_ENTRIES = 10;
const MAX_MESSAGE_LENGTH = 300;

const entries: string[] = [];

function push(message: string) {
  const time = new Date().toISOString().slice(11, 19);
  entries.push(`[${time}] ${message.slice(0, MAX_MESSAGE_LENGTH)}`);
  if (entries.length > MAX_ENTRIES) entries.shift();
}

/** Liefert die gesammelten Fehler als Text (leer, wenn nichts passiert ist). */
export function getRecentClientErrors(): string {
  return entries.join("\n");
}

/** Einmalig beim App-Start aufrufen. */
export function installErrorLog(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    const where = event.filename ? ` (${event.filename}:${event.lineno})` : "";
    push(`${event.message}${where}`);
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const text = reason instanceof Error
      ? `${reason.name}: ${reason.message}`
      : String(reason);
    push(`Unbehandelte Promise-Ablehnung: ${text}`);
  });
}
