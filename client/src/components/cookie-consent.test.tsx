import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, renderHook, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CookieConsent, useCookieConsent } from "./cookie-consent";
import { apiRequest } from "@/lib/queryClient";
import { PLATFORM_CONSENT, consentStorageKey, readConsent, invalidateConsentStatus, funnelConsentScope } from "@/lib/consent-store";
import { MARKETING_CONSENT_VERSION, CONSENT_MAX_AGE_MS } from "@shared/privacy-consent";
vi.mock("@/lib/queryClient", () => ({ apiRequest: vi.fn() }));

/**
 * Diese Tests sichern die Ursache eines konkreten Ausfalls ab.
 *
 * Der Banner war ein Vollbild-Overlay (`fixed inset-0` mit `bg-black/50
 * backdrop-blur-sm`), das 1 Sekunde nach dem Laden erschien und keinen Weg zum
 * Wegklicken hatte. Auf dem Handy — wo ~95 % des Anzeigen-Traffics landet —
 * verdeckte es die komplette Landingpage. Von 175 Besuchern aus der
 * Meta-Kampagne erreichten 2 die Registrierung.
 *
 * Wenn also jemand `inset-0` oder einen gefüllten Accept-Button zurückbringt,
 * soll hier etwas rot werden.
 */

vi.mock("@/lib/platform-tracker", () => ({
  trackPlatformEvent: vi.fn(),
}));

const BANNER_DELAY_MS = 2500;

/** Der Hinweis, unabhängig von seinem Text — die Region ist der stabile Anker. */
const banner = () => screen.queryByRole("region", { name: /Cookies/i });

/** Rendert den Banner und lässt die Einblend-Verzögerung ablaufen. */
async function renderBanner() {
  const view = render(<CookieConsent />);
  await act(async () => {
    vi.advanceTimersByTime(BANNER_DELAY_MS);
  });
  return view;
}

