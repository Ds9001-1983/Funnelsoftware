import nodemailer from "nodemailer";
import { CONTACT_EMAIL, contactSchema, type ContactMessage } from "@shared/contact";

/** Fixed recipient; visitor input can only become reply-to or plain message text. */
export async function sendContactMessage(input: ContactMessage): Promise<boolean> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success || parsed.data.website) return false;
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, FROM_EMAIL } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return false;
  const port = Number(process.env.SMTP_PORT || 587);
  const transport = nodemailer.createTransport({
    host: SMTP_HOST, port, secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 8000, greetingTimeout: 5000, socketTimeout: 8000, dnsTimeout: 5000,
    disableFileAccess: true, disableUrlAccess: true,
  });
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    // Absolute deadline below nginx's 30s read timeout, including slow SMTP peers.
    const result = await Promise.race([
      transport.sendMail({
        from: FROM_EMAIL || "noreply@trichterwerk.de",
        to: CONTACT_EMAIL,
        replyTo: parsed.data.email,
        subject: "Kontaktanfrage über Trichterwerk",
        text: `Kontaktanfrage von ${parsed.data.email}\n\n${parsed.data.message}`,
      }),
      new Promise<null>(resolve => { timeout = setTimeout(() => { transport.close(); resolve(null); }, 20_000); }),
    ]);
    return !!result?.accepted?.some(address => String(address).toLowerCase() === CONTACT_EMAIL);
  } catch {
    // SMTP errors may contain the entire message. Never log their raw contents.
    console.warn("Kontaktmail konnte nicht bestätigt werden.");
    return false;
  } finally {
    clearTimeout(timeout);
    transport.close();
  }
}
