import { test, expect } from "@playwright/test";
import pg from "pg";
import { E2E_DATABASE_URL } from "./helpers/env";
import { registerAndVerify, getCsrfToken } from "./helpers/api";
import { closePool } from "./helpers/db";
import { makeSlug, runId } from "./helpers/unique";

test.afterAll(closePool);
for (const width of [390, 1440]) test(`Rechtliche Links vor Veröffentlichung und im Footer (${width}px)`, async ({ page, browser }, testInfo) => {
  // Editing is deliberately restricted to desktop/tablet in the product.
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => { localStorage.setItem("onboarding-completed", "true"); localStorage.setItem("trichterwerk-cookie-consent", "true"); });
  await registerAndVerify(page.request);
  const headers = { "X-CSRF-Token": await getCsrfToken(page.request) };
  const create = await page.request.post("/api/funnels", { headers, data: { name: "Rechtliche Links", pages: [{ id: "start", type: "welcome", title: "Willkommen", elements: [] }] } });
  expect(create.status()).toBe(201);
  const funnel = await create.json();
  const slug = makeSlug(runId());
  const denied = await page.request.patch(`/api/funnels/${funnel.id}`, { headers, data: { status: "published", slug } });
  expect(denied.status()).toBe(400);
  expect((await denied.json()).code).toBe("LEGAL_LINKS_REQUIRED");
  expect((await page.request.get(`/api/public/funnels/${funnel.uuid}`)).status()).toBe(404);
  await page.goto(`/funnels/${funnel.id}`);
  // The editor warning leads directly to the required fields.
  await page.getByRole("button", { name: "Rechtliche Links bearbeiten", exact: true }).click();
  await page.getByLabel("Impressum-URL", { exact: true }).fill("https://example.test/legal");
  await page.getByLabel("Datenschutzerklärung-URL", { exact: true }).fill("/privacy");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByTestId("button-publish").click();
  await page.getByTestId("input-publish-slug").fill(slug);
  await expect(page.getByTestId("button-confirm-publish")).toBeDisabled();
  await expect(page.getByRole("alert")).toContainText("Datenschutzerklärung-URL");
  await expect(page.getByRole("dialog")).toHaveCSS("opacity", "1");
  await page.screenshot({ path: testInfo.outputPath("publication-blocked.png"), animations: "disabled" });
  await page.getByRole("dialog").getByRole("button", { name: "Rechtliche Links bearbeiten" }).click();
  await page.getByLabel("Datenschutzerklärung-URL", { exact: true }).fill("https://example.test/privacy");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByTestId("button-publish").click();
  await page.getByTestId("input-publish-slug").fill(slug);
  await expect(page.getByTestId("button-confirm-publish")).toBeEnabled();
  const published = page.waitForResponse(r => r.url().endsWith(`/api/funnels/${funnel.id}`) && r.request().method() === "PATCH" && r.request().postDataJSON()?.publish === true);
  await page.getByTestId("button-confirm-publish").click();
  expect((await published).status()).toBe(200);
  const live = await (await published).json();
  expect(live.slug).toBe(slug);
  const db = new pg.Pool({ connectionString: E2E_DATABASE_URL });
  const host = `legal-${slug}.example.test`;
  try {
    await db.query("INSERT INTO domains(funnel_id,user_id,hostname,verified,verification_token) VALUES ($1,$2,$3,true,'local-test')", [funnel.id, funnel.userId, host]);
    const custom = await page.request.get(`/api/public/funnel-by-host?host=${host}`);
    expect(custom.status()).toBe(200);
    expect(await custom.json()).toMatchObject({ uuid: funnel.uuid, slug: live.slug });
    const content = await page.request.get(`/api/public/funnels/${live.uuid}`);
    expect(await content.json()).toMatchObject({ impressumUrl: "https://example.test/legal", datenschutzUrl: "https://example.test/privacy" });
  } finally { await db.end(); }
  const visitor = await browser.newContext({ viewport: { width, height: 900 } });
  try {
    const publicPage = await visitor.newPage();
    await publicPage.goto(`/f/${live.slug}`);
    for (const [name, href] of [["Impressum", "https://example.test/legal"], ["Datenschutz", "https://example.test/privacy"]]) {
      const link = publicPage.getByRole("link", { name, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", href);
    }
    await publicPage.screenshot({ path: testInfo.outputPath(`legal-footer-${width}.png`), fullPage: true, animations: "disabled" });
  } finally { await visitor.close(); }
});
