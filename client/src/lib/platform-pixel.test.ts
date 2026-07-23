// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { TRICHTERWERK_PIXEL_ID } from "@shared/meta";

// vi.mock wird gehoistet — die Mocks müssen über vi.hoisted entstehen, sonst
// greift die Factory auf noch nicht initialisierte Konstanten zu.
const mocks = vi.hoisted(() => ({
  injectMetaPixel: vi.fn(),
  fbqTrack: vi.fn(),
  consent: { allowsMarketing: false },
}));

vi.mock("@/lib/meta-pixel", () => ({
  injectMetaPixel: mocks.injectMetaPixel,
  fbqTrack: mocks.fbqTrack,
}));

vi.mock("@/components/cookie-consent", () => ({
  useCookieConsent: () => ({ allowsMarketing: mocks.consent.allowsMarketing }),
}));

import { useTrichterwerkPixel } from "./platform-pixel";

function pageViewCount(): number {
  return mocks.fbqTrack.mock.calls.filter((c) => c[0] === "PageView").length;
}

describe("useTrichterwerkPixel", () => {
  beforeEach(() => {
    mocks.injectMetaPixel.mockClear();
    mocks.fbqTrack.mockClear();
    mocks.consent.allowsMarketing = false;
  });

  it("lädt ohne Marketing-Consent keinen Pixel", () => {
    renderHook(() => useTrichterwerkPixel("/", true));
    expect(mocks.injectMetaPixel).not.toHaveBeenCalled();
    expect(mocks.fbqTrack).not.toHaveBeenCalled();
  });

  it("lädt trotz Consent nichts, wenn die Route nicht freigegeben ist", () => {
    // Greift im eingeloggten App-Bereich: dort wird der Cookie-Banner gar nicht
    // gezeigt, und Nutzung der App ist keine Akquise.
    mocks.consent.allowsMarketing = true;
    renderHook(() => useTrichterwerkPixel("/dashboard", false));
    expect(mocks.injectMetaPixel).not.toHaveBeenCalled();
  });

  it("lädt den Pixel mit der Trichterwerk-ID, sobald Consent und Route passen", () => {
    mocks.consent.allowsMarketing = true;
    renderHook(() => useTrichterwerkPixel("/", true));
    expect(mocks.injectMetaPixel).toHaveBeenCalledTimes(1);
    expect(mocks.injectMetaPixel).toHaveBeenCalledWith(TRICHTERWERK_PIXEL_ID);
  });

  it("feuert für den Einstiegsaufruf kein zweites PageView", () => {
    // injectMetaPixel sendet init + PageView bereits selbst.
    mocks.consent.allowsMarketing = true;
    renderHook(() => useTrichterwerkPixel("/", true));
    expect(pageViewCount()).toBe(0);
  });

  it("meldet jeden Routenwechsel als PageView", () => {
    mocks.consent.allowsMarketing = true;
    const { rerender } = renderHook(
      ({ loc }) => useTrichterwerkPixel(loc, true),
      { initialProps: { loc: "/" } },
    );
    expect(pageViewCount()).toBe(0);

    rerender({ loc: "/vorlagen" });
    expect(pageViewCount()).toBe(1);

    rerender({ loc: "/register" });
    expect(pageViewCount()).toBe(2);
  });

  it("lädt den Pixel nur einmal, auch über mehrere Navigationen", () => {
    mocks.consent.allowsMarketing = true;
    const { rerender } = renderHook(
      ({ loc }) => useTrichterwerkPixel(loc, true),
      { initialProps: { loc: "/" } },
    );
    rerender({ loc: "/vorlagen" });
    rerender({ loc: "/register" });
    expect(mocks.injectMetaPixel).toHaveBeenCalledTimes(1);
  });

  it("startet sauber, wenn der Consent erst nachträglich erteilt wird", () => {
    // Besucher klickt den Banner erst auf der Seite weg — dann darf genau ein
    // Ladevorgang und kein doppeltes PageView entstehen.
    const { rerender } = renderHook(({ loc }) => useTrichterwerkPixel(loc, true), {
      initialProps: { loc: "/" },
    });
    expect(mocks.injectMetaPixel).not.toHaveBeenCalled();

    mocks.consent.allowsMarketing = true;
    rerender({ loc: "/" });

    expect(mocks.injectMetaPixel).toHaveBeenCalledTimes(1);
    expect(pageViewCount()).toBe(0);

    rerender({ loc: "/register" });
    expect(pageViewCount()).toBe(1);
  });
});
