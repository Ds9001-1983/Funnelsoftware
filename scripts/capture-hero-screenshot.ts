/**
 * Nimmt das Hero-Bild der Startseite als echten Screenshot des echten Dashboards auf:
 *   client/public/images/hero-dashboard.png + .webp   (1200×800, @2x gerendert)
 *
 * Warum ein Skript statt eines gerenderten Mockups: Das frühere Hero-Bild war
 * KI-generiert und enthielt sichtbare Textfehler („Deshboard", „Sales Manument",
 * „All statics"). Ein Screenshot der laufenden App kann solche Fehler nicht
 * enthalten und lässt sich nach jedem UI-Update in Sekunden neu erzeugen.
 *
 * Ablauf: Demo-Konto per API anlegen → Demo-Funnels + Leads einspielen →
 * Dashboard aufrufen → Screenshot. Die Demo-Daten sind bewusst plausibel, aber
 * eindeutig fiktiv (E-Mails auf example.com — RFC 2606, kann niemandem gehören).
 *
 * Voraussetzung: laufender E2E-Server auf der Wegwerf-DB.
 *   npm run test:e2e:server      # Terminal 1
 *   npm run capture:hero         # Terminal 2
 *
 * Optionen:
 *   BASE_URL=…      Zielserver (Default: http://localhost:5137)
 *   DATABASE_URL=…  Datenbank desselben Servers (Default: die E2E-Wegwerf-DB)
 *   THEME=dark|light|both   Welche Variante(n) aufnehmen (Default: both)
 *
 * Sicherheitsnetz: Das Skript schreibt Demo-Daten und weigert sich deshalb,
 * gegen eine nicht-lokale Datenbank zu laufen (siehe assertLocalDatabase).
 */
import { chromium, type Browser } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import sharp from "sharp";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:5137";
const DATABASE_URL =
  process.env.DATABASE_URL ??
  `postgresql://${process.env.USER ?? "postgres"}@localhost:5432/funnelsoftware_e2e`;
const THEME = (process.env.THEME ?? "dark") as "dark" | "light" | "both";

const ROOT = path.resolve(import.meta.dirname, "..");
const IMAGE_DIR = path.join(ROOT, "client/public/images");

/**
 * Aufnahme-Viewport. Bewusst größer als das Zielmaß und im selben 3:2, damit
 * mehr vom Dashboard ins Bild passt und die UI im fertigen Hero feiner wirkt.
 */
const VIEWPORT = { width: 1440, height: 960 };

/** Zielmaß des Hero-Bilds — identisch zu width/height in landing.tsx, @2x ausgeliefert. */
const OUTPUT = { width: 2400, height: 1600 };

/**
 * Demo-Funnels. Namen und Kennzahlen sind so gewählt, dass sie ein plausibel
 * genutztes Konto zeigen — nicht Rekordwerte, die unglaubwürdig wirken.
 */
const DEMO_FUNNELS = [
  {
    name: "Erstgespräch Q4-Kampagne",
    description: "Terminbuchung mit Budget-Qualifizierung",
    views: 4820,
    leads: 412,
  },
  {
    name: "Leadmagnet: Funnel-Checkliste",
    description: "PDF-Download gegen E-Mail-Adresse",
    views: 3140,
    leads: 356,
  },
  {
    name: "Webinar-Anmeldung Oktober",
    description: "Registrierung inkl. Erinnerungsstrecke",
    views: 2265,
    leads: 198,
  },
];

/**
 * Demo-Leads für die „Neueste Leads"-Karte. `minutesAgo` steuert die relative
 * Zeitangabe im UI („vor 12 Min"), `status` die farbige Statuskugel.
 */
const DEMO_LEADS = [
  { name: "Lena Hoffmann", email: "l.hoffmann@example.com", funnel: 0, minutesAgo: 12, status: "new" },
  { name: "Tobias Reinhardt", email: "t.reinhardt@example.com", funnel: 1, minutesAgo: 47, status: "new" },
  { name: "Sandra Költzsch", email: "s.koeltzsch@example.com", funnel: 0, minutesAgo: 185, status: "contacted" },
  { name: "Michael Bauer", email: "m.bauer@example.com", funnel: 2, minutesAgo: 320, status: "qualified" },
  { name: "Nadine Wolters", email: "n.wolters@example.com", funnel: 1, minutesAgo: 1490, status: "converted" },
];

