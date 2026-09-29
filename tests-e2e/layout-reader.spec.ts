import { test, expect } from "@playwright/test";

const funnel = {
  id: 1, uuid: "layout-test", name: "Layout-Test", documentVersion: 2, status: "draft",
  theme: { primaryColor: "#123456", textColor: "#111111", backgroundColor: "#ffffff", fontFamily: "Inter" },
  pages: [{ id: "contact", type: "contact", title: "Kontakt", elements: [
    { id: "name", type: "input", placeholder: "Dein Name", required: true },
    { id: "email", type: "input", placeholder: "Deine E-Mail", required: true },
    { id: "text", type: "text", content: "Beispieltext für die dritte Spalte." },
  ], layout: { version: 1, width: "wide", sections: [{ id: "s", columns: [
    { id: "left", elementIds: ["email"] }, { id: "middle", elementIds: ["name"] }, { id: "right", elementIds: ["text"] },
  ] }] } }],
};

test.beforeEach(async ({ page, baseURL }) => {
  // Catch all external requests and all APIs, including tracking. Nothing is
  // persisted and no real services receive test data.
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.origin !== new URL(baseURL!).origin) return route.abort();
    if (url.pathname === "/api/auth/user") return route.fulfill({ json: { user: { id: 1, username: "layout-test", isPro: true, plan: "pro", emailVerifiedAt: "2026-09-29T00:00:00Z" } } });
    if (["/api/funnels/1/preview", "/api/funnels/1", "/api/public/funnels/layout-test"].includes(url.pathname)) return route.fulfill({ json: funnel });
    if (url.pathname.startsWith("/api/")) return route.fulfill({ status: 200, json: {} });
    return route.continue();
  });
});

for (const path of ["/preview/1", "/f/layout-test"]) {
  for (const width of [1440, 390]) {
  test(`${path}: Spalten und Eingabereihenfolge bei ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto(path);
    const columns = page.locator("[data-layout-column]");
    await expect(columns).toHaveCount(3);
    await page.locator(".funnel-layout").evaluate(async element => {
      await document.fonts.ready;
      await Promise.all(element.parentElement!.getAnimations().map(animation => animation.finished));
    });
    const first = (await columns.nth(0).boundingBox())!;
    const second = (await columns.nth(1).boundingBox())!;
    const third = (await columns.nth(2).boundingBox())!;
    if (width > 640) {
      expect(second.y).toBeCloseTo(first.y, 0);
      expect(third.y).toBeCloseTo(first.y, 0);
      expect(second.x).toBeGreaterThan(first.x);
      expect(third.x).toBeGreaterThan(second.x);
    } else {
      expect(second.x).toBeCloseTo(first.x, 0);
      expect(second.y).toBeGreaterThan(first.y);
      expect(third.y).toBeGreaterThan(second.y);
    }
    await page.getByPlaceholder("Deine E-Mail").focus();
    await page.keyboard.press("Tab");
    await expect(page.getByPlaceholder("Dein Name")).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
  }
}

test("eine schmale Vorschau stapelt auch auf einem großen Bildschirm", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/preview/1");
  const layout = page.locator(".funnel-layout");
  await expect(layout).toBeVisible();
  await layout.evaluate(async element => {
    await document.fonts.ready;
    await Promise.all(element.parentElement!.getAnimations().map(animation => animation.finished));
  });
  await layout.evaluate(element => { (element as HTMLElement).style.width = "340px"; });
  const columns = page.locator("[data-layout-column]");
  const first = (await columns.nth(0).boundingBox())!;
  const second = (await columns.nth(1).boundingBox())!;
  expect(second.x).toBeCloseTo(first.x, 0);
  expect(second.y).toBeGreaterThan(first.y);
});

test("öffnet neue Layouts im Editor als Vorschau ohne Schreibzugriff", async ({ page }) => {
  const writes: string[] = [];
  page.on("request", request => {
    if (request.url().includes("/api/funnels") && request.method() !== "GET") writes.push(request.method());
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/funnels/1");
  await expect(page.getByText("Die Bearbeitung ist in dieser Editorversion noch nicht verfügbar.", { exact: false })).toBeVisible();
  await expect(page.locator("[data-layout-column]")).toHaveCount(3);
  await page.getByPlaceholder("Dein Name").fill("Vorschau");
  await page.keyboard.press("ControlOrMeta+s");
  expect(writes).toEqual([]);
});
