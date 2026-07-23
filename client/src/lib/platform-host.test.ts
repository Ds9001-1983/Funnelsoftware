// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { isPlatformHost } from "./platform-host";

describe("isPlatformHost", () => {
  it("erkennt unsere eigenen Hosts", () => {
    expect(isPlatformHost("trichterwerk.de")).toBe(true);
    expect(isPlatformHost("www.trichterwerk.de")).toBe(true);
  });

  it("erkennt lokale Entwicklungs-Hosts", () => {
    expect(isPlatformHost("localhost")).toBe(true);
    expect(isPlatformHost("127.0.0.1")).toBe(true);
  });

  it("weist Custom-Domains von Kunden ab", () => {
    // Der entscheidende Fall: Auf diesen Domains liegt ein veröffentlichter
    // Kundenfunnel. Unser Tracking darf dort nicht anspringen.
    expect(isPlatformHost("funnel.kunde.de")).toBe(false);
    expect(isPlatformHost("landing.beispiel-gmbh.com")).toBe(false);
  });

  it("lässt sich nicht durch Groß-/Kleinschreibung oder Leerzeichen austricksen", () => {
    expect(isPlatformHost("TRICHTERWERK.DE")).toBe(true);
    expect(isPlatformHost("  trichterwerk.de  ")).toBe(true);
  });

  it("fällt bei Subdomains und ähnlich aussehenden Domains nicht um", () => {
    // Nur exakte Treffer zählen — sonst würde eine vom Kunden kontrollierte
    // Domain wie "trichterwerk.de.kunde.com" als unsere durchgehen.
    expect(isPlatformHost("trichterwerk.de.kunde.com")).toBe(false);
    expect(isPlatformHost("nicht-trichterwerk.de")).toBe(false);
    expect(isPlatformHost("app.trichterwerk.de")).toBe(false);
  });

  it("liest ohne Argument den aktuellen Host (jsdom: localhost)", () => {
    expect(isPlatformHost()).toBe(true);
  });
});
