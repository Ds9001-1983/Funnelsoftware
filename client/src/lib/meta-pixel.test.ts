// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { injectMetaPixel, fbqTrack } from "./meta-pixel";

/** Queue-Einträge sind arguments-Objekte — für Assertions in Arrays wandeln. */
function queuedCalls(): unknown[][] {
  return (window.fbq?.queue ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>));
}

describe("meta-pixel", () => {
  beforeEach(() => {
    delete window.fbq;
    delete window._fbq;
    document.getElementById("meta-pixel-script")?.remove();
  });

  it("fbqTrack ist ohne geladenes Pixel ein No-op (kein Consent → kein Fehler)", () => {
    expect(() => fbqTrack("PageView")).not.toThrow();
    expect(window.fbq).toBeUndefined();
  });

  it("injectMetaPixel erstellt Stub + Script und queued init/PageView", () => {
    injectMetaPixel("1234567890123456");

    expect(window.fbq).toBeTypeOf("function");
    expect(document.getElementById("meta-pixel-script")).toBeTruthy();
    expect(
      (document.getElementById("meta-pixel-script") as HTMLScriptElement).src,
    ).toContain("connect.facebook.net");

    const calls = queuedCalls();
    expect(calls).toContainEqual(["init", "1234567890123456"]);
    expect(calls).toContainEqual(["track", "PageView"]);
  });

  it("fbqTrack queued Events mit und ohne eventID", () => {
    injectMetaPixel("1234567890123456");
    fbqTrack("PageView");
    fbqTrack("Lead", {}, { eventID: "lead-uuid-1" });

    const calls = queuedCalls();
    expect(calls).toContainEqual(["track", "PageView"]);
    expect(calls).toContainEqual(["track", "Lead", {}, { eventID: "lead-uuid-1" }]);
  });

  it("doppeltes injectMetaPixel initialisiert dieselbe Pixel-ID nicht erneut", () => {
    injectMetaPixel("9999888877776666");
    const initCountBefore = queuedCalls().filter((c) => c[0] === "init").length;
    injectMetaPixel("9999888877776666");
    const initCountAfter = queuedCalls().filter((c) => c[0] === "init").length;

    expect(initCountAfter).toBe(initCountBefore);
    // Auch das Script-Element bleibt einmalig.
    expect(document.querySelectorAll("#meta-pixel-script")).toHaveLength(1);
  });

  it("Cleanup entfernt das Script-Element", () => {
    const cleanup = injectMetaPixel("1234567890123456");
    expect(document.getElementById("meta-pixel-script")).toBeTruthy();
    cleanup();
    expect(document.getElementById("meta-pixel-script")).toBeNull();
  });
});
