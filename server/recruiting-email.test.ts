// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import type { RecruitingEmail, RecruitingEmailTransport } from "./email";

const message: RecruitingEmail = {
  recipient: "candidate@example.test", replyTo: "owner@example.test", senderName: "Team Recruiting",
  subject: "Deine Bewerbung", body: "Hallo <img src=x onerror=alert(1)> & Danke!\nNächster Schritt",
};

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("DATABASE_URL", "postgresql://test@127.0.0.1:55437/recruiting_test");
  vi.stubEnv("SMTP_HOST", "");
  vi.stubEnv("SMTP_USER", "");
  vi.stubEnv("SMTP_PASS", "");
  vi.stubEnv("FROM_EMAIL", "noreply@trichterwerk.de");
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("Bewerbermail-Transport", () => {
  it("sendet Text und escaped HTML mit Plattformabsender und bestätigter Antwortadresse", async () => {
    const { sendRecruitingEmail } = await import("./email");
    const transport = { sendMail: vi.fn().mockResolvedValue({ accepted: [message.recipient], messageId: "test-message" }) };
    expect(await sendRecruitingEmail(message, { transport })).toEqual({ status: "sent", messageId: "test-message" });
    const sent = transport.sendMail.mock.calls[0][0];
    expect(sent.from).toEqual({ name: "Team Recruiting", address: "noreply@trichterwerk.de" });
    expect(sent.replyTo.address).toBe(message.replyTo);
    expect(sent.to.address).toBe(message.recipient);
    expect(sent.text).toBe(message.body);
    expect(sent.html).toContain("&lt;img src=x onerror=alert(1)&gt; &amp; Danke!");
    expect(sent.html).not.toContain("<img");
    expect(sent.disableFileAccess).toBe(true);
    expect(sent.disableUrlAccess).toBe(true);
  });

  it.each([
    [{ responseCode: 451 }, "retryable", "smtp_451"],
    [{ responseCode: 550 }, "failed", "smtp_550"],
    [{ code: "EDNS" }, "retryable", "smtp_connection_unavailable"],
    [{ code: "EAUTH" }, "failed", "smtp_authentication_failed"],
    [{ code: "ETIMEDOUT", command: "CONN" }, "uncertain", "smtp_acceptance_unknown"],
    [{ code: "ECONNECTION", command: "CONN" }, "uncertain", "smtp_acceptance_unknown"],
    [{ code: "ESOCKET", command: "DATA" }, "uncertain", "smtp_acceptance_unknown"],
  ])("klassifiziert %j ohne SMTP-Fehlertext zu speichern", async (smtpError, status, errorCode) => {
    const { sendRecruitingEmail } = await import("./email");
    const transport = { sendMail: vi.fn().mockRejectedValue({ ...smtpError, message: "private candidate@example.test" }) };
    expect(await sendRecruitingEmail(message, { transport })).toEqual({ status, errorCode });
  });

  it("meldet fehlendes SMTP ohne Empfänger, Betreff oder Inhalt zu loggen", async () => {
    const log = vi.spyOn(console, "log");
    const error = vi.spyOn(console, "error");
    const { sendRecruitingEmail } = await import("./email");
    expect(await sendRecruitingEmail(message)).toEqual({ status: "failed", errorCode: "smtp_not_configured" });
    expect(log).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it.each([
    { recipient: "one@example.test,two@example.test" },
    { replyTo: "owner@example.test\r\nBcc: attacker@example.test" },
    { subject: "Hallo\nBcc: attacker@example.test" },
    { senderName: "Team\r\nContent-Type: text/html" },
  ])("weist Header-/Empfängerinjektion vor dem Transport ab: %j", async override => {
    const { sendRecruitingEmail } = await import("./email");
    const transport = { sendMail: vi.fn() };
    expect(await sendRecruitingEmail({ ...message, ...override }, { transport })).toEqual({ status: "failed", errorCode: "invalid_message" });
    expect(transport.sendMail).not.toHaveBeenCalled();
  });

  it.each([
    ["production", "postgresql://test@127.0.0.1/recruiting_test"],
    ["test", "postgresql://test@production.example/recruiting_test"],
    ["test", "postgresql://test@127.0.0.1/production"],
    ["test", "postgresql://test@127.0.0.1@production.example/recruiting_test"],
  ])("verbietet Testtransporte außerhalb isolierter Tests: %s %s", async (nodeEnv, databaseUrl) => {
    vi.stubEnv("NODE_ENV", nodeEnv);
    vi.stubEnv("DATABASE_URL", databaseUrl);
    const { sendRecruitingEmail } = await import("./email");
    const transport: RecruitingEmailTransport = { sendMail: vi.fn() };
    await expect(sendRecruitingEmail(message, { transport })).rejects.toThrow("isolated loopback test database");
    expect(transport.sendMail).not.toHaveBeenCalled();
  });
});
