import { useEffect } from "react";

/**
 * Warnt den Nutzer beim Schließen des Tabs / Navigieren, solange `enabled` true ist.
 * Moderne Browser ignorieren den Custom-Text und zeigen eine Standard-Meldung;
 * der Parameter wird trotzdem gesetzt, um ältere Browser mitzunehmen.
 */
export function useBeforeUnload(enabled: boolean, message = "Es gibt ungespeicherte Änderungen.") {
  useEffect(() => {
    if (!enabled) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
      return message;
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [enabled, message]);
}
