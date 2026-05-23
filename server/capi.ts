import { createHash } from "crypto";

const META_GRAPH_API_VERSION = "v21.0";

/** Persönliche Daten — werden vor dem Senden SHA-256-gehasht (Meta-Anforderung). */
export interface CapiUserData {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  /** IP des Besuchers (wird NICHT gehasht, sondern roh erwartet). */
  clientIpAddress?: string | null;
  /** User-Agent des Besuchers (roh). */
  clientUserAgent?: string | null;
  /** `_fbc` Cookie (Click ID, roh). */
  fbc?: string | null;
  /** `_fbp` Cookie (Browser ID, roh). */
  fbp?: string | null;
}

export interface SendCapiEventArgs {
  /** Meta-Pixel-ID (öffentlich). */
  pixelId: string;
  /** Conversions-API-Access-Token (Secret). */
  accessToken: string;
  /** Event-Name (z. B. "Lead"). */
  eventName: string;
  /**
   * Eindeutige Event-ID — MUSS identisch mit der Client-Pixel-Event-ID sein,
   * sonst dedupliziert Meta nicht und du zählst Events doppelt.
   */
  eventId: string;
  /** URL, auf der der Lead entstanden ist (für browser_id-Matching). */
  eventSourceUrl: string;
  /** Personenbezogene Daten (werden gehasht, wo nötig). */
  userData: CapiUserData;
  /** Optionale Custom-Daten (Lead-Wert, Currency, Content-Name etc.). */
  customData?: Record<string, unknown>;
}

/** SHA-256-Hash von String (lowercase + getrimmt), oder undefined bei leerer Eingabe. */
function hashPii(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  return createHash("sha256").update(normalized).digest("hex");
}

/**
 * Telefonnummer für Hashing normalisieren: nur Ziffern, führende 00/+ entfernen.
 * Meta erwartet das so für maximales Match-Quality.
 */
function normalizePhone(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  return digits || undefined;
}

/**
 * Sendet ein Server-Side-Event an die Meta Conversions API.
 * PII (E-Mail/Telefon/Vor-/Nachname) wird SHA-256-gehasht. Die IP, User-Agent,
 * fbc, fbp werden ungehasht übergeben — so verlangt es Meta.
 *
 * Throws bei HTTP-Fehlern; Aufrufer entscheidet, ob er fängt + loggt.
 */
export async function sendCapiEvent(args: SendCapiEventArgs): Promise<void> {
  const { pixelId, accessToken, eventName, eventId, eventSourceUrl, userData, customData } = args;

  const user_data: Record<string, string> = {};
  const em = hashPii(userData.email);
  if (em) user_data.em = em;
  const ph = hashPii(normalizePhone(userData.phone));
  if (ph) user_data.ph = ph;
  const fn = hashPii(userData.firstName);
  if (fn) user_data.fn = fn;
  const ln = hashPii(userData.lastName);
  if (ln) user_data.ln = ln;
  if (userData.clientIpAddress) user_data.client_ip_address = userData.clientIpAddress;
  if (userData.clientUserAgent) user_data.client_user_agent = userData.clientUserAgent;
  if (userData.fbc) user_data.fbc = userData.fbc;
  if (userData.fbp) user_data.fbp = userData.fbp;

  const body = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: eventSourceUrl,
        action_source: "website",
        user_data,
        ...(customData ? { custom_data: customData } : {}),
      },
    ],
  };

  const url = `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Meta CAPI ${res.status}: ${text || res.statusText}`);
  }
}
