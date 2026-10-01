import { test, expect, type Page } from "@playwright/test";
import { registerAndVerify, getCsrfToken } from "./helpers/api";
import { closePool } from "./helpers/db";
import { makeSlug, runId } from "./helpers/unique";
import { openPublicFunnel, submitFunnelLead } from "./helpers/public-funnel";
import type { Funnel } from "../shared/schema";
import type { ContentTemplate, MediaAsset } from "../shared/builder-library";

test.afterAll(closePool);
test.beforeEach(async ({ page }) => {
  test.skip(process.env.BUILDER_LIBRARY_EDITOR !== "true", "Bibliothek ist deaktiviert.");
  test.setTimeout(180_000); page.setDefaultTimeout(15_000);
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.addInitScript(() => { localStorage.setItem("onboarding-completed", "true"); localStorage.setItem("trichterwerk-cookie-consent", "true"); });
  await registerAndVerify(page.request);
});
async function selectPage(page: Page, id: string) {
  await page.getByRole("button", { name: "Flow-Ansicht öffnen", exact: true }).click();
  await page.getByLabel("Regelseite", { exact: true }).selectOption(id); await page.keyboard.press("Escape");
}
async function save(page: Page, id: number): Promise<Funnel> {
  const pending = page.waitForResponse(response => response.url().endsWith(`/api/funnels/${id}`) && response.request().method() === "PATCH");
  await page.getByTestId("button-save").click(); const response = await pending;
  expect(response.status()).toBe(200); return response.json();
}

