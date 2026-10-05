// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import type { Server } from "node:http";
import { createContactRouter } from "./contact";

describe("public contact endpoint", () => {
  let server: Server;
  let url: string;
  const send = vi.fn(async () => true);
  const valid = { email: "visitor@example.com", message: "Ich habe eine Frage zum Funnel." };
  const post = (body: unknown) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  beforeEach(async () => {
    send.mockReset().mockResolvedValue(true);
    const app = express();
    app.use(express.json());
    app.use("/api/public/contact", createContactRouter(send));
    server = await new Promise<Server>(resolve => { const listening = app.listen(0, "127.0.0.1", () => resolve(listening)); });
    url = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/public/contact`;
  });
  afterEach(async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });

  it("accepts anonymous requests, normalizes input and strips the honeypot field", async () => {
    const response = await post({ ...valid, email: ` ${valid.email} `, message: ` ${valid.message} `, website: "" });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(send).toHaveBeenCalledExactlyOnceWith(valid);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it.each([
    { ...valid, email: "invalid" },
    { ...valid, email: "visitor@example.com\r\nBcc: other@example.com" },
    { ...valid, message: "   " },
    { ...valid, message: "x".repeat(3001) },
    { ...valid, to: "other@example.com" },
    { ...valid, email: [valid.email] },
  ])("rejects invalid or injected input without sending: %j", async input => {
    expect((await post(input)).status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });
  it("silently discards honeypot submissions", async () => {
    expect((await post({ ...valid, website: "https://spam.example" })).status).toBe(200);
    expect(send).not.toHaveBeenCalled();
  });
  it("rejects ordinary cross-origin form submissions", async () => {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "email=visitor@example.com" });
    expect(response.status).toBe(415);
    expect(send).not.toHaveBeenCalled();
  });
  it("limits requests from the same IP with a retry hint", async () => {
    for (let i = 0; i < 5; i++) expect((await post(valid)).status).toBe(200);
    const response = await post(valid);
    expect(response.status).toBe(429);
    expect(Number(response.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(send).toHaveBeenCalledTimes(5);
  });
  it.each([false, new Error("private SMTP details")])("does not report success when mail is unconfirmed (%s)", async result => {
    if (result instanceof Error) send.mockRejectedValueOnce(result);
    else send.mockResolvedValueOnce(result);
    const response = await post(valid);
    expect(response.status).toBe(503);
    const body = await response.text();
    expect(body).toContain("Eingaben bleiben erhalten");
    expect(body).not.toContain("private SMTP details");
    expect(body).not.toContain(valid.email);
  });
});
