import { describe, it, expect } from "vitest";
import type { Request } from "express";
import { extractCapiRequestContext } from "./capi";

/** Minimaler Request-Stub — nur die Felder, die der Extractor liest. */
function makeRequest(opts: {
  headers?: Record<string, string | string[] | undefined>;
  remoteAddress?: string;
}): Request {
  return {
    headers: opts.headers ?? {},
    socket: { remoteAddress: opts.remoteAddress },
  } as unknown as Request;
}

describe("extractCapiRequestContext", () => {
  it("nimmt die erste IP aus x-forwarded-for statt der Proxy-IP", () => {
    // Hinter nginx ist remoteAddress immer der Proxy — würde er gewinnen,
    // bekäme Meta für jeden Besucher dieselbe IP.
    const ctx = extractCapiRequestContext(
      makeRequest({
        headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
        remoteAddress: "127.0.0.1",
      }),
    );
    expect(ctx.clientIpAddress).toBe("203.0.113.7");
  });

  it("fällt ohne x-forwarded-for auf die Socket-IP zurück", () => {
    const ctx = extractCapiRequestContext(makeRequest({ remoteAddress: "198.51.100.4" }));
    expect(ctx.clientIpAddress).toBe("198.51.100.4");
  });

  it("liest _fbc und _fbp aus dem Cookie-Header", () => {
    const ctx = extractCapiRequestContext(
      makeRequest({
        headers: {
          cookie: "session=abc; _fbc=fb.1.1700000000.AbCdEf; _fbp=fb.1.1700000000.987654321",
        },
      }),
    );
    expect(ctx.fbc).toBe("fb.1.1700000000.AbCdEf");
    expect(ctx.fbp).toBe("fb.1.1700000000.987654321");
  });

  it("behält Gleichheitszeichen im Cookie-Wert", () => {
    // Base64-artige Werte enthalten '=' als Padding — ein naives split("=")
    // würde sie abschneiden und das Matching bei Meta zerstören.
    const ctx = extractCapiRequestContext(
      makeRequest({ headers: { cookie: "_fbp=a=b=c" } }),
    );
    expect(ctx.fbp).toBe("a=b=c");
  });

  it("übernimmt den User-Agent", () => {
    const ctx = extractCapiRequestContext(
      makeRequest({ headers: { "user-agent": "Mozilla/5.0 (Test)" } }),
    );
    expect(ctx.clientUserAgent).toBe("Mozilla/5.0 (Test)");
  });

  it("liefert undefined statt leerer Strings, wenn nichts da ist", () => {
    const ctx = extractCapiRequestContext(makeRequest({}));
    expect(ctx.clientIpAddress).toBeUndefined();
    expect(ctx.clientUserAgent).toBeUndefined();
    expect(ctx.fbc).toBeUndefined();
    expect(ctx.fbp).toBeUndefined();
  });
});
