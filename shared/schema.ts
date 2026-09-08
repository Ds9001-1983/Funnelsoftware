import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ============ URL-SICHERHEIT ============

/** Erlaubte Protokolle für nutzerdefinierte Links (Element-Link / Button). */
export const SAFE_URL_PROTOCOLS = ["http:", "https:", "mailto:", "tel:"] as const;

/**
 * True, wenn die URL gefahrlos in `href`/`window.open` verwendet werden darf:
 * relative URLs/Anker oder absolute URLs mit erlaubtem Protokoll. Blockt
 * `javascript:`, `data:`, `vbscript:` etc. (Stored XSS / Open Redirect).
 * Leere Eingabe = kein Link = unbedenklich.
 */
export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  // Tabs/Zeilenumbrüche entfernen — Browser ignorieren sie in URLs, also dürfen
  // sie kein "javascript:" verschleiern (z. B. "java\tscript:...").
  const t = url.replace(/[\t\n\r]/g, "").trim();
  if (!t) return true;
  // Relative URLs, root-relative und reine Anker enthalten kein Protokoll.
  if (/^(\/|#|\.\/|\.\.\/)/.test(t)) return true;
  try {
    return (SAFE_URL_PROTOCOLS as readonly string[]).includes(new URL(t).protocol.toLowerCase());
  } catch {
    // Kein parsebares absolutes Protokoll → als relativ behandeln (nicht ausführbar).
    return true;
  }
}

/** Zod-String, der nur sichere URL-Protokolle (oder relative URLs) zulässt. */
export const safeUrlSchema = z
  .string()
  .refine(isSafeUrl, { message: "Unerlaubtes URL-Protokoll (erlaubt: http, https, mailto, tel)" });

// ============ UPLOAD-LIMITS ============
// Gemeinsame Quelle der Wahrheit für Client (Vorab-Validierung + UI-Hinweis)
// und Server (multer-Limit), damit beide nicht auseinanderlaufen.
/** Max. Bildgröße in Bytes (Bild wird serverseitig zu WebP/1200px reduziert). */
export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
/** Max. Audiogröße in Bytes (wird im Originalformat gespeichert). */
export const MAX_AUDIO_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB
/** Max. Größe je Bild einer Fehlermeldung (Screenshot + optionaler Anhang).
 *  Bewusst kleiner als MAX_IMAGE_UPLOAD_BYTES: der automatische Screenshot ist
 *  bereits WebP-komprimiert, und die Datei geht zusätzlich als Mail-Anhang raus. */
export const MAX_BUG_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5 MB
/** Max. Länge der Fehlerbeschreibung (Freitext des Nutzers). */
export const BUG_REPORT_MAX_DESCRIPTION = 2000;

// ============ PLÄNE & LIMITS ============
// Client (Preisseite, Limit-Dialoge) und Server (Enforcement) teilen sich
// diese Werte — sonst laufen Anzeige und Durchsetzung auseinander.

/** Abgeleiteter Plan zur Laufzeit — keine eigene DB-Spalte (server/auth.ts:getUserPlan). */
export type PlanId = "pro" | "trial" | "free";

/** Free-Plan: max. gleichzeitig veröffentlichte Funnels (Entwürfe unbegrenzt). */
export const FREE_MAX_PUBLISHED_FUNNELS = 1;
/** Free-Plan: sichtbare Leads pro Kalendermonat (UTC). Leads werden IMMER
 *  gespeichert — oberhalb des Limits nur maskiert angezeigt, Upgrade schaltet
 *  rückwirkend frei (server/lead-limits.ts). */
export const FREE_MONTHLY_LEAD_LIMIT = 100;

/** Fehlercodes der Plan-/Limit-Durchsetzung (Server-Responses + Client-Handler). */
export const PLAN_ERROR_CODES = {
  /** Funktion nur im Pro-Plan (KI, Custom Domains, Teams, Branding ausblenden). */
  PRO_REQUIRED: "PRO_REQUIRED",
  /** Free-Limit erreicht (z. B. zweiter veröffentlichter Funnel). */
  FREE_LIMIT_REACHED: "FREE_LIMIT_REACHED",
} as const;

/**
 * Fehlercodes, die der GLOBALE Handler übernimmt (Toast + Upgrade-/Verify-Flow,
 * client/src/components/global-error-handler.tsx) — Seiten-Handler und der
 * CSRF-Retry in queryClient prüfen gegen DIESE Liste statt eigener Literale,
 * damit ein neuer Code nur an einer Stelle ergänzt werden muss.
 */
export const GLOBALLY_HANDLED_ERROR_CODES: readonly string[] = [
  "TRIAL_EXPIRED", // Legacy (alte Sessions)
  "EMAIL_NOT_VERIFIED",
  PLAN_ERROR_CODES.PRO_REQUIRED,
  PLAN_ERROR_CODES.FREE_LIMIT_REACHED,
];

// ============ DATABASE TABLES ============

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  isAdmin: boolean("is_admin").notNull().default(false),
  trialEndsAt: timestamp("trial_ends_at"),
  isPro: boolean("is_pro").notNull().default(false),
  subscriptionStatus: text("subscription_status").notNull().default("trial"), // trial, free, active, past_due, cancelled, expired
  subscriptionPlan: text("subscription_plan"), // basic, pro, enterprise
  subscriptionStartedAt: timestamp("subscription_started_at"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  lastLoginAt: timestamp("last_login_at"),
  emailVerifiedAt: timestamp("email_verified_at"),
  emailVerificationToken: text("email_verification_token"),
  // Lead-Benachrichtigungs-Mails abbestellbar (Settings → Benachrichtigungen)
  leadNotificationsEnabled: boolean("lead_notifications_enabled").notNull().default(true),
  // "Erstellt mit Trichterwerk"-Badge auf veröffentlichten Funnels ausblenden.
  // Nutzer-Intent auf Account-Ebene; ob er greift, entscheidet der Plan zur
  // Lesezeit (Pro ja, Free nie) — Downgrade blendet den Badge automatisch ein.
  hideBranding: boolean("hide_branding").notNull().default(false),
  // Partnerprogramm: eigener Empfehlungscode (lazy generiert, /register?ref=…)
  // und wer diesen Account geworben hat. Provision (25 % lifetime) wird manuell
  // über die Admin-Übersicht abgerechnet — kein Payout-Automatismus in V1.
  referralCode: text("referral_code").unique(),
  referredById: integer("referred_by_id"),
  // Marketing-Einwilligung aus dem Cookie-Banner, festgehalten bei der
  // Registrierung. Wird gebraucht, weil die Zahlung erst Wochen später über
  // einen Stripe-Webhook eintrifft — dort gibt es weder Browser noch
  // localStorage, aus dem sich der Consent noch ablesen ließe. Ohne dieses
  // Feld dürfte das Purchase-Event an Meta nicht gesendet werden.
  marketingConsent: boolean("marketing_consent").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  // Jeder Stripe-Webhook macht einen Lookup über die Customer-ID
  index("users_stripe_customer_id_idx").on(table.stripeCustomerId),
  // Admin-Partnerübersicht joint über referredById
  index("users_referred_by_id_idx").on(table.referredById),
]);

