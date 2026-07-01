import { describe, it, expect } from "vitest";
import {
  dailyVisitorHash,
  deriveReferrerHost,
  deriveDeviceClass,
  deriveCountry,
  isTrackablePath,
} from "./tracking";

const DAY1 = new Date("2026-07-01T10:00:00Z");
const DAY2 = new Date("2026-07-02T10:00:00Z");

describe("dailyVisitorHash", () => {
  it("ist deterministisch für gleiche Eingaben am selben Tag", () => {
    expect(dailyVisitorHash("1.2.3.4", "UA", DAY1)).toBe(dailyVisitorHash("1.2.3.4", "UA", DAY1));
  });

  it("liefert einen 64-stelligen Hex-Hash (SHA-256) und nie die Roh-IP", () => {
    const h = dailyVisitorHash("1.2.3.4", "UA", DAY1);
    expect(h).toMatch(/^[a-f0-9]{64}$/);
    expect(h).not.toContain("1.2.3.4");
  });

  it("unterscheidet verschiedene IPs", () => {
    expect(dailyVisitorHash("1.2.3.4", "UA", DAY1)).not.toBe(dailyVisitorHash("5.6.7.8", "UA", DAY1));
  });

  it("rotiert täglich (gleiche IP, anderer Tag → anderer Hash)", () => {
    expect(dailyVisitorHash("1.2.3.4", "UA", DAY1)).not.toBe(dailyVisitorHash("1.2.3.4", "UA", DAY2));
  });
});

describe("deriveReferrerHost", () => {
  it("extrahiert nur den Host, nie die volle URL", () => {
    expect(deriveReferrerHost("https://www.google.com/search?q=geheim")).toBe("www.google.com");
  });
  it("gibt null bei fehlendem/ungültigem Referrer zurück", () => {
    expect(deriveReferrerHost(null)).toBeNull();
    expect(deriveReferrerHost("kein-url")).toBeNull();
  });
});

describe("deriveDeviceClass", () => {
  it("erkennt mobil", () => {
    expect(deriveDeviceClass("Mozilla/5.0 (iPhone; ...) Mobile")).toBe("mobile");
    expect(deriveDeviceClass("Mozilla/5.0 (Linux; Android 13; ...) Mobile Safari")).toBe("mobile");
  });
  it("erkennt tablet", () => {
    expect(deriveDeviceClass("Mozilla/5.0 (iPad; ...)")).toBe("tablet");
    expect(deriveDeviceClass("Mozilla/5.0 (Linux; Android 13; SM-Tablet) Safari")).toBe("tablet");
  });
  it("fällt auf desktop zurück", () => {
    expect(deriveDeviceClass("Mozilla/5.0 (Windows NT 10.0) Chrome")).toBe("desktop");
    expect(deriveDeviceClass("")).toBe("desktop");
  });
});

describe("deriveCountry", () => {
  it("bevorzugt den CF-IPCountry-Header", () => {
    expect(deriveCountry({ "cf-ipcountry": "DE" })).toBe("DE");
  });
  it("fällt auf Accept-Language zurück", () => {
    expect(deriveCountry({ "accept-language": "de-DE,de;q=0.9" })).toBe("DE");
  });
  it("gibt null zurück, wenn nichts ableitbar ist", () => {
    expect(deriveCountry({})).toBeNull();
    expect(deriveCountry({ "cf-ipcountry": "XX" })).toBeNull();
  });
});

describe("isTrackablePath", () => {
  it("akzeptiert Whitelist-Pfade und ignoriert Query/Trailing-Slash", () => {
    expect(isTrackablePath("/")).toBe(true);
    expect(isTrackablePath("/?utm_source=meta")).toBe(true);
    expect(isTrackablePath("/impressum/")).toBe(true);
    expect(isTrackablePath("/register")).toBe(true);
  });
  it("lehnt App-/Funnel-Pfade ab", () => {
    expect(isTrackablePath("/dashboard")).toBe(false);
    expect(isTrackablePath("/f/abc-123")).toBe(false);
    expect(isTrackablePath("/settings")).toBe(false);
  });
});
