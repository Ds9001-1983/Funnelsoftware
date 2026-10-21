import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./queryClient";
import { consentStorageKey, funnelConsentScope, invalidateConsentStatus, PLATFORM_CONSENT, readConsent, saveConsent } from "./consent-store";
import { CONSENT_MAX_AGE_MS, MARKETING_CONSENT_VERSION, NECESSARY_ONLY } from "@shared/privacy-consent";

vi.mock("./queryClient", () => ({ apiRequest: vi.fn() }));
const accepted = { necessary: true as const, analytics: true, marketing: true };

beforeEach(() => {
  localStorage.clear();
  vi.resetAllMocks();
  invalidateConsentStatus();
});

describe("Einwilligungsspeicher", () => {
  it("behält bei verlorener Serverantwort die Sperre und einen sichtbaren Wiederholungsbedarf", async () => {
    vi.mocked(apiRequest).mockRejectedValueOnce(new Error("Antwort verloren"));
    await expect(saveConsent(PLATFORM_CONSENT, accepted)).rejects.toThrow();
    expect(readConsent()).toMatchObject({ preferences: NECESSARY_ONLY, withdrawalPending: true });
  });

  it("sperrt sofort während einer Anfrage und gibt erst die bestätigte Auswahl frei", async () => {
    let respond!: (response: Response) => void;
    vi.mocked(apiRequest).mockImplementationOnce(() => new Promise(resolve => { respond = resolve; }));
    const saving = saveConsent(PLATFORM_CONSENT, accepted);
    expect(readConsent()).toMatchObject({ preferences: NECESSARY_ONLY, withdrawalPending: true });
    respond(new Response(JSON.stringify({ marketing: true, version: MARKETING_CONSENT_VERSION, expiresAt: new Date(Date.now() + CONSENT_MAX_AGE_MS).toISOString() })));
    await saving;
    expect(readConsent()).toMatchObject({ preferences: accepted });
    expect(readConsent()?.withdrawalPending).toBeUndefined();
  });

  it("akzeptiert keine Serverbestätigung mit ungültigem Ablaufdatum", async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce(new Response(JSON.stringify({ marketing: true, version: MARKETING_CONSENT_VERSION, expiresAt: "kaputt" })));
    await expect(saveConsent(PLATFORM_CONSENT, accepted)).rejects.toThrow("Einwilligungszeitraum");
    expect(readConsent()).toMatchObject({ preferences: NECESSARY_ONLY, withdrawalPending: true });
  });

  it("übernimmt weder Plattform- noch fremde Funnel-Zustimmungen oder veränderte Empfänger", async () => {
    const configuration = { uuid: "customer-a", datenschutzUrl: "https://example.com/privacy", metaPixelId: "123" };
    const scope = funnelConsentScope(configuration);
    await saveConsent(scope, accepted);
    expect(readConsent(scope)?.preferences.marketing).toBe(true);
    expect(readConsent()).toBeNull();
    expect(readConsent(funnelConsentScope({ ...configuration, uuid: "customer-b" }))).toBeNull();
    expect(readConsent(funnelConsentScope({ ...configuration, metaPixelId: "456" }))).toBeNull();
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("gibt trotz fehlerhaft gespeicherter Freigabe bei ausstehendem Widerruf nichts frei", () => {
    localStorage.setItem(consentStorageKey(PLATFORM_CONSENT), JSON.stringify({
      version: MARKETING_CONSENT_VERSION, expiresAt: Date.now() + CONSENT_MAX_AGE_MS,
      preferences: accepted, withdrawalPending: true,
    }));
    expect(readConsent()?.preferences).toEqual(NECESSARY_ONLY);
  });
});
