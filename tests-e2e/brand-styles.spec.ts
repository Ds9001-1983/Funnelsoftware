import { test, expect } from "@playwright/test";
import { registerAndVerify, getCsrfToken } from "./helpers/api";
import { closePool } from "./helpers/db";
import { makeSlug, runId } from "./helpers/unique";

test.afterAll(closePool);
test("Markenstil: Vorschau, Undo, Wiederverwendung, Kontogrenzen und unabhängige Veröffentlichung", async ({ page, browser, playwright, baseURL }, testInfo) => {
  test.skip(process.env.BUILDER_LAYOUT_EDITOR !== "true", "Erweiterte Designbearbeitung ist deaktiviert.");
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.addInitScript(() => { localStorage.setItem("onboarding-completed", "true"); localStorage.setItem("trichterwerk-cookie-consent", "true"); });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await registerAndVerify(page.request);
  const headers = { "X-CSRF-Token": await getCsrfToken(page.request) };
  const create = async (name: string, custom: boolean) => {
    const response = await page.request.post("/api/funnels", { headers, data: { name, pages: [{ id: "p", title: "Kontakt", type: "contact", buttonText: "Absenden", ...(custom ? { backgroundColor: "#abcdef" } : {}), elements: [
      { id: "heading", type: "heading", content: "Deine Beratung", ...(custom ? { styles: { color: "#ff0000", fontSize: "22px" } } : {}) },
      { id: "email", type: "input", placeholder: "E-Mail", required: true, mapToLeadField: "email" },
      { id: "button", type: "button", content: "Kontakt aufnehmen", buttonAction: "next" },
    ] }] } });
    expect(response.status()).toBe(201);
    return response.json();
  };
  const original = await create("Markenstil Quelle", true);
  await page.goto(`/funnels/${original.id}`);
  await page.getByRole("button", { name: "Auto-Save deaktivieren" }).click();
  await page.getByRole("button", { name: "Design", exact: true }).click();
  await page.getByRole("button", { name: /^Ocean/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("checkbox")).not.toBeChecked();
  await expect(dialog.getByRole("heading", { name: "Deine Beratung" })).toHaveCSS("color", "rgb(255, 0, 0)");
  await dialog.getByRole("button", { name: "Abbrechen", exact: true }).click();
  await expect(page.getByTestId("button-save")).toBeDisabled();
  await page.getByRole("button", { name: /^Ocean/ }).click();
  await dialog.getByRole("button", { name: "Design anwenden", exact: true }).click();
  await expect(page.getByLabel("Design: Primärfarbe", { exact: true })).toHaveValue("#0ea5e9");
  await page.getByRole("button", { name: "Rückgängig", exact: true }).click();
  await expect(page.getByLabel("Design: Primärfarbe", { exact: true })).toHaveValue(original.theme.primaryColor.toLowerCase());
  await page.getByRole("button", { name: "Wiederholen", exact: true }).click();
  await expect(page.getByLabel("Design: Primärfarbe", { exact: true })).toHaveValue("#0ea5e9");
  await page.getByRole("button", { name: /^Sunset/ }).click();
  await dialog.getByRole("checkbox").check();
  await expect(dialog.getByRole("heading", { name: "Deine Beratung" })).toHaveCSS("color", "rgb(120, 53, 15)");
  await dialog.getByRole("button", { name: "Design anwenden", exact: true }).click();
  await expect(page.getByTestId("phone-preview-content").getByRole("heading", { name: "Deine Beratung" })).toHaveCSS("font-size", "36px");
  await page.getByRole("button", { name: "Rückgängig", exact: true }).click();
  await expect(page.getByTestId("phone-preview-content").getByRole("heading", { name: "Deine Beratung" })).toHaveCSS("color", "rgb(255, 0, 0)");
  await page.getByLabel("Design: Button-Stil", { exact: true }).selectOption("outline");
  await page.getByLabel("Design: Rundungen", { exact: true }).fill("16");
  await page.getByLabel("Design: Textgröße", { exact: true }).fill("18");
  await page.getByLabel("Design: Elementabstand", { exact: true }).fill("24");
  const save = async (id: number) => {
    const response = page.waitForResponse(response => response.url().endsWith(`/api/funnels/${id}`) && response.request().method() === "PATCH");
    await page.getByTestId("button-save").click();
    const saved = await response;
    expect(saved.status()).toBe(200);
    return saved.json();
  };
  const saved = await save(original.id);
  expect(saved.documentVersion).toBe(2);
  expect(saved.pages).toEqual(original.pages);
  await page.getByLabel("Name des Markenstils").fill("Studio Blau");
  const createdBrand = page.waitForResponse(response => response.url().endsWith("/api/brand-styles") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Als Markenstil speichern", exact: true }).click();
  const brandResponse = await createdBrand;
  expect(brandResponse.status()).toBe(201);
  const brand = await brandResponse.json();
  expect(brand.theme).toEqual(saved.theme);
  await page.reload();
  await page.getByRole("button", { name: "Design", exact: true }).click();
  await expect(page.getByTestId(`brand-style-${brand.id}`)).toBeVisible();

  const second = await create("Markenstil Ziel", false);
  await page.goto(`/funnels/${second.id}`);
  await page.getByRole("button", { name: "Auto-Save deaktivieren" }).click();
  await page.getByRole("button", { name: "Design", exact: true }).click();
  await page.getByTestId(`brand-style-${brand.id}`).getByRole("button", { name: "Vorschau", exact: true }).click();
  await dialog.getByRole("button", { name: "Design anwenden", exact: true }).click();
  const copied = await save(second.id);
  expect(copied.theme).toEqual({ ...brand.theme, source: { id: brand.id, version: 1 } });
  const canvasButton = page.getByTestId("phone-preview-content").getByRole("button", { name: "Kontakt aufnehmen", exact: true });
  await expect(canvasButton).toHaveCSS("border-radius", "16px");
  await expect(canvasButton).toHaveCSS("font-size", "18px");
  await expect(canvasButton).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(canvasButton).toHaveCSS("color", "rgb(14, 165, 233)");
  await page.screenshot({ path: testInfo.outputPath("brand-style-editor.png") });

  const foreign = await playwright.request.newContext({ baseURL });
  try {
    await registerAndVerify(foreign);
    const foreignHeaders = { "X-CSRF-Token": await getCsrfToken(foreign) };
    expect(await (await foreign.get("/api/brand-styles")).json()).toEqual([]);
    expect((await foreign.patch(`/api/brand-styles/${brand.id}`, { headers: foreignHeaders, data: { archived: true, expectedVersion: 1 } })).status()).toBe(404);
    expect((await page.request.post("/api/brand-styles", { headers, data: { name: "Invalid", theme: { ...brand.theme, fontFamily: "Remote font" } } })).status()).toBe(400);
    const changed = await page.request.patch(`/api/brand-styles/${brand.id}`, { headers, data: { theme: { ...brand.theme, primaryColor: "#112233" }, expectedVersion: 1 } });
    expect(changed.status()).toBe(200);
    expect((await changed.json()).version).toBe(2);
    expect((await page.request.patch(`/api/brand-styles/${brand.id}`, { headers, data: { name: "Stale", expectedVersion: 1 } })).status()).toBe(409);
    expect((await (await page.request.get(`/api/funnels/${second.id}`)).json()).theme).toEqual(copied.theme);
  } finally { await foreign.dispose(); }

  const slug = makeSlug(runId());
  expect((await page.request.patch(`/api/funnels/${second.id}`, { headers, data: { slug, expectedVersion: copied.editVersion, documentVersion: 2, mutationId: crypto.randomUUID(), publish: true } })).status()).toBe(200);
  const visitor = await browser.newContext({ baseURL, viewport: { width: 390, height: 900 } });
  try {
    const livePage = await visitor.newPage();
    await livePage.goto(`/f/${slug}`);
    const button = livePage.getByRole("button", { name: "Kontakt aufnehmen", exact: true });
    await expect(button).toHaveCSS("border-radius", "16px");
    await expect(button).toHaveCSS("font-size", "18px");
    await expect(button).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(button).toHaveCSS("color", "rgb(14, 165, 233)");
    await expect(livePage.getByRole("heading", { name: "Deine Beratung" })).toHaveCSS("font-size", "32px");
  } finally { await visitor.close(); }

  await page.reload();
  await page.getByRole("button", { name: "Design", exact: true }).click();
  page.once("dialog", dialog => dialog.accept());
  await page.getByLabel("Aktion für Studio Blau", { exact: true }).selectOption("archive");
  await expect(page.getByTestId(`brand-style-${brand.id}`)).toHaveCount(0);
  expect((await (await page.request.get(`/api/public/funnels/${slug}`)).json()).theme).toEqual(copied.theme);
  expect(errors).toEqual([]);
});
