// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";

const mocks = vi.hoisted(() => ({ host: { isPlatform: true } }));

vi.mock("@/lib/platform-host", () => ({
  isPlatformHost: () => mocks.host.isPlatform,
}));

import { trackPageview } from "./platform-tracker";

describe("trackPageview", () => {
  let beacon: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mocks.host.isPlatform = true;
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
