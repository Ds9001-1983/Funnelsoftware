import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@trichterwerk.de";
const APP_URL = process.env.APP_URL || "http://localhost:5000";

const isConfigured = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })
  : null;

/**
 * HTML-Escaping für nutzer-/besuchergesteuerte Werte in E-Mail-Templates.
 * Lead-Felder kommen ungefiltert vom öffentlichen Funnel-Formular — ohne
 * Escaping kann ein Besucher HTML/Links in die Owner-Mail injizieren (Phishing).
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Trichterwerk</h1>
    </div>
    <!-- Content -->
    <div style="padding:40px;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="padding:24px 40px;background:#fafafa;border-top:1px solid #e4e4e7;text-align:center;">
      <p style="margin:0;color:#a1a1aa;font-size:12px;">
        &copy; ${new Date().getFullYear()} Trichterwerk by SUPERBRAND.marketing
      </p>
      <p style="margin:8px 0 0;color:#a1a1aa;font-size:12px;">
        Diese E-Mail wurde automatisch versendet. Bitte antworte nicht direkt auf diese E-Mail.
      </p>
    </div>
  </div>
</body>
</html>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!transporter) {
    console.log(`[Email] SMTP nicht konfiguriert. E-Mail an ${to} wird nicht gesendet.`);
    console.log(`[Email] Betreff: ${subject}`);
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"Trichterwerk" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Erfolgreich gesendet an ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error(`[Email] Fehler beim Senden an ${to}:`, error);
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  const resetLink = `${APP_URL}/reset-password?token=${token}`;

  const html = baseTemplate(`
    <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">Passwort zurücksetzen</h2>
    <p style="margin:0 0 24px;color:#52525b;font-size:15px;line-height:1.6;">
      Du hast angefordert, dein Passwort zurückzusetzen. Klicke auf den Button um ein neues Passwort zu wählen.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${resetLink}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
        Neues Passwort setzen
      </a>
    </div>
    <p style="margin:0 0 8px;color:#71717a;font-size:13px;">
      Dieser Link ist <strong>1 Stunde</strong> gültig. Falls du kein neues Passwort angefordert hast, kannst du diese E-Mail ignorieren.
    </p>
    <p style="margin:16px 0 0;color:#a1a1aa;font-size:12px;word-break:break-all;">
      Link funktioniert nicht? Kopiere diese URL: ${resetLink}
    </p>
  `);

  return sendEmail(email, "Passwort zurücksetzen – Trichterwerk", html);
}

export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  const verifyLink = `${APP_URL}/verify-email?token=${token}`;

  const html = baseTemplate(`
    <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">E-Mail-Adresse bestätigen</h2>
    <p style="margin:0 0 24px;color:#52525b;font-size:15px;line-height:1.6;">
      Willkommen bei Trichterwerk! Bitte bestätige deine E-Mail-Adresse, um alle Funktionen nutzen zu können.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${verifyLink}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
        E-Mail bestätigen
      </a>
    </div>
    <p style="margin:0;color:#71717a;font-size:13px;">
      Falls du dich nicht bei Trichterwerk registriert hast, kannst du diese E-Mail ignorieren.
    </p>
    <p style="margin:16px 0 0;color:#a1a1aa;font-size:12px;word-break:break-all;">
      Link funktioniert nicht? Kopiere diese URL: ${verifyLink}
    </p>
  `);

  return sendEmail(email, "E-Mail bestätigen – Trichterwerk", html);
}

export async function sendWelcomeEmail(email: string, displayName?: string): Promise<boolean> {
  const name = displayName || "dort";
  const loginLink = `${APP_URL}/login`;

  const html = baseTemplate(`
    <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">Willkommen bei Trichterwerk!</h2>
    <p style="margin:0 0 24px;color:#52525b;font-size:15px;line-height:1.6;">
      Hallo ${name}, schön dass du dabei bist! Deine 14-tägige Testphase hat begonnen.
    </p>
    <div style="background:#f4f4f5;border-radius:8px;padding:20px;margin:0 0 24px;">
      <p style="margin:0 0 12px;color:#18181b;font-weight:600;font-size:14px;">Deine nächsten Schritte:</p>
      <p style="margin:0 0 8px;color:#52525b;font-size:14px;">1. Erstelle deinen ersten Funnel</p>
      <p style="margin:0 0 8px;color:#52525b;font-size:14px;">2. Wähle ein Template oder starte von Null</p>
      <p style="margin:0;color:#52525b;font-size:14px;">3. Veröffentliche und sammle Leads</p>
    </div>
    <div style="text-align:center;margin:32px 0;">
      <a href="${loginLink}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
        Jetzt loslegen
      </a>
    </div>
  `);

  return sendEmail(email, "Willkommen bei Trichterwerk! 🚀", html);
}

export async function sendLeadNotificationEmail(
  ownerEmail: string,
  leadData: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    message?: string | null;
    answers?: Record<string, any> | null;
  },
  funnelName: string
): Promise<boolean> {
  const leadsLink = `${APP_URL}/leads`;

  // Besucher-Eingaben escapen — sonst HTML-/Link-Injection in die Owner-Mail
  const name = leadData.name && escapeHtml(leadData.name);
  const email = leadData.email && escapeHtml(leadData.email);
  const phone = leadData.phone && escapeHtml(leadData.phone);
  const company = leadData.company && escapeHtml(leadData.company);
  const message = leadData.message && escapeHtml(leadData.message);

  const fieldsHtml = [
    name && `<tr><td style="padding:8px 12px;color:#52525b;font-size:14px;border-bottom:1px solid #f4f4f5;"><strong>Name:</strong></td><td style="padding:8px 12px;color:#18181b;font-size:14px;border-bottom:1px solid #f4f4f5;">${name}</td></tr>`,
    email && `<tr><td style="padding:8px 12px;color:#52525b;font-size:14px;border-bottom:1px solid #f4f4f5;"><strong>E-Mail:</strong></td><td style="padding:8px 12px;color:#18181b;font-size:14px;border-bottom:1px solid #f4f4f5;"><a href="mailto:${email}">${email}</a></td></tr>`,
    phone && `<tr><td style="padding:8px 12px;color:#52525b;font-size:14px;border-bottom:1px solid #f4f4f5;"><strong>Telefon:</strong></td><td style="padding:8px 12px;color:#18181b;font-size:14px;border-bottom:1px solid #f4f4f5;"><a href="tel:${phone}">${phone}</a></td></tr>`,
    company && `<tr><td style="padding:8px 12px;color:#52525b;font-size:14px;border-bottom:1px solid #f4f4f5;"><strong>Firma:</strong></td><td style="padding:8px 12px;color:#18181b;font-size:14px;border-bottom:1px solid #f4f4f5;">${company}</td></tr>`,
    message && `<tr><td style="padding:8px 12px;color:#52525b;font-size:14px;border-bottom:1px solid #f4f4f5;"><strong>Nachricht:</strong></td><td style="padding:8px 12px;color:#18181b;font-size:14px;border-bottom:1px solid #f4f4f5;">${message}</td></tr>`,
  ].filter(Boolean).join("");

  const html = baseTemplate(`
    <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">Neuer Lead eingegangen!</h2>
    <p style="margin:0 0 24px;color:#52525b;font-size:15px;line-height:1.6;">
      Über deinen Funnel <strong>"${escapeHtml(funnelName)}"</strong> ist ein neuer Lead eingegangen.
    </p>
    <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;overflow:hidden;margin:0 0 24px;">
      ${fieldsHtml}
    </table>
    <div style="text-align:center;margin:32px 0;">
      <a href="${leadsLink}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
        Alle Leads ansehen
      </a>
    </div>
  `);

  return sendEmail(ownerEmail, `Neuer Lead: ${leadData.name || "Unbekannt"} via ${funnelName}`, html);
}
