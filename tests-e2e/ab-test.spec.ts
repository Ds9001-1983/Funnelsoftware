import { test, expect } from "@playwright/test";
import { registerAndVerify, getCsrfToken, createPublishedFunnel } from "./helpers/api";
import { closePool } from "./helpers/db";
import { makeCredentials, makeSlug, runId as newRunId } from "./helpers/unique";

/**
 * A/B-Tests Ende-zu-Ende: Ein laufender Test teilt Traffic (Variante wird
 * deterministisch über die vorbelegte sessionStorage-Zuweisung erzwungen),
 * der Public-Funnel rendert die Varianten-Overrides, und die
 * view-/submit-Events speisen den Stats-Endpoint /api/funnels/:id/ab-stats.
 */

const TEST_ID = "test-e2e";
const VARIANT_A = "variant-a";
const VARIANT_B = "variant-b";
const VARIANT_B_TITLE = "Variante B gewinnt dich!";

const SILENCE_OVERLAYS = () => {
  localStorage.setItem("trichterwerk-cookie-consent", "true");
  localStorage.setItem(
    "trichterwerk-cookie-preferences",
    JSON.stringify({ necessary: true, analytics: false, marketing: false }),
  );
};

test.afterAll(async () => {
  await closePool();
});

test("Variante wird gerendert, Stats zählen View + Conversion", async ({ page, request }) => {
  const id = newRunId();
  await registerAndVerify(request, makeCredentials(id));
  const funnel = await createPublishedFunnel(request, {
    name: `AB Funnel ${id}`,
    slug: makeSlug(id),
  });

  // Laufenden A/B-Test auf der Welcome-Seite anlegen (wie der Editor: PATCH aufs abTests-jsonb).
  const csrf = await getCsrfToken(request);
  const patch = await request.patch(`/api/funnels/${funnel.id}`, {
    headers: { "X-CSRF-Token": csrf },
    data: {
      abTests: [
        {
          id: TEST_ID,
          name: "E2E Headline-Test",
          pageId: "page-1",
          status: "running",
          variants: [
            { id: VARIANT_A, name: "Kontrolle", trafficAllocation: 50, views: 0, conversions: 0 },
            {
              id: VARIANT_B,
              name: "Variante B",
              title: VARIANT_B_TITLE,
              trafficAllocation: 50,
              views: 0,
              conversions: 0,
            },
          ],
          config: { minSampleSize: 100, significanceThreshold: 0.95, goalMetric: "conversion" },
          createdAt: new Date().toISOString(),
        },
      ],
    },
  });
  expect(patch.ok()).toBe(true);

  // Variante B deterministisch erzwingen: getVariantAssignments liest die
  // Session-Zuweisung, bevor es neu würfelt.
  await page.addInitScript(SILENCE_OVERLAYS);
  await page.addInitScript(
    ({ key, value }) => sessionStorage.setItem(key, value),
    {
      key: `tw_ab_${funnel.uuid}`,
      value: JSON.stringify({ [TEST_ID]: VARIANT_B }),
    },
  );

  // View-Event muss die Varianten-Zuweisung tragen.
  const [viewReq] = await Promise.all([
    page.waitForRequest(
      (r) =>
        r.url().includes("/api/public/analytics") &&
        r.method() === "POST" &&
        (r.postDataJSON() as { eventType?: string })?.eventType === "view",
    ),
    page.goto(`/f/${funnel.slug}`),
  ]);
  const viewBody = viewReq.postDataJSON() as {
    metadata?: { abVariants?: Record<string, string> };
  };
  expect(viewBody.metadata?.abVariants).toEqual({ [TEST_ID]: VARIANT_B });

  // Override sichtbar: Variante B ersetzt den Seitentitel.
  await expect(page.getByText(VARIANT_B_TITLE)).toBeVisible();

  // Lead absenden → submit-Event trägt dieselbe Zuweisung.
  await page.getByTestId("button-funnel-next").click();
  await page.getByPlaceholder("Deine E-Mail").fill(`ab-${id}@example.com`);
  const [submitReq] = await Promise.all([
    page.waitForRequest(
      (r) =>
        r.url().includes("/api/public/analytics") &&
        r.method() === "POST" &&
        (r.postDataJSON() as { eventType?: string })?.eventType === "submit",
    ),
    page.getByTestId("button-funnel-submit").click(),
  ]);
  const submitBody = submitReq.postDataJSON() as {
    metadata?: { abVariants?: Record<string, string> };
  };
  expect(submitBody.metadata?.abVariants).toEqual({ [TEST_ID]: VARIANT_B });
  await expect(page.getByText("Danke!")).toBeVisible();

  // Stats-Endpoint aggregiert die Events (Owner-Session im request-Context).
  await expect
    .poll(async () => {
      const res = await request.get(`/api/funnels/${funnel.id}/ab-stats`);
      if (!res.ok()) return null;
      const stats = (await res.json()) as Record<
        string,
        Record<string, { views: number; conversions: number }>
      >;
      return stats[TEST_ID]?.[VARIANT_B] ?? null;
    })
    .toEqual({ views: 1, conversions: 1 });
});
