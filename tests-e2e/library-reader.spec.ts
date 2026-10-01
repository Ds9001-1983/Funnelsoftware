import { test, expect, type Page } from "@playwright/test";
import type { FunnelPage } from "../shared/schema";

const baseTheme = { primaryColor: "#123456", textColor: "#111111", backgroundColor: "#ffffff", fontFamily: "Inter" };
const sourceTheme = { ...baseTheme, primaryColor: "#aa1122", backgroundColor: "#eeeeee", fontFamily: "Lora", design: { version: 1 as const, headingSize: 36, bodySize: 18, spacing: 20, radius: 8, buttonStyle: "solid" as const } };
const sectionTheme = { ...sourceTheme, primaryColor: "#1122aa", textColor: "#1122aa", backgroundColor: "#ddeeff", fontFamily: "Geist" };
function fixture() {
  const pages: FunnelPage[] = [{ id: "start", type: "welcome", title: "Stilkopien", themeOverride: sourceTheme, elements: [
    { id: "title", type: "heading", content: "Seitendesign" }, { id: "button", type: "button", content: "Seitenbutton", buttonAction: "next" },
    { id: "section-title", type: "heading", content: "Abschnittsdesign" }, { id: "section-button", type: "button", content: "Abschnittsbutton", buttonAction: "next" },
  ], layout: { version: 1, width: "wide", sections: [
    { id: "page-style", columns: [{ id: "left", elementIds: ["title", "button"] }] },
    { id: "section-style", themeOverride: sectionTheme, columns: [{ id: "right", elementIds: ["section-title", "section-button"] }] },
  ] } }];
  return { id: 1, uuid: "library-reader", name: "Vorlagenleser", documentVersion: 5, editVersion: 1, editorProtocol: true, status: "published", pages, abTests: [], theme: baseTheme };
}
// Every API and external request is intercepted, also when exercising live assets.
async function mock(page: Page, baseURL: string, editing = false) {
  const writes: string[] = [], errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => { localStorage.setItem("onboarding-completed", "true"); localStorage.setItem("trichterwerk-cookie-consent", "true"); });
  await page.route("**/*", route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin !== new URL(baseURL).origin) return route.abort();
    if (url.pathname === "/api/auth/user") return route.fulfill({ json: { user: { id: 1, username: "reader", isPro: true, plan: "pro", emailVerifiedAt: "2026-10-01T00:00:00Z" } } });
    if (url.pathname === "/api/funnels/editor-capabilities") return route.fulfill({ json: { layoutEditing: true, routingEditing: true, personalizationEditing: true, libraryEditing: editing } });
    if (url.pathname.startsWith("/api/") && request.method() !== "GET") writes.push(url.pathname);
    if (["/api/funnels/1", "/api/funnels/1/preview", "/api/public/funnels/library-reader"].includes(url.pathname)) return route.fulfill({ json: fixture() });
    if (url.pathname.startsWith("/api/")) return route.fulfill({ json: {} });
    return route.continue();
  });
  return { writes, errors };
}
async function checkStyles(page: Page) {
  await expect(page.getByRole("heading", { name: "Seitendesign", exact: true })).toHaveCSS("font-size", "36px");
  await expect(page.getByRole("heading", { name: "Seitendesign", exact: true })).toHaveCSS("font-family", "Lora");
  await expect(page.getByRole("button", { name: "Seitenbutton", exact: true })).toHaveCSS("background-color", "rgb(170, 17, 34)");
  await expect(page.getByRole("heading", { name: "Abschnittsdesign", exact: true })).toHaveCSS("color", "rgb(17, 34, 170)");
  await expect(page.getByRole("heading", { name: "Abschnittsdesign", exact: true })).toHaveCSS("font-family", '"Geist Sans"');
  await expect(page.getByRole("button", { name: "Abschnittsbutton", exact: true })).toHaveCSS("background-color", "rgb(17, 34, 170)");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test("v5 bleibt ohne Bibliotheksfreigabe lesbar und schreibgeschützt", async ({ page, baseURL }) => {
  const { writes, errors } = await mock(page, baseURL!);
  await page.setViewportSize({ width: 1600, height: 1000 }); await page.goto("/funnels/1");
  await expect(page.getByText("Die Bearbeitung ist in dieser Editorversion noch nicht verfügbar.", { exact: false })).toBeVisible();
  await checkStyles(page); await page.keyboard.press("ControlOrMeta+s");
  expect(writes).toEqual([]); expect(errors).toEqual([]);
});
for (const path of ["/preview/1", "/f/library-reader"]) {
  test(`${path}: kopierte Seiten- und Abschnittsstile bleiben mobil erhalten`, async ({ page, baseURL }, info) => {
    const { errors } = await mock(page, baseURL!);
    await page.setViewportSize({ width: 390, height: 900 }); await page.goto(path); await checkStyles(page);
    await page.screenshot({ path: info.outputPath("library-reader-mobile.png"), animations: "disabled" }); expect(errors).toEqual([]);
  });
}
test("Canvas übernimmt dieselben Seiten- und Abschnittsstile", async ({ page, baseURL }) => {
  const { writes, errors } = await mock(page, baseURL!, true);
  await page.setViewportSize({ width: 1600, height: 1000 }); await page.goto("/funnels/1");
  await checkStyles(page); await expect(page.getByRole("button", { name: "Vorlagen & Medien", exact: true })).toBeVisible();
  expect(writes).toEqual([]); expect(errors).toEqual([]);
});
