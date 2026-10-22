import { test, expect, type APIRequestContext } from "@playwright/test";
import pg from "pg";
import { E2E_DATABASE_URL } from "./helpers/env";
import { registerAndVerify, createPublishedFunnel, getCsrfToken } from "./helpers/api";
import { closePool } from "./helpers/db";
import { makeSlug, runId } from "./helpers/unique";

test.afterAll(closePool);
test("retention drafts preview without deletion, preserve exceptions and enforce ownership", async ({ page, browser }) => {
  const database = new pg.Pool({ connectionString: E2E_DATABASE_URL, max: 1 });
  const other = await browser.newContext();
  const anonymous = await browser.newContext();
  const headers = async (request: APIRequestContext) => ({ "X-CSRF-Token": await getCsrfToken(request) });
  try {
    await page.addInitScript(() => {
      localStorage.setItem("onboarding-completed", "true");
      localStorage.setItem("trichterwerk-cookie-consent", "true");
    });
    const owner = await registerAndVerify(page.request);
    await registerAndVerify(other.request);
    const key = runId();
    const name = `Aufbewahrung ${key}`;
    const funnel = await createPublishedFunnel(page.request, { name, slug: makeSlug(key) });
    const { rows: [lead] } = await database.query(`INSERT INTO leads (user_id,funnel_id,name,email,status,closed_at,created_at)
      SELECT id,$1,'Ada Frist','ada@example.invalid','lost',now()-interval '31 days',now()-interval '90 days' FROM users WHERE email=$2 RETURNING id, closed_at`, [funnel.id, owner.email]);
    const url = `/api/retention/funnels/${funnel.id}`;
    expect((await anonymous.request.get(url)).status()).toBe(401);
    expect((await other.request.get(url)).status()).toBe(404);
    const input = { expectedVersion: 0, mode: "closed_applications", days: 30, purpose: "Dokumentierter Testzweck" };
    expect((await page.request.put(url, { data: input })).status()).toBe(403);
    expect((await other.request.put(url, { headers: await headers(other.request), data: input })).status()).toBe(404);
    expect((await page.request.put(url, { headers: await headers(page.request), data: { ...input, enabled: true } })).status()).toBe(400);
    expect((await other.request.put(`/api/retention/leads/${lead.id}/exception`, { headers: await headers(other.request), data: { expectedVersion: 0, exception: null } })).status()).toBe(404);
    // Clients cannot forge completion evidence via the generic lead endpoint.
    expect((await page.request.patch(`/api/leads/${lead.id}`, { headers: await headers(page.request), data: { closedAt: "2000-01-01" } })).status()).toBe(200);
    const original = (await database.query("SELECT closed_at FROM leads WHERE id=$1", [lead.id])).rows[0].closed_at;
    expect(original).toEqual(lead.closed_at);
    await page.goto("/leads");
    await page.getByLabel("Bewerberprozess", { exact: true }).click();
    await page.getByRole("option", { name, exact: true }).click();
    await page.getByRole("button", { name: "Aufbewahrung planen" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/Automatische Löschung ist ausgeschaltet/)).toBeVisible();
    await expect(dialog.getByTestId("retention-count-unknown")).toHaveText("1");
    await dialog.getByLabel("Aufbewahrung in Tagen (je 24 Stunden)").fill("30");
    await dialog.getByLabel("Begründung für die gewählte Frist").fill(input.purpose);
    await dialog.getByRole("button", { name: "Entwurf speichern und Vorschau aktualisieren" }).click();
    await expect(dialog.getByTestId("retention-count-due")).toHaveText("1");
    await dialog.getByRole("button", { name: "Ausnahme", exact: true }).click();
    await dialog.getByLabel(`Ausnahmegrund für Lead #${lead.id}`).fill("Beleg wird noch benötigt");
    await dialog.getByLabel("Nächster Prüftermin").fill(`${new Date().getUTCFullYear() + 1}-01-15T12:00`);
    await dialog.getByRole("button", { name: "Ausnahme speichern", exact: true }).click();
    await expect(dialog.getByTestId("retention-count-excluded")).toHaveText("1");
    await expect(dialog.getByTestId("retention-count-due")).toHaveText("0");
    await database.query("UPDATE lead_retention_exceptions SET review_at=now()-interval '1 day' WHERE lead_id=$1", [lead.id]);
    await dialog.getByRole("button", { name: "Neu laden", exact: true }).click();
    await expect(dialog.getByTestId("retention-count-review")).toHaveText("1");
    await dialog.getByRole("button", { name: "Ausnahme aufheben", exact: true }).click();
    await expect(dialog.getByTestId("retention-count-due")).toHaveText("1");
    expect((await database.query("SELECT count(*)::int AS n FROM leads WHERE id=$1", [lead.id])).rows[0].n).toBe(1);
    const preview = await page.request.get(url);
    expect(preview.headers()["cache-control"]).toBe("no-store");
    expect(await preview.json()).toMatchObject({ automaticDeletion: false, draft: { version: 1 } });
    expect((await page.request.put(url, { headers: await headers(page.request), data: input })).status()).toBe(409);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Aufbewahrung planen" }).click();
    await expect(dialog.getByLabel("Begründung für die gewählte Frist")).toHaveValue(input.purpose);
  } finally { await other.close(); await anonymous.close(); await database.end(); }
});