// Funnels table
export const funnels = pgTable("funnels", {
  id: serial("id").primaryKey(),
  uuid: text("uuid").notNull().unique().default(sql`gen_random_uuid()`),
  slug: text("slug").unique(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft, published, archived
  pages: jsonb("pages").notNull().default([]),
  theme: jsonb("theme").notNull().default({}),
  abTests: jsonb("ab_tests").notNull().default([]),
  webhookUrl: text("webhook_url"),
  webhookEnabled: boolean("webhook_enabled").notNull().default(false),
  webhookSecret: text("webhook_secret"),
  gtmId: text("gtm_id"),
  // Server-Side Meta Conversions API (CAPI). Pixel-ID darf öffentlich sein,
  // der Access-Token ist ein Secret und sollte nur dem Funnel-Owner gezeigt
  // werden. Beides + capiEnabled wird beim Lead-Capture serverseitig
  // ausgewertet (nur bei Marketing-Consent feuern — siehe server/capi.ts).
  metaPixelId: text("meta_pixel_id"),
  metaCapiToken: text("meta_capi_token"),
  capiEnabled: boolean("capi_enabled").notNull().default(false),
  // Letzter CAPI-Fehler (null = letztes Event OK / noch keins) — für eine
  // Tracking-Warnung im Editor, statt Fehler nur stumm zu loggen.
  capiLastError: text("capi_last_error"),
  capiLastErrorAt: timestamp("capi_last_error_at"),
  // Rechtstexte des Funnel-Owners: Besucher-Funnels erheben personenbezogene
  // Daten — der Owner braucht Impressum + Datenschutzerklärung im Footer
  // (§ 5 DDG, Art. 13 DSGVO). URLs zeigen auf die Seiten des Kunden.
  impressumUrl: text("impressum_url"),
  datenschutzUrl: text("datenschutz_url"),
  // Optionales Vorschaubild fürs Teilen (Open Graph). Fällt serverseitig auf das
  // generische Trichterwerk-OG-Bild zurück, wenn nicht gesetzt.
  ogImageUrl: text("og_image_url"),
  views: integer("views").notNull().default(0),
  leads: integer("leads_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  index("funnels_user_id_idx").on(table.userId),
  index("funnels_slug_idx").on(table.slug),
]);

// Custom Domains table — pro Funnel kann eine eigene Domain hinterlegt werden.
// Verifikation läuft über einen TXT-Record auf `_trichterwerk-verify.<hostname>`.
export const domains = pgTable("domains", {
  id: serial("id").primaryKey(),
  funnelId: integer("funnel_id").notNull().references(() => funnels.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  hostname: text("hostname").notNull().unique(),
  verified: boolean("verified").notNull().default(false),
  verificationToken: text("verification_token").notNull(),
  sslStatus: text("ssl_status").notNull().default("pending"), // pending, active, error
  createdAt: timestamp("created_at").defaultNow().notNull(),
  verifiedAt: timestamp("verified_at"),
}, (table) => [
  index("domains_user_id_idx").on(table.userId),
  index("domains_funnel_id_idx").on(table.funnelId),
  index("domains_hostname_idx").on(table.hostname),
]);

// Leads table
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  uuid: text("uuid").notNull().unique().default(sql`gen_random_uuid()`),
  funnelId: integer("funnel_id").notNull().references(() => funnels.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  message: text("message"),
  answers: jsonb("answers").default({}),
  status: text("status").notNull().default("new"), // new, contacted, qualified, converted, lost
  source: text("source"),
  // Einwilligungsnachweis (Art. 7 Abs. 1 DSGVO): Der Marketing-Consent des
  // Besuchers gated die CAPI-Übermittlung — ohne Persistierung ist die
  // Einwilligung nicht nachweisbar.
  marketingConsent: boolean("marketing_consent").notNull().default(false),
  consentAt: timestamp("consent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("leads_user_id_idx").on(table.userId),
  index("leads_funnel_id_idx").on(table.funnelId),
]);

// Templates table (global, not user-specific)
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  uuid: text("uuid").notNull().unique().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // leads, sales, recruiting, webinar, quiz
  thumbnail: text("thumbnail"),
  pages: jsonb("pages").notNull().default([]),
  theme: jsonb("theme").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Analytics events table
export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  funnelId: integer("funnel_id").notNull().references(() => funnels.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // view, pageView, click, submit, complete
  pageId: text("page_id"),
  metadata: jsonb("metadata").default({}),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("analytics_events_funnel_id_idx").on(table.funnelId),
  index("analytics_events_funnel_event_idx").on(table.funnelId, table.eventType),
  index("analytics_events_timestamp_idx").on(table.timestamp),
]);

// Plattform-Besuche (Reichweitenmessung für trichterwerk.de selbst) — BEWUSST
// getrennt von analytics_events (das an Kunden-Funnels hängt). Cookieless &
// datensparsam: KEINE Roh-IP, KEIN User-Agent, KEINE Cookie-Kennung gespeichert.
// Der visitorHash ist ein tages-rotierender, serverseitig gesalzener Einweg-Hash
// (siehe server/tracking.ts) — nicht auf die Person rückrechenbar, kein
// tagesübergreifendes Wiedererkennen. Rechtsgrundlage: Art. 6 (1) f DSGVO,
// § 25 (2) Nr. 2 TDDDG (kein Zugriff auf Endgeräte-Infos → keine Einwilligung).
export const platformVisits = pgTable("platform_visits", {
  id: serial("id").primaryKey(),
  visitorHash: text("visitor_hash").notNull(),
  path: text("path").notNull(),
  referrerHost: text("referrer_host"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  deviceClass: text("device_class"), // mobile | tablet | desktop
  country: text("country"), // grober 2-stelliger Ländercode, falls ermittelbar
  eventType: text("event_type").notNull().default("pageview"), // siehe PLATFORM_EVENT_TYPES
  /**
   * Freie Unterscheidung innerhalb eines Ereignistyps, z.B. welcher CTA geklickt
   * wurde ("hero" | "pricing" | "final") oder woran ein Formular scheiterte
   * ("email_taken"). Nullable und additiv, damit `drizzle-kit push` im Deploy
   * nicht-interaktiv durchläuft.
   */
  label: text("label"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("platform_visits_timestamp_idx").on(table.timestamp),
  index("platform_visits_visitor_idx").on(table.visitorHash, table.timestamp),
  index("platform_visits_event_idx").on(table.eventType),
  // Der Funnel-Report filtert über beides gleichzeitig.
  index("platform_visits_event_time_idx").on(table.eventType, table.timestamp),
]);

// KI-Zugangsdaten pro User (Bring-Your-Own-Key): Der Kunde hinterlegt seinen
// EIGENEN Provider + API-Key → Trichterwerk trägt keine KI-Kosten. Bewusst eine
// eigene Tabelle (nicht in `users`), damit der verschlüsselte Key NICHT über die
// Session-Deserialisierung / GET /api/auth/user nach außen gelangt.
export const aiCredentials = pgTable("ai_credentials", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // anthropic | openai | openai-compatible
  model: text("model").notNull(),
  baseUrl: text("base_url"), // nur bei openai-compatible
  // AES-256-GCM: "iv:authTag:ciphertext" (hex) — siehe server/crypto.ts.
  keyCiphertext: text("key_ciphertext").notNull(),
  keyLast4: text("key_last4").notNull(), // nur für die maskierte Anzeige, NIE der Key
  testedAt: timestamp("tested_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("ai_credentials_user_id_idx").on(table.userId),
]);

export type InsertAiCredential = typeof aiCredentials.$inferInsert;

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Teams table (Enterprise feature)
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Team members table
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  // NULL = ausstehende Einladung an eine noch nicht registrierte E-Mail
  // (invitedEmail gesetzt). Der Claim bei der Registrierung füllt userId nach.
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"), // owner, admin, member
  invitedEmail: text("invited_email"),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("team_members_team_id_idx").on(table.teamId),
  index("team_members_user_id_idx").on(table.userId),
]);

// E-Mail-Versandprotokoll: Dedupe-Gate für Lifecycle-Mails. Der Unique-Index
// macht den Versand DB-atomar (INSERT zuerst, nur bei Erfolg senden) — auch
// bei mehreren Server-Instanzen oder Stripe-Webhook-Retries kein Doppelversand.
// periodKey: "" für Einmal-Mails, "YYYY-MM" für monatliche, invoice-ID für Dunning.
export const emailLog = pgTable("email_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  emailType: text("email_type").notNull(), // trial_ending_3d, free_downgrade, reengagement_14d, payment_failed, lead_limit_reached
  periodKey: text("period_key").notNull().default(""),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("email_log_dedupe_idx").on(table.userId, table.emailType, table.periodKey),
]);

// Fehlermeldungen aus dem eingeloggten Bereich ("Problem melden"-Widget).
// Screenshot und Anhang liegen bewusst NICHT unter uploads/ — das Verzeichnis
// wird von nginx und express.static ohne jede Auth ausgeliefert, und ein
// Screenshot kann Kontaktdaten der Leads unseres Kunden zeigen. Sie landen in
// private-uploads/bug-reports/ und sind nur über die Admin-Route abrufbar.
// Aufbewahrung (server/scheduler.ts): Bilder 90 Tage, Datensatz 12 Monate.
export const bugReports = pgTable("bug_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  /** Pfad + Query der Seite, auf der gemeldet wurde — Query ist clientseitig um
   *  Secrets (token, code, session_id) bereinigt. */
  pageUrl: text("page_url").notNull(),
  userAgent: text("user_agent"),
  viewport: text("viewport"), // "1440x900@2"
  clientErrors: text("client_errors"), // letzte Konsolenfehler, gekürzt
  screenshotPath: text("screenshot_path"), // Dateiname in private-uploads/bug-reports
  attachmentPath: text("attachment_path"),
  status: text("status").notNull().default("open"), // open | done
  emailSentAt: timestamp("email_sent_at"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  // Admin-Liste filtert nach Status und sortiert nach Datum.
  index("bug_reports_status_created_at_idx").on(table.status, table.createdAt),
  index("bug_reports_user_id_idx").on(table.userId),
]);

// API Keys table (Enterprise feature)
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull(), // Store only the hash, show prefix to user
  keyPrefix: text("key_prefix").notNull(), // e.g. "tw_...abc" for display
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("api_keys_user_id_idx").on(table.userId),
]);