describe("CookieConsent", () => {
  beforeEach(() => {
    localStorage.clear();
    invalidateConsentStatus();
    vi.mocked(apiRequest).mockImplementation(async (_method, _url, data) => ({ json: async () => ({ marketing: (data as any).marketing, version: MARKETING_CONSENT_VERSION, expiresAt: new Date(Date.now() + CONSENT_MAX_AGE_MS).toISOString() }) }) as Response);
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("erscheint erst nach der Verzögerung", async () => {
    render(<CookieConsent />);
    expect(banner()).not.toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(BANNER_DELAY_MS);
    });
    expect(banner()).toBeInTheDocument();
  });

  it("verdeckt die Seite NICHT — kein Vollbild-Overlay", async () => {
    await renderBanner();

    const region = screen.getByRole("region", { name: /Cookies/i });
    // Der eigentliche Regressionsschutz:
    expect(region.className).not.toContain("inset-0");
    expect(region.className).not.toContain("bg-black/50");
    expect(region.className).not.toContain("backdrop-blur");
    // Unten angedockt und für Klicks daneben durchlässig.
    expect(region.className).toContain("bottom-0");
    expect(region.className).toContain("pointer-events-none");
  });

  it("ist nicht modal — bewusst keine dialog-Rolle, kein Focus-Trap", async () => {
    await renderBanner();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lässt sich per X schließen und wertet das als Ablehnung", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderBanner();

    await user.click(screen.getByTestId("cookie-consent-close"));

    expect(banner()).not.toBeInTheDocument();
    // Wegklicken muss zum datenschutzfreundlichen Ergebnis führen, sonst wäre
    // es ein Dark Pattern.
    expect(readConsent()!.preferences).toMatchObject({
      necessary: true,
      analytics: false,
      marketing: false,
    });
  });

  it("schließt auf Escape, ebenfalls als Ablehnung", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderBanner();

    await user.keyboard("{Escape}");

    expect(banner()).not.toBeInTheDocument();
    expect(readConsent()!.preferences.marketing).toBe(false);
  });

  it("gewichtet Zustimmen und Ablehnen optisch gleich", async () => {
    await renderBanner();

    const reject = screen.getByTestId("cookie-consent-reject");
    const accept = screen.getByTestId("cookie-consent-accept");
    // DSK-Orientierungshilfe: Ablehnen muss genauso einfach sein wie Zustimmen.
    // Vorher war Accept ein gefüllter Primary-Button (bg-purple-600).
    expect(accept.className).not.toContain("bg-purple-600");
    expect(accept.className).toBe(reject.className);
  });

  it("setzt Marketing nur bei 'Alle akzeptieren'", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderBanner();

    await user.click(screen.getByTestId("cookie-consent-accept"));

    expect(readConsent()!.preferences.marketing).toBe(true);
  });

  it("erscheint nicht erneut, wenn schon entschieden wurde", async () => {
    localStorage.setItem(consentStorageKey(PLATFORM_CONSENT), JSON.stringify({
      version: MARKETING_CONSENT_VERSION, expiresAt: Date.now() + CONSENT_MAX_AGE_MS,
      preferences: { necessary: true, analytics: false, marketing: false },
    }));

    await renderBanner();
    expect(banner()).not.toBeInTheDocument();
  });

  it("lädt Altzustimmungen und beschädigten Speicher nicht als Freigabe", async () => {
    localStorage.setItem("trichterwerk-cookie-preferences", JSON.stringify({ necessary: true, analytics: true, marketing: true }));
    localStorage.setItem(consentStorageKey(PLATFORM_CONSENT), "broken");
    await renderBanner();
    expect(banner()).toBeInTheDocument();
    expect(readConsent()).toBeNull();
  });

  it("gibt Marketing bei fehlgeschlagener Speicherung nicht frei", async () => {
    vi.mocked(apiRequest).mockRejectedValueOnce(new Error("offline"));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const view = await renderBanner();
    await user.click(screen.getByTestId("cookie-consent-accept"));
    expect(readConsent()?.preferences.marketing).toBe(false);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(banner()).toBeInTheDocument();
    view.unmount();
    await renderBanner();
    expect(screen.getByRole("alert")).toHaveTextContent("noch nicht bestätigt");
    expect(screen.getByRole("button", { name: "Widerruf erneut senden" })).toBeVisible();
  });

  it("beendet eine zeitlich abgelaufene Zustimmung auch im geöffneten Tab", async () => {
    const scope = funnelConsentScope({ uuid: "expiry-test" });
    localStorage.setItem(consentStorageKey(scope), JSON.stringify({
      version: scope.version, expiresAt: Date.now() + 1000,
      preferences: { necessary: true, analytics: true, marketing: true },
    }));
    const { result } = renderHook(() => useCookieConsent(scope));
    expect(result.current.allowsMarketing).toBe(true);
    await act(async () => { vi.advanceTimersByTime(1001); });
    expect(result.current.allowsMarketing).toBe(false);
    expect(result.current.allowsAnalytics).toBe(false);
  });

  it("liest nach Wiederherstellung aus dem Browsercache einen zwischenzeitlichen Widerruf neu", async () => {
    const scope = funnelConsentScope({ uuid: "restored-funnel" });
    const record = {
      version: scope.version, expiresAt: Date.now() + CONSENT_MAX_AGE_MS,
      preferences: { necessary: true, analytics: true, marketing: true },
    };
    localStorage.setItem(consentStorageKey(scope), JSON.stringify(record));
    const { result } = renderHook(() => useCookieConsent(scope));
    expect(result.current.allowsMarketing).toBe(true);

    // Ein eingefrorenes Dokument muss Änderungen anderer Tabs auch dann
    // berücksichtigen, wenn es dafür kein storage-/focus-Ereignis erhält.
    localStorage.setItem(consentStorageKey(scope), JSON.stringify({
      ...record, preferences: { necessary: true, analytics: false, marketing: false },
    }));
    await act(async () => {
      window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
    });
    expect(result.current.allowsMarketing).toBe(false);
    expect(result.current.allowsAnalytics).toBe(false);
  });

  it("prüft nach Browser-Wiederherstellung auch einen serverseitigen Kontowiderruf erneut", async () => {
    const expiresAt = Date.now() + CONSENT_MAX_AGE_MS;
    localStorage.setItem(consentStorageKey(PLATFORM_CONSENT), JSON.stringify({
      version: MARKETING_CONSENT_VERSION, expiresAt,
      preferences: { necessary: true, analytics: false, marketing: true },
    }));
    const fetchStatus = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ marketing: true, version: MARKETING_CONSENT_VERSION, expiresAt: new Date(expiresAt).toISOString() })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ marketing: false, version: MARKETING_CONSENT_VERSION, expiresAt: null })));
    vi.stubGlobal("fetch", fetchStatus);
    const { result } = renderHook(() => useCookieConsent());
    await waitFor(() => expect(result.current.allowsMarketing).toBe(true));

    await act(async () => {
      window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
    });
    await waitFor(() => expect(result.current.allowsMarketing).toBe(false));
    expect(fetchStatus).toHaveBeenCalledTimes(2);
  });

  it("reserviert Platz am Seitenende, statt Inhalt zu verdecken", async () => {
    // Auf /register verdeckte der Hinweis in der ersten Fassung alle drei
    // Eingabefelder. Das Body-Padding stellt sicher, dass jedes Feld frei
    // gescrollt werden kann.
    await renderBanner();
    expect(document.body.style.paddingBottom).not.toBe("");

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByTestId("cookie-consent-reject"));
    expect(document.body.style.paddingBottom).toBe("");
  });
});
