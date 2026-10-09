// Bei Änderungen an Zwecken oder Empfängern eine neue Fassung veröffentlichen.
export const MARKETING_CONSENT_VERSION = "2026-10-07";
export const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;
export const PLATFORM_CONSENT_SCOPE = "platform";

export interface CookiePreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
}

export const NECESSARY_ONLY: CookiePreferences = {
  necessary: true, analytics: false, marketing: false,
};

export interface FunnelConsentConfiguration {
  uuid: string;
  name?: string;
  datenschutzUrl?: string | null;
  impressumUrl?: string | null;
  metaPixelId?: string | null;
  gtmId?: string | null;
  capiEnabled?: boolean;
}
export function funnelConsentVersion(funnel: FunnelConsentConfiguration): string {
  return JSON.stringify([MARKETING_CONSENT_VERSION, funnel.uuid, funnel.datenschutzUrl || "", funnel.impressumUrl || "", funnel.metaPixelId || "", funnel.gtmId || "", !!funnel.capiEnabled]);
}
export function hasFunnelPrivacyInformation(funnel: FunnelConsentConfiguration): boolean {
  try {
    return ["https:", "http:"].includes(new URL(funnel.datenschutzUrl || "").protocol);
  } catch { return false; }
}
