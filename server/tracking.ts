import { createHash } from "crypto";

// Reichweitenmessung für trichterwerk.de — cookieless & datensparsam.
//
// DSGVO-Kern: Die Besucher-IP wird NUR flüchtig im RAM zur Hash-Bildung genutzt
// und NIE gespeichert. Der resultierende visitorHash ist einweg (SHA-256) über
// ein geheimes Server-Secret + das aktuelle Datum:
//   - nicht auf die Person rückrechenbar (Secret verlässt den Server nie),
//   - tages-rotierend → kein tagesübergreifendes Wiedererkennen, kein Langzeitprofil,
//   - nur auf trichterwerk.de gültig → kein Cross-Site-Tracking.

// Salt-Basis: geheimes Server-Secret. In Prod ist SESSION_SECRET ohnehin Pflicht
// (server/index.ts validateEnv); im Dev Fallback.
const SALT_SECRET = process.env.SESSION_SECRET || "dev-tracking-salt";

/** YYYY-MM-DD (UTC) — Teil des Hash-Inputs, sorgt für die Tages-Rotation. */
function dayStamp(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Tages-rotierender, anonymer Besucher-Hash. IP + User-Agent werden ausschließlich
 * hier flüchtig verwendet und NICHT persistiert.
 */
export function dailyVisitorHash(ip: string, userAgent: string, now = new Date()): string {
  return createHash("sha256")
    .update(`${ip}|${userAgent}|${SALT_SECRET}|${dayStamp(now)}`)
    .digest("hex");
}

/** Nur der Host des Referrers (nie die volle URL → kein PII/Session-Leak). */
export function deriveReferrerHost(referrer?: string | null): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    return host || null;
  } catch {
    return null;
  }
}

/** Grobe Geräteklasse aus dem User-Agent — kein Fingerprinting-Anspruch. */
export function deriveDeviceClass(userAgent?: string | null): string {
  const ua = (userAgent || "").toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(ua) || (/android/.test(ua) && !/mobile/.test(ua))) {
    return "tablet";
  }
  if (/mobi|iphone|ipod|windows phone/.test(ua) || (/android/.test(ua) && /mobile/.test(ua))) {
    return "mobile";
  }
  return "desktop";
}

/**
 * Grober Ländercode ohne externen Geo-Dienst (kein Datentransfer): bevorzugt den
 * CF-IPCountry-Header (falls Cloudflare), sonst grob aus Accept-Language. Fallback null.
 */
export function deriveCountry(headers: Record<string, string | string[] | undefined>): string | null {
  const cf = headers["cf-ipcountry"];
  if (typeof cf === "string" && cf.length === 2 && cf.toUpperCase() !== "XX") {
    return cf.toUpperCase();
  }
  const al = headers["accept-language"];
  if (typeof al === "string") {
    const m = al.match(/[a-z]{2}-([a-z]{2})/i);
    if (m) return m[1].toUpperCase();
  }
  return null;
}

// Nur Marketing-/Legal-/Auth-Pfade werden gemessen. App-, Funnel- (/f/:uuid) und
// geschützte Backend-Seiten werden NICHT getrackt (die haben ihr eigenes,
// owner-verantwortetes Consent-System).
const TRACKABLE_PATHS = new Set([
  "/",
  "/impressum",
  "/datenschutz",
  "/agb",
  "/avv",
  "/nutzungsbedingungen",
  "/login",
  "/register",
]);

/** True, wenn der Pfad zur Reichweiten-Whitelist gehört. */
export function isTrackablePath(path: string): boolean {
  const clean = (path.split(/[?#]/)[0] || "/").replace(/\/+$/, "") || "/";
  return TRACKABLE_PATHS.has(clean);
}
