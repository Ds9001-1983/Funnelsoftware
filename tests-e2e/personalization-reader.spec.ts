import { test, expect, type Page } from "@playwright/test";
import type { ABTest, FunnelPage } from "../shared/schema";
import type { FunnelLeadPayload } from "../client/src/components/funnel-viewer/FunnelRenderer";

function fixture() {
  const pages: FunnelPage[] = [
    { id: "start", type: "question", title: "Standort", elements: [{ id: "place", type: "input", label: "Ort", placeholder: "Dein Ort" }] },
    { id: "contact", type: "contact", title: "Kontakt", elements: [
      { id: "title", type: "heading", content: "Angebot für {{Ort}}", personalization: { version: 1, bindings: [{ id: "p", token: "Ort", source: { kind: "answer", fieldId: "place" }, fallback: "deine Region" }] } },
      { id: "campaign", type: "text", content: "Aktion {{Kampagne}}", personalization: { version: 1, bindings: [{ id: "c", token: "Kampagne", source: { kind: "campaign", key: "utm_campaign" }, fallback: "Standard" }] } },
      { id: "email", type: "input", placeholder: "E-Mail", required: true, mapToLeadField: "email" },
    ], layout: { version: 1, width: "wide", sections: [{ id: "section", columns: [{ id: "left", elementIds: ["title", "campaign"] }, { id: "right", elementIds: ["email"] }] }] } },
    { id: "done", type: "thankyou", title: "Vielen Dank", elements: [] },
  ];
  return { id: 1, uuid: "personalization-reader", name: "Persönliches Angebot", documentVersion: 4, editVersion: 1, editorProtocol: true, status: "published", publishedRevisionId: 321, pages, abTests: [] as ABTest[],
    theme: { primaryColor: "#123456", textColor: "#111111", backgroundColor: "#ffffff", fontFamily: "Inter" } };
}

// This suite also runs against built/live assets: every API and external call
// is intercepted, so no production content, leads or metrics are written.
async function mockFunnel(page: Page, baseURL: string, funnel: ReturnType<typeof fixture>, editing = false) {
  const payloads: FunnelLeadPayload[] = [], writes: string[] = [], errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("onboarding-completed", "true");
    localStorage.setItem("trichterwerk-cookie-consent", "true");
  });
  await page.route("**/*", route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin !== new URL(baseURL).origin) return route.abort();
    if (url.pathname === "/api/auth/user") return route.fulfill({ json: { user: { id: 1, username: "personalization-test", isPro: true, plan: "pro", emailVerifiedAt: "2026-10-01T00:00:00Z" } } });
    if (url.pathname === "/api/funnels/editor-capabilities") return route.fulfill({ json: { layoutEditing: true, routingEditing: true, personalizationEditing: editing } });
    if (url.pathname.startsWith("/api/funnels") && request.method() !== "GET") writes.push(request.method());
    if (["/api/funnels/1", "/api/funnels/1/preview", "/api/public/funnels/personalization-reader"].includes(url.pathname)) return route.fulfill({ json: funnel });
    if (url.pathname === "/api/public/leads") { payloads.push(request.postDataJSON()); return route.fulfill({ status: 201, json: { id: "mock-lead" } }); }
    if (url.pathname.startsWith("/api/")) return route.fulfill({ json: {} });
    return route.continue();
  });
  return { payloads, writes, errors };
}

test("v4 bleibt bei deaktivierter Bearbeitung als Funktionsvorschau lesbar", async ({ page, baseURL }) => {
  const { writes, errors } = await mockFunnel(page, baseURL!, fixture());
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/funnels/1");
  await expect(page.getByText("Die Bearbeitung ist in dieser Editorversion noch nicht verfügbar.", { exact: false })).toBeVisible();
  await page.getByPlaceholder("Dein Ort").fill("Köln");
  await page.getByTestId("button-funnel-next").click();
  await expect(page.getByRole("heading", { name: "Angebot für Köln", exact: true })).toBeVisible();
  await expect(page.getByText("Aktion Standard", { exact: true })).toBeVisible();
  await page.keyboard.press("ControlOrMeta+s");
  expect(writes).toEqual([]); expect(errors).toEqual([]);
});

