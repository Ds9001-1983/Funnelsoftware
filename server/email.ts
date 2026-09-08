import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@trichterwerk.de";
const APP_URL = process.env.APP_URL || "http://localhost:5000";
/** Postfach fuer Fehlermeldungen aus dem Produkt. Fallback ist die Adresse, die
 *  auch im Impressum und in den Marketing-Seiten steht. */
const BUG_REPORT_TO = process.env.BUG_REPORT_EMAIL || "info@superbrand.marketing";

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

/** Optionale Zusaetze fuer einzelne Mails. Bewusst schmal gehalten: bis auf die
 *  Fehlermeldungen kommt jede Mail dieses Moduls ohne Anhang und ohne Reply-To aus. */
interface SendEmailOptions {
  /** Antwortadresse — bei Fehlermeldungen der Melder, damit eine Antwort direkt bei ihm landet. */
  replyTo?: string;
  /** Dateianhaenge (nodemailer-Format). Nur mit In-Memory-Buffern verwenden. */
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  options?: SendEmailOptions,
): Promise<boolean> {
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
      ...(options?.replyTo ? { replyTo: options.replyTo } : {}),
      ...(options?.attachments?.length ? { attachments: options.attachments } : {}),
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

// ============ LIFECYCLE-MAILS (server/scheduler.ts + Stripe-Webhook) ============
// Alle Versände laufen über das email_log-Dedupe (storage.tryLogEmail) —
// die Funktionen hier bauen nur Template + Versand.

/** Trial endet in ~3 Tagen: Erinnerung mit Feature-Verlust-Liste + Upgrade-CTA. */
export async function sendTrialEndingSoonEmail(
  email: string,
  displayName: string | null | undefined,
  daysLeft: number,
): Promise<boolean> {
  const name = displayName ? escapeHtml(displayName) : "dort";
  const upgradeLink = `${APP_URL}/settings#billing`;

  const html = baseTemplate(`
    <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">Noch ${daysLeft} ${daysLeft === 1 ? "Tag" : "Tage"} volle Pro-Features</h2>
    <p style="margin:0 0 24px;color:#52525b;font-size:15px;line-height:1.6;">
      Hallo ${name}, deine Pro-Testphase endet bald. Keine Sorge: Dein Account läuft
      danach automatisch im <strong>kostenlosen Free-Plan</strong> weiter — dein zuletzt
      bearbeiteter Funnel bleibt online.
    </p>
    <div style="background:#f4f4f5;border-radius:8px;padding:20px;margin:0 0 24px;">
      <p style="margin:0 0 12px;color:#18181b;font-weight:600;font-size:14px;">Nach der Testphase entfallen:</p>
      <p style="margin:0 0 8px;color:#52525b;font-size:14px;">• Unbegrenzte veröffentlichte Funnels (Free: 1)</p>
      <p style="margin:0 0 8px;color:#52525b;font-size:14px;">• Unbegrenzte Leads (Free: 100 sichtbar pro Monat)</p>
      <p style="margin:0 0 8px;color:#52525b;font-size:14px;">• Eigene Domain, Teams &amp; KI-Generator</p>
      <p style="margin:0;color:#52525b;font-size:14px;">• Entfernbares „Erstellt mit Trichterwerk“-Badge</p>
    </div>
    <div style="text-align:center;margin:32px 0;">
      <a href="${upgradeLink}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
        Pro behalten — 49 €/Monat
      </a>
    </div>
    <p style="margin:0;color:#a1a1aa;font-size:13px;text-align:center;">
      Monatlich kündbar · Endpreis inkl. MwSt.
    </p>
  `);

  return sendEmail(email, `Deine Pro-Testphase endet in ${daysLeft} ${daysLeft === 1 ? "Tag" : "Tagen"}`, html);
}

/** Nach dem Free-Downgrade: welcher Funnel blieb online, was wurde depubliziert. */
export async function sendFreeDowngradeEmail(
  email: string,
  displayName: string | null | undefined,
  keptFunnelName: string | null,
  demotedCount: number,
): Promise<boolean> {
  const name = displayName ? escapeHtml(displayName) : "dort";
  const upgradeLink = `${APP_URL}/settings#billing`;
  const kept = keptFunnelName
    ? `Dein Funnel <strong>„${escapeHtml(keptFunnelName)}“</strong> bleibt online.`
    : "Du kannst jederzeit einen Funnel veröffentlichen.";
  const demoted =
    demotedCount > 0
      ? `<p style="margin:0 0 24px;color:#52525b;font-size:15px;line-height:1.6;">
           ${demotedCount === 1 ? "Ein weiterer veröffentlichter Funnel wurde" : `${demotedCount} weitere veröffentlichte Funnels wurden`}
           auf „Entwurf“ gesetzt — nichts ist gelöscht, mit einem Upgrade schaltest du alles wieder live.
         </p>`
      : "";

  const html = baseTemplate(`
    <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">Du bist jetzt im Free-Plan</h2>
    <p style="margin:0 0 16px;color:#52525b;font-size:15px;line-height:1.6;">
      Hallo ${name}, deine Pro-Testphase ist vorbei — dein Account läuft kostenlos weiter.
      ${kept}
    </p>
    ${demoted}
    <div style="background:#f4f4f5;border-radius:8px;padding:20px;margin:0 0 24px;">
      <p style="margin:0 0 12px;color:#18181b;font-weight:600;font-size:14px;">Dein Free-Plan:</p>
      <p style="margin:0 0 8px;color:#52525b;font-size:14px;">• 1 veröffentlichter Funnel, unbegrenzte Entwürfe</p>
      <p style="margin:0 0 8px;color:#52525b;font-size:14px;">• 100 sichtbare Leads pro Monat (alle werden gespeichert)</p>
      <p style="margin:0;color:#52525b;font-size:14px;">• Alle Templates &amp; Editor-Funktionen</p>
    </div>
    <div style="text-align:center;margin:32px 0;">
      <a href="${upgradeLink}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
        Auf Pro upgraden
      </a>
    </div>
  `);

  return sendEmail(email, "Deine Testphase ist vorbei — dein Account läuft kostenlos weiter", html);
}

/** Re-Engagement nach 14 Tagen Inaktivität (einmalig pro Account). */
export async function sendReEngagementEmail(
  email: string,
  displayName: string | null | undefined,
): Promise<boolean> {
  const name = displayName ? escapeHtml(displayName) : "dort";
  const loginLink = `${APP_URL}/login`;

  const html = baseTemplate(`
    <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">Dein Funnel wartet auf dich</h2>
    <p style="margin:0 0 24px;color:#52525b;font-size:15px;line-height:1.6;">
      Hallo ${name}, du warst eine Weile nicht mehr bei Trichterwerk. Dein Account
      und deine Funnels sind noch da — und mit den fertigen Vorlagen ist ein
      Funnel in unter einer Stunde live.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${loginLink}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
        Weitermachen
      </a>
    </div>
    <p style="margin:0;color:#a1a1aa;font-size:13px;text-align:center;">
      Fragen oder Feedback? Antworte einfach auf diese E-Mail an info@superbrand.marketing.
    </p>
  `);

  return sendEmail(email, "Dein Funnel wartet auf dich", html);
}

/** Dunning: Zahlung fehlgeschlagen — CTA ins Stripe-Portal (Settings → Billing). */
export async function sendPaymentFailedEmail(
  email: string,
  displayName: string | null | undefined,
): Promise<boolean> {
  const name = displayName ? escapeHtml(displayName) : "dort";
  const billingLink = `${APP_URL}/settings#billing`;

  const html = baseTemplate(`
    <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">Deine Zahlung konnte nicht verarbeitet werden</h2>
    <p style="margin:0 0 24px;color:#52525b;font-size:15px;line-height:1.6;">
      Hallo ${name}, die letzte Abbuchung für dein Pro-Abo ist fehlgeschlagen.
      Dein Zugang bleibt vorerst aktiv — Stripe versucht es automatisch erneut.
      Damit nichts unterbrochen wird, aktualisiere am besten kurz deine Zahlungsmethode.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${billingLink}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
        Zahlungsmethode aktualisieren
      </a>
    </div>
  `);

  return sendEmail(email, "Zahlung fehlgeschlagen — bitte Zahlungsmethode prüfen", html);
}

/** Free-Limit erreicht: Funnel sammelt weiter, Leads über dem Limit sind maskiert. */
export async function sendLeadLimitReachedEmail(
  email: string,
  displayName: string | null | undefined,
  funnelName: string,
): Promise<boolean> {
  const name = displayName ? escapeHtml(displayName) : "dort";
  const upgradeLink = `${APP_URL}/settings#billing`;

  const html = baseTemplate(`
    <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">100 Leads diesen Monat — stark! 🎉</h2>
    <p style="margin:0 0 24px;color:#52525b;font-size:15px;line-height:1.6;">
      Hallo ${name}, dein Funnel <strong>„${escapeHtml(funnelName)}“</strong> hat das
      Monatslimit deines Free-Plans erreicht. Gute Nachricht: <strong>Er sammelt
      weiter</strong> — alle neuen Leads werden gespeichert, sind aber bis zu einem
      Upgrade gesperrt. Mit Pro schaltest du sie rückwirkend frei.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${upgradeLink}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
        Leads freischalten — Pro für 49 €/Monat
      </a>
    </div>
  `);

  return sendEmail(email, `${funnelName}: Lead-Limit erreicht — dein Funnel sammelt weiter`, html);
}

/** Team-Einladung: Bestandsnutzer → Settings, Unbekannte → Registrierung. */
export async function sendTeamInviteEmail(
  email: string,
  teamName: string,
  inviterName: string,
  isExistingUser: boolean,
): Promise<boolean> {
  const link = isExistingUser ? `${APP_URL}/settings` : `${APP_URL}/register?invite=1`;
  const cta = isExistingUser ? "Team ansehen" : "Kostenlos registrieren & beitreten";

  const html = baseTemplate(`
    <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">Du wurdest in ein Team eingeladen</h2>
    <p style="margin:0 0 24px;color:#52525b;font-size:15px;line-height:1.6;">
      ${escapeHtml(inviterName)} hat dich zum Team <strong>„${escapeHtml(teamName)}“</strong>
      bei Trichterwerk eingeladen — dem Funnel-Builder aus Deutschland.
      ${isExistingUser ? "Melde dich an, um loszulegen." : "Erstelle einen kostenlosen Account mit dieser E-Mail-Adresse, dann wirst du dem Team automatisch zugeordnet."}
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${link}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
        ${cta}
      </a>
    </div>
  `);

  return sendEmail(email, `Einladung ins Team „${teamName}“ bei Trichterwerk`, html);
}

// ============ FEHLERMELDUNGEN (Bug-Report-Widget) ============

/**
 * Meldet eine Fehlermeldung aus dem Produkt an das Betreiber-Postfach.
 *
 * Der Screenshot geht als Anhang mit, damit das Problem ohne Login sichtbar ist.
 * Das bedeutet: liegt auf dem Screenshot ein Kundendatensatz, landet er auch im
 * Postfach beim SMTP-Anbieter. Deshalb maskiert das Widget Lead-Daten vor der
 * Aufnahme (client/src/lib/screenshot.ts) und die Datenschutzerklaerung nennt
 * den Versandweg. Reply-To ist der Melder, damit eine Antwort direkt ankommt.
 */
export async function sendBugReportNotification(report: {
  id: number;
  description: string;
  pageUrl: string;
  userAgent?: string | null;
  viewport?: string | null;
  clientErrors?: string | null;
  reporterEmail: string;
  reporterName?: string | null;
  plan: string;
  screenshot?: { filename: string; content: Buffer; contentType: string } | null;
  attachment?: { filename: string; content: Buffer; contentType: string } | null;
}): Promise<boolean> {
  const adminLink = `${APP_URL}/admin#bug-${report.id}`;
  const row = (label: string, value: string) =>
    `<tr><td style="padding:8px 12px;color:#52525b;font-size:14px;border-bottom:1px solid #f4f4f5;white-space:nowrap;"><strong>${label}:</strong></td><td style="padding:8px 12px;color:#18181b;font-size:14px;border-bottom:1px solid #f4f4f5;word-break:break-word;">${value}</td></tr>`;

  const rows = [
    row("Melder", `${escapeHtml(report.reporterName || report.reporterEmail)} (${escapeHtml(report.reporterEmail)})`),
    row("Plan", escapeHtml(report.plan)),
    row("Seite", escapeHtml(report.pageUrl)),
    report.viewport ? row("Fenster", escapeHtml(report.viewport)) : "",
    report.userAgent ? row("Browser", escapeHtml(report.userAgent)) : "",
  ].filter(Boolean).join("");

  const attachments = [report.screenshot, report.attachment].filter(
    (file): file is { filename: string; content: Buffer; contentType: string } => !!file,
  );

  const html = baseTemplate(`
    <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">Neue Fehlermeldung #${report.id}</h2>
    <div style="margin:0 0 24px;padding:16px;background:#fef2f2;border-left:4px solid #ef4444;border-radius:6px;color:#18181b;font-size:15px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(report.description)}</div>
    <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;overflow:hidden;margin:0 0 24px;">
      ${rows}
    </table>
    ${attachments.length
      ? `<p style="margin:0 0 24px;color:#52525b;font-size:14px;">Screenshot und Anhang liegen dieser E-Mail bei.</p>`
      : `<p style="margin:0 0 24px;color:#52525b;font-size:14px;">Zu dieser Meldung wurde kein Bild übermittelt.</p>`}
    ${report.clientErrors
      ? `<p style="margin:0 0 8px;color:#52525b;font-size:13px;"><strong>Zuletzt protokollierte Browser-Fehler:</strong></p>
         <pre style="margin:0 0 24px;padding:12px;background:#18181b;color:#e4e4e7;border-radius:6px;font-size:12px;line-height:1.5;white-space:pre-wrap;word-break:break-word;">${escapeHtml(report.clientErrors)}</pre>`
      : ""}
    <div style="text-align:center;margin:32px 0;">
      <a href="${adminLink}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
        Im Admin-Bereich öffnen
      </a>
    </div>
  `);

  const subjectPage = report.pageUrl.slice(0, 60);
  return sendEmail(BUG_REPORT_TO, `Fehlermeldung #${report.id} von ${report.reporterEmail} (${subjectPage})`, html, {
    replyTo: report.reporterEmail,
    attachments,
  });
}
