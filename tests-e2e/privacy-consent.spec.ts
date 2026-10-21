import { test, expect, type Page } from "@playwright/test";
import { MARKETING_CONSENT_VERSION } from "../shared/privacy-consent";
import { createPublishedFunnel, getCsrfToken, registerAndVerify } from "./helpers/api";
import { closePool } from "./helpers/db";
import { runId } from "./helpers/unique";

const consentPath = "/api/privacy/marketing-consent";
const pixelCalls: string[] = [];

async function blockExternalRequests(page: Page) {
  await page.route("https://**/*", route => {
    pixelCalls.push(route.request().url());
    return route.fulfill({ contentType: "text/plain", body: "" });
  });
}

async function fixture(page: Page, identifier: string, withEmbeds = false) {
  await page.route(`**/api/public/funnels/${identifier}`, route => route.fulfill({ json: {
    uuid: identifier, name: identifier, datenschutzUrl: "https://example.com/privacy",
    impressumUrl: "https://example.com/legal", metaPixelId: "123456789012345",
    gtmId: "GTM-TEST123", allowCustomScripts: false,
    theme: { primaryColor: "#6d28d9", backgroundColor: "#ffffff", textColor: "#111827", fontFamily: "Inter" },
    pages: [{ id: "welcome", type: "welcome", title: "Datenschutz-Test", elements: withEmbeds ? [
      { id: "video", type: "video", videoType: "youtube", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
      { id: "calendar", type: "calendar", calendarUrl: "https://calendly.com/example/30min" },
    ] : [] }],
  } }));
}

test.beforeEach(async ({ page }) => {
  pixelCalls.length = 0;
  await blockExternalRequests(page);
});
test.afterAll(closePool);

test("anonyme Zustimmung braucht CSRF und Widerruf funktioniert nach Registrierung und Logout", async ({ page }) => {
  const denied = await page.request.post(consentPath, { data: { marketing: true, version: MARKETING_CONSENT_VERSION } });
  expect(denied.status()).toBe(403);
  await page.goto("/datenschutz");
  await page.getByTestId("cookie-consent-accept").click();
  await expect.poll(async () => (await (await page.request.get(consentPath)).json()).marketing).toBe(true);
  await registerAndVerify(page.request);
  await page.request.post("/api/auth/logout");
  await page.reload();
  await page.getByTestId("privacy-revoke").click();
  await expect.poll(async () => (await (await page.request.get(consentPath)).json()).marketing).toBe(false);
  await expect(page.getByTestId("cookie-consent-accept")).toBeVisible();
});

test("verlorene Bestätigung bleibt nach Reload sichtbar und lässt sich widerrufen", async ({ page }) => {
  await page.goto("/datenschutz");
  await page.route(`**${consentPath}`, async route => {
    if (route.request().method() !== "POST") return route.continue();
    // Der Server hat den Nachweis und Cookie bereits erzeugt; nur die Antwort
    // an die Oberfläche geht verloren. Das darf nicht als Ablehnung gelten.
    await route.fetch();
    await route.abort("failed");
  });
  await page.getByTestId("cookie-consent-accept").click();
  await expect(page.getByRole("alert")).toContainText("noch nicht bestätigt");
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("noch nicht bestätigt");
  expect(pixelCalls.some(url => url.includes("connect.facebook.net"))).toBe(false);
  await page.unroute(`**${consentPath}`);
  await page.getByRole("button", { name: "Widerruf erneut senden" }).click();
  await expect.poll(async () => (await (await page.request.get(consentPath)).json()).marketing).toBe(false);
  await expect(page.getByTestId("cookie-consent-accept")).toBeVisible();
});

test("Plattform und zwei Kunden-Funnels übernehmen keine fremde Freigabe", async ({ page }) => {
  await fixture(page, "customer-a");
  await fixture(page, "customer-b");
  await page.goto("/datenschutz");
  await page.getByTestId("cookie-consent-accept").click();
  await expect(page.getByTestId("cookie-consent-accept")).toBeHidden();
  await expect.poll(() => pixelCalls.some(url => url.includes("connect.facebook.net"))).toBe(true);
  pixelCalls.length = 0;
  await page.goto("/f/customer-a");
  await expect(page.getByTestId("cookie-consent-accept")).toBeVisible();
  expect(pixelCalls).toEqual([]);
  await expect(page.getByRole("link", { name: "Datenschutz und Anbieter" })).toHaveAttribute("href", "https://example.com/privacy");
  await page.getByTestId("cookie-consent-accept").click();
  await expect.poll(() => pixelCalls.some(url => url.includes("connect.facebook.net"))).toBe(true);
  expect(pixelCalls.some(url => url.includes("googletagmanager.com"))).toBe(false);
  pixelCalls.length = 0;
  await page.goto("/f/customer-b");
  await expect(page.getByTestId("cookie-consent-reject")).toBeVisible();
  expect(pixelCalls).toEqual([]);
});

test("Video und Kalender sind mobil erreichbar, laden erst nach Aktivierung und enden beim Widerruf", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await fixture(page, "embed-test", true);
  await page.goto("/f/embed-test");
  await expect(page.getByRole("button", { name: "Inhalt laden" })).toHaveCount(2);
  expect(await page.locator("iframe").count()).toBe(0);
  expect(pixelCalls).toEqual([]);
  const load = page.getByRole("button", { name: "Inhalt laden" }).first();
  await load.scrollIntoViewIfNeeded();
  // toBeVisible allein übersieht Abschneiden durch overflow:hidden.
  expect(await load.evaluate(button => {
    const r = button.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return hit === button || !!hit && button.contains(hit);
  })).toBe(true);
  await load.click();
  await expect(page.locator('iframe[src*="youtube-nocookie.com"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Inhalt laden" }).click();
  await expect(page.locator('iframe[src*="calendly.com"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Cookie-Einstellungen", exact: true }).click();
  await expect(page.getByRole("button", { name: "Inhalt laden" })).toHaveCount(2);
  await expect(page.locator("iframe")).toHaveCount(0);
});

test("Kunden-GTM ist auf der Plattform gesperrt und Kundendomains nehmen keine Kontozugriffe an", async ({ request }) => {
  await registerAndVerify(request);
  const suffix = runId();
  const funnel = await createPublishedFunnel(request, { name: "Isolierter Funnel", slug: `privacy-${suffix}` });
  const csrf = await getCsrfToken(request);
  const changed = await request.patch(`/api/funnels/${funnel.id}`, { headers: { "X-CSRF-Token": csrf }, data: { gtmId: "GTM-TEST123" } });
  expect(changed.ok()).toBe(true);
  const publicResult = await request.get(`/api/public/funnels/${funnel.slug}`);
  expect((await publicResult.json()).allowCustomScripts).toBe(false);
  const write = await request.post("/api/funnels", { headers: { Host: "customer.example.test", "X-CSRF-Token": csrf }, data: { name: "Nicht erlaubter Kontozugriff" } });
  expect(write.status()).toBe(403);
  expect((await write.json()).code).toBe("PLATFORM_HOST_REQUIRED");
  const account = await request.get("/api/auth/user", { headers: { Host: "customer.example.test" } });
  expect(account.status()).toBe(401);
});

test("Empfehlungslinks erzeugen keinen dauerhaften Affiliate-Speicher", async ({ page }) => {
  await page.goto("/register?ref=synthetic-partner");
  await expect(page.getByRole("button", { name: /kostenlos|registrieren|account erstellen/i })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("tw-signup-ref"))).toBeNull();
});

test("Widerruf beendet bereits geladene Kundenskripte auch im zweiten Tab", async ({ page, context }) => {
  await fixture(page, "shared-tabs");
  await page.goto("/f/shared-tabs");
  await page.getByTestId("cookie-consent-accept").click();
  await expect.poll(() => pixelCalls.some(url => url.includes("connect.facebook.net"))).toBe(true);
  const second = await context.newPage();
  await blockExternalRequests(second);
  await fixture(second, "shared-tabs");
  await second.goto("/f/shared-tabs");
  await expect.poll(() => second.evaluate(() => !!(window as unknown as { fbq?: unknown }).fbq)).toBe(true);
  const reloaded = second.waitForEvent("load");
  await page.getByRole("button", { name: "Cookie-Einstellungen", exact: true }).click();
  await reloaded;
  await expect(second.getByTestId("cookie-consent-accept")).toBeVisible();
  expect(await second.evaluate(() => !!(window as unknown as { fbq?: unknown }).fbq)).toBe(false);
});

test("eine wiederhergestellte Seite beendet Skripte bei inzwischen widerrufener Zustimmung", async ({ page }) => {
  await fixture(page, "restored-customer");
  await page.goto("/f/restored-customer");
  await page.getByTestId("cookie-consent-accept").click();
  await expect.poll(() => page.evaluate(() => !!window.fbq)).toBe(true);
  const reloaded = page.waitForEvent("load");
  await page.evaluate(() => {
    // Wiederherstellung deterministisch simulieren: Der Zustand änderte sich,
    // während das Dokument eingefroren war; kein storage-/focus-Ereignis.
    const key = "tw-consent-v2:funnel:restored-customer";
    const record = JSON.parse(localStorage.getItem(key)!);
    record.preferences = { necessary: true, analytics: false, marketing: false };
    localStorage.setItem(key, JSON.stringify(record));
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
  });
  await reloaded;
  expect(await page.evaluate(() => !!window.fbq)).toBe(false);
  expect(await page.locator('script[src*="connect.facebook.net"]').count()).toBe(0);
});
