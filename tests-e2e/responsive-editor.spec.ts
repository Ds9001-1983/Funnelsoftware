import { test, expect } from "@playwright/test";
import { registerAndVerify, createPublishedFunnel, getCsrfToken } from "./helpers/api";
import { closePool } from "./helpers/db";
import { makeSlug, runId } from "./helpers/unique";
test.afterAll(closePool);
test("device styles render on all widths and can be saved without changing live content", async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("onboarding-completed", "true"); localStorage.setItem("trichterwerk-cookie-consent", "true"); });
  await registerAndVerify(page.request);
  const funnel = await createPublishedFunnel(page.request, { name: "Responsive", slug: makeSlug(runId()) });
  const headers = { "X-CSRF-Token": await getCsrfToken(page.request) };
  let owner = await (await page.request.get(`/api/funnels/${funnel.id}`)).json();
  owner.pages[0].elements = [
    { id: "responsive-title", type: "heading", content: "Responsive Überschrift", responsive: { desktop: { fontSize: 44 }, tablet: { fontSize: 30 }, mobile: { fontSize: 22, padding: 8 } } },
    { id: "responsive-image", type: "image", imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='100'%3E%3Crect width='200' height='100' fill='navy'/%3E%3C/svg%3E", responsive: { desktop: { imageHeight: 200 }, mobile: { imageHeight: 120, imageX: 20, imageY: 70 } } },
  ];
  const published = await page.request.patch(`/api/funnels/${funnel.id}`, { headers, data: { pages: owner.pages, expectedVersion: owner.editVersion, documentVersion: 6, mutationId: crypto.randomUUID(), publish: true } });
  expect(published.ok()).toBeTruthy(); owner = await published.json(); expect(owner.documentVersion).toBe(6);
  expect((await page.request.patch(`/api/funnels/${funnel.id}`, { headers, data: { name: "Alter Editor", expectedVersion: owner.editVersion, documentVersion: 5, mutationId: crypto.randomUUID() } })).status()).toBe(409);
  await page.goto(`/f/${funnel.slug}`);
  for (const [width, fontSize] of [[1280, 44], [768, 30], [390, 22]]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator('[data-funnel-element="responsive-title"] h3')).toHaveCSS("font-size", `${fontSize}px`);
  }
  await expect(page.locator('[data-funnel-element="responsive-image"] img')).toHaveCSS("height", "120px");
  await expect(page.locator('[data-funnel-element="responsive-image"] img')).toHaveCSS("object-position", "20% 70%");
  await page.screenshot({ path: "/tmp/trichterwerk-improvements-tests/responsive-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/funnels/${funnel.id}`);
  await page.locator('[data-funnel-element="responsive-title"]').click();
  const panel = page.getByRole("region", { name: "Darstellung je Gerät" });
  await panel.getByLabel("Schriftgröße (px)").fill("26");
  await panel.getByLabel("Schriftgröße (px)").blur();
  await expect(page.locator('[data-funnel-element="responsive-title"] h3')).toHaveCSS("font-size", "26px");
  await page.getByTestId("button-save").click();
  await expect(page.getByText(/Gespeichert/).first()).toBeVisible();
  expect((await (await page.request.get(`/api/public/funnels/${funnel.slug}`)).json()).pages[0].elements[0].responsive.mobile.fontSize).toBe(22);
  await panel.getByRole("button", { name: "Desktop", exact: true }).click();
  await expect(page.locator('[data-funnel-element="responsive-title"] h3')).toHaveCSS("font-size", "44px");
  owner = await (await page.request.get(`/api/funnels/${funnel.id}`)).json();
  owner.pages[0].elements[0].content = "Überlauf".repeat(40);
  expect((await page.request.patch(`/api/funnels/${funnel.id}`, { headers, data: { pages: owner.pages, expectedVersion: owner.editVersion, documentVersion: 6, mutationId: crypto.randomUUID() } })).ok()).toBeTruthy();
  await page.reload();
  await expect(page.getByText(/Möglicher Überlauf oder abgeschnittener Text/)).toBeVisible();
  await page.route("**/api/funnels/editor-capabilities", route => route.fulfill({ json: { layoutEditing: true, routingEditing: true, personalizationEditing: true, libraryEditing: true, responsiveEditing: false } }));
  await page.reload();
  await expect(page.getByTestId("button-save")).toHaveCount(0);
});
