// Cookieless Reichweiten-Beacon für trichterwerk.de.
//
// Setzt selbst NICHTS im Browser (kein Cookie, kein localStorage, kein
// Fingerprinting) → darf ohne Einwilligung laufen (§ 25 Abs. 2 Nr. 2 TDDDG).
// Der Server (POST /api/public/track) leitet aus IP + User-Agent nur einen
// tages-rotierenden Anonym-Hash ab und speichert keine Roh-IP.
//
// Das ist die zuverlässigere der beiden Messungen: der Meta-Pixel
// (platform-pixel.ts) sieht nur einwilligende Besucher, dieses Beacon sieht alle.
// Der Funnel-Report im Admin-Bereich baut deshalb hierauf auf.

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

/**
 * First-Touch-Kampagne der laufenden Sitzung.
 *
 * Ohne das stehen die UTM-Parameter nur an dem Event, bei dem sie in der URL
 * waren: Ein Besucher landet mit `?utm_source=meta` auf "/", klickt auf
 * "/register" — und weil wouter clientseitig navigiert, hat das Register-Event
 * keine Quelle mehr. Damit ließe sich nie sag, welche Kampagne registriert hat.
 *
 * Eine Modul-Variable statt sessionStorage: sie überlebt die SPA-Navigation,
 * fasst aber kein Endgerät an (§ 25 TDDDG bleibt außen vor, keine Einwilligung
 * nötig). Bei einem harten Reload ist sie weg — dann stehen die UTMs aber in
 * der Regel wieder in der URL.
 */
let firstTouch: { source?: string; medium?: string; campaign?: string } | null = null;

function captureFirstTouch(): void {
  if (firstTouch) return;
  const params = new URLSearchParams(window.location.search);
  const source = params.get("utm_source") || undefined;
  const medium = params.get("utm_medium") || undefined;
  const campaign = params.get("utm_campaign") || undefined;
  if (source || medium || campaign) firstTouch = { source, medium, campaign };
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

  captureFirstTouch();

  send(
    JSON.stringify({
      path,
      referrer: document.referrer || undefined,
      utmSource: firstTouch?.source,
      utmMedium: firstTouch?.medium,
      utmCampaign: firstTouch?.campaign,
      eventType,
      label,
    }),
  );
}

/** Meldet einen Seitenaufruf (fire-and-forget). Stört den Nutzer nie. */
export function trackPageview(path: string): void {
  trackPlatformEvent(path, "pageview");
}
