// Cookieless Reichweiten-Beacon für trichterwerk.de.
//
// Setzt selbst NICHTS im Browser (kein Cookie, kein localStorage, kein
// Fingerprinting) → darf ohne Einwilligung laufen (§ 25 Abs. 2 Nr. 2 TDDDG).
// Der Server (POST /api/public/track) leitet aus IP + User-Agent nur einen
// tages-rotierenden Anonym-Hash ab und speichert keine Roh-IP.

import { comparisonLinks, funnelBuilderPage } from "@shared/seo-links";

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

/** Meldet einen Seitenaufruf (fire-and-forget). Stört den Nutzer nie. */
export function trackPageview(path: string): void {
  if (typeof window === "undefined") return;
  if (!isTrackable(path)) return;

  const params = new URLSearchParams(window.location.search);
  const body = JSON.stringify({
    path,
    referrer: document.referrer || undefined,
    utmSource: params.get("utm_source") || undefined,
    utmMedium: params.get("utm_medium") || undefined,
    utmCampaign: params.get("utm_campaign") || undefined,
    eventType: "pageview",
  });

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