for (const path of ["/preview/1", "/f/personalization-reader"]) {
  test(`${path}: persönliche Texte und Ersatzwerte im mobilen Spaltenlayout`, async ({ page, baseURL }) => {
    const { errors } = await mockFunnel(page, baseURL!, fixture());
    await page.setViewportSize({ width: 390, height: 900 });
    const literal = "<img src=x onerror=alert(1)> {{Ort}}";
    await page.goto(`${path}?utm_campaign=${encodeURIComponent(literal)}&name=Ignorieren`);
    await page.getByPlaceholder("Dein Ort").fill("Bonn & Umgebung");
    await page.getByTestId("button-funnel-next").click();
    await expect(page.getByRole("heading", { name: "Angebot für Bonn & Umgebung", exact: true })).toBeVisible();
    await expect(page.getByText(`Aktion ${literal}`, { exact: true })).toBeVisible();
    await expect(page.locator("img")).toHaveCount(0);
    await expect(page.locator("[data-layout-column]")).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByTestId("button-funnel-back").click();
    await page.getByPlaceholder("Dein Ort").fill("");
    await page.getByTestId("button-funnel-next").click();
    await expect(page.getByRole("heading", { name: "Angebot für deine Region", exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("Testwerte aktualisieren auch den Abschnitts-Canvas ohne Speichervorgang", async ({ page, baseURL }) => {
  const { writes, errors } = await mockFunnel(page, baseURL!, fixture(), true);
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/funnels/1");
  await page.getByRole("button", { name: "Flow-Ansicht öffnen", exact: true }).click();
  await page.getByLabel("Regelseite", { exact: true }).selectOption("contact");
  await page.keyboard.press("Escape");
  await page.getByRole("heading", { name: "Angebot für {{Ort}}", exact: true }).click();
  const panel = page.getByRole("region", { name: "Personalisierung", exact: true });
  await panel.getByLabel("Testwerte im Canvas anzeigen", { exact: true }).check();
  await panel.getByLabel("Testwert: Ort", { exact: true }).fill("Hamburg");
  await expect(page.getByRole("heading", { name: "Angebot für Hamburg", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Vorlagentext anzeigen", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Angebot für {{Ort}}", exact: true })).toBeVisible();
  await expect(page.getByTestId("button-save")).toBeDisabled();
  expect(writes).toEqual([]); expect(errors).toEqual([]);
});

for (const variant of ["control", "alternative"]) {
  test(`Personalisierung nur in A/B-Alternative: ${variant}`, async ({ page, baseURL }) => {
    const funnel = fixture();
    const elements = structuredClone(funnel.pages[1].elements);
    funnel.pages[1].elements = elements.map(element => ({ ...element, personalization: undefined, content: element.id === "title" ? "Allgemeines Angebot" : element.id === "campaign" ? "Allgemeine Aktion" : element.content }));
    funnel.abTests = [{ id: "test", pageId: "contact", name: "Ansprache", status: "running", variants: [
      { id: "control", name: "Kontrolle", trafficAllocation: 50, views: 0, conversions: 0 },
      { id: "alternative", name: "Persönlich", trafficAllocation: 50, views: 0, conversions: 0, elements },
    ] }];
    await page.addInitScript(variant => sessionStorage.setItem("tw_ab_personalization-reader", JSON.stringify({ test: variant })), variant);
    const { payloads, errors } = await mockFunnel(page, baseURL!, funnel);
    await page.goto("/f/personalization-reader?utm_campaign=Herbst");
    await page.getByPlaceholder("Dein Ort").fill("Berlin");
    await page.getByTestId("button-funnel-next").click();
    await expect(page.getByRole("heading", { name: variant === "alternative" ? "Angebot für Berlin" : "Allgemeines Angebot", exact: true })).toBeVisible();
    await expect(page.getByText(variant === "alternative" ? "Aktion Herbst" : "Allgemeine Aktion", { exact: true })).toBeVisible();
    await page.getByPlaceholder("E-Mail", { exact: true }).fill("personal@example.test");
    await page.getByTestId("button-funnel-submit").click();
    await expect(page.getByRole("heading", { name: "Vielen Dank", exact: true })).toBeVisible();
    expect(payloads).toHaveLength(1);
    expect(payloads[0].answerSnapshot).toMatchObject({ documentVersion: 4, contentRevisionId: 321, path: ["start", "contact"], variants: { test: variant } });
    expect(payloads[0].answers?.Ort).toBe("Berlin");
    expect(JSON.stringify(payloads[0].answers)).not.toContain("Herbst");
    expect(errors).toEqual([]);
  });
}
