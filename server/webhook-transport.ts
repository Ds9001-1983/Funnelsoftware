import type { LookupAddress } from "node:dns";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import http from "node:http";
import https from "node:https";
import { checkServerIdentity } from "node:tls";
import { createHmac } from "node:crypto";
import { isSafeWebhookUrl } from "@shared/schema";

export interface DeliveryOutcome { kind: "delivered" | "retry" | "failed"; statusCode?: number; errorCode?: string }
export interface DeliveryRequest { url: string; body: string; secret: string | null; eventId: string }
export type WebhookTransport = (request: DeliveryRequest) => Promise<DeliveryOutcome>;
export function publicWebhookAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b, c] = address.split(".").map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127)
      || (a === 198 && (b === 18 || b === 19)) || (a === 192 && b === 0) || (a === 192 && b === 88 && c === 99)
      || (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113));
  }
  if (isIP(address) !== 6) return false;
  const [a, b] = address.toLowerCase().split(":").map(value => parseInt(value || "0", 16));
  // Global unicast only; exclude transition/documentation/special-use ranges.
  return a >= 0x2000 && a <= 0x3fff && a !== 0x2002 && !(a === 0x2001 && (b <= 0x1ff || b === 0xdb8)) && !(a === 0x3fff && b <= 0xfff);
}
export function classifyWebhookStatus(statusCode: number): DeliveryOutcome {
  return statusCode >= 200 && statusCode < 300 ? { kind: "delivered", statusCode }
    : { kind: statusCode >= 500 || statusCode === 408 || statusCode === 429 ? "retry" : "failed", statusCode, errorCode: statusCode >= 300 && statusCode < 400 ? "redirect_rejected" : `http_${statusCode}` };
}
export function webhookHeaders(request: DeliveryRequest) {
  return {
    "Content-Type": "application/json", "User-Agent": "Trichterwerk-Webhook/2.0",
    "X-Trichterwerk-Timestamp": new Date().toISOString(),
    "X-Trichterwerk-Event-Id": request.eventId, "Idempotency-Key": request.eventId,
    ...(request.secret ? { "X-Trichterwerk-Signature": `sha256=${createHmac("sha256", request.secret).update(request.body).digest("hex")}` } : {}),
  };
}
/** Resolve once, validate all answers, then connect to a pinned IP. Never follow redirects. */
export const deliverWebhook: WebhookTransport = async request => {
  if (!isSafeWebhookUrl(request.url)) return { kind: "failed", errorCode: "unsafe_destination" };
  const url = new URL(request.url);
  if (url.username || url.password) return { kind: "failed", errorCode: "unsafe_destination" };
  let timer: ReturnType<typeof setTimeout> | undefined;
  let addresses: LookupAddress[];
  try {
    addresses = await Promise.race([
      lookup(url.hostname, { all: true }),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("timeout")), 10_000); }),
    ]);
  } catch { return { kind: "retry", errorCode: "dns_unavailable" }; }
  finally { if (timer) clearTimeout(timer); }
  if (!addresses.length || addresses.some(item => !publicWebhookAddress(item.address))) return { kind: "failed", errorCode: "unsafe_destination" };
  return new Promise(resolve => {
    let done = false;
    const finish = (outcome: DeliveryOutcome) => { if (!done) { done = true; clearTimeout(timeout); resolve(outcome); } };
    const options: https.RequestOptions = {
      protocol: url.protocol, hostname: addresses[0].address, port: url.port || (url.protocol === "https:" ? 443 : 80),
      method: "POST", path: url.pathname + url.search, agent: false,
      servername: url.hostname, checkServerIdentity: (_host, certificate) => checkServerIdentity(url.hostname, certificate),
      headers: { ...webhookHeaders(request), Host: url.host, "Content-Length": Buffer.byteLength(request.body) },
    };
    const outgoing = (url.protocol === "https:" ? https : http).request(options, response => {
      // Response bodies may contain secrets or be unbounded; neither store nor drain them.
      const outcome = classifyWebhookStatus(response.statusCode ?? 500);
      finish(outcome); response.destroy();
    });
    const timeout = setTimeout(() => { finish({ kind: "retry", errorCode: "delivery_timeout" }); outgoing.destroy(); }, 10_000);
    outgoing.on("error", () => finish({ kind: "retry", errorCode: "network_error" }));
    outgoing.end(request.body);
  });
};