// Sessions table for express-session with connect-pg-simple
export const sessions = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
}, (table) => [
  // connect-pg-simple prunt abgelaufene Sessions über expire — ohne Index
  // ist jeder Prune-Lauf ein Full Table Scan
  index("session_expire_idx").on(table.expire),
]);

// ============ ZOD SCHEMAS & TYPES ============

// User schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  displayName: true,
  isAdmin: true,
  trialEndsAt: true,
  isPro: true,
  subscriptionStatus: true,
  subscriptionPlan: true,
  subscriptionStartedAt: true,
});

// Admin user schema for customer management
export const adminUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  displayName: z.string().nullable(),
  isAdmin: z.boolean(),
  trialEndsAt: z.string().nullable(),
  isPro: z.boolean(),
  subscriptionStatus: z.string(),
  subscriptionPlan: z.string().nullable(),
  subscriptionStartedAt: z.string().nullable(),
  lastLoginAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Additional computed fields for admin view
  funnelCount: z.number().optional(),
  leadCount: z.number().optional(),
  daysInTrial: z.number().optional(),
  isTrialExpired: z.boolean().optional(),
});

export type AdminUser = z.infer<typeof adminUserSchema>;

export const selectUserSchema = createSelectSchema(users);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Funnel Page Types
export type PageType = "welcome" | "question" | "multiChoice" | "contact" | "calendar" | "thankyou";

