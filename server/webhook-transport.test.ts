// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventEmitter } from "node:events";
import { createHmac } from "node:crypto";
const mocks = vi.hoisted(() => ({ lookup: vi.fn(), request: vi.fn() }));
vi.mock("node:dns/promises", () => ({ lookup: mocks.lookup }));
vi.mock("node:https", () => ({ default: { request: mocks.request } }));
import { classifyWebhookStatus, deliverWebhook, publicWebhookAddress, webhookHeaders } from "./webhook-transport";
const request = { url: "https://hooks.example.com/event", body: '{"event_id":"stable"}', eventId: "stable", secret: "test-secret" };
beforeEach(() => { vi.clearAllMocks(); mocks.lookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]); });
describe("webhook transport", () => {
  it.each(["127.0.0.1", "10.1.2.3", "172.17.1.1", "192.168.1.5", "169.254.169.254", "100.64.1.1", "0.0.0.0", "224.0.0.1", "::1", "::ffff:127.0.0.1", "fd00::1", "fe80::1", "2001:db8::1", "2002:7f00:1::"]) ("rejects nonpublic address %s", address => { expect(publicWebhookAddress(address)).toBe(false); });
  it("allows public v4 and v6", () => { expect(publicWebhookAddress("93.184.216.34")).toBe(true); expect(publicWebhookAddress("2606:4700::1111")).toBe(true); });
  it("signs the exact persisted body and includes a stable idempotency key", () => {
    expect(webhookHeaders(request)).toMatchObject({ "Idempotency-Key": "stable", "X-Trichterwerk-Event-Id": "stable", "X-Trichterwerk-Signature": `sha256=${createHmac("sha256", "test-secret").update(request.body).digest("hex")}` });
  });
  it("retries only transient HTTP failures", () => {
    expect([200, 204].map(code => classifyWebhookStatus(code).kind)).toEqual(["delivered", "delivered"]);
    expect([408, 429, 500, 503].every(code => classifyWebhookStatus(code).kind === "retry")).toBe(true);
    expect([301, 307, 400, 401, 404, 410].every(code => classifyWebhookStatus(code).kind === "failed")).toBe(true);
  });
  it("rejects mixed public/private DNS answers without making a request", async () => {
    mocks.lookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }, { address: "127.0.0.1", family: 4 }]);
    expect(await deliverWebhook(request)).toMatchObject({ kind: "failed", errorCode: "unsafe_destination" }); expect(mocks.request).not.toHaveBeenCalled();
  });
  it("pins the validated IP, preserves the TLS/Host name and never follows redirects", async () => {
    const outgoing = Object.assign(new EventEmitter(), { end: vi.fn(() => queueMicrotask(() => mocks.request.mock.calls[0][1]({ statusCode: 302, destroy: vi.fn() }))), destroy: vi.fn() });
    mocks.request.mockReturnValue(outgoing);
    expect(await deliverWebhook(request)).toEqual({ kind: "failed", statusCode: 302, errorCode: "redirect_rejected" });
    expect(mocks.request).toHaveBeenCalledOnce();
    expect(mocks.request.mock.calls[0][0]).toMatchObject({ hostname: "93.184.216.34", servername: "hooks.example.com", headers: { Host: "hooks.example.com" }, path: "/event" });
    expect(outgoing.end).toHaveBeenCalledWith(request.body);
  });
  it("makes DNS failures retryable", async () => { mocks.lookup.mockRejectedValue(new Error("DNS")); expect(await deliverWebhook(request)).toMatchObject({ kind: "retry", errorCode: "dns_unavailable" }); });
});
