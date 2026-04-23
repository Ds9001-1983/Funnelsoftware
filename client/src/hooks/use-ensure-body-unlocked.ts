import { useEffect } from "react";

/**
 * Safety-Net gegen Radix-Dialog-Cleanup-Bugs: Wenn `trigger` von true auf
 * false wechselt, prüft der Hook nach einem Tick (nach Radix' Exit-Animation),
 * ob `document.body` noch mit `pointer-events: none` oder `overflow: hidden`
 * blockiert ist. Falls ja, setzt er die Styles zurück.
 *
 * Nur als defensive Bremse gedacht — verändert nichts am Normal-Fall,
 * rettet aber wenn Radix' interne Cleanup-Effects bei Mutation/Navigation-
 * Kollisionen nicht sauber durchlaufen.
 */
export function useEnsureBodyUnlocked(trigger: boolean) {
  useEffect(() => {
    if (trigger) return;
    // Nach Radix' Exit-Animation (typisch 150-200 ms) prüfen
    const id = window.setTimeout(() => {
      const style = document.body.style;
      if (style.pointerEvents === "none") style.pointerEvents = "";
    }, 300);
    return () => window.clearTimeout(id);
  }, [trigger]);
}