// Page element/block schema - Extended with OpenFunnels block types
export const pageElementSchema = z.object({
  id: z.string(),
  type: z.enum([
    // Basic
    "heading", "text", "image", "button",
    // Form elements
    "input", "textarea", "select", "checkbox", "radio", "fileUpload", "date",
    // Media
    "video", "audio", "embed",
    // Interactive
    "slider", "testimonial", "faq", "list", "timer", "calendar", "countdown",
    // Advanced
    "code", "chart",
    // Layout
    "socialProof", "divider", "spacer", "progressBar", "icon",
    // Special
    "quiz", "product", "team"
  ]),
  content: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  // Explizites Lead-Feld-Mapping (überschreibt die Label-Heuristik im Public-Funnel).
  // Wenn gesetzt, wird der Wert dieses Inputs eindeutig diesem Lead-Feld zugeordnet.
  mapToLeadField: z.enum(["name", "email", "phone", "company", "message"]).optional(),
  // Validation options for form elements
  validation: z.object({
    type: z.enum(["text", "email", "phone", "url", "number", "custom"]).optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    min: z.number().optional(), // For number inputs
    max: z.number().optional(), // For number inputs
    pattern: z.string().optional(), // Custom regex pattern
    errorMessage: z.string().optional(), // Custom error message
  }).optional(),
  options: z.array(z.string()).optional(),
  optionRouting: z.record(z.string(), z.string()).optional(), // option-text → targetPageId
  label: z.string().optional(),
  acceptedFileTypes: z.array(z.string()).optional(),
  maxFileSize: z.number().optional(),
  maxFiles: z.number().optional(),
  // Video element properties
  videoUrl: z.string().optional(),
  videoType: z.enum(["youtube", "vimeo", "upload"]).optional(),
  videoAutoplay: z.boolean().optional(),
  // Date element properties
  dateFormat: z.string().optional(),
  includeTime: z.boolean().optional(),
  // Slider/Testimonial properties
  slides: z.array(z.object({
    id: z.string(),
    image: z.string().optional(),
    title: z.string().optional(),
    text: z.string().optional(),
    author: z.string().optional(),
    role: z.string().optional(),
    rating: z.number().optional(),
  })).optional(),
  // FAQ properties
  faqItems: z.array(z.object({
    id: z.string(),
    question: z.string(),
    answer: z.string(),
  })).optional(),
  // List properties
  listItems: z.array(z.object({
    id: z.string(),
    text: z.string(),
    icon: z.string().optional(),
    targetPageId: z.string().optional(),
  })).optional(),
  listStyle: z.enum(["bullet", "number", "check", "icon"]).optional(),
  // Timer properties
  timerEndDate: z.string().optional(),
  timerStyle: z.enum(["countdown", "stopwatch"]).optional(),
  timerShowDays: z.boolean().optional(),
  // Social Proof properties
  socialProofType: z.enum(["badges", "logos", "stats", "reviews"]).optional(),
  socialProofItems: z.array(z.object({
    id: z.string(),
    image: z.string().optional(),
    text: z.string().optional(),
    value: z.string().optional(),
  })).optional(),
  // Divider properties
  dividerStyle: z.enum(["solid", "dashed", "dotted", "gradient"]).optional(),
  dividerColor: z.string().optional(),
  // Spacer properties
  spacerHeight: z.number().optional(),
  // ProgressBar properties
  progressValue: z.number().optional(),
  progressShowLabel: z.boolean().optional(),
  // Icon properties
  iconName: z.string().optional(),
  iconSize: z.enum(["sm", "md", "lg", "xl"]).optional(),
  // Image properties
  imageUrl: z.string().optional(),
  imageAlt: z.string().optional(),
  // Quiz properties
  quizConfig: z.object({
    questions: z.array(z.object({
      id: z.string(),
      question: z.string(),
      answers: z.array(z.object({
        id: z.string(),
        text: z.string(),
        points: z.record(z.string(), z.number()),
      })),
    })),
    results: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      minPoints: z.number(),
      maxPoints: z.number(),
      color: z.string(),
    })),
    showProgressBar: z.boolean(),
    shuffleQuestions: z.boolean(),
    shuffleAnswers: z.boolean(),
  }).optional(),
  // Audio properties
  audioUrl: z.string().optional(),
  audioAutoplay: z.boolean().optional(),
  audioLoop: z.boolean().optional(),
  // Calendar/Booking properties
  calendarProvider: z.enum(["calendly", "cal", "custom"]).optional(),
  calendarUrl: z.string().optional(),
  // Chart properties
  chartType: z.enum(["bar", "line", "pie", "doughnut"]).optional(),
  chartData: z.object({
    labels: z.array(z.string()),
    datasets: z.array(z.object({
      label: z.string(),
      data: z.array(z.number()),
      color: z.string().optional(),
    })),
  }).optional(),
  // Code/Embed properties
  codeContent: z.string().max(50000).optional(),
  codeLanguage: z.string().optional(),
  embedCode: z.string().max(50000).optional(),
  embedUrl: z.string().optional(),
  // Countdown properties
  countdownDate: z.string().optional(),
  countdownStyle: z.enum(["flip", "simple", "circular"]).optional(),
  countdownShowLabels: z.boolean().optional(),
  // Product properties
  productName: z.string().optional(),
  productPrice: z.string().optional(),
  productImage: z.string().optional(),
  productDescription: z.string().optional(),
  productButtonText: z.string().optional(),
  productButtonUrl: z.string().optional(),
  // Team properties
  teamMembers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    role: z.string().optional(),
    image: z.string().optional(),
    bio: z.string().optional(),
    social: z.object({
      linkedin: z.string().optional(),
      twitter: z.string().optional(),
      email: z.string().optional(),
    }).optional(),
  })).optional(),
  // Button properties
  buttonUrl: safeUrlSchema.optional(),
  buttonTarget: z.enum(["_self", "_blank"]).optional(),
  buttonVariant: z.enum(["primary", "secondary", "outline", "ghost"]).optional(),
  buttonAction: z.enum(["next", "page", "url"]).optional(), // next=sequential, page=specific page, url=external
  buttonNextPageId: z.string().optional(), // Target page ID when buttonAction="page"
  // Element-weiter Link (für Text-/Heading-/Image-Elemente): wenn gesetzt,
  // wird das gerenderte Element in ein <a href> gewickelt.
  linkUrl: safeUrlSchema.optional(),
  linkTarget: z.enum(["_self", "_blank"]).optional(),
  // General styles (extended)
  styles: z.object({
    fontSize: z.string().optional(),
    fontWeight: z.string().optional(),
    fontStyle: z.string().optional(),
    textAlign: z.string().optional(),
    color: z.string().optional(),
    backgroundColor: z.string().optional(),
    padding: z.string().optional(),
    margin: z.string().optional(),
    borderRadius: z.string().optional(),
    // Extended styles from OpenFunnels
    imageSize: z.string().optional(),
    minHeight: z.string().optional(),
    maxWidth: z.string().optional(),
    boxShadow: z.string().optional(),
    border: z.string().optional(),
    opacity: z.number().optional(),
  }).optional(),
});

