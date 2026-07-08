/**
 * Generiert die Galerie-Assets pro Template (shared/template-meta.ts):
 *   - Portrait-Poster (erste Funnel-Seite):  client/public/templates/portrait/<slug>.webp + .png
 *   - Hover-Video (5–10s Funnel-Durchlauf):  client/public/templates/videos/<slug>.webm + .mp4
 *
 * Nutzt den Aufnahmemodus der Detailseite (/vorlagen/<slug>?video=1 — nackter
 * Funnel ohne Header/Phone-Frame) und klickt sich scripted durch 3–4 Schritte.
 *
 * Voraussetzung: laufender Server mit der /vorlagen-Route. Am einfachsten der
 * E2E-Server (Port 5137, eigene Wegwerf-DB):
 *   npm run test:e2e:server        # Terminal 1
 *   npm run generate:template-videos   # Terminal 2
 * Abweichender Server: BASE_URL=http://localhost:5000 npm run generate:template-videos
 * Nur einzelne Templates: npm run generate:template-videos -- termin-buchen quiz
 *
 * .mp4-Fallback (alte Safari) entsteht nur, wenn ffmpeg im PATH ist.
 */
import { chromium } from "@playwright/test";
import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { templateMetas } from "../shared/template-meta";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:5137";
const ROOT = path.resolve(import.meta.dirname, "..");
const PORTRAIT_DIR = path.join(ROOT, "client/public/templates/portrait");
const VIDEO_DIR = path.join(ROOT, "client/public/templates/videos");
const VIEWPORT = { width: 375, height: 740 };
const STEP_PAUSE_MS = 900;
const MAX_STEPS = 4;

function hasFfmpeg(): boolean {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function assertServerReachable(): Promise<void> {
  try {
    const res = await fetch(BASE_URL, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.error(
      `Kein Server unter ${BASE_URL} erreichbar (${(err as Error).message}).\n` +
        `Starte z. B. den E2E-Server: npm run test:e2e:server`,
    );
    process.exit(1);
  }
}

async function main() {
  await assertServerReachable();
  fs.mkdirSync(PORTRAIT_DIR, { recursive: true });
  fs.mkdirSync(VIDEO_DIR, { recursive: true });

  const onlySlugs = process.argv.slice(2);
  const targets = onlySlugs.length
    ? templateMetas.filter((t) => onlySlugs.includes(t.slug))
    : templateMetas;
  if (!targets.length) {
    console.error(`Keine passenden Slugs: ${onlySlugs.join(", ")}`);
    process.exit(1);
  }

  const ffmpeg = hasFfmpeg();
  if (!ffmpeg) console.warn("ffmpeg nicht gefunden — es entstehen nur .webm-Videos.");

  const browser = await chromium.launch();
  const tmpVideoDir = fs.mkdtempSync(path.join(ROOT, ".template-videos-"));

  try {
    for (const meta of targets) {
      const url = `${BASE_URL}/vorlagen/${meta.slug}?video=1`;
      console.log(`▸ ${meta.slug} — ${url}`);

      const context = await browser.newContext({
        viewport: VIEWPORT,
        deviceScaleFactor: 2,
        recordVideo: { dir: tmpVideoDir, size: VIEWPORT },
        reducedMotion: "no-preference",
      });
      // Cookie-Banner stummschalten — er läge sonst halbtransparent über der Aufnahme.
      await context.addInitScript(() => {
        localStorage.setItem("trichterwerk-cookie-consent", "true");
        localStorage.setItem(
          "trichterwerk-cookie-preferences",
          JSON.stringify({ necessary: true, analytics: false, marketing: false }),
        );
      });
      const page = await context.newPage();

      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(
        '[data-testid="button-funnel-next"], [data-testid="button-funnel-submit"]',
        { timeout: 15000 },
      );
      // Fonts/Bilder kurz setzen lassen, dann Poster der ersten Seite schießen.
      await page.waitForTimeout(800);
      const posterPng = await page.screenshot({ type: "png" });
      await sharp(posterPng).webp({ quality: 80 }).toFile(path.join(PORTRAIT_DIR, `${meta.slug}.webp`));
      await sharp(posterPng).png({ compressionLevel: 9 }).toFile(path.join(PORTRAIT_DIR, `${meta.slug}.png`));

      // Scripted Walkthrough: Option wählen → Weiter; auf der Kontaktseite
      // Felder befüllen und stoppen (kein Submit — es soll kein Abschluss
      // suggeriert und nichts gespeichert werden; Preview-Mode POSTet ohnehin nie).
      let lastTitle = await page.locator("h1").first().textContent().catch(() => null);
      for (let step = 0; step < MAX_STEPS; step++) {
        await page.waitForTimeout(STEP_PAUSE_MS);

        const radio = page.locator('label:has(input[type="radio"])').first();
        if (await radio.count()) {
          await radio.click().catch(() => {});
          await page.waitForTimeout(600);
        }

        const next = page.locator('[data-testid="button-funnel-next"]');
        if (await next.count()) {
          await next.click().catch(() => {});
          await page.waitForTimeout(400);
          const title = await page.locator("h1").first().textContent().catch(() => null);
          if (title === lastTitle) break; // Validierung blockiert (z. B. Quiz) → Aufnahme beenden
          lastTitle = title;
          continue;
        }

        // Kontakt-/letzte Seite: sichtbare Textfelder demo-befüllen (ohne Honeypot).
        const inputs = page.locator(
          'input:visible:not([type="radio"]):not([type="checkbox"]):not([name="website"])',
        );
        const demo = ["Max", "Mustermann", "max@beispiel.de", "0151 2345678"];
        const count = Math.min(await inputs.count(), demo.length);
        for (let i = 0; i < count; i++) {
          await inputs.nth(i).fill(demo[i]).catch(() => {});
          await page.waitForTimeout(250);
        }
        await page.waitForTimeout(STEP_PAUSE_MS);
        break;
      }

      const video = page.video();
      await context.close(); // finalisiert die Aufnahme
      const recordedPath = await video?.path();
      if (recordedPath) {
        const webmPath = path.join(VIDEO_DIR, `${meta.slug}.webm`);
        fs.copyFileSync(recordedPath, webmPath);
        if (ffmpeg) {
          // H.264 braucht gerade Dimensionen (375px → 374/376) + faststart fürs Web.
          execFileSync("ffmpeg", [
            "-y", "-loglevel", "error",
            "-i", webmPath,
            "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "28",
            "-movflags", "+faststart", "-an",
            path.join(VIDEO_DIR, `${meta.slug}.mp4`),
          ]);
        }
        console.log(`  ✓ Poster + Video gespeichert`);
      } else {
        console.warn(`  ⚠ Kein Video aufgezeichnet für ${meta.slug}`);
      }
    }
  } finally {
    await browser.close();
    fs.rmSync(tmpVideoDir, { recursive: true, force: true });
  }

  console.log(`\nFertig: ${targets.length} Template(s) → ${PORTRAIT_DIR} + ${VIDEO_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
