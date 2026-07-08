/**
 * Browser-Meta-Pixel (fbevents.js) für veröffentlichte Funnels — die
 * Client-Hälfte zum server-seitigen CAPI-Tracking (server/capi.ts).
 *
 * DSGVO: Der Aufrufer (public-funnel.tsx) lädt das Pixel ausschließlich nach
 * Marketing-Consent. `fbqTrack` ist ohne geladenes Pixel ein No-op, sodass
 * Tracking-Aufrufe im Code keinen Consent-Check brauchen.
 *
 * Deduplizierung: Das Lead-Event feuert mit eventID = Lead-UUID — dieselbe
 * event_id, die der Server als CAPI-eventId sendet. Meta verrechnet beide
 * Events zu einem (Browser- und Server-Event ergänzen sich).
 */

type FbqStub = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: FbqStub;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: FbqStub;
    _fbq?: FbqStub;
  }
}

const SCRIPT_ID = "meta-pixel-script";
/** Bereits initialisierte Pixel-IDs — doppeltes fbq('init') erzeugt
 *  Warnungen und doppelte PageViews. */
const initializedPixels = new Set<string>();

/**
 * Lädt fbevents.js (Standard-Stub-Snippet) und feuert init + PageView.
 * Gibt eine Cleanup-Funktion zurück, die das Script-Element entfernt —
 * ein geladenes Pixel lässt sich nicht sauber entladen; beim Consent-Widerruf
 * führt resetCookieConsent() ohnehin einen Reload aus (wie beim GTM-Effekt).
 */
export function injectMetaPixel(pixelId: string): () => void {
  if (!window.fbq) {
    const stub = function (this: unknown) {
      if (stub.callMethod) {
        // eslint-disable-next-line prefer-rest-params
        stub.callMethod.apply(stub, arguments as unknown as unknown[]);
      } else {
        // eslint-disable-next-line prefer-rest-params
        stub.queue.push(arguments);
      }
    } as FbqStub;
    stub.push = stub;
    stub.loaded = true;
    stub.version = "2.0";
    stub.queue = [];
    window.fbq = stub;
    if (!window._fbq) window._fbq = stub;
  }

  if (!initializedPixels.has(pixelId)) {
    initializedPixels.add(pixelId);
    window.fbq("init", pixelId);
    window.fbq("track", "PageView");
  }

  if (!document.getElementById(SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }

  return () => {
    document.getElementById(SCRIPT_ID)?.remove();
  };
}

/**
 * Feuert ein Standard-Event (PageView, Lead, …). No-op, solange kein Pixel
 * geladen ist (kein Consent / keine Pixel-ID) — der Stub puffert Events, die
 * vor dem fbevents.js-Load ankommen.
 */
export function fbqTrack(
  event: string,
  params?: Record<string, unknown>,
  options?: { eventID?: string },
): void {
  if (typeof window === "undefined" || !window.fbq) return;
  if (options?.eventID) {
    window.fbq("track", event, params ?? {}, options);
  } else if (params) {
    window.fbq("track", event, params);
  } else {
    window.fbq("track", event);
  }
}
