import { test, expect } from "@playwright/test";
import pg from "pg";
import { E2E_DATABASE_URL } from "./helpers/env";
import { makeCredentials } from "./helpers/unique";
const pool = new pg.Pool({ connectionString: E2E_DATABASE_URL });
test.afterAll(() => pool.end());
test.describe.configure({ mode: "serial" });
const count = async () => Number((await pool.query("SELECT count(*) FROM platform_visits")).rows[0].count);

test("browser objection persists across reload and stops beacons on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/datenschutz");
  await page.getByRole("button", { name: "Reichweitenmessung widersprechen" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Die Reichweitenmessung" })).toContainText("ausgeschaltet");
  const cookie = (await page.context().cookies()).find(c => c.name === "tw_platform_optout");
  expect(cookie).toMatchObject({ value: "1", path: "/", sameSite: "Lax" });
  const beacons: string[] = [];
  page.on("request", request => { if (request.url().includes("/api/public/track")) beacons.push(request.url()); });
  await page.reload();
  await expect(page.getByRole("button", { name: "Widerspruch zurücknehmen" })).toBeVisible();
  await page.goto("/");
  await page.getByRole("link", { name: /Kostenlos/ }).first().waitFor();
  expect(beacons).toEqual([]);
  await page.goto("/datenschutz");
  await page.getByRole("button", { name: "Widerspruch zurücknehmen" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Die Reichweitenmessung" })).toContainText("eingeschaltet");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Reichweitenmessung widersprechen" }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/r12-privacy-mobile.png" });
});

test("server honors cookie, DNT, GPC and host boundaries; drops arbitrary metadata", async ({ request }) => {
  const start = await count();
  for (const headers of [{ Cookie: "tw_platform_optout=1" }, { DNT: "1" }, { "X-Platform-Optout": "1" }, { "Sec-GPC": "1" }, { Host: "customer.example.test" }]) {
    const response = await request.post("/api/public/track", { headers, data: { path: "/", eventType: "pageview" } });
    expect(response.status()).toBe(204);
  }
  expect(await count()).toBe(start);
  await request.post("/api/public/track", { data: { path: "/?email=person@example.test", eventType: "cta_click", label: "person@example.test", referrer: "https://person.example.test/private", utmSource: "person@example.test", utmCampaign: "private" } });
  expect(await count()).toBe(start + 1);
  expect((await pool.query("SELECT path,label,referrer_host,utm_source,utm_campaign FROM platform_visits ORDER BY id DESC LIMIT 1")).rows[0]).toEqual({ path: "/", label: null, referrer_host: null, utm_source: null, utm_campaign: null });
});

test("registration works after objection without a registration measurement", async ({ request }) => {
  const start = await count(), credentials = makeCredentials();
  const response = await request.post("/api/auth/register", { headers: { Cookie: "tw_platform_optout=1" }, data: credentials });
  expect(response.status()).toBe(201);
  expect(await count()).toBe(start);
});

test("GPC disables the choice and requires no preference cookie", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "globalPrivacyControl", { value: true }));
  await page.setExtraHTTPHeaders({ "Sec-GPC": "1" });
  await page.goto("/datenschutz");
  await expect(page.getByRole("button", { name: "Widerspruch zurücknehmen" })).toBeDisabled();
  expect((await page.context().cookies()).some(c => c.name === "tw_platform_optout")).toBe(false);
});


test("blocked cookies still suppress registration measurement in the current tab", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(document, "cookie", { get: () => "", set: () => {}, configurable: true }));
  await page.goto("/datenschutz");
  await page.getByRole("button", { name: "Reichweitenmessung widersprechen" }).click();
  await expect(page.getByRole("alert")).toContainText("nicht dauerhaft gespeichert");
  await page.getByRole("link", { name: "Zurück zur Startseite" }).click();
  await page.getByRole("link", { name: /Kostenlos/ }).first().click();
  await page.getByLabel("E-Mail", { exact: false }).fill("synthetic-cookie-block@example.test");
  await page.locator("input#password").fill("synthetic-password-123");
  const submitted = page.waitForRequest("**/api/auth/register");
  await page.route("**/api/auth/register", route => route.fulfill({ status: 400, json: { error: "Synthetischer Test abgeschlossen" } }));
  await page.getByTestId("button-register-submit").click();
  expect((await submitted).headers()["x-platform-optout"]).toBe("1");
});
