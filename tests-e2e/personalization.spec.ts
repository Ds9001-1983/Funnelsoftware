import { test, expect } from "@playwright/test";
import { registerAndVerify, getCsrfToken } from "./helpers/api";
import { closePool, findLeadsByEmail } from "./helpers/db";
import { makeSlug, runId } from "./helpers/unique";
import { openPublicFunnel, submitFunnelLead } from "./helpers/public-funnel";

test.afterAll(closePool);
test("Personalisierung: Zuordnen, Canvas-Test, Undo, Veröffentlichung und unveränderte Antwortdaten", async ({ page, browser, baseURL }, info) => {
  test.skip(process.env.BUILDER_PERSONALIZATION_EDITOR !== "true", "Personalisierung ist deaktiviert.");
  test.setTimeout(180_000); page.setDefaultTimeout(15_000);
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.addInitScript(() => { localStorage.setItem("onboarding-completed", "true"); localStorage.setItem("trichterwerk-cookie-consent", "true"); });
  await registerAndVerify(page.request);
  const headers = { "X-CSRF-Token": await getCsrfToken(page.request) };
  const created = await page.request.post("/api/funnels", { headers, data: { name: "Persönliches Angebot", pages: [
    { id: "start", type: "question", title: "Standort", elements: [{ id: "place", type: "input", label: "Ort", placeholder: "Dein Ort", required: true }] },
    { id: "contact", type: "contact", title: "Angebot", elements: [
      { id: "title", type: "heading", content: "Dein Angebot für {{Ort}}" },
      { id: "campaign", type: "text", content: "Aktion" },
      { id: "email", type: "input", placeholder: "E-Mail", mapToLeadField: "email", required: true },
    ] },
    { id: "done", type: "thankyou", title: "Vielen Dank", elements: [] },
  ] } });
  expect(created.status()).toBe(201); const original = await created.json();
  await page.goto(`/funnels/${original.id}`);
  await page.getByRole("button", { name: "Auto-Save deaktivieren" }).click();
  await page.getByRole("button", { name: "Flow-Ansicht öffnen", exact: true }).click();
  await page.getByLabel("Regelseite", { exact: true }).selectOption("contact"); await page.keyboard.press("Escape");
  const canvas = page.getByTestId("phone-preview-content");
  await canvas.getByRole("heading", { name: "Dein Angebot für {{Ort}}", exact: true }).click();
  const panel = page.getByRole("region", { name: "Personalisierung", exact: true });
  const activate = async () => { await panel.getByRole("button", { name: "Personalisierung aktivieren", exact: true }).click(); await page.getByRole("button", { name: "Personalisierung übernehmen", exact: true }).click(); };
  await activate();
  await page.getByRole("button", { name: "Rückgängig", exact: true }).click();
  await expect(panel.getByRole("button", { name: "Personalisierung aktivieren", exact: true })).toBeVisible();
  await expect(page.getByTestId("button-save")).toBeDisabled();
  await page.getByRole("button", { name: "Wiederholen", exact: true }).click();
  await expect(canvas.getByRole("heading", { name: "Dein Angebot für {{Ort}}", exact: true })).toBeVisible();
  await panel.getByLabel("Vorhandenen Platzhalter zuordnen", { exact: true }).selectOption("Ort");
  await panel.getByLabel("Ersatztext der neuen Variable", { exact: true }).fill("deine Region");
  await panel.getByRole("button", { name: "Platzhalter zuordnen", exact: true }).click();
  await panel.getByLabel("Testwerte im Canvas anzeigen", { exact: true }).check();
  await expect(canvas.getByRole("heading", { name: "Dein Angebot für deine Region", exact: true })).toBeVisible();
  await panel.getByLabel("Testwert: Ort", { exact: true }).fill("Köln");
  await canvas.getByRole("heading", { name: "Dein Angebot für Köln", exact: true }).dblclick();
  await expect(canvas.locator("[data-inline-editing]")).toHaveValue("Dein Angebot für {{Ort}}");
  await page.keyboard.press("Escape");
  await canvas.getByText("Aktion", { exact: true }).click(); await activate();
  await panel.getByLabel("Neue Variablenquelle", { exact: true }).selectOption("campaign");
  await panel.getByLabel("Ersatztext der neuen Variable", { exact: true }).fill("Standard");
  await panel.getByRole("button", { name: "Variable einfügen", exact: true }).click();
  const literal = "<img src=x onerror=alert(1)> {{Ort}}";
  await panel.getByLabel("Testwert: utm_campaign", { exact: true }).fill(literal);
  await expect(canvas.getByText(`Aktion ${literal}`, { exact: true })).toBeVisible();
  await expect(canvas.locator("img")).toHaveCount(0);
  const save = page.waitForResponse(response => response.url().endsWith(`/api/funnels/${original.id}`) && response.request().method() === "PATCH");
  await page.getByTestId("button-save").click();
  const savedResponse = await save; expect(savedResponse.status()).toBe(200); const saved = await savedResponse.json();
  expect(saved.documentVersion).toBe(4);
  expect(saved.pages[1].elements[0].content).toBe("Dein Angebot für {{Ort}}");
  expect(saved.pages[1].elements[1].content).toBe("Aktion {{utm_campaign}}");
  expect(JSON.stringify(saved)).not.toContain(literal);
  await panel.getByLabel("Testwert: utm_campaign", { exact: true }).fill("Herbst");
  await expect(page.getByTestId("button-save")).toBeDisabled();
  await page.screenshot({ path: info.outputPath("personalization-editor.png") });
  await page.reload();
  expect((await (await page.request.get(`/api/funnels/${original.id}`)).json()).pages).toEqual(saved.pages);

  // Renaming/reordering fields preserves stable sources. Old writers stay out.
  const renamedPages = structuredClone(saved.pages);
  renamedPages[0].elements[0].label = "Dein Standort";
  const slug = makeSlug(runId());
  const published = await page.request.patch(`/api/funnels/${original.id}`, { headers, data: { pages: renamedPages, slug, expectedVersion: saved.editVersion, documentVersion: 4, mutationId: crypto.randomUUID(), publish: true } });
  expect(published.status()).toBe(200); const live = await published.json();
  expect((await page.request.patch(`/api/funnels/${original.id}`, { headers, data: { name: "Alter Tab", expectedVersion: live.editVersion, documentVersion: 3, mutationId: crypto.randomUUID() } })).status()).toBe(409);
  const broken = structuredClone(live.pages); broken[0].elements = [];
  expect((await page.request.patch(`/api/funnels/${original.id}`, { headers, data: { pages: broken, expectedVersion: live.editVersion, documentVersion: 4, mutationId: crypto.randomUUID(), publish: true } })).status()).toBe(400);
  const errors: string[] = [];
  const visitorContext = await browser.newContext({ baseURL, viewport: { width: 390, height: 900 } });
  visitorContext.setDefaultTimeout(15_000);
  try {
    const visitor = await visitorContext.newPage(); visitor.on("pageerror", error => errors.push(error.message));
    await openPublicFunnel(visitor, `/f/${slug}?utm_campaign=${encodeURIComponent(literal)}&name=Ignorieren`);
    await visitor.getByPlaceholder("Dein Ort").fill("Bonn & Umgebung"); await visitor.getByTestId("button-funnel-next").click();
    await expect(visitor.getByRole("heading", { name: "Dein Angebot für Bonn & Umgebung", exact: true })).toBeVisible();
    await expect(visitor.getByText(`Aktion ${literal}`, { exact: true })).toBeVisible();
    await expect(visitor.locator("img")).toHaveCount(0);
    const email = `personal-${runId()}@example.test`;
    await visitor.getByPlaceholder("E-Mail", { exact: true }).fill(email);
    await submitFunnelLead(visitor);
    await expect(visitor.getByRole("heading", { name: "Vielen Dank", exact: true })).toBeVisible();
    const leads = await findLeadsByEmail(email); expect(leads).toHaveLength(1);
    const ownerLeads = await (await page.request.get(`/api/leads?funnelId=${original.id}`)).json();
    const lead = ownerLeads.find((item: { email: string }) => item.email === email);
    expect(lead.answerSnapshot).toMatchObject({ documentVersion: 4, contentRevisionId: live.publishedRevisionId, path: ["start", "contact"] });
    expect(lead.answers["Dein Standort"]).toBe("Bonn & Umgebung");
    expect(JSON.stringify(lead.answers)).not.toContain(literal);
  } finally { await visitorContext.close(); }
  const second = await browser.newContext({ baseURL });
  try {
    const visitor = await second.newPage(); await openPublicFunnel(visitor, `/f/${slug}`);
    await visitor.getByPlaceholder("Dein Ort").fill("Berlin"); await visitor.getByTestId("button-funnel-next").click();
    await expect(visitor.getByRole("heading", { name: "Dein Angebot für Berlin", exact: true })).toBeVisible();
    await expect(visitor.getByText("Aktion Standard", { exact: true })).toBeVisible();
  } finally { await second.close(); }
  expect((await (await page.request.get(`/api/funnels/${original.id}`)).json()).pages).toEqual(live.pages);
  expect(errors).toEqual([]);
});