export type PageElement = z.infer<typeof pageElementSchema>;

// Column schema for flexible layouts (from OpenFunnels)
export const columnSchema = z.object({
  id: z.string(),
  width: z.number().min(10).max(100), // Percentage width
  elements: z.array(pageElementSchema),
  styles: z.object({
    backgroundColor: z.string().optional(),
    padding: z.string().optional(),
    verticalAlign: z.enum(["top", "middle", "bottom"]).optional(),
  }).optional(),
});

export type Column = z.infer<typeof columnSchema>;

// Section schema for grouping columns (from OpenFunnels)
export const sectionSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  columns: z.array(columnSchema),
  layout: z.enum([
    "single",           // 100%
    "two-equal",        // 50% / 50%
    "two-left",         // 66% / 33%
    "two-right",        // 33% / 66%
    "three-equal",      // 33% / 33% / 33%
    "three-wide-center",// 25% / 50% / 25%
    "four-equal",       // 25% / 25% / 25% / 25%
    "custom",           // Custom widths
  ]).optional(),
  styles: z.object({
    backgroundColor: z.string().optional(),
    backgroundImage: z.string().optional(),
    padding: z.string().optional(),
    margin: z.string().optional(),
    minHeight: z.string().optional(),
    fullWidth: z.boolean().optional(),
  }).optional(),
});

export type Section = z.infer<typeof sectionSchema>;

// Page transition animation types
export type PageAnimation = "fade" | "slide" | "scale" | "none";

// Conditional logic for page routing
export const pageConditionSchema = z.object({
  elementId: z.string(),
  operator: z.enum(["equals", "notEquals", "contains", "isEmpty"]),
  value: z.string().optional(),
  targetPageId: z.string(),
});

export type PageCondition = z.infer<typeof pageConditionSchema>;

// Funnel page schema - Extended with sections support
export const funnelPageSchema = z.object({
  id: z.string(),
  type: z.enum(["welcome", "question", "multiChoice", "contact", "calendar", "thankyou"]),
  title: z.string(),
  subtitle: z.string().optional(),
  // Legacy flat elements array (backward compatible)
  elements: z.array(pageElementSchema),
  // New: Sections with columns for flexible layouts (OpenFunnels style)
  sections: z.array(sectionSchema).optional(),
  // Use sections mode or flat elements mode
  useAdvancedLayout: z.boolean().optional(),
  buttonText: z.string().optional(),
  backgroundColor: z.string().optional(),
  backgroundImage: z.string().optional(),
  // Animation settings
  animation: z.enum(["fade", "slide", "scale", "none"]).optional(),
  // Conditional logic for branching
  conditions: z.array(pageConditionSchema).optional(),
  // Simple conditional routing (option -> pageId mapping)
  conditionalRouting: z.record(z.string(), z.string()).optional(),
  // Default next page ID (overrides sequential navigation)
  nextPageId: z.string().optional(),
  // Show confetti on this page
  showConfetti: z.boolean().optional(),
  // Page visibility (hidden pages are skipped in public view)
  hidden: z.boolean().optional(),
  // Page-level styles (OpenFunnels)
  pageStyles: z.object({
    maxWidth: z.string().optional(),
    padding: z.string().optional(),
    fontFamily: z.string().optional(),
  }).optional(),
});

export type FunnelPage = z.infer<typeof funnelPageSchema>;

// A/B Test Variant schema
export const abTestVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  // Variant can override any page properties
  title: z.string().optional(),
  subtitle: z.string().optional(),
  elements: z.array(pageElementSchema).optional(),
  backgroundColor: z.string().optional(),
  buttonText: z.string().optional(),
  // Traffic allocation percentage (0-100)
  trafficAllocation: z.number().min(0).max(100).default(50),
  // Variant-specific metrics
  views: z.number().default(0),
  conversions: z.number().default(0),
});

export type ABTestVariant = z.infer<typeof abTestVariantSchema>;

// A/B Test schema for page-level testing
export const abTestSchema = z.object({
  id: z.string(),
  name: z.string(),
  pageId: z.string(),
  // Control is the original page, variants are the alternatives
  variants: z.array(abTestVariantSchema),
  // Test status
  status: z.enum(["draft", "running", "paused", "completed"]).default("draft"),
  // Winner variant ID (set when test is completed)
  winnerId: z.string().optional(),
  // Test configuration
  config: z.object({
    // Minimum sample size per variant
    minSampleSize: z.number().default(100),
    // Statistical significance threshold (e.g., 0.95 for 95%)
    significanceThreshold: z.number().default(0.95),
    // Metric to optimize: conversion or engagement
    goalMetric: z.enum(["conversion", "engagement", "time_on_page"]).default("conversion"),
  }).optional(),
  // Test dates
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  createdAt: z.string().optional(),
});

export type ABTest = z.infer<typeof abTestSchema>;

// Theme schema
export const themeSchema = z.object({
  primaryColor: z.string(),
  backgroundColor: z.string(),
  textColor: z.string(),
  fontFamily: z.string(),
});

