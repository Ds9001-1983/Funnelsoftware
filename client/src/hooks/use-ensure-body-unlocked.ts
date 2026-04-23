import { useEffect } from "react";

const LOCK_ATTRS = ["pointer-events", "overflow"] as const;
const DATA_LOCK_ATTRS = ["data-scroll-locked", "data-aria-hidden"] as const;

function hasOpenRadixOverlay(): boolean {
  // Radix setzt data-state="open" auf Dialog / AlertDialog / Popover / Sheet / DropdownMenu / ContextMenu
  // während deren Inhalt sichtbar ist. Wir behandeln body-Locks als legitim, solange eins davon offen ist.
  return !!document.querySelector(
    '[data-state="open"][role="dialog"], [data-state="open"][role="alertdialog"]',
  );
}

function cleanupBodyStyles(): void {
  if (hasOpenRadixOverlay()) return;

  const body = document.body;
  const html = document.documentElement;

  // `pointer-events: none` ist die Haupt-Ursache des "UI eingefroren"-Bugs.
  if (getComputedStyle(body).pointerEvents === "none") {
    body.style.pointerEvents = "";
  }
  // Radix Dialog setzt `overflow: hidden` auf body — bleibt hängen wenn Cleanup
  // nicht durchläuft (dann scrollt nichts mehr).
  if (body.style.overflow === "hidden") {
    body.style.overflow = "";
  }
  if (html.style.overflow === "hidden") {
    html.style.overflow = "";
  }
  // Radix-Scroll-Lock-Attribute aufräumen, falls sie ohne Dialog hängen bleiben.
  for (const attr of DATA_LOCK_ATTRS) {
    if (body.hasAttribute(attr)) body.removeAttribute(attr);
  }
  // `pointer-events` kann auch über Attribut-Style gesetzt werden — clear auch das.
  void LOCK_ATTRS;
}

/**
 * Punktueller Safety-Net: Wenn `trigger` von true auf false wechselt, prüft
 * der Hook mehrmals, ob <body> noch Locks von einem beendeten Radix-Dialog hat,
 * und entfernt sie. Mehrere Zeitpunkte (50/200/500/1000 ms) decken schnelle
 * wie langsame Exit-Animationen ab.
 *
 * Nur als defensive Bremse gedacht — verändert nichts am Normal-Fall.
 */
export function useEnsureBodyUnlocked(trigger: boolean) {
  useEffect(() => {
    if (trigger) return;
    const delays = [50, 200, 500, 1000];
    const ids = delays.map((delay) => window.setTimeout(cleanupBodyStyles, delay));
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [trigger]);
}

/**
 * Globaler Watcher: Beobachtet `<body>` auf Style-/Attribute-Änderungen und
 * räumt Body-Locks auf, sobald kein Radix-Overlay mehr offen ist.
 * Wird einmalig auf App-Root-Ebene gemountet — schützt alle Dialoge/Sheets/
 * Dropdowns gleichzeitig, unabhängig davon wo sie entstehen.
 */
export function useGlobalBodyLockGuard() {
  useEffect(() => {
    // Kleiner Debounce, damit wir nicht bei jeder Radix-Änderung sofort feuern
    // (Radix setzt manchmal kurz überlappende Styles).
    let timer: number | null = null;
    const schedule = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = null;
        cleanupBodyStyles();
      }, 120);
    };

    const observer = new MutationObserver((mutations) => {
      // Nur auf `style`- oder Lock-Attribute am body selbst reagieren
      for (const m of mutations) {
        if (m.target !== document.body) continue;
        if (
          m.type === "attributes" &&
          (m.attributeName === "style" ||
            m.attributeName === "data-scroll-locked" ||
            m.attributeName === "data-aria-hidden")
        ) {
          schedule();
          return;
        }
      }
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "data-scroll-locked", "data-aria-hidden"],
    });

    // Zusätzlich bei jedem `popstate` (Browser-Back/Forward) + als Safety-Net
    // alle paar Sekunden einmal prüfen.
    const interval = window.setInterval(cleanupBodyStyles, 2000);
    const onPopState = () => cleanupBodyStyles();
    window.addEventListener("popstate", onPopState);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
      window.removeEventListener("popstate", onPopState);
      if (timer !== null) window.clearTimeout(timer);
    };
  }, []);
}
