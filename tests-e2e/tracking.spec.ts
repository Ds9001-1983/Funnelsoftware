import { test, expect } from "@playwright/test";
import { registerAndVerify, getCsrfToken, createPublishedFunnel } from "./helpers/api";
import { closePool } from "./helpers/db";
import { makeCredentials, makeSlug, runId as newRunId } from "./helpers/unique";

/**
 * Browser-Meta-Pixel auf veröffentlichten Funnels:
 * - lädt NUR mit Marketing-Consent (DSGVO-Zusicherung),
 * - feuert PageView beim Laden und pro Schritt,
 * - feuert Lead mit eventID = Lead-UUID aus der Server-Response
 *   (CAPI-Deduplizierung).
 *
 * fbevents.js wird per page.route gestubbt — der Fake zeichnet alle
 * fbq-Aufrufe in window.__fbqCalls auf; es verlässt kein Request die Testumgebung.
 */

const PIXEL_ID = "1234567890123456";

// Fake-fbevents.js: verarbeitet die Stub-Queue und zeichnet weitere Calls auf.
const FAKE_FBEVENTS = `
  (function () {
    var recorded = (window.__fbqCalls = window.__fbqCalls || []);
    var queued = (window.fbq && window.fbq.queue) || [];
    for (var i = 0; i < queued.length; i++) recorded.push(Array.prototype.slice.call(queued[i]));
    var replacement = function () { recorded.push(Array.prototype.slice.call(arguments)); };
    replacement.callMethod = replacement;
    replacement.queue = [];
    replacement.push = replacement;
    replacement.loaded = true;
    replacement.version = "2.0";
    window.fbq = replacement;
  })();
`;

function consentInit(marketing: boolean) {
  const prefs = JSON.stringify({ necessary: true, analytics: false, marketing });
  return `
    localStorage.setItem("trichterwerk-cookie-consent", "true");
    localStorage.setItem("trichterwerk-cookie-preferences", ${JSON.stringify(prefs)});
  `;
}

test.afterAll(async () => {
  await closePool();
});

test("Pixel: PageView bei Load + Schritt, Lead-eventID == Server-Lead-UUID", async ({
  page,
  request,
}) => {
  const id = newRunId();
  await registerAndVerify(request, makeCredentials(id));
  const funnel = await createPublishedFunnel(request, {
    name: `Pixel Funnel ${id}`,
    slug: makeSlug(id),
  });

  // Pixel-ID am Funnel hinterlegen (CAPI bleibt aus — reiner Browser-Test).
  const csrf = await getCsrfToken(request);
  const patch = await request.patch(`/api/funnels/${funnel.id}`, {
    headers: { "X-CSRF-Token": csrf },
    data: { metaPixelId: PIXEL_ID },
  });
  expect(patch.ok()).toBe(true);

  // fbevents.js stubben, Marketing-Consent VOR Navigation setzen.
  await page.route("**/connect.facebook.net/**", (route) =>
    route.fulfill({ contentType: "application/javascript", body: FAKE_FBEVENTS }),
  );
  await page.addInitScript(consentInit(true));

  await page.goto(`/f/${funnel.slug}`);
  await expect(page.getByText("Willkommen")).toBeVisible();

  // init + PageView beim Laden
  await expect
    .poll(async () => page.evaluate(() => (window as any).__fbqCalls?.length ?? 0))
    .toBeGreaterThanOrEqual(2);
  let calls: unknown[][] = await page.evaluate(() => (window as any).__fbqCalls);
  expect(calls).toContainEqual(["init", PIXEL_ID]);
  expect(calls.filter((c) => c[0] === "track" && c[1] === "PageView")).toHaveLength(1);

  // Schrittwechsel → weiterer PageView
  await page.getByTestId("button-funnel-next").click();
  await expect(page.getByText("Kontakt")).toBeVisible();
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          (window as any).__fbqCalls.filter(
            (c: unknown[]) => c[0] === "track" && c[1] === "PageView",
          ).length,
      ),
    )
    .toBe(2);

  // Lead absenden: eventID muss der Server-Lead-UUID entsprechen.
  await page.getByPlaceholder("Deine E-Mail").fill(`pixel-${id}@example.com`);
  const [leadRes] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/public/leads") && r.request().method() === "POST",
    ),
    page.getByTestId("button-funnel-submit").click(),
  ]);
  const leadBody = (await leadRes.json()) as { id: string };
  expect(leadBody.id).toBeTruthy();

  await expect(page.getByText("Danke!")).toBeVisible();
  calls = await page.evaluate(() => (window as any).__fbqCalls);
  const leadCall = calls.find((c) => c[0] === "track" && c[1] === "Lead");
  expect(leadCall, "Lead-Event wurde nicht gefeuert").toBeDefined();
  expect(leadCall![3]).toEqual({ eventID: leadBody.id });
});

test("Ohne Marketing-Consent lädt kein Pixel und feuert kein Event", async ({
  page,
  request,
}) => {
  const id = newRunId();
  await registerAndVerify(request, makeCredentials(id));
  const funnel = await createPublishedFunnel(request, {
    name: `Pixel Opt-out ${id}`,
    slug: makeSlug(id),
  });
  const csrf = await getCsrfToken(request);
  await request.patch(`/api/funnels/${funnel.id}`, {
    headers: { "X-CSRF-Token": csrf },
    data: { metaPixelId: PIXEL_ID },
  });

  const pixelRequests: string[] = [];
  await page.route("**/connect.facebook.net/**", (route) => {
    pixelRequests.push(route.request().url());
    return route.fulfill({ contentType: "application/javascript", body: FAKE_FBEVENTS });
  });
  // Consent gespeichert, aber Marketing abgelehnt.
  await page.addInitScript(consentInit(false));

  await page.goto(`/f/${funnel.slug}`);
  await expect(page.getByText("Willkommen")).toBeVisible();

  // Kompletter Durchlauf inkl. Lead — trotzdem darf nichts an Meta gehen.
  await page.getByTestId("button-funnel-next").click();
  await page.getByPlaceholder("Deine E-Mail").fill(`optout-${id}@example.com`);
  await page.getByTestId("button-funnel-submit").click();
  await expect(page.getByText("Danke!")).toBeVisible();

  expect(pixelRequests).toEqual([]);
  expect(await page.evaluate(() => (window as any).fbq ?? null)).toBeNull();
});
