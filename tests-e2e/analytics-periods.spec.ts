import { test, expect } from "@playwright/test";
import { registerAndVerify, createPublishedFunnel } from "./helpers/api";
import { closePool } from "./helpers/db";

test.afterAll(closePool);
test("analytics uses the selected period and records the observed path", async ({ page, request }) => {
  await registerAndVerify(page.request);
  const suffix = Date.now().toString(36);
  const funnel = await createPublishedFunnel(page.request, { name: `Analytics ${suffix}`, slug: `analytics-${suffix}` });
  const visitId = crypto.randomUUID();
  for (const [sequence, eventType, pageId, previousPageId] of [[0, "view", undefined, null], [1, "pageView", "page-1", null], [2, "pageView", "page-3", "page-1"]] as const) {
    const response = await page.request.post("/api/public/analytics", { data: { funnelUuid: funnel.uuid, eventType, pageId, metadata: { visitId, sequence, previousPageId } } });
    expect(response.status()).toBe(201);
  }
  const response = await page.request.get(`/api/funnels/${funnel.id}/metrics?range=7d`);
  expect(response.ok()).toBeTruthy();
  const metrics = await response.json();
  expect(metrics.totalViews).toBe(1);
  expect(metrics.paths.transitions).toMatchObject([{ from: "page-1", to: "page-3", visits: 1 }]);
  expect(metrics.paths.exits).toEqual([]);
  expect((await page.request.get(`/api/funnels/${funnel.id}/metrics?range=bad`)).status()).toBe(400);
  await page.goto("/analytics");
  await expect(page.getByTestId("visitor-paths")).toContainText("Willkommen → Danke!");
  await page.getByTestId("select-time-range").click();
  const changed = page.waitForResponse(response => response.url().includes("/api/analytics/overview?range=7d"));
  await page.getByRole("option", { name: "Letzte 7 Tage" }).click();
  expect((await changed).ok()).toBeTruthy();
  await expect(page.getByTestId("visitor-paths")).toContainText("1 erfasste Besuche");
  await registerAndVerify(request);
  expect((await request.get(`/api/funnels/${funnel.id}/metrics?range=7d`)).status()).toBe(404);
  expect(await (await request.get("/api/analytics/overview?range=7d")).json()).toMatchObject({ totalViews: 0, totalLeads: 0, funnels: [] });
});
