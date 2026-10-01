import { test, expect } from "@playwright/test";
import { openPublicFunnel } from "./helpers/public-funnel";
import { registerAndVerify, getCsrfToken } from "./helpers/api";
import { closePool, findLeadsByEmail } from "./helpers/db";
import { makeSlug, runId } from "./helpers/unique";

test.afterAll(closePool);
test("Besucherregeln: Aktivierung, feste Optionen, Testmodus, frühere Antworten und veröffentlichter Besucherweg", async ({ page, browser, baseURL }, info) => {
  test.skip(process.env.BUILDER_ROUTING_EDITOR !== "true", "Besucherregeln sind deaktiviert.");
  test.setTimeout(180_000);
  page.setDefaultTimeout(15_000);
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.addInitScript(() => { localStorage.setItem("onboarding-completed", "true"); localStorage.setItem("trichterwerk-cookie-consent", "true"); });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await registerAndVerify(page.request);
  const headers = { "X-CSRF-Token": await getCsrfToken(page.request) };
  const created = await page.request.post("/api/funnels", { headers, data: { name: "Besucherregeln", pages: [
    { id: "budget", type: "question", title: "Budget", elements: [{ id: "budget-field", type: "input", label: "Budget", placeholder: "Dein Budget", required: true, validation: { type: "number" } }] },
    { id: "need", type: "question", title: "Bedarf", elements: [] },
    { id: "fast", type: "contact", title: "Termin", elements: [{ id: "fast-email", type: "input", placeholder: "E-Mail Termin", mapToLeadField: "email", required: true }, { id: "fast-details", type: "input", placeholder: "Terminwunsch" }] },
    { id: "slow", type: "contact", title: "Informationen", elements: [{ id: "slow-email", type: "input", placeholder: "E-Mail Infos", mapToLeadField: "email", required: true }, { id: "direct", type: "button", content: "Infos absenden", buttonAction: "page", buttonNextPageId: "thanks-slow" }] },
    { id: "thanks-fast", type: "thankyou", title: "Termin angefragt", elements: [] },
    { id: "thanks-slow", type: "thankyou", title: "Infos angefragt", elements: [] },
  ] } });
  expect(created.status()).toBe(201);
  const original = await created.json();
  await page.goto(`/funnels/${original.id}`);
  await page.getByRole("button", { name: "Auto-Save deaktivieren" }).click();
  const flow = page.getByRole("dialog", { name: "Funnel-Flow", exact: true });
  const openFlow = async () => page.getByRole("button", { name: "Flow-Ansicht öffnen", exact: true }).click();
  const activate = async () => { await flow.getByRole("button", { name: "Besucherregeln aktivieren", exact: true }).click(); await page.getByRole("button", { name: "Regeln übernehmen", exact: true }).click(); await expect(page.getByRole("dialog", { name: "Besucherregeln aktivieren", exact: true })).toBeHidden(); };
  await openFlow(); await activate();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Rückgängig", exact: true }).click();
  await expect(page.getByTestId("button-save")).toBeDisabled();
  await page.getByRole("button", { name: "Wiederholen", exact: true }).click();
  await openFlow(); await flow.getByLabel("Regelseite", { exact: true }).selectOption("need"); await page.keyboard.press("Escape");
  await page.getByTitle("Single Choice", { exact: true }).click();
  await page.getByTestId("phone-preview-content").getByText("Option 1", { exact: true }).click();
  await page.getByPlaceholder("Wähle eine Option").fill("Zeitpunkt");
  await page.getByLabel("Auswahloption 1", { exact: true }).fill("Jetzt");
  await page.getByLabel("Auswahloption 2", { exact: true }).fill("Später");
  await page.getByRole("button", { name: "Option 3 löschen", exact: true }).click();
  await openFlow(); await activate();
  await flow.getByLabel("Standardziel", { exact: true }).selectOption("slow");
  await flow.getByRole("button", { name: "Regel hinzufügen", exact: true }).click();
  await flow.getByLabel("Name von Regel 1", { exact: true }).fill("Budget und Eile");
  await flow.getByLabel("Regel 1, Bedingung 1: Vergleichstyp", { exact: true }).selectOption("number");
  await flow.getByLabel("Regel 1, Bedingung 1: Wert", { exact: true }).fill("1000");
  await flow.getByRole("button", { name: "Bedingung hinzufügen", exact: true }).click();
  await flow.getByLabel("Regel 1, Bedingung 2: Feld", { exact: true }).selectOption({ label: "Bedarf · Zeitpunkt" });
  await flow.getByLabel("Ziel von Regel 1", { exact: true }).selectOption("fast");
  await flow.getByText("Regeln mit Beispielantworten testen", { exact: true }).click();
  await flow.getByLabel("Testantwort: Budget", { exact: true }).fill("2000");
  await flow.getByLabel("Testantwort: Zeitpunkt", { exact: true }).selectOption({ label: "Jetzt" });
  await expect(flow.getByRole("status")).toHaveText("Ziel: Termin · Budget und Eile");
  await flow.getByLabel("Testantwort: Budget", { exact: true }).fill("");
  await expect(flow.getByRole("status")).toHaveText("Ziel: Informationen · Standardziel");
  await flow.getByLabel("Verknüpfung in Regel 1", { exact: true }).selectOption("any");
  await expect(flow.getByRole("status")).toHaveText("Ziel: Termin · Budget und Eile");
  await flow.getByLabel("Verknüpfung in Regel 1", { exact: true }).selectOption("all");
  await flow.getByLabel("Testantwort: Budget", { exact: true }).fill("2000");
  await page.screenshot({ path: info.outputPath("visitor-rule-test.png") });
  await flow.getByLabel("Regelseite", { exact: true }).selectOption("fast"); await activate();
  await flow.getByLabel("Standardziel", { exact: true }).selectOption("thanks-fast");
  await flow.getByLabel("Regelseite", { exact: true }).selectOption("slow"); await activate();
  await flow.getByLabel("Standardziel", { exact: true }).selectOption("thanks-slow");
  await page.keyboard.press("Escape");
  const save = page.waitForResponse(response => response.url().endsWith(`/api/funnels/${original.id}`) && response.request().method() === "PATCH");
  await page.getByTestId("button-save").click();
  const savedResponse = await save; expect(savedResponse.status()).toBe(200);
  const saved = await savedResponse.json(); expect(saved.documentVersion).toBe(3);
  const optionId = saved.pages[1].elements[0].choices[0].id;
  expect(saved.pages[1].routing.rules[0].conditions[1].value).toBe(optionId);
  await page.reload(); await openFlow(); await flow.getByLabel("Regelseite", { exact: true }).selectOption("need");
  await expect(flow.getByLabel("Name von Regel 1", { exact: true })).toHaveValue("Budget und Eile");
  await page.keyboard.press("Escape");
  await page.getByTestId("phone-preview-content").getByText("Jetzt", { exact: true }).click();
  await page.getByLabel("Auswahloption 1", { exact: true }).fill("Sofort");
  await page.getByRole("button", { name: "Option 1 löschen", exact: true }).click();
  await expect(page.getByText("Diese Option wird noch in einer Besucherregel verwendet. Passe zuerst die Regel an.", { exact: true })).toBeVisible();
  const renamedResponse = page.waitForResponse(response => response.url().endsWith(`/api/funnels/${original.id}`) && response.request().method() === "PATCH");
  await page.getByTestId("button-save").click();
  const renamed = await (await renamedResponse).json();
  expect(renamed.pages[1].elements[0].choices[0]).toEqual({ id: optionId, label: "Sofort" });
  const slug = makeSlug(runId());
  const publish = await page.request.patch(`/api/funnels/${original.id}`, { headers, data: { slug, expectedVersion: renamed.editVersion, documentVersion: 3, mutationId: crypto.randomUUID(), publish: true } });
  expect(publish.status()).toBe(200);
  const live = await publish.json();
  const cyclic = structuredClone(live.pages); cyclic[0].routing.fallbackPageId = "budget";
  expect((await page.request.patch(`/api/funnels/${original.id}`, { headers, data: { pages: cyclic, expectedVersion: live.editVersion, documentVersion: 3, mutationId: crypto.randomUUID(), publish: true } })).status()).toBe(400);
  expect((await page.request.patch(`/api/funnels/${original.id}`, { headers, data: { name: "Alter Tab", expectedVersion: live.editVersion, documentVersion: 2, mutationId: crypto.randomUUID() } })).status()).toBe(409);
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 900 } });
  context.setDefaultTimeout(15_000);
  try {
    const visitor = await context.newPage();
    await openPublicFunnel(visitor, `/f/${slug}`);
    await visitor.getByPlaceholder("Dein Budget").fill("2000"); await visitor.getByTestId("button-funnel-next").click();
    await visitor.getByText("Sofort", { exact: true }).click(); await visitor.getByTestId("button-funnel-next").click();
    await expect(visitor.getByRole("heading", { name: "Termin", exact: true })).toBeVisible();
    await visitor.getByPlaceholder("E-Mail Termin").fill("discard@example.test"); await visitor.getByPlaceholder("Terminwunsch").fill("Verwerfen");
    await visitor.getByTestId("button-funnel-back").click();
    await expect(visitor.getByRole("heading", { name: "Bedarf", exact: true })).toBeVisible();
    await visitor.getByTestId("button-funnel-back").click();
    await expect(visitor.getByRole("heading", { name: "Budget", exact: true })).toBeVisible();
    await visitor.getByPlaceholder("Dein Budget").fill("500"); await visitor.getByTestId("button-funnel-next").click();
    await expect(visitor.getByLabel("Sofort", { exact: true })).not.toBeChecked();
    await visitor.getByText("Sofort", { exact: true }).click(); await visitor.getByTestId("button-funnel-next").click();
    await expect(visitor.getByRole("heading", { name: "Informationen", exact: true })).toBeVisible();
    await visitor.getByRole("button", { name: "Infos absenden", exact: true }).click();
    await expect(visitor.getByText("Dieses Feld ist erforderlich")).toBeVisible();
    const email = `rules-${runId()}@example.test`;
    await visitor.getByPlaceholder("E-Mail Infos").fill(email);
    const submitted = visitor.waitForResponse(response => response.url().endsWith("/api/public/leads") && response.request().method() === "POST");
    await visitor.getByRole("button", { name: "Infos absenden", exact: true }).click();
    let response = await submitted;
    // All tests share one loopback IP. The global public limiter (60/min)
    // runs before the lead limiter (12/min), with separate reset deadlines.
    // Keep both production limits and allow one retry per exhausted limiter.
    const exhaustedLimits = new Set<number>();
    for (let retry = 0; response.status() === 429 && retry < 2; retry++) {
      const limit = Number(response.headers()["ratelimit-limit"]);
      expect([12, 60]).toContain(limit);
      expect(exhaustedLimits.has(limit)).toBe(false);
      exhaustedLimits.add(limit);
      const retryAfter = Number(response.headers()["retry-after"]);
      expect(retryAfter).toBeGreaterThan(0); expect(retryAfter).toBeLessThanOrEqual(60);
      await expect(visitor.getByText("Absenden fehlgeschlagen. Bitte versuche es erneut.")).toBeVisible();
      expect(await findLeadsByEmail(email)).toHaveLength(0);
      await visitor.waitForTimeout(retryAfter * 1000 + 100);
      const retried = visitor.waitForResponse(response => response.url().endsWith("/api/public/leads") && response.request().method() === "POST");
      await visitor.getByRole("button", { name: "Infos absenden", exact: true }).click();
      response = await retried;
    }
    expect(response.status()).toBe(201);
    await expect(visitor.getByRole("heading", { name: "Infos angefragt", exact: true })).toBeVisible();
    const leads = await findLeadsByEmail(email); expect(leads).toHaveLength(1);
    expect(JSON.stringify(leads[0])).not.toContain("Verwerfen");
    expect(JSON.stringify(leads[0])).not.toContain("discard@example.test");
    const ownerLeads = await (await page.request.get(`/api/leads?funnelId=${original.id}`)).json();
    const lead = ownerLeads.find((lead: { email: string }) => lead.email === email);
    expect(lead.answerSnapshot).toMatchObject({ contentRevisionId: live.publishedRevisionId, path: ["budget", "need", "slow"] });
    expect(lead.answerSnapshot.fields.find((field: { elementId: string }) => field.elementId === saved.pages[1].elements[0].id)).toMatchObject({ optionId, optionText: "Sofort" });
    expect(lead.answers.Zeitpunkt).toBe("Sofort");
  } finally { await context.close(); }
  expect(errors).toEqual([]);
});