// ===== KI-Funnel-Erstellung (Bring-Your-Own-Key) =====

export const aiProviderEnum = z.enum(["anthropic", "openai", "openai-compatible"]);
export type AiProvider = z.infer<typeof aiProviderEnum>;

/** Was der Client beim Speichern der KI-Zugangsdaten senden darf. */
export const aiCredentialInputSchema = z
  .object({
    provider: aiProviderEnum,
    model: z.string().min(1).max(100),
    apiKey: z.string().min(20).max(400),
    // Nur für openai-compatible (Groq/Together/OpenRouter/self-hosted). Muss https sein.
    baseUrl: z.string().url().max(300).refine((v) => v.startsWith("https://"), {
      message: "Base-URL muss mit https:// beginnen",
    }).optional().nullable(),
  })
  .refine((d) => d.provider !== "openai-compatible" || !!d.baseUrl, {
    message: "Base-URL ist für OpenAI-kompatible Anbieter erforderlich.",
    path: ["baseUrl"],
  });
export type AiCredentialInput = z.infer<typeof aiCredentialInputSchema>;

/** Was der Server an den Client zurückgibt — NIE der Key selbst. */
export const aiCredentialStatusSchema = z.object({
  configured: z.boolean(),
  provider: aiProviderEnum.optional(),
  model: z.string().optional(),
  baseUrl: z.string().nullable().optional(),
  keyLast4: z.string().optional(),
  testedAt: z.string().nullable().optional(),
});
export type AiCredentialStatus = z.infer<typeof aiCredentialStatusSchema>;

/** Eingabe für die KI-Funnel-Generierung. */
export const generateFunnelInputSchema = z.object({
  description: z.string().min(10).max(2000),
  audience: z.string().max(500).optional(),
  pageCount: z.number().int().min(3).max(10).default(5),
});
export type GenerateFunnelInput = z.infer<typeof generateFunnelInputSchema>;

/** Striktes Ziel-Schema für den KI-Output — nur schema-konformes JSON kommt durch. */
export const aiFunnelOutputSchema = z.object({
  pages: z.array(funnelPageSchema).min(2).max(12),
  theme: themeSchema,
});
export type AiFunnelOutput = z.infer<typeof aiFunnelOutputSchema>;

export type Theme = z.infer<typeof themeSchema>;

// Slug validation schema
export const slugSchema = z.string()
  .min(3, "Slug muss mindestens 3 Zeichen lang sein")
  .max(60, "Slug darf maximal 60 Zeichen lang sein")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Nur Kleinbuchstaben, Zahlen und Bindestriche erlaubt");

// Generate URL-safe slug from funnel name (handles German umlauts)
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[äÄ]/g, "ae")
    .replace(/[öÖ]/g, "oe")
    .replace(/[üÜ]/g, "ue")
    .replace(/[ß]/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// SSRF-Schutz: Webhook-URLs dürfen nur auf öffentliche http(s)-Ziele zeigen.
// Private/interne Hosts (localhost, RFC-1918-Ranges, Link-Local, .local,
// hostnamen ohne Punkt, IPv6) würden dem Server erlauben, interne Dienste
// anzusprechen — der Lead-Webhook feuert serverseitig.
const privateHostPattern =
  /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0$|172\.(1[6-9]|2\d|3[01])\.)/i;

export function isSafeWebhookUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  if (privateHostPattern.test(host)) return false;
  // Bare Hostnames (intranet) und IPv6-Adressen (enthalten ":") ablehnen
  if (!host.includes(".") || host.includes(":")) return false;
  if (host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".lan")) return false;
  return true;
}

// Funnel schema (for API responses)
export const funnelSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  slug: z.string().nullable().optional(),
  userId: z.number(),
  name: z.string(),
  description: z.string().optional().nullable(),
  status: z.enum(["draft", "published", "archived"]),
  pages: z.array(funnelPageSchema),
  theme: themeSchema,
  // A/B Tests
  abTests: z.array(abTestSchema).optional(),
  // Integrations
  // Leer/null erlaubt (zum Deaktivieren/Leeren) — gesetzte Werte werden validiert.
  webhookUrl: z
    .string()
    .nullable()
    .optional()
    .refine((v) => !v || isSafeWebhookUrl(v), {
      message: "Webhook-URL muss eine öffentliche http(s)-Adresse sein",
    }),
  webhookEnabled: z.boolean().optional(),
  webhookSecret: z.string().nullable().optional(),
  // GTM-Container-ID wird im Public-Funnel in ein <script> interpoliert —
  // striktes Format verhindert Script-Injection über dieses Feld.
  gtmId: z
    .string()
    .nullable()
    .optional()
    .refine((v) => !v || /^GTM-[A-Z0-9]{4,16}$/.test(v), {
      message: "Ungültige GTM-Container-ID (Format: GTM-XXXXXXX)",
    }),
  // Format-Validierung: Pixel-ID ist numerisch, Token ausreichend lang.
  // Leer/null erlaubt (zum Deaktivieren/Leeren).
  metaPixelId: z
    .string()
    .nullable()
    .optional()
    .refine((v) => !v || /^\d{6,20}$/.test(v), { message: "Pixel-ID muss numerisch sein (nur Ziffern)" }),
  metaCapiToken: z
    .string()
    .nullable()
    .optional()
    .refine((v) => !v || v.length >= 20, { message: "CAPI-Token sieht zu kurz/ungültig aus" }),
  capiEnabled: z.boolean().optional(),
  capiLastError: z.string().nullable().optional(),
  capiLastErrorAt: z.string().or(z.date()).nullable().optional(),
  // Rechtstexte des Funnel-Owners (Footer-Links im Public-Funnel)
  impressumUrl: z
    .string()
    .nullable()
    .optional()
    .refine((v) => !v || isSafeUrl(v), { message: "Unerlaubtes URL-Protokoll" }),
  datenschutzUrl: z
    .string()
    .nullable()
    .optional()
    .refine((v) => !v || isSafeUrl(v), { message: "Unerlaubtes URL-Protokoll" }),
  ogImageUrl: z
    .string()
    .nullable()
    .optional()
    .refine((v) => !v || isSafeUrl(v), { message: "Unerlaubtes URL-Protokoll" }),
  views: z.number(),
  leads: z.number(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export type Funnel = z.infer<typeof funnelSchema>;

// Insert funnel schema
export const insertFunnelSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  description: z.string().optional(),
  slug: slugSchema.optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  pages: z.array(funnelPageSchema).default([]),
  theme: themeSchema.default({
    primaryColor: "#7C3AED",
    backgroundColor: "#ffffff",
    textColor: "#1a1a1a",
    fontFamily: "Inter",
  }),
  abTests: z.array(abTestSchema).optional(),
});

