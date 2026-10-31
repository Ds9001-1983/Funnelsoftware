// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";

const mocks = vi.hoisted(() => ({ host: { isPlatform: true } }));

vi.mock("@/lib/platform-host", () => ({
  isPlatformHost: () => mocks.host.isPlatform,
}));

import { setPlatformOptOut } from "./platform-privacy";
import { trackPageview } from "./platform-tracker";

describe("trackPageview", () => {
  let beacon: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mocks.host.isPlatform = true;
    setPlatformOptOut(false);
    Object.defineProperty(navigator, "doNotTrack", { value: "0", configurable: true });
    Object.defineProperty(navigator, "globalPrivacyControl", { value: false, configurable: true });
    beacon = vi.fn(() => true);
    Object.defineProperty(navigator, "sendBeacon", {
      value: beacon,
      configurable: true,
      writable: true,
    });
  });

  it("meldet getrackte Marketing-Seiten", () => {
    trackPageview("/");
    expect(beacon).toHaveBeenCalledTimes(1);
    expect(beacon.mock.calls[0][0]).toBe("/api/public/track");
  });

  it("meldet Seiten außerhalb der Whitelist nicht", () => {
    trackPageview("/dashboard");
    expect(beacon).not.toHaveBeenCalled();
  });

  it("meldet Kundenfunnels nicht", () => {
    trackPageview("/f/mein-funnel");
    expect(beacon).not.toHaveBeenCalled();
  });

  it("meldet auf der Custom-Domain eines Kunden gar nichts", () => {
    // Dort bootet die App unter "/" — einer getrackten Route — bevor der Host
    // aufgelöst und nach "/f/…" umgeleitet wird. Ohne die Host-Sperre landeten
    // die Besucher des Kunden in unserer Reichweitenstatistik.
    mocks.host.isPlatform = false;
    trackPageview("/");
    expect(beacon).not.toHaveBeenCalled();
  });
});


describe("measurement objections", () => {
  beforeEach(() => { mocks.host.isPlatform = true; });
  it("stops all page events immediately and resumes only after explicit withdrawal", () => {
    const beacon = vi.fn();
    Object.defineProperty(navigator, "sendBeacon", { value: beacon, configurable: true });
    setPlatformOptOut(true);
    trackPageview("/"); expect(beacon).not.toHaveBeenCalled();
    setPlatformOptOut(false);
    trackPageview("/"); expect(beacon).toHaveBeenCalledOnce();
  });
  it("honors browser privacy signals without writing a cookie", () => {
    const beacon = vi.fn();
    Object.defineProperty(navigator, "sendBeacon", { value: beacon, configurable: true });
    setPlatformOptOut(false);
    Object.defineProperty(navigator, "doNotTrack", { value: "1", configurable: true });
    trackPageview("/"); expect(beacon).not.toHaveBeenCalled();
    Object.defineProperty(navigator, "doNotTrack", { value: "0", configurable: true });
    Object.defineProperty(navigator, "globalPrivacyControl", { value: true, configurable: true });
    trackPageview("/"); expect(beacon).not.toHaveBeenCalled();
    expect(document.cookie).not.toContain("tw_platform_optout");
    Object.defineProperty(navigator, "globalPrivacyControl", { value: false, configurable: true });
  });
});
