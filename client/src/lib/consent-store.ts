import { apiRequest } from "./queryClient";
import { CONSENT_MAX_AGE_MS, MARKETING_CONSENT_VERSION, NECESSARY_ONLY, type CookiePreferences } from "@shared/privacy-consent";
import { funnelConsentVersion, type FunnelConsentConfiguration } from "@shared/privacy-consent";

export interface ConsentScope {
  key: string;
  version: string;
  privacyUrl: string;
  label: string;
  marketingDescription: string;
  summary: string;
}
export const PLATFORM_CONSENT: ConsentScope = {
  key: "platform", version: MARKETING_CONSENT_VERSION, privacyUrl: "/datenschutz",
  label: "Trichterwerk (SUPERBRAND.marketing)",
  summary: "Mit deiner Zustimmung messen wir mit Meta Besuche, Registrierungen und Zahlungen einschließlich späterer Aborechnungen. Dabei sind eine Übermittlung in die USA und ein Abgleich gehashter Kontaktdaten möglich.",
  marketingDescription: "Meta-Pixel und Conversions API (Meta Platforms Ireland Ltd.) messen Besuche, Registrierungen und Zahlungen einschließlich späterer Aborechnungen. E-Mail-Adressen werden für den Abgleich gehasht, IP-Adresse und Browserinformationen können übermittelt werden. Cookies: _fbp/_fbc. Eine Verarbeitung in den USA ist möglich.",
};
export function funnelConsentScope(funnel: FunnelConsentConfiguration): ConsentScope {
  return {
    key: `funnel:${funnel.uuid}`, version: funnelConsentVersion(funnel),
    privacyUrl: funnel.datenschutzUrl || "", label: `das Angebot „${funnel.name || "Funnel"}“ des verlinkten Anbieters`,
    summary: "Deine Zustimmung gilt für die Analyse und Werbemessung dieses Angebots, gegebenenfalls mit Meta und den Diensten in den verlinkten Datenschutzhinweisen. Dabei können Kontakt- und Browserdaten auch in den USA verarbeitet werden.",
    marketingDescription: "Der Betreiber kann Meta-Pixel und Conversions API zur Werbemessung verwenden. Dabei können Kontaktangaben gehasht sowie IP-Adresse und Browserinformationen an Meta Platforms Ireland Ltd. übermittelt werden. Verarbeitung in den USA möglich. Weitere eingesetzte Dienste und Zwecke findest du in den Datenschutzhinweisen des Anbieters.",
  };
}
export interface ConsentRecord {
  version: string;
  expiresAt: number;
  preferences: CookiePreferences;
  withdrawalPending?: boolean;
}
export const consentStorageKey = (scope: ConsentScope) => `tw-consent-v2:${scope.key}`;
export function readConsent(scope = PLATFORM_CONSENT): ConsentRecord | null {
  try {
    const record = JSON.parse(localStorage.getItem(consentStorageKey(scope)) || "null");
    if (!record || record.version !== scope.version || !Number.isFinite(record.expiresAt) || record.expiresAt <= Date.now()) return null;
    const p = record.preferences;
    if (p?.necessary !== true || typeof p.analytics !== "boolean" || typeof p.marketing !== "boolean") return null;
    return record.withdrawalPending ? { ...record, preferences: NECESSARY_ONLY } : record;
  } catch { return null; }
}
export function notifyConsent(scope: ConsentScope) {
  window.dispatchEvent(new CustomEvent("cookieConsentChanged", { detail: { scope: scope.key } }));
}
function writeRecord(scope: ConsentScope, record: ConsentRecord) {
  localStorage.setItem(consentStorageKey(scope), JSON.stringify(record));
  notifyConsent(scope);
}
let serverStatus: Promise<boolean> | undefined;
export function invalidateConsentStatus() { serverStatus = undefined; }
export async function confirmPlatformConsent(): Promise<boolean> {
  serverStatus ??= fetch("/api/privacy/marketing-consent", { credentials: "same-origin", cache: "no-store", signal: AbortSignal.timeout(8000) })
    .then(async response => {
      if (!response.ok) return false;
      const status = await response.json();
      return status.marketing === true && status.version === MARKETING_CONSENT_VERSION
        && Date.parse(status.expiresAt) > Date.now();
    }).catch(() => false);
  return serverStatus;
}
export async function saveConsent(scope: ConsentScope, preferences: CookiePreferences) {
  // Bei blockiertem Browserspeicher keine serverseitige Zustimmung erzeugen,
  // die der Besucher in diesem Browser anschließend nicht verwalten könnte.
  // Auch eine verlorene Antwort kann eine serverseitig bereits gespeicherte
  // Zustimmung bedeuten. Den ungeklärten Zustand bis zur Bestätigung erhalten.
  invalidateConsentStatus();
  writeRecord(scope, {
    version: scope.version, expiresAt: Date.now() + CONSENT_MAX_AGE_MS,
    preferences: NECESSARY_ONLY, withdrawalPending: scope.key === "platform",
  });
  let expiresAt = Date.now() + CONSENT_MAX_AGE_MS;
  if (scope.key === "platform") {
    const response = await apiRequest("POST", "/api/privacy/marketing-consent", { marketing: preferences.marketing, version: MARKETING_CONSENT_VERSION }, AbortSignal.timeout(8000));
    const status = await response.json();
    if (status.marketing !== preferences.marketing || status.version !== MARKETING_CONSENT_VERSION) throw new Error("Ungültige Einwilligungsantwort");
    if (preferences.marketing) {
      expiresAt = Date.parse(status.expiresAt);
      if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) throw new Error("Ungültiger Einwilligungszeitraum");
    }
    invalidateConsentStatus();
  }
  writeRecord(scope, { version: scope.version, expiresAt, preferences });
}
function clearTrackingCookies(scope: ConsentScope) {
  for (const item of document.cookie.split(";")) {
    const name = item.trim().split("=")[0];
    if (!(["_fbp", "_fbc"].includes(name) || (scope.key.startsWith("funnel:") && name === `tw_ab_${scope.key.slice(7)}`))) continue;
    const parts = window.location.hostname.split(".");
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    for (let i = 0; i < parts.length - 1; i++) document.cookie = `${name}=; Max-Age=0; path=/; domain=.${parts.slice(i).join(".")}; SameSite=Lax`;
  }
}
export async function resetConsent(scope = PLATFORM_CONSENT) {
  // Sofort lokal sperren. Bei Netzwerkfehlern bleibt dieser Sperrvermerk über
  // den Reload erhalten und der Banner bietet einen erneuten Widerruf an.
  try {
    writeRecord(scope, { version: scope.version, expiresAt: Date.now() + CONSENT_MAX_AGE_MS, preferences: NECESSARY_ONLY, withdrawalPending: scope.key === "platform" });
  } catch { /* Server-Widerruf auch bei blockiertem localStorage versuchen. */ }
  try {
    (window as Window & { fbq?: (...args: unknown[]) => void }).fbq?.("consent", "revoke");
    clearTrackingCookies(scope);
    if (scope.key.startsWith("funnel:")) {
      try { sessionStorage.removeItem(`tw_ab_${scope.key.slice(7)}`); } catch { /* Optionaler Speicher. */ }
    }
    if (scope.key === "platform") {
      try {
        localStorage.removeItem("trichterwerk-cookie-consent");
        localStorage.removeItem("trichterwerk-cookie-preferences");
      } catch { /* Optionaler Altbestand. */ }
      await apiRequest("POST", "/api/privacy/marketing-consent", { marketing: false, version: MARKETING_CONSENT_VERSION }, AbortSignal.timeout(8000));
    }
    localStorage.removeItem(consentStorageKey(scope));
  } catch {
    // Fehlermeldung und Wiederholung nach dem Reload: withdrawalPending.
  } finally {
    invalidateConsentStatus();
    window.location.reload();
  }
}