test("Eigene Seiten und Abschnitte: zuordnen, Design wählen, Undo und unabhängige Veröffentlichung", async ({ page, browser, baseURL }, info) => {
  const headers = { "X-CSRF-Token": await getCsrfToken(page.request) };
  const sourceResponse = await page.request.post("/api/funnels", { headers, data: { name: "Vorlagenquelle", theme: { primaryColor: "#aa1122", backgroundColor: "#eeeeee", textColor: "#111111", fontFamily: "Inter" }, pages: [
    { id: "start", type: "question", title: "Ort", elements: [{ id: "place", type: "input", label: "Ort" }] },
    { id: "contact", type: "contact", title: "Kontakt", elements: [
      { id: "title", type: "heading", content: "Hallo {{Ort}}", personalization: { version: 1, bindings: [{ id: "p", token: "Ort", source: { kind: "answer", fieldId: "place" }, fallback: "Gast" }] } },
      { id: "email", type: "input", placeholder: "E-Mail", required: true, mapToLeadField: "email" },
    ], routing: { version: 1, fallbackPageId: "done", rules: [] }, layout: { version: 1, width: "wide", sections: [{ id: "section", name: "Kontaktblock", columns: [{ id: "column", elementIds: ["title", "email"] }] }] } },
    { id: "done", type: "thankyou", title: "Danke", elements: [] },
  ] } });
  expect(sourceResponse.status()).toBe(201); const source = await sourceResponse.json();
  await page.goto(`/funnels/${source.id}`); await selectPage(page, "contact");
  await page.getByRole("button", { name: "Vorlagen & Medien", exact: true }).click();
  await page.getByLabel("Name der Inhaltsvorlage").fill("Kontaktseite");
  await page.getByRole("button", { name: "Als Vorlage speichern", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Kontaktseite", exact: true })).toBeVisible();
  await page.getByLabel("Inhalt für Vorlage").selectOption("section");
  await page.getByLabel("Name der Inhaltsvorlage").fill("Kontaktabschnitt");
  await page.getByRole("button", { name: "Als Vorlage speichern", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Kontaktabschnitt", exact: true })).toBeVisible();
  const templates: ContentTemplate[] = (await (await page.request.get("/api/library/templates")).json()).items;
  const template = templates.find(item => item.kind === "page")!, section = templates.find(item => item.kind === "section")!;
  const targetResponse = await page.request.post("/api/funnels", { headers, data: { name: "Ziel", pages: [
    { id: "start", type: "question", title: "Dein Ort", elements: [{ id: "place", type: "input", label: "Ort", placeholder: "Dein Ort" }], layout: { version: 1, sections: [{ id: "target-section", columns: [{ id: "target-column", elementIds: ["place"] }] }] } },
    { id: "done", type: "thankyou", title: "Vielen Dank", elements: [] },
  ] } });
  expect(targetResponse.status()).toBe(201); const target = await targetResponse.json();
  await page.goto(`/funnels/${target.id}`); await page.getByRole("button", { name: "Auto-Save deaktivieren" }).click();
  const begin = async (id: number) => {
    await page.getByRole("button", { name: "Vorlagen & Medien", exact: true }).click();
    await page.getByTestId(`content-template-${id}`).getByRole("button", { name: "Prüfen und einfügen" }).click();
  };
  await begin(template.id);
  await expect(page.getByRole("button", { name: "Kopie einfügen", exact: true })).toBeDisabled();
  await page.getByLabel("Zuordnung: Danke", { exact: true }).selectOption("done");
  await page.getByLabel("Zuordnung: Ort · Ort", { exact: true }).selectOption("place");
  await page.screenshot({ path: info.outputPath("library-import.png"), animations: "disabled" });
  await page.getByRole("button", { name: "Kopie einfügen", exact: true }).click();
  await page.getByRole("button", { name: "Rückgängig", exact: true }).click();
  await expect(page.getByTestId("button-save")).toBeDisabled();
  await page.getByRole("button", { name: "Wiederholen", exact: true }).click();
  const saved = await save(page, target.id);
  expect(saved.documentVersion).toBe(5); expect(saved.pages).toHaveLength(3);
  expect(saved.pages[1].id).not.toBe("contact"); expect(saved.pages[1].elements[1].id).not.toBe("email");
  expect(saved.pages[1].themeOverride?.primaryColor).toBe("#aa1122");
  expect(saved.pages[1].elements[0].personalization?.bindings[0].source).toEqual({ kind: "answer", fieldId: "place" });
  await begin(section.id);
  await page.getByLabel("Design beim Einfügen").selectOption("target");
  await page.getByLabel("Zuordnung: Ort · Ort", { exact: true }).selectOption("__remove");
  await page.getByRole("button", { name: "Kopie einfügen", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Hallo Gast", exact: true })).toBeVisible();
  const withSection = await save(page, target.id);
  expect(withSection.pages[0].layout?.sections).toHaveLength(2);
  expect(withSection.pages[0].layout?.sections[1].themeOverride).toBeUndefined();
  await page.getByRole("button", { name: "Rückgängig", exact: true }).click();
  const undone = await save(page, target.id); expect(undone.pages).toEqual(saved.pages);
  await page.reload();
  const slug = makeSlug(runId());
  const published = await page.request.patch(`/api/funnels/${target.id}`, { headers, data: { slug, expectedVersion: undone.editVersion, documentVersion: 5, mutationId: crypto.randomUUID(), publish: true } });
  expect(published.status()).toBe(200); const live = await published.json();
  expect((await page.request.patch(`/api/funnels/${target.id}`, { headers, data: { name: "Alter Tab", expectedVersion: live.editVersion, documentVersion: 4, mutationId: crypto.randomUUID() } })).status()).toBe(409);
  const changed = structuredClone(template.content); changed.page.elements[0].content = "Geänderte Vorlage";
  expect((await page.request.patch(`/api/library/templates/${template.id}`, { headers, data: { content: changed, archived: true, expectedVersion: template.version } })).status()).toBe(200);
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 900 } });
  try {
    const visitor = await context.newPage(); await openPublicFunnel(visitor, `/f/${slug}`);
    await visitor.getByPlaceholder("Dein Ort").fill("Bonn"); await visitor.getByTestId("button-funnel-next").click();
    await expect(visitor.getByRole("heading", { name: "Hallo Bonn", exact: true })).toBeVisible();
    await expect(visitor.getByTestId("button-funnel-submit")).toHaveCSS("background-color", "rgb(170, 17, 34)");
    const email = `library-${runId()}@example.test`;
    await visitor.getByPlaceholder("E-Mail", { exact: true }).fill(email); await submitFunnelLead(visitor);
    await expect(visitor.getByRole("heading", { name: "Vielen Dank", exact: true })).toBeVisible();
    const leads = await (await page.request.get(`/api/leads?funnelId=${target.id}`)).json();
    expect(leads.find((lead: { email: string }) => lead.email === email).answerSnapshot).toMatchObject({ documentVersion: 5, contentRevisionId: live.publishedRevisionId });
  } finally { await context.close(); }
  expect((await (await page.request.get(`/api/funnels/${target.id}`)).json()).pages).toEqual(saved.pages);
});

test("Mediathek: echte Datei hochladen, ordnen, wiederverwenden und ohne URL-Wechsel archivieren", async ({ page, browser, baseURL }, info) => {
  const headers = { "X-CSRF-Token": await getCsrfToken(page.request) };
  const created = await page.request.post("/api/funnels", { headers, data: { name: "Medien", pages: [{ id: "start", type: "welcome", title: "Bilder", elements: [{ id: "image", type: "image", imageUrl: "" }] }] } });
  expect(created.status()).toBe(201); const funnel = await created.json();
  await page.goto(`/funnels/${funnel.id}`); await page.getByRole("button", { name: "Auto-Save deaktivieren" }).click();
  await page.getByRole("button", { name: "Vorlagen & Medien", exact: true }).click();
  await page.getByRole("button", { name: "Mediathek", exact: true }).click();
  const library = page.getByRole("region", { name: "Medienbibliothek" });
  await library.getByLabel("Neuer Medienordner").fill("Sommer"); await library.getByRole("button", { name: "Ordner anlegen", exact: true }).click();
  await expect(library.getByLabel("Medienordner", { exact: true }).locator("option").filter({ hasText: "Sommer" })).toHaveCount(1);
  await library.getByLabel("Medienordner", { exact: true }).selectOption({ label: "Sommer" });
  await library.getByLabel("Bild für die Mediathek").setInputFiles({ name: "motiv.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=", "base64") });
  await expect(library.getByRole("img", { name: "motiv.png" })).toBeVisible();
  await expect(library.getByText("1 × 1 · 1 KB", { exact: true })).toBeVisible();
  const asset: MediaAsset = (await (await page.request.get("/api/library/media")).json()).items[0];
  const file = await page.request.get(asset.url); expect(file.status()).toBe(200); const bytes = await file.body();
  expect(asset.folderId).not.toBeNull(); expect(asset.mimeType).toBe("image/webp"); expect(asset.bytes).toBe(bytes.length);
  page.once("dialog", dialog => dialog.accept("Sommermotiv")); await library.getByRole("button", { name: "Umbenennen", exact: true }).click();
  await expect(library.getByRole("img", { name: "Sommermotiv" })).toBeVisible();
  await library.getByLabel("Medienordner", { exact: true }).selectOption("all");
  await library.getByLabel("Ordner für Sommermotiv").selectOption("");
  await expect(library.getByLabel("Ordner für Sommermotiv")).toBeEnabled();
  await page.screenshot({ path: info.outputPath("media-library.png"), animations: "disabled" });
  await page.keyboard.press("Escape");
  await page.locator('[data-element-id="image"]').click();
  await page.getByRole("button", { name: "Aus Mediathek", exact: true }).click();
  await page.getByRole("button", { name: "Bild verwenden", exact: true }).click();
  const saved = await save(page, funnel.id); expect(saved.pages[0].elements[0].imageUrl).toBe(asset.url);
  await page.getByRole("button", { name: "Aus Mediathek", exact: true }).click();
  await page.getByRole("button", { name: "Archivieren", exact: true }).click();
  await expect(page.getByRole("img", { name: "Sommermotiv", exact: true })).toHaveCount(0);
  expect(await (await page.request.get(asset.url)).body()).toEqual(bytes);
  await page.getByLabel("Archiv anzeigen", { exact: true }).check();
  await expect(page.getByRole("button", { name: "Bild verwenden", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Wiederherstellen", exact: true }).click();
  await page.getByLabel("Archiv anzeigen", { exact: true }).uncheck();
  await expect(page.getByRole("button", { name: "Bild verwenden", exact: true })).toBeEnabled();
  expect((await (await page.request.get("/api/library/media")).json()).items[0]).toMatchObject({ url: asset.url, folderId: null, name: "Sommermotiv" });
  const foreign = await browser.newContext({ baseURL });
  try {
    expect((await foreign.request.get("/api/library/media")).status()).toBe(401);
    await registerAndVerify(foreign.request); const otherHeaders = { "X-CSRF-Token": await getCsrfToken(foreign.request) };
    expect((await (await foreign.request.get("/api/library/media")).json()).items).toEqual([]);
    expect((await foreign.request.patch(`/api/library/media/${asset.id}`, { headers: otherHeaders, data: { name: "Fremd", expectedVersion: 1 } })).status()).toBe(404);
    expect((await foreign.request.patch(`/api/library/folders/${asset.folderId}`, { headers: otherHeaders, data: { name: "Fremd", expectedVersion: 1 } })).status()).toBe(404);
  } finally { await foreign.close(); }
  expect((await (await page.request.get(`/api/funnels/${funnel.id}`)).json()).pages).toEqual(saved.pages);
  expect(await (await page.request.get(asset.url)).body()).toEqual(bytes);
});