/**
 * Das Skript legt Demo-Daten an und darf deshalb nie eine echte Datenbank
 * treffen. Erlaubt sind nur lokale Hosts — die Prod-DB läuft remote.
 */
function assertLocalDatabase(url: string): void {
  const host = new URL(url).hostname;
  if (!["localhost", "127.0.0.1", "::1"].includes(host)) {
    console.error(
      `Abbruch: DATABASE_URL zeigt auf "${host}", nicht auf localhost.\n` +
        `Dieses Skript schreibt Demo-Daten und darf nur gegen eine lokale Wegwerf-DB laufen.`,
    );
    process.exit(1);
  }
}

async function assertServerReachable(): Promise<void> {
  try {
    const res = await fetch(BASE_URL, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.error(
      `Kein Server unter ${BASE_URL} erreichbar (${(err as Error).message}).\n` +
        `Starte zuerst: npm run test:e2e:server`,
    );
    process.exit(1);
  }
}

/**
 * Legt das Demo-Konto an und verifiziert es. Läuft über die echten Endpunkte,
 * damit das Konto denselben Zustand hat wie ein regulär registrierter Nutzer.
 * Die Session-Cookies landen im BrowserContext, aus dem `request` stammt.
 */
async function createDemoAccount(
  request: import("@playwright/test").APIRequestContext,
  pool: pg.Pool,
  email: string,
): Promise<number> {
  const res = await request.post("/api/auth/register", {
    data: { username: email.split("@")[0], email, password: "HeroDemo2026!" },
  });
  if (res.status() !== 201) {
    throw new Error(`Registrierung fehlgeschlagen (${res.status()}): ${await res.text()}`);
  }

  const { rows } = await pool.query<{ id: number; email_verification_token: string }>(
    "SELECT id, email_verification_token FROM users WHERE email = $1",
    [email],
  );
  const user = rows[0];
  if (!user) throw new Error(`Demo-Konto ${email} nicht in der DB gefunden`);

  const verify = await request.get(
    `/api/auth/verify-email?token=${encodeURIComponent(user.email_verification_token)}`,
  );
  if (!verify.ok()) throw new Error(`E-Mail-Verifikation fehlgeschlagen (${verify.status()})`);

  // Aktives Abo + Anzeigename: unterdrückt den Trial-Ablauf-Banner, der sonst
  // quer über dem Screenshot läge, und füllt die Begrüßung.
  await pool.query(
    `UPDATE users
        SET subscription_status = 'active',
            subscription_plan = 'pro',
            is_pro = true,
            display_name = 'Demo',
            email_verified_at = now()
      WHERE id = $1`,
    [user.id],
  );

  return user.id;
}

/** Spielt Funnels und Leads direkt in die DB — Views/Leads-Zähler sind sonst nur über Tausende echter Requests erreichbar. */
async function seedDemoData(pool: pg.Pool, userId: number, runId: string): Promise<void> {
  const funnelIds: number[] = [];

  for (const [i, funnel] of DEMO_FUNNELS.entries()) {
    const { rows } = await pool.query<{ id: number }>(
      `INSERT INTO funnels (user_id, name, description, status, slug, pages, views, leads_count, created_at, updated_at)
       VALUES ($1, $2, $3, 'published', $4, $5::jsonb, $6, $7, now() - ($8 || ' days')::interval, now())
       RETURNING id`,
      [
        userId,
        funnel.name,
        funnel.description,
        `demo-${runId}-${i}`,
        JSON.stringify([
          { id: "page-1", type: "welcome", title: funnel.name, elements: [], buttonText: "Start" },
        ]),
        funnel.views,
        funnel.leads,
        String(30 - i * 7),
      ],
    );
    funnelIds.push(rows[0].id);
  }

  for (const lead of DEMO_LEADS) {
    await pool.query(
      `INSERT INTO leads (funnel_id, user_id, name, email, status, source, created_at)
       VALUES ($1, $2, $3, $4, $5, 'demo', now() - ($6 || ' minutes')::interval)`,
      [funnelIds[lead.funnel], userId, lead.name, lead.email, lead.status, String(lead.minutesAgo)],
    );
  }
}

/** Nimmt das Dashboard in einem Theme auf und schreibt PNG + WebP. */
async function capture(browser: Browser, theme: "dark" | "light", suffix: string): Promise<void> {
  const context = await browser.newContext({
    // Ohne baseURL scheitern die relativen Pfade in page.request/page.goto —
    // das Skript läuft außerhalb der Playwright-Config, die sie sonst liefert.
    baseURL: BASE_URL,
    viewport: VIEWPORT,
    // @2x rendern: Der Screenshot ist danach 2400×1600 und bleibt auf
    // Retina-Displays scharf, wenn er auf 1200 CSS-Pixel skaliert wird.
    deviceScaleFactor: 2,
    locale: "de-DE",
    timezoneId: "Europe/Berlin",
    reducedMotion: "reduce",
  });

  // Overlays stummschalten, die sonst über dem Dashboard lägen.
  await context.addInitScript((selectedTheme: string) => {
    localStorage.setItem("trichterwerk-theme", selectedTheme);
    localStorage.setItem("onboarding-completed", "true");
    localStorage.setItem("trichterwerk-cookie-consent", "true");
    localStorage.setItem(
      "trichterwerk-cookie-preferences",
      JSON.stringify({ necessary: true, analytics: false, marketing: false }),
    );
  }, theme);

  // Session auf UTC: Die Zeitstempel im Schema sind `timestamp without time
  // zone`, und der Server-Prozess liest sie als UTC. Schriebe dieses Skript in
  // lokaler Zeit (Europe/Berlin), lägen die Leads zwei Stunden in der Zukunft —
  // im Dashboard stünde dann „vor -108 Min".
  const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    max: 2,
    options: "-c timezone=UTC",
  });
  const page = await context.newPage();

  try {
    const runId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const email = `hero-${runId}@example.com`;

    const userId = await createDemoAccount(page.request, pool, email);
    await seedDemoData(pool, userId, runId);

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    // Auf echte Daten warten, nicht auf die Skeleton-Platzhalter: Der
    // Funnel-Name erscheint erst, wenn beide Queries aufgelöst sind.
    await page.getByText(DEMO_FUNNELS[0].name).first().waitFor({ timeout: 20_000 });
    await page.getByText(DEMO_LEADS[0].name).first().waitFor({ timeout: 20_000 });

    // Webfonts fertig laden lassen, sonst rendert der Screenshot Fallback-Schrift.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600);

    const png = await page.screenshot({ type: "png" });
    const target = path.join(IMAGE_DIR, `hero-dashboard${suffix}`);

    // WebP in @2x (das ist die Datei, die praktisch jeder Browser bekommt),
    // PNG nur in @1x — es ist reiner Fallback und muss nicht retina-scharf sein.
    await sharp(png)
      .resize(OUTPUT.width, OUTPUT.height, { fit: "fill" })
      .webp({ quality: 82 })
      .toFile(`${target}.webp`);
    await sharp(png)
      .resize(OUTPUT.width / 2, OUTPUT.height / 2, { fit: "fill" })
      .png({ compressionLevel: 9 })
      .toFile(`${target}.png`);

    const kb = (f: string) => Math.round(fs.statSync(f).size / 1024);
    console.log(
      `  ✓ ${theme}: hero-dashboard${suffix}.png (${kb(`${target}.png`)} KB) + .webp (${kb(`${target}.webp`)} KB)`,
    );
  } finally {
    await pool.end();
    await context.close();
  }
}

async function main() {
  assertLocalDatabase(DATABASE_URL);
  await assertServerReachable();
  fs.mkdirSync(IMAGE_DIR, { recursive: true });

  const themes: Array<{ theme: "dark" | "light"; suffix: string }> =
    THEME === "both"
      ? [
          { theme: "dark", suffix: "" },
          { theme: "light", suffix: "-light" },
        ]
      : [{ theme: THEME, suffix: "" }];

  const browser = await chromium.launch();
  try {
    for (const { theme, suffix } of themes) {
      console.log(`▸ Dashboard aufnehmen (${theme})`);
      await capture(browser, theme, suffix);
    }
  } finally {
    await browser.close();
  }

  console.log(`\nFertig → ${IMAGE_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
