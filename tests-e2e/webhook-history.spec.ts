import { test, expect } from "@playwright/test";
import pg from "pg";
import { E2E_DATABASE_URL } from "./helpers/env";
import { registerAndVerify, createPublishedFunnel, getCsrfToken } from "./helpers/api";
import { closePool } from "./helpers/db";
import { makeSlug, runId } from "./helpers/unique";
test.afterAll(closePool);
test("lead intake persists one webhook and owner can inspect delivery attempts", async ({ page, request }) => {
  await page.addInitScript(() => { localStorage.setItem("onboarding-completed", "true"); localStorage.setItem("trichterwerk-cookie-consent", "true"); });
  await registerAndVerify(page.request);
  const funnel = await createPublishedFunnel(page.request, { name: "Webhook Verlauf", slug: makeSlug(runId()) });
  const csrf = await getCsrfToken(page.request);
  expect((await page.request.patch(`/api/funnels/${funnel.id}`, { headers: { "X-CSRF-Token": csrf }, data: { webhookEnabled: true, webhookUrl: "https://hooks.example.com/intake" } })).ok()).toBeTruthy();
  const payload = { funnelId: funnel.uuid, email: `webhook-${runId()}@example.test` };
  expect((await page.request.post("/api/public/leads", { data: payload })).status()).toBe(201);
  expect((await page.request.post("/api/public/leads", { data: payload })).status()).toBe(200);
  const url = `/api/funnels/${funnel.id}/webhook-deliveries`;
  const history = await (await page.request.get(url)).json();
  expect(history.items).toHaveLength(1); expect(history.items[0]).toMatchObject({ status: "pending", attempts: 0, history: [] });
  expect(JSON.stringify(history)).not.toMatch(/hooks.example.com|webhookSecret|"payload"/);
  expect((await request.get(url)).status()).toBe(401); await registerAndVerify(request); expect((await request.get(url)).status()).toBe(404);
  expect((await page.request.get(`${url}?before=oops`)).status()).toBe(400);
  // Worker is disabled in E2E. Model a failed attempt locally; no external request.
  const pool = new pg.Pool({ connectionString: E2E_DATABASE_URL });
  try {
    await pool.query("UPDATE webhook_jobs SET attempts=1, error_code='http_503' WHERE id=$1", [history.items[0].id]);
    await pool.query("INSERT INTO webhook_attempts (job_id,attempt,outcome,status_code,error_code,finished_at) VALUES ($1,1,'retry',503,'http_503',NOW())", [history.items[0].id]);
    await page.goto(`/funnels/${funnel.id}`);
    await page.getByTestId("button-settings").click();
    await page.getByRole("button", { name: "Versandverlauf anzeigen" }).click();
    const panel = page.getByTestId("webhook-history"); await expect(panel).toContainText("1/5 Versuche");
    await panel.locator("summary").click(); await expect(panel).toContainText("HTTP 503"); await expect(panel).toContainText(history.items[0].eventId);
    await pool.query("UPDATE webhook_jobs SET status='delivered', attempts=2, delivered_at=NOW(), error_code=NULL WHERE id=$1", [history.items[0].id]);
    await expect(panel.getByText("Zugestellt", { exact: true })).toBeVisible({ timeout: 12_000 });
  } finally { await pool.end(); }
});
