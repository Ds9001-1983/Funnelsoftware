import { createHmac, randomBytes } from "node:crypto";
import { hasPlatformOptOut } from "@shared/platform-privacy";
import { comparisonLinks, funnelBuilderPage } from "@shared/seo-links";
import { CLIENT_TRACKABLE_EVENTS } from "@shared/schema";

// Pseudonyme Reichweitenmessung. Ein zufälliger Schlüssel lebt nur im RAM des
// Prozesses und wird bei UTC-Tageswechsel oder Neustart ersetzt. Keine Ableitung
// aus SESSION_SECRET und keine Ablage in Datenbank, Backups oder Logs.
export function createDailyVisitorHasher() {
  let activeDay = "";
  let key = randomBytes(32);
  return (ip: string, userAgent: string, now = new Date()): string => {
    const day = now.toISOString().slice(0, 10);
    if (day !== activeDay) {
      key.fill(0);
      key = randomBytes(32);
      activeDay = day;
    }
    return createHmac("sha256", key).update(JSON.stringify([day, ip, userAgent])).digest("hex");
  };
}
export const dailyVisitorHash = createDailyVisitorHasher();

/** Browserpräferenz auch für direkte Beacons und Registrierung durchsetzen. */
export function platformMeasurementBlocked(headers: Record<string, string | string[] | undefined>): boolean {
  return headers.dnt === "1" || headers["sec-gpc"] === "1" || headers["x-platform-optout"] === "1" ||
    (typeof headers.cookie === "string" && hasPlatformOptOut(headers.cookie));
}

/** Freie Labels können personenbezogene Inhalte enthalten; nur Produktcodes speichern. */
export function platformEventLabel(event: string, label?: string): string | null {
  const allowed = event === "cta_click" ? ["hero", "pricing", "final"] :
    event === "form_submit_error" ? ["password_short", "email_taken", "server_error"] : [];
  return label && allowed.includes(label) ? label : null;
}

/** URL-Helfer: nur der Host; auch ein Host kann personenbezogene Inhalte tragen. */
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
  // SEO-Marketing-Seiten — genau deren Reichweite soll gemessen werden.
  funnelBuilderPage.path,
  "/vergleich",
  ...comparisonLinks.map((l) => l.path),
]);

/** True, wenn der Pfad zur Reichweiten-Whitelist gehört. */
export function isTrackablePath(path: string): boolean {
  const clean = (path.split(/[?#]/)[0] || "/").replace(/\/+$/, "") || "/";
  return TRACKABLE_PATHS.has(clean);
}

/**
 * Ereignistypen, die ein Browser melden darf.
 *
 * `register`, `trial_started` und `purchase` fehlen hier absichtlich: sie
 * entstehen nur serverseitig (Register-Handler bzw. Stripe-Webhook). Vorher
 * stand `register` im Client-Enum — ein einzelnes
 * `curl -d '{"path":"/register","eventType":"register"}'` konnte damit die
 * Registrierungszahl im Admin-Dashboard beliebig hochtreiben, also genau die
 * Kennzahl, an der eine Kampagne bewertet wird.
 *
 * Die Zod-Validierung in `trackEventSchema` deckt denselben Fall ab; diese
 * Funktion ist die zweite Sperre direkt an der Route — eine künftige
 * Schema-Erweiterung soll die Lücke nicht lautlos wieder aufmachen.
 */
const CLIENT_ALLOWED_EVENTS: ReadonlySet<string> = new Set(CLIENT_TRACKABLE_EVENTS);

export function isClientTrackableEvent(eventType: string): boolean {
  return CLIENT_ALLOWED_EVENTS.has(eventType);
}
