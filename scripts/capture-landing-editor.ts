/** Capture the real editor with local example data. No production connection.
 * Start the isolated E2E server, then run with the same E2E_DATABASE_URL:
 * E2E_DATABASE_URL=postgresql://.../funnelsoftware_e2e_landing npx tsx scripts/capture-landing-editor.ts
 */
import { chromium, expect } from "@playwright/test";
import sharp from "sharp";
import path from "node:path";
import { registerAndVerify, getCsrfToken } from "../tests-e2e/helpers/api";
import { closePool } from "../tests-e2e/helpers/db";
import { E2E_BASE_URL } from "../tests-e2e/helpers/env";
import { remapElementIds } from "../client/src/lib/utils";
import { getTemplateBySlug } from "../client/src/lib/templates";

const browser = await chromium.launch();
try {
  const context = await browser.newContext({ baseURL: E2E_BASE_URL, viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    localStorage.setItem("onboarding-completed", "true");
    localStorage.setItem("trichterwerk-cookie-consent", "true");
    localStorage.setItem("trichterwerk-theme", "light");
  });
  await registerAndVerify(context.request);
  const template = getTemplateBySlug("express-bewerbung")!;
  const headers = { "X-CSRF-Token": await getCsrfToken(context.request) };
  const result = await context.request.post("/api/funnels", { headers, data: { name: "Express-Bewerbung · Beispiel", pages: remapElementIds(template.pages), theme: template.theme } });
  if (!result.ok()) throw new Error(`Local example creation failed: ${result.status()}`);
  const funnel = await result.json();
  const page = await context.newPage();
  await page.goto(`/funnels/${funnel.id}`);
  await expect(page.getByTestId("button-publish")).toBeVisible();
  await expect(page.locator("[data-funnel-element]").first()).toBeVisible();
  await page.mouse.move(20, 20);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
  await sharp(await page.screenshot()).webp({ quality: 85 }).toFile(path.resolve("client/public/images/landing-editor.webp"));
  await context.close();
  console.log("Real editor captured with explicitly fictional example content.");
} finally { await browser.close(); await closePool(); }