export type InsertFunnel = z.infer<typeof insertFunnelSchema>;

// Lead schema (for API responses)
export const leadSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  funnelId: z.number(),
  userId: z.number(),
  funnelName: z.string().optional(), // Joined from funnel
  name: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  answers: z.record(z.string(), z.any()).optional().nullable(),
  status: z.enum(["new", "contacted", "qualified", "converted", "lost"]),
  source: z.string().optional().nullable(),
  // Einwilligungsnachweis (Art. 7 Abs. 1 DSGVO)
  marketingConsent: z.boolean().optional(),
  consentAt: z.string().or(z.date()).optional().nullable(),
  createdAt: z.string().or(z.date()),
});

export type Lead = z.infer<typeof leadSchema>;

// Insert lead schema — Längenlimits, weil der Endpunkt öffentlich ist
// (ohne Limits: bis ~1 MB Datenmüll pro Lead über den 1mb-Body-Cap).
export const insertLeadSchema = z.object({
  funnelId: z.number(),
  name: z.string().max(200).optional(),
  email: z.string().email().max(254).optional(),
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  message: z.string().max(5000).optional(),
  answers: z.record(z.string().max(200), z.any()).optional(),
  status: z.enum(["new", "contacted", "qualified", "converted", "lost"]).default("new"),
  source: z.string().max(500).optional(),
  // DSGVO-Marketing-Einwilligung des Besuchers (Cookie-Consent). Wird vom
  // Public-Funnel mitgeschickt und gated server-side Tracking (Meta CAPI).
  marketingConsent: z.boolean().optional(),
});

export type InsertLead = z.infer<typeof insertLeadSchema>;

