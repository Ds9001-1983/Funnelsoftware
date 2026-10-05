// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const smtp = vi.hoisted(() => ({ sendMail: vi.fn(), close: vi.fn(), createTransport: vi.fn() }));
vi.mock("nodemailer", () => ({ default: { createTransport: smtp.createTransport } }));
import { sendContactMessage } from "./contact-email";
import { CONTACT_EMAIL } from "@shared/contact";

describe("contact email", () => {
  const input = { email: "visitor@example.com", message: "Frage <script>alert(1)</script>\nzum Funnel" };
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("SMTP_HOST", "smtp.example.test"); vi.stubEnv("SMTP_USER", "test"); vi.stubEnv("SMTP_PASS", "test");
    vi.stubEnv("FROM_EMAIL", "support@example.test");
    smtp.createTransport.mockReturnValue(smtp);
    smtp.sendMail.mockResolvedValue({ accepted: [CONTACT_EMAIL] });
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); vi.restoreAllMocks(); });
  it("uses configured SMTP, a fixed recipient, reply-to and plain text only", async () => {
    expect(await sendContactMessage(input)).toBe(true);
    expect(smtp.sendMail).toHaveBeenCalledWith({
      from: "support@example.test", to: CONTACT_EMAIL, replyTo: input.email,
      subject: "Kontaktanfrage über Trichterwerk", text: `Kontaktanfrage von ${input.email}\n\n${input.message}`,
    });
    expect(smtp.createTransport).toHaveBeenCalledWith(expect.objectContaining({ host: "smtp.example.test", disableFileAccess: true, disableUrlAccess: true }));
    expect(smtp.close).toHaveBeenCalled();
  });
  it("does not send without SMTP credentials", async () => {
    vi.stubEnv("SMTP_PASS", "");
    expect(await sendContactMessage(input)).toBe(false);
    expect(smtp.sendMail).not.toHaveBeenCalled();
  });
  it("rejects invalid reply-to headers", async () => {
    expect(await sendContactMessage({ ...input, email: "bad@example.com\r\nBcc: victim@example.com" })).toBe(false);
    expect(smtp.sendMail).not.toHaveBeenCalled();
  });
  it("requires the intended recipient to be accepted", async () => {
    smtp.sendMail.mockResolvedValue({ accepted: [], rejected: [CONTACT_EMAIL] });
    expect(await sendContactMessage(input)).toBe(false);
  });
  it("does not log raw SMTP errors or message contents", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    smtp.sendMail.mockRejectedValue(new Error(input.email + input.message));
    expect(await sendContactMessage(input)).toBe(false);
    expect(JSON.stringify(warn.mock.calls)).not.toContain(input.email);
    expect(JSON.stringify(warn.mock.calls)).not.toContain(input.message);
  });
  it("closes a stalled SMTP connection within the absolute deadline", async () => {
    vi.useFakeTimers();
    smtp.sendMail.mockReturnValue(new Promise(() => {}));
    const result = sendContactMessage(input);
    await vi.advanceTimersByTimeAsync(20_000);
    expect(await result).toBe(false);
    expect(smtp.close).toHaveBeenCalled();
  });
});
