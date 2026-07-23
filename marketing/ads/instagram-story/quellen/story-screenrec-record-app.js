// Nimmt den echten Produkt-Flow als Video auf (Playwright recordVideo).
// Flow analog tests-e2e/funnel-lifecycle.spec.ts: Registrieren → Verifizieren →
// Template wählen → Funnel erstellen → Editor → Publizieren.
// Loggt Zeitmarken (Sekunden seit Aufnahmestart) für den späteren Schnitt.
const { chromium } = require('/Users/dennissasse/Desktop/DEV/Trichterwerk/Funnelsoftware/node_modules/playwright');
const { Pool } = require('/Users/dennissasse/Desktop/DEV/Trichterwerk/Funnelsoftware/node_modules/pg');

const BASE = 'http://localhost:5137';
const OUTDIR = process.argv[2];
const id = 'ad' + String(Math.floor(process.uptime() * 1000) % 1000000);

const SILENCE_OVERLAYS = `
  localStorage.setItem("onboarding-completed", "true");
  localStorage.setItem("trichterwerk-cookie-consent", "true");
  localStorage.setItem("trichterwerk-cookie-preferences", JSON.stringify({ necessary: true, analytics: false, marketing: false }));
`;

(async () => {
  const pool = new Pool({ connectionString: 'postgresql://dennissasse@localhost:5432/funnelsoftware_e2e' });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1152, height: 720 },
    deviceScaleFactor: 2,
    recordVideo: { dir: OUTDIR, size: { width: 1152, height: 720 } },
  });
  const page = await ctx.newPage();
  await page.addInitScript(SILENCE_OVERLAYS);

  const t0 = Date.now();
  const mark = (label) => console.log(`MARK ${((Date.now() - t0) / 1000).toFixed(2)}s ${label}`);
  const pause = (ms) => page.waitForTimeout(ms);

  // --- Setup (unwichtig fürs Video, läuft aber mit auf — wird weggeschnitten)
  const email = `${id}@example.com`;
  await page.goto(`${BASE}/register`);
  await page.fill('#username', id);
  await page.fill('#email', email);
  await page.fill('#password', 'AdDemo123!x');
  await page.fill('#confirmPassword', 'AdDemo123!x');
  await page.getByTestId('button-register-submit').click();
  await page.waitForURL(`${BASE}/`);
  const { rows } = await pool.query(
    'SELECT email_verification_token FROM users WHERE email = $1', [email],
  );
  await page.request.get(`${BASE}/api/auth/verify-email?token=${encodeURIComponent(rows[0].email_verification_token)}`);
  mark('setup-done');

  // --- Segment 1: Template-Galerie ansehen + Template wählen
  await page.goto(`${BASE}/funnels/new`);
  await page.waitForLoadState('networkidle');
  await pause(400);
  mark('SEG1_START galerie sichtbar');
  await pause(1200);
  // sanft scrollen, damit die Galerie lebt
  await page.mouse.wheel(0, 300);
  await pause(900);
  await page.mouse.wheel(0, -300);
  await pause(700);
  const terminCard = page.getByTestId('template-template-termin');
  const card = (await terminCard.count()) ? terminCard : page.getByTestId('template-template-vsl-demo');
  await card.hover();
  await pause(600);
  await card.click();
  await pause(800);
  await page.getByTestId('button-continue').click();
  await pause(600);
  await page.getByTestId('input-funnel-name').fill('Strategiegespräch');
  await pause(800);
  mark('SEG1_END name eingegeben');
  await page.getByTestId('button-create-funnel').click();
  await page.waitForURL(/\/funnels\/(\d+)$/);
  const funnelId = page.url().match(/\/funnels\/(\d+)$/)[1];

  // --- Segment 2: Editor
  await page.waitForLoadState('networkidle');
  await pause(600);
  mark('SEG2_START editor sichtbar');
  await pause(1500);
  // etwas Leben: durch die Seiten klicken, wenn Navigator da ist; sonst scrollen
  await page.mouse.wheel(0, 250);
  await pause(1000);
  await page.mouse.wheel(0, 250);
  await pause(1000);
  await page.mouse.wheel(0, -500);
  await pause(1200);
  mark('SEG2_END');

  // --- Segment 3: Publizieren
  mark('SEG3_START publish klick');
  await page.getByTestId('button-publish').click();
  await pause(900);
  await page.getByTestId('input-publish-slug').fill(`strategie-${id}`);
  await pause(600);
  const confirm = page.getByTestId('button-confirm-publish');
  await confirm.isEnabled() || await page.waitForTimeout(1200);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes(`/api/funnels/${funnelId}`) && r.request().method() === 'PATCH'),
    confirm.click(),
  ]);
  await pause(1800);
  mark('SEG3_END publiziert');

  await pause(500);
  await ctx.close(); // schreibt das Video fertig
  await browser.close();
  await pool.end();
  console.log('VIDEO_DIR ' + OUTDIR);
})().catch((e) => { console.error(e); process.exit(1); });