// Custom-Domain-Schemas
// Exportiert, damit das Frontend (CustomDomainPanel) dieselbe Validierung nutzt.
export const hostnameRegex = /^(?=.{3,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

export const domainSchema = z.object({
  id: z.number(),
  funnelId: z.number(),
  userId: z.number(),
  hostname: z.string(),
  verified: z.boolean(),
  verificationToken: z.string(),
  // pending: SSL-Ausstellung läuft (Server-Provisioner arbeitet die Domain ab),
  // active: Zertifikat + nginx-vhost stehen, error: Ausstellung fehlgeschlagen.
  // Wird von deploy/domain-provisioner.sh direkt per SQL fortgeschrieben —
  // bei Umbenennung der Spalte das Skript mit anpassen.
  sslStatus: z.enum(["pending", "active", "error"]),
  createdAt: z.string().or(z.date()),
  verifiedAt: z.string().or(z.date()).nullable().optional(),
});
export type Domain = z.infer<typeof domainSchema>;

// API-Antworten geben den verificationToken nicht mehr heraus (serverseitiges
// Geheimnis für den Legacy-TXT-Fallback) — das Frontend arbeitet mit dieser Form.
export type PublicDomain = Omit<Domain, "verificationToken">;

export const insertDomainSchema = z.object({
  funnelId: z.number(),
  hostname: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(253)
    .regex(hostnameRegex, "Ungültiger Hostname"),
});
export type InsertDomain = z.infer<typeof insertDomainSchema>;

// Analytics schema
export const analyticsEventSchema = z.object({
  id: z.number(),
  funnelId: z.number(),
  eventType: z.enum(["view", "pageView", "click", "submit", "complete"]),
  pageId: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
  timestamp: z.string().or(z.date()),
});

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;

// Insert analytics schema
export const insertAnalyticsSchema = z.object({
  funnelId: z.number(),
  eventType: z.enum(["view", "pageView", "click", "submit", "complete"]),
  pageId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;

/**
 * Alle Ereignistypen, die in `platform_visits` vorkommen können.
 *
 * Wichtig ist die Trennung darunter: `CLIENT_TRACKABLE_EVENTS` sind die, die ein
 * Browser melden darf. `register`, `trial_started` und `purchase` entstehen
 * ausschließlich serverseitig — sie sind die Zahlen, an denen Kampagnen bewertet
 * werden, und dürfen nicht von außen setzbar sein.
 */
export const PLATFORM_EVENT_TYPES = [
  "pageview",
  "cta_click",
  "form_start",
  "form_submit_error",
  "form_abort",
  "consent_accept",
  "consent_reject",
  "checkout_redirect",
  "register",
  "trial_started",
  "purchase",
] as const;

export const CLIENT_TRACKABLE_EVENTS = [
  "pageview",
  "cta_click",
  "form_start",
  "form_submit_error",
  "form_abort",
  "consent_accept",
  "consent_reject",
  "checkout_redirect",
] as const;

export type PlatformEventType = (typeof PLATFORM_EVENT_TYPES)[number];

// Plattform-Tracking: was der Client-Beacon senden DARF. visitorHash, country
// und deviceClass werden ausschließlich serverseitig gesetzt (nicht vom Client).
// eventType ist hier bewusst auf CLIENT_TRACKABLE_EVENTS begrenzt: vorher stand
// "register" im Enum, sodass ein einzelnes curl die Registrierungszahl im
// Admin-Dashboard hochtreiben konnte.
export const trackEventSchema = z.object({
  path: z.string().min(1).max(200),
  referrer: z.string().max(500).optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  label: z.string().max(60).optional(),
  eventType: z.enum(CLIENT_TRACKABLE_EVENTS).default("pageview"),
});

export type TrackEvent = z.infer<typeof trackEventSchema>;

// Was in platform_visits geschrieben wird (Server-intern, nach Ableitung).
export type InsertPlatformVisit = typeof platformVisits.$inferInsert;

// Template schema (for API responses)
export const templateSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(["leads", "sales", "recruiting", "webinar", "quiz", "survey"]),
  thumbnail: z.string().optional().nullable(),
  pages: z.array(funnelPageSchema),
  theme: themeSchema,
  createdAt: z.string().or(z.date()),
});

export type Template = z.infer<typeof templateSchema>;

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Benutzername ist erforderlich"),
  password: z.string().min(1, "Passwort ist erforderlich"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Eine Passwort-Policy für ALLE Pfade (Registrierung, Reset, Ändern) —
// vorher akzeptierte der Reset schwächere Passwörter als die Registrierung.
//
// Länge statt Zeichenklassen: NIST SP 800-63B rät ausdrücklich von
// Kompositionsregeln ab, weil "8 Zeichen + Großbuchstabe + Zahl" zuverlässig
// `Sommer2026!` produziert. 10 frei gewählte Zeichen sind stärker — und im
// Formular fällt die häufigste Fehlermeldung weg.
export const PASSWORD_MIN_LENGTH = 10;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Passwort muss mindestens ${PASSWORD_MIN_LENGTH} Zeichen haben`);

export const registerSchema = z.object({
  /**
   * Optional: fehlt er, leitet der Server ihn aus der E-Mail ab. Ein separater
   * Benutzername neben der E-Mail war ein Pflichtfeld ohne Gegenwert — die
   * LocalStrategy akzeptiert zum Login längst beides, und im UI erscheint er
   * nur als Initialen und @handle, nie in einer URL.
   */
  username: z
    .string()
    .min(3, "Benutzername muss mindestens 3 Zeichen haben")
    .max(30, "Benutzername darf höchstens 30 Zeichen haben")
    .optional(),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: passwordSchema,
  displayName: z.string().optional(),
  /**
   * Marketing-Einwilligung aus dem Cookie-Banner. Nur damit darf die
   * Registrierung serverseitig an die Meta Conversions API gemeldet werden —
   * der Server kennt den Banner-Zustand (localStorage) sonst nicht.
   * Fehlt das Feld, gilt "keine Einwilligung".
   */
  marketingConsent: z.boolean().optional(),
  /**
   * Empfehlungscode aus /register?ref=… (localStorage-Handoff wie beim
   * template-Param). Unbekannte Codes und Selbst-Referrals werden serverseitig
   * still ignoriert — die Registrierung scheitert daran nie.
   */
  referralCode: z.string().max(32).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Team schemas
export const teamSchema = z.object({
  id: z.number(),
  name: z.string(),
  ownerId: z.number(),
  createdAt: z.string().or(z.date()),
  // Joined field: role of the current user in this team
  role: z.enum(["owner", "admin", "member"]).optional(),
});

export type Team = z.infer<typeof teamSchema>;

export const insertTeamSchema = z.object({
  name: z.string().min(1, "Teamname ist erforderlich").max(100),
});

export type InsertTeam = z.infer<typeof insertTeamSchema>;

export const teamMemberSchema = z.object({
  id: z.number(),
  teamId: z.number(),
  // NULL = ausstehende Einladung (invitedEmail gesetzt, noch nicht registriert)
  userId: z.number().nullable(),
  role: z.enum(["owner", "admin", "member"]),
  invitedEmail: z.string().nullable().optional(),
  acceptedAt: z.string().or(z.date()).nullable().optional(),
  createdAt: z.string().or(z.date()),
  // Joined fields
  username: z.string().optional(),
  email: z.string().optional(),
  displayName: z.string().nullable().optional(),
});

export type TeamMember = z.infer<typeof teamMemberSchema>;

// API Key schemas
export const apiKeySchema = z.object({
  id: z.number(),
  userId: z.number(),
  name: z.string(),
  keyPrefix: z.string(),
  lastUsedAt: z.string().or(z.date()).nullable().optional(),
  createdAt: z.string().or(z.date()),
});

export type ApiKey = z.infer<typeof apiKeySchema>;

export const insertApiKeySchema = z.object({
  name: z.string().min(1, "API-Key Name ist erforderlich").max(100),
});

export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

// ============ FEHLERMELDUNGEN (Bug-Report-Widget) ============

/** Erlaubte Zustände einer Fehlermeldung. */
export const BUG_REPORT_STATUSES = ["open", "done"] as const;
export type BugReportStatus = (typeof BUG_REPORT_STATUSES)[number];

/** Vom Client gesendete Felder. Nutzer-ID, E-Mail und Plan setzt der Server
 *  aus der Session — der Client darf sie nicht bestimmen. */
export const insertBugReportSchema = z.object({
  description: z
    .string()
    .trim()
    .min(5, "Bitte beschreibe das Problem in mindestens 5 Zeichen")
    .max(BUG_REPORT_MAX_DESCRIPTION, `Die Beschreibung darf höchstens ${BUG_REPORT_MAX_DESCRIPTION} Zeichen lang sein`),
  pageUrl: z.string().trim().min(1, "Seitenangabe fehlt").max(500),
  userAgent: z.string().trim().max(500).optional(),
  viewport: z.string().trim().max(32).optional(),
  clientErrors: z.string().trim().max(2000).optional(),
});

export type InsertBugReport = z.infer<typeof insertBugReportSchema>;

/** Statuswechsel im Admin-Bereich. */
export const updateBugReportSchema = z.object({
  status: z.enum(BUG_REPORT_STATUSES),
});

/** Eine Fehlermeldung, wie der Admin-Bereich sie liest (inkl. Melder-Angaben). */
export const bugReportSchema = z.object({
  id: z.number(),
  userId: z.number(),
  description: z.string(),
  pageUrl: z.string(),
  userAgent: z.string().nullable().optional(),
  viewport: z.string().nullable().optional(),
  clientErrors: z.string().nullable().optional(),
  screenshotPath: z.string().nullable().optional(),
  attachmentPath: z.string().nullable().optional(),
  status: z.enum(BUG_REPORT_STATUSES),
  emailSentAt: z.string().or(z.date()).nullable().optional(),
  resolvedAt: z.string().or(z.date()).nullable().optional(),
  createdAt: z.string().or(z.date()),
  // Joined
  reporterEmail: z.string().optional(),
  reporterUsername: z.string().optional(),
});

export type BugReport = z.infer<typeof bugReportSchema>;
