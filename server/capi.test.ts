import { describe, it, expect } from "vitest";
import type { Request } from "express";
import { extractCapiRequestContext, buildPurchaseEvent } from "./capi";

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

describe("buildPurchaseEvent", () => {
  const consentingUser = { email: "kunde@example.de", marketingConsent: true };

  it("rechnet die kleinste Währungseinheit in ganze Einheiten um", () => {
    // 4900 Cent sind 49 €. Ungeteilt gemeldet stünde in Meta ein Umsatz
    // vom Hundertfachen und der ROAS wäre wertlos.
    const draft = buildPurchaseEvent(
      { id: "in_123", amount_paid: 4900, currency: "eur" },
      consentingUser,
    );
    expect(draft?.customData).toEqual({ value: 49, currency: "EUR" });
  });

  it("nutzt die Rechnungs-ID als eventId (idempotent bei Webhook-Retries)", () => {
    const draft = buildPurchaseEvent(
      { id: "in_abc", amount_paid: 4900, currency: "eur" },
      consentingUser,
    );
    expect(draft?.eventId).toBe("in_abc");
  });

  it("meldet die 0-€-Rechnung des Trial-Starts nicht", () => {
    const draft = buildPurchaseEvent(
      { id: "in_trial", amount_paid: 0, currency: "eur" },
      consentingUser,
    );
    expect(draft).toBeNull();
  });

  it("sendet ohne Marketing-Einwilligung nichts", () => {
    const draft = buildPurchaseEvent(
      { id: "in_123", amount_paid: 4900, currency: "eur" },
      { email: "kunde@example.de", marketingConsent: false },
    );
    expect(draft).toBeNull();
  });

  it("sendet nichts, wenn zur Customer-ID kein Nutzer gefunden wurde", () => {
    expect(buildPurchaseEvent({ id: "in_123", amount_paid: 4900 }, null)).toBeNull();
    expect(buildPurchaseEvent({ id: "in_123", amount_paid: 4900 }, undefined)).toBeNull();
  });

  it("sendet nichts ohne Rechnungs-ID — sonst ginge die Deduplizierung verloren", () => {
    const draft = buildPurchaseEvent({ amount_paid: 4900, currency: "eur" }, consentingUser);
    expect(draft).toBeNull();
  });

  it("normalisiert die Währung auf Großbuchstaben und fällt auf EUR zurück", () => {
    expect(
      buildPurchaseEvent({ id: "in_1", amount_paid: 100, currency: "usd" }, consentingUser)
        ?.customData.currency,
    ).toBe("USD");
    expect(
      buildPurchaseEvent({ id: "in_2", amount_paid: 100 }, consentingUser)?.customData.currency,
    ).toBe("EUR");
  });

  it("ignoriert negative Beträge (Gutschriften)", () => {
    const draft = buildPurchaseEvent(
      { id: "in_credit", amount_paid: -4900, currency: "eur" },
      consentingUser,
    );
    expect(draft).toBeNull();
  });
});
