import { test, expect } from "@playwright/test";
import { registerAndVerify, getCsrfToken } from "./helpers/api";
import { closePool, findLeadsByEmail } from "./helpers/db";
import { makeSlug, runId } from "./helpers/unique";

test.afterAll(closePool);
test("Abschnitte: Umstellen, Bearbeiten, Undo/Redo, Speichern, Veröffentlichen und Lead erhalten", async ({ page, browser }, testInfo) => {
  test.skip(process.env.BUILDER_LAYOUT_EDITOR !== "true", "Layout-Bearbeitung ist noch nicht aktiviert.");
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.addInitScript(() => { localStorage.setItem("onboarding-completed", "true"); localStorage.setItem("trichterwerk-cookie-consent", "true"); });
  await registerAndVerify(page.request);
  const slug = makeSlug(runId());
  const headers = { "X-CSRF-Token": await getCsrfToken(page.request) };
  const create = await page.request.post("/api/funnels", { headers, data: { name: "Layout-Abnahme", pages: [{ id: "contact", title: "Kontakt", type: "contact", elements: [
    { id: "name", type: "input", placeholder: "Dein Name", required: true, mapToLeadField: "name" },
    { id: "email", type: "input", placeholder: "Deine E-Mail", required: true, mapToLeadField: "email", validation: { type: "email" } },
  ] }] } });
  expect(create.status()).toBe(201);
  const original = await create.json();
  const url = `/api/funnels/${original.id}`;
  expect((await page.request.patch(url, { headers, data: { status: "published", slug } })).status()).toBe(200);
  await page.goto(`/funnels/${original.id}`);
  await page.getByRole("button", { name: "Auto-Save deaktivieren" }).click();
  await page.getByRole("button", { name: "Abschnitte für diese Seite aktivieren" }).click();
  await expect(page.getByTestId("layout-editor")).toBeVisible();
  await page.getByRole("button", { name: "Desktop-Vorschau" }).click();
  await page.getByLabel("Seitenbreite", { exact: true }).selectOption("wide");
  await page.getByLabel("Spalten in Abschnitt 1", { exact: true }).selectOption("2");
  await page.locator('[data-element-id="name"]').click({ position: { x: 2, y: 2 } });
  await page.getByLabel("Element in Spalte verschieben").selectOption({ label: "Bestehende Inhalte · Spalte 2" });
  await expect(page.locator("[data-layout-column]").nth(1).getByPlaceholder("Dein Name")).toBeVisible();
  await page.locator("[data-layout-column]").nth(1).getByRole("button", { name: "Element ziehen", exact: true })
    .dragTo(page.locator("[data-layout-column]").nth(0).getByRole("button", { name: "Spalte 1 · Hier einfügen", exact: true }));
  await expect(page.locator("[data-layout-column]").nth(0).getByPlaceholder("Dein Name")).toBeVisible();
  await page.getByLabel("Element in Spalte verschieben").selectOption({ label: "Bestehende Inhalte · Spalte 2" });

  await page.getByLabel("Abschnittsvorlage").selectOption("benefits");
  await page.getByRole("button", { name: "Abschnitt hinzufügen" }).click();
  await page.getByRole("button", { name: "Abschnitt 2 duplizieren", exact: true }).click();
  await expect(page.locator("[data-layout-section]")).toHaveCount(3);
  await page.getByRole("button", { name: "Abschnitt 3 nach oben", exact: true }).click();
  await expect(page.getByLabel("Name von Abschnitt 2", { exact: true })).toHaveValue("Vorteile (Kopie)");
  await page.locator('[data-testid^="section-controls-"]').nth(1).getByTitle("Abschnitt ziehen")
    .dragTo(page.locator('[data-testid^="section-controls-"]').nth(2).getByTitle("Abschnitt ziehen"));
  await expect(page.getByLabel("Name von Abschnitt 3", { exact: true })).toHaveValue("Vorteile (Kopie)");
  await page.getByRole("button", { name: "Abschnitt 3 nach oben", exact: true }).click();
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Abschnitt 2 löschen", exact: true }).click();
  await expect(page.locator("[data-layout-section]")).toHaveCount(2);
  await page.getByRole("button", { name: "Rückgängig", exact: true }).click();
  await expect(page.locator("[data-layout-section]")).toHaveCount(3);
  await page.getByRole("button", { name: "Wiederholen", exact: true }).click();
  await expect(page.locator("[data-layout-section]")).toHaveCount(2);
  const saveResponse = page.waitForResponse(response => response.url().endsWith(url) && response.request().method() === "PATCH");
  await page.getByTestId("button-save").click();
  const savedResponse = await saveResponse;
  expect(savedResponse.status()).toBe(200);
  const saved = await savedResponse.json();
  expect(saved.documentVersion).toBe(2);
  expect(saved.pages[0].layout.sections[0].columns.map((column: { elementIds: string[] }) => column.elementIds)).toEqual([["email"], ["name"]]);
  const ids = saved.pages[0].elements.map((element: { id: string }) => element.id);
  expect(new Set(ids).size).toBe(ids.length);
  const publicBefore = await (await page.request.get(`/api/public/funnels/${slug}`)).json();
  expect(publicBefore.pages[0].layout).toBeUndefined();
  await expect(page.getByText(/^Gespeichert ·/).first()).toBeVisible();
  await expect.poll(() => page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith("tw-editor-recovery:")).length)).toBe(0);
  await page.screenshot({ path: testInfo.outputPath("layout-editor.png") });
  await page.reload();
  await expect(page.locator("[data-layout-section]")).toHaveCount(2);
  await expect(page.getByPlaceholder("Dein Name")).toHaveCount(1);

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByTestId("button-publish").click();
  const publish = page.waitForResponse(response => response.url().endsWith(url) && response.request().method() === "PATCH");
  await page.getByTestId("button-confirm-publish").click();
  expect((await publish).status()).toBe(200);
  const live = await (await page.request.get(`/api/public/funnels/${slug}`)).json();
  expect(live.pages[0].layout).toEqual(saved.pages[0].layout);

  const visitor = await browser.newContext({ viewport: { width: 390, height: 900 } });
  try {
    await visitor.addInitScript(() => localStorage.setItem("trichterwerk-cookie-consent", "true"));
    const visit = await visitor.newPage();
    await visit.goto(`/f/${slug}`);
    await expect(visit.locator("[data-layout-column]")).toHaveCount(5);
    await visit.getByTestId("button-funnel-submit").click();
    await expect(visit.getByText("Dieses Feld ist erforderlich")).toHaveCount(2);
    const email = `layout-${runId()}@example.test`;
    await visit.getByPlaceholder("Deine E-Mail").fill(email);
    await visit.getByPlaceholder("Dein Name").fill("Layout Testperson");
    const submission = visit.waitForResponse(response => response.url().includes("/api/public/leads") && response.request().method() === "POST");
    await visit.getByTestId("button-funnel-submit").click();
    expect((await submission).ok()).toBe(true);
    await expect.poll(async () => (await findLeadsByEmail(email)).length).toBe(1);

    await page.getByRole("button", { name: "Gespeicherte Versionen", exact: true }).click();
    const initial = page.getByRole("dialog").locator("div.border.rounded-lg").filter({ hasText: "Version 0" });
    await initial.getByRole("button", { name: "Wiederherstellen", exact: true }).click();
    await page.getByRole("button", { name: "Als Entwurf wiederherstellen", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const restored = await (await page.request.get(url)).json();
    expect(restored.pages[0].layout).toBeUndefined();
    expect(restored.documentVersion).toBe(2);
    expect((await (await page.request.get(`/api/public/funnels/${slug}`)).json()).pages[0].layout).toEqual(saved.pages[0].layout);
    expect(await findLeadsByEmail(email)).toEqual([expect.objectContaining({ name: "Layout Testperson", funnel_id: original.id })]);
  } finally { await visitor.close(); }
  expect(errors).toEqual([]);
});
