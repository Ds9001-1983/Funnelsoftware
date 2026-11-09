// Eigene pseudonyme Reichweitenmessung, getrennt von Marketing-Pixeln.
// Widerspruch und Browser-Datenschutzsignale stoppen jeden Beacon.
import { platformMeasurementBlocked } from "./platform-privacy";
import { comparisonLinks, funnelBuilderPage } from "@shared/seo-links";
import { isPlatformHost } from "@/lib/platform-host";
import type { PlatformEventType } from "@shared/schema";

// Muss zur Server-Whitelist (server/tracking.ts) passen.
const TRACKABLE = new Set([
  "/",
  "/impressum",
  "/datenschutz",
  "/agb",
  "/avv",
  "/nutzungsbedingungen",
  "/login",
  "/register",
  // SEO-Marketing-Seiten — genau deren Reichweite soll gemessen werden.
  funnelBuilderPage.path,
  "/vergleich",
  ...comparisonLinks.map((l) => l.path),
]);

function isTrackable(path: string): boolean {
  const clean = (path.split(/[?#]/)[0] || "/").replace(/\/+$/, "") || "/";
  return TRACKABLE.has(clean);
}

function send(body: string): void {
  try {
    if (navigator.sendBeacon) {
      // Blob mit JSON-Content-Type, damit express.json() serverseitig parst.
      navigator.sendBeacon("/api/public/track", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/public/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Tracking darf nie den Besucher stören.
  }
}

/**
 * Ereignistypen, die der Browser melden darf.
 *
 * `register`, `trial_started` und `purchase` fehlen absichtlich — die entstehen
 * serverseitig und der Server lehnt sie hier auch ab (server/tracking.ts).
 */
type ClientEventType = Exclude<PlatformEventType, "register" | "trial_started" | "purchase">;

/**
 * Meldet ein Ereignis innerhalb des Funnels (fire-and-forget).
 *
 * @param path      Getrackte Route, auf der das Ereignis passiert ist.
 * @param eventType Was passiert ist.
 * @param label     Feinere Unterscheidung, z.B. welcher CTA ("hero") oder
 *                  woran ein Formular scheiterte ("email_taken").
 */
export function trackPlatformEvent(
  path: string,
  eventType: ClientEventType,
  label?: string,
): void {
  if (typeof window === "undefined") return;
  // Niemals auf der Custom-Domain eines Kunden messen. Dort bootet die App
  // unter "/" — einer getrackten Route — bevor der Host aufgelöst und nach
  // "/f/…" umgeleitet wird. Ohne diese Sperre landeten die Besucher des Kunden
  // in unserer eigenen Reichweitenstatistik.
  if (!isPlatformHost()) return;
  if (!isTrackable(path)) return;

  if (platformMeasurementBlocked()) return;

  send(
    JSON.stringify({
      path,
      eventType,
      label,
    }),
  );
}

/** Meldet einen Seitenaufruf (fire-and-forget). Stört den Nutzer nie. */
export function trackPageview(path: string): void {
  trackPlatformEvent(path, "pageview");
}
