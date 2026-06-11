import { describe, it, expect } from "vitest";
import { funnelSchema, isSafeWebhookUrl } from "./schema";

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
