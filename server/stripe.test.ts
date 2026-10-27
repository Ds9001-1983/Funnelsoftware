// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({ listSessions: vi.fn(), expire: vi.fn(), listSubscriptions: vi.fn(), cancel: vi.fn() }));
vi.mock("stripe", () => ({ default: class {
  checkout = { sessions: { list: mock.listSessions, expire: mock.expire } };
  subscriptions = { list: mock.listSubscriptions, cancel: mock.cancel };
} }));
async function* items(values: object[]) { for (const value of values) yield value; }
async function configured() {
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_synthetic");
  vi.resetModules();
  return import("./stripe");
}
afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });
describe("account billing closure", () => {
  it("expires every open checkout before cancelling all live subscription statuses across pages", async () => {
    const events: string[] = [];
    mock.listSessions.mockImplementation(({ status }) => items(status === "open" ? Array.from({ length: 101 }, (_, id) => ({ id: `cs_${id}` })) : [{ mode: "subscription", subscription: "sub_paid" }]));
    mock.expire.mockImplementation(async id => { events.push(`expire:${id}`); });
    mock.listSubscriptions.mockImplementation(() => items(["active", "trialing", "past_due", "incomplete", "unpaid", "paused", "canceled", "incomplete_expired"].map(status => ({ id: status, status }))));
    mock.cancel.mockImplementation(async id => { events.push(`cancel:${id}`); });
    await (await configured()).closeAccountBilling("cus_synthetic");
    expect(mock.expire).toHaveBeenCalledTimes(101);
    expect(events.slice(101)).toEqual(["cancel:active", "cancel:trialing", "cancel:past_due", "cancel:incomplete", "cancel:unpaid", "cancel:paused"]);
    expect(mock.listSubscriptions).toHaveBeenCalledWith({ customer: "cus_synthetic", status: "all", limit: 100 }, { timeout: 15000, maxNetworkRetries: 0 });
  });
  it("keeps an unsettled completed checkout pending", async () => {
    mock.listSessions.mockImplementation(({ status }) => items(status === "complete" ? [{ mode: "subscription", subscription: null }] : []));
    await expect((await configured()).closeAccountBilling("cus_synthetic")).rejects.toThrow("noch verarbeitet");
    expect(mock.listSubscriptions).not.toHaveBeenCalled();
  });
  it("propagates expiration and cancellation failures for a later retry", async () => {
    const api = await configured();
    mock.listSessions.mockImplementation(({ status }) => items(status === "open" ? [{ id: "cs_open" }] : []));
    mock.expire.mockRejectedValueOnce(new Error("temporarily unavailable"));
    await expect(api.closeAccountBilling("cus_synthetic")).rejects.toThrow("temporarily unavailable");
    expect(mock.listSubscriptions).not.toHaveBeenCalled();
    mock.listSubscriptions.mockImplementation(() => items([{ id: "sub_active", status: "active" }]));
    mock.cancel.mockRejectedValue(new Error("cancel unavailable"));
    await expect(api.closeAccountBilling("cus_synthetic")).rejects.toThrow("cancel unavailable");
  });
  it("fails closed without Stripe configuration", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", ""); vi.resetModules();
    await expect((await import("./stripe")).closeAccountBilling("cus_synthetic")).rejects.toThrow("nicht konfiguriert");
  });
});
