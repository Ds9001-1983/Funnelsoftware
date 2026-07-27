import { describe, it, expect } from "vitest";
import {
  funnelSchema,
  isSafeWebhookUrl,
  registerSchema,
  trackEventSchema,
  PASSWORD_MIN_LENGTH,
} from "./schema";

const partialFunnel = funnelSchema.partial();

describe("isSafeWebhookUrl", () => {
  it("erlaubt öffentliche https-URLs", () => {
    expect(isSafeWebhookUrl("https://hooks.zapier.com/hooks/catch/123/abc")).toBe(true);
    expect(isSafeWebhookUrl("http://example.com/webhook")).toBe(true);
  });

  it("lehnt interne und private Ziele ab (SSRF)", () => {
    expect(isSafeWebhookUrl("http://localhost:5000/api")).toBe(false);
    expect(isSafeWebhookUrl("http://127.0.0.1/admin")).toBe(false);
    expect(isSafeWebhookUrl("http://10.0.0.5/internal")).toBe(false);
    expect(isSafeWebhookUrl("http://192.168.1.1/")).toBe(false);
    expect(isSafeWebhookUrl("http://172.16.0.1/")).toBe(false);
    expect(isSafeWebhookUrl("http://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isSafeWebhookUrl("http://intranet/")).toBe(false);
    expect(isSafeWebhookUrl("http://[::1]/")).toBe(false);
    expect(isSafeWebhookUrl("http://server.local/")).toBe(false);
  });

  it("lehnt Nicht-HTTP-Protokolle und kaputte URLs ab", () => {
    expect(isSafeWebhookUrl("ftp://example.com/")).toBe(false);
    expect(isSafeWebhookUrl("file:///etc/passwd")).toBe(false);
    expect(isSafeWebhookUrl("nicht-mal-eine-url")).toBe(false);
  });
});

describe("funnelSchema Integrations-Validierung", () => {
  it("akzeptiert gültige gtmId und leere Werte", () => {
    expect(partialFunnel.safeParse({ gtmId: "GTM-ABC1234" }).success).toBe(true);
    expect(partialFunnel.safeParse({ gtmId: null }).success).toBe(true);
    expect(partialFunnel.safeParse({ gtmId: "" }).success).toBe(true);
  });

  it("lehnt Script-Injection über gtmId ab", () => {
    expect(partialFunnel.safeParse({ gtmId: "x');alert(1);//" }).success).toBe(false);
    expect(partialFunnel.safeParse({ gtmId: "GTM-abc" }).success).toBe(false);
    expect(partialFunnel.safeParse({ gtmId: "GTMX-1234" }).success).toBe(false);
  });

  it("validiert webhookUrl gegen SSRF", () => {
    expect(partialFunnel.safeParse({ webhookUrl: "https://crm.example.com/hook" }).success).toBe(true);
    expect(partialFunnel.safeParse({ webhookUrl: null }).success).toBe(true);
    expect(partialFunnel.safeParse({ webhookUrl: "http://localhost/x" }).success).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = { email: "max@example.com", password: "a".repeat(PASSWORD_MIN_LENGTH) };

  it("akzeptiert E-Mail + Passwort ohne Benutzernamen", () => {
    // Der Benutzername war ein Pflichtfeld ohne Gegenwert — der Server leitet
    // ihn jetzt aus der E-Mail ab.
    const r = registerSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.username).toBeUndefined();
  });

  it("akzeptiert einen mitgeschickten Benutzernamen weiterhin", () => {
    expect(registerSchema.safeParse({ ...valid, username: "max" }).success).toBe(true);
    expect(registerSchema.safeParse({ ...valid, username: "ab" }).success).toBe(false);
  });

  it("verlangt Länge statt Zeichenklassen", () => {
    // Keine Kompositionsregeln mehr (NIST SP 800-63B): eine lange Passphrase
    // ohne Großbuchstabe und Zahl ist gültig, ein kurzes "Aa1..." nicht.
    expect(registerSchema.safeParse({ ...valid, password: "pferd zaun tisch" }).success).toBe(true);
    expect(registerSchema.safeParse({ ...valid, password: "Sommer26" }).success).toBe(false);
  });
});

describe("trackEventSchema", () => {
  it("nimmt Browser-Ereignisse mit Label an", () => {
    const r = trackEventSchema.safeParse({ path: "/", eventType: "cta_click", label: "hero" });
    expect(r.success).toBe(true);
  });

  it("verwirft serverseitige Conversion-Ereignisse vom Client", () => {
    expect(trackEventSchema.safeParse({ path: "/register", eventType: "register" }).success).toBe(false);
    expect(trackEventSchema.safeParse({ path: "/register", eventType: "purchase" }).success).toBe(false);
  });

  it("fällt ohne eventType auf pageview zurück", () => {
    const r = trackEventSchema.safeParse({ path: "/" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.eventType).toBe("pageview");
  });
});
