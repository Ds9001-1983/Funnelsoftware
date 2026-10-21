import { test, expect, type APIRequestContext } from "@playwright/test";
import { readFile } from "node:fs/promises";
import pg from "pg";
import { E2E_DATABASE_URL } from "./helpers/env";
import { registerAndVerify, createPublishedFunnel, getCsrfToken } from "./helpers/api";
import { closePool } from "./helpers/db";
import { makeSlug, runId } from "./helpers/unique";

test.afterAll(closePool);

test("mobile subject export includes recruiting records across deleted funnels and preserves owner isolation", async ({ page, browser }, testInfo) => {
  test.setTimeout(120_000);
  const database = new pg.Pool({ connectionString: E2E_DATABASE_URL, max: 1 });
  const other = await browser.newContext();
  const anonymous = await browser.newContext();
  const key = runId();
  const email = `applicant-${key}@example.test`;
  const headers = async (request: APIRequestContext) => ({ "X-CSRF-Token": await getCsrfToken(request) });
  try {
    await page.addInitScript(() => {
      localStorage.setItem("onboarding-completed", "true");
      localStorage.setItem("trichterwerk-cookie-consent", "true");
    });
    const ownerCredentials = await registerAndVerify(page.request);
    await registerAndVerify(other.request);
    const funnel = await createPublishedFunnel(page.request, { name: `Export ${key}`, slug: makeSlug(key) });
    const foreign = await createPublishedFunnel(other.request, { name: `Fremd ${key}`, slug: makeSlug(`foreign-${key}`) });
    const { rows: [owner] } = await database.query("SELECT id FROM users WHERE email = $1", [ownerCredentials.email]);

    expect((await anonymous.request.get(`/api/leads/gdpr-export?email=${encodeURIComponent(email)}`)).status()).toBe(401);
    expect((await page.request.post("/api/leads/gdpr-export", { data: { email } })).status()).toBe(403);
    const invalid = await page.request.post("/api/leads/gdpr-export", { headers: await headers(page.request), data: { email: "invalid" } });
    expect(invalid.status()).toBe(400);
    expect(invalid.headers()["cache-control"]).toBe("no-store");

    expect((await page.request.put(`/api/recruiting/funnels/${funnel.id}/rules`, {
      headers: await headers(page.request),
      data: {
        expectedVersion: 0, trigger: "created", stageId: null,
        subject: "Eingang {{name}}", body: "Hallo {{name}}, deine Bewerbung ist angekommen.",
        senderName: "Recruiting-Team", enabled: true,
      },
    })).status()).toBe(200);
    // Older leads fill the Free-plan view limit; the subject export must still
    // contain the applicant's unmasked data after a downgrade.
    await database.query(
      `INSERT INTO leads (user_id, funnel_id, email, created_at)
       SELECT $1, $2, 'filler-' || item || '@example.test', now() - interval '1 second'
       FROM generate_series(1, 100) AS item`, [owner.id, funnel.id],
    );
    const submission = await page.request.post("/api/public/leads", {
      data: { funnelId: funnel.uuid, name: "Ada Export", email, answers: { experience: "Fünf Jahre" } },
    });
    expect(submission.status()).toBe(201);
    const { rows: [lead] } = await database.query("SELECT id FROM leads WHERE user_id = $1 AND email = $2", [owner.id, email]);
    expect((await page.request.patch(`/api/recruiting/leads/${lead.id}/stage`, {
      headers: await headers(page.request), data: { stageId: "lost", expectedVersion: 0 },
    })).status()).toBe(200);
    expect((await other.request.post("/api/public/leads", {
      data: { funnelId: foreign.uuid, name: "Fremde Personendaten", email },
    })).status()).toBe(201);
    expect((await page.request.delete(`/api/funnels/${funnel.id}`, { headers: await headers(page.request) })).status()).toBe(204);
    await database.query(
      "UPDATE users SET is_pro = false, trial_ends_at = NULL, subscription_status = 'free' WHERE id = $1", [owner.id],
    );
    const locked = await page.request.get(`/api/leads/${lead.id}`);
    expect(await locked.json()).toMatchObject({ locked: true });
    const outsiderExport = await other.request.get(`/api/leads/gdpr-export?email=${encodeURIComponent(email)}&userId=${owner.id}`);
    const outsiderData = await outsiderExport.json();
    expect(outsiderData.leads).toHaveLength(1);
    expect(outsiderData.leads[0].name).toBe("Fremde Personendaten");
    expect(JSON.stringify(outsiderData)).not.toContain("Ada Export");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/leads");
    const freeButton = page.getByRole("button", { name: "Weiter im Free-Plan" });
    await expect(page.getByTestId("button-gdpr").or(freeButton)).toBeVisible();
    if (await freeButton.isVisible()) await freeButton.click();
    await page.getByTestId("button-gdpr").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("button", { name: "Exportieren", exact: true })).toBeDisabled();
    await page.getByLabel("E-Mail der Person").fill(email.toUpperCase());
    const exportRequest = page.waitForRequest(request => request.url().endsWith("/api/leads/gdpr-export") && request.method() === "POST");
    const downloadPromise = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Exportieren", exact: true }).click();
    const request = await exportRequest;
    expect(new URL(request.url()).search).toBe("");
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^betroffenenauskunft-\d{4}-\d{2}-\d{2}\.json$/);
    const downloadPath = await download.path();
    if (!downloadPath) throw new Error("Download fehlt");
    const text = await readFile(downloadPath, "utf8");
    const data = JSON.parse(text);
    expect(data.count).toBe(1);
    expect(data.leads[0]).toMatchObject({ id: lead.id, name: "Ada Export", email });
    expect(data.leads[0].funnelDeletedAt).not.toBeNull();
    expect(data.recruiting.stageEvents).toMatchObject([{ fromStageId: "new", toStageId: "lost" }]);
    expect(data.recruiting.mailJobs).toMatchObject([{
      recipient: email, subject: "Eingang Ada Export", body: "Hallo Ada Export, deine Bewerbung ist angekommen.",
    }]);
    expect(text).not.toContain("Fremde Personendaten");
    await expect(page.getByText("Export erstellt", { exact: true })).toBeVisible();
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await dialog.screenshot({ path: testInfo.outputPath("subject-export-mobile.png") });

    const legacy = await page.request.get(`/api/leads/gdpr-export?email=${encodeURIComponent(email)}`);
    expect(legacy.status()).toBe(200);
    expect(legacy.headers()["cache-control"]).toBe("no-store");
    expect((await legacy.json()).recruiting).toEqual(data.recruiting);
    // A revoked/unverified address cannot access the export.
    await database.query("UPDATE users SET email_verified_at = NULL WHERE id = $1", [owner.id]);
    expect((await page.request.get(`/api/leads/gdpr-export?email=${encodeURIComponent(email)}`)).status()).toBe(403);
    await database.query("UPDATE users SET email_verified_at = now() WHERE id = $1", [owner.id]);

    page.once("dialog", confirmation => confirmation.accept());
    await dialog.getByRole("button", { name: "Daten löschen", exact: true }).click();
    await expect(page.getByText("Löschung ausgeführt", { exact: true })).toBeVisible();
    expect((await database.query("SELECT id FROM leads WHERE id = $1", [lead.id])).rowCount).toBe(0);
    expect((await database.query("SELECT id FROM lead_stage_events WHERE lead_id = $1", [lead.id])).rowCount).toBe(0);
    expect((await database.query("SELECT id FROM recruiting_mail_jobs WHERE lead_id = $1", [lead.id])).rowCount).toBe(0);
    expect((await database.query("SELECT id FROM leads WHERE funnel_id = $1 AND email = $2", [foreign.id, email])).rowCount).toBe(1);
    const empty = await page.request.post("/api/leads/gdpr-export", { headers: await headers(page.request), data: { email } });
    expect(await empty.json()).toMatchObject({ count: 0, leads: [], recruiting: { stageEvents: [], mailJobs: [] } });
  } finally {
    await Promise.allSettled([database.end(), other.close(), anonymous.close()]);
  }
});
