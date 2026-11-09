import { test, expect, type APIRequestContext } from "@playwright/test";
import pg from "pg";
import { E2E_DATABASE_URL } from "./helpers/env";
import { registerAndVerify, createPublishedFunnel, getCsrfToken } from "./helpers/api";
import { closePool } from "./helpers/db";
import { makeSlug, runId } from "./helpers/unique";

test.afterAll(closePool);
test("owner plans statistics retention without deleting data; access, CSRF and activation are enforced", async ({ page, browser }, testInfo) => {
  const database = new pg.Pool({ connectionString: E2E_DATABASE_URL, max: 1 });
  const other = await browser.newContext(), anonymous = await browser.newContext();
  const headers = async (request: APIRequestContext) => ({ "X-CSRF-Token": await getCsrfToken(request) });
  try {
    await page.addInitScript(() => { localStorage.setItem("onboarding-completed", "true"); localStorage.setItem("trichterwerk-cookie-consent", "true"); });
    await registerAndVerify(page.request); await registerAndVerify(other.request);
    const key = runId(), name = `Statistik ${key}`;
    const funnel = await createPublishedFunnel(page.request, { name, slug: makeSlug(key) });
    await database.query("INSERT INTO analytics_events (funnel_id,event_type,timestamp) VALUES ($1,'view',(now() AT TIME ZONE 'UTC')-interval '31 days')", [funnel.id]);
    await database.query("INSERT INTO analytics_events (funnel_id,event_type) VALUES ($1,'pageView')", [funnel.id]);
    const url = `/api/retention/analytics/${funnel.id}`;
    const draft = { expectedVersion: 0, days: 30, purpose: "Begrenzte Statistik für Testkampagne" };
    expect((await anonymous.request.get(url)).status()).toBe(401);
    expect((await other.request.get(url)).status()).toBe(404);
    expect((await page.request.put(url, { data: draft })).status()).toBe(403);
    expect((await other.request.put(url, { headers: await headers(other.request), data: draft })).status()).toBe(404);
    expect((await page.request.put(url, { headers: await headers(page.request), data: { ...draft, active: true } })).status()).toBe(400);
    await page.goto("/analytics");
    await page.getByLabel("Funnel für Statistik-Aufbewahrung").selectOption(String(funnel.id));
    await page.getByRole("button", { name: "Statistik-Aufbewahrung planen", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByTestId("analytics-retention-unknown")).toHaveText("2");
    await dialog.getByLabel("Statistik-Aufbewahrung in Tagen (je 24 Stunden)").fill("30");
    await dialog.getByLabel("Begründung für die Statistik-Frist").fill(draft.purpose);
    await dialog.getByRole("button", { name: "Entwurf speichern und Vorschau aktualisieren" }).click();
    await expect(dialog.getByTestId("analytics-retention-due")).toHaveText("1");
    await expect(dialog.getByTestId("analytics-retention-waiting")).toHaveText("1");
    await expect(dialog.getByText("Automatische Statistik-Löschung ist ausgeschaltet.")).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("statistics-desktop.png") });
    await dialog.getByRole("checkbox").check();
    await expect(dialog.getByRole("button", { name: "Statistik-Löschung aktivieren", exact: true })).toBeDisabled();
    await dialog.getByLabel("Statistik-Aufbewahrung in Tagen (je 24 Stunden)").fill("90");
    await expect(dialog.getByRole("checkbox")).not.toBeChecked();
    await expect(dialog.getByRole("checkbox")).toBeDisabled();
    const preview = await page.request.get(url);
    expect(preview.headers()["cache-control"]).toBe("no-store");
    const activation = { expectedVersion: 1, active: true, confirmed: true, previewToken: (await preview.json()).previewToken };
    expect((await other.request.put(`${url}/activation`, { headers: await headers(other.request), data: activation })).status()).toBe(404);
    expect((await page.request.put(`${url}/activation`, { headers: await headers(page.request), data: { ...activation, previewToken: "forged" } })).status()).toBe(409);
    expect((await page.request.put(`${url}/activation`, { headers: await headers(page.request), data: activation })).status()).toBe(503);
    expect((await page.request.put(url, { headers: await headers(page.request), data: draft })).status()).toBe(409);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(dialog.getByLabel("Begründung für die Statistik-Frist")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("statistics-mobile.png") });
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Statistik-Aufbewahrung planen", exact: true }).click();
    await expect(dialog.getByLabel("Statistik-Aufbewahrung in Tagen (je 24 Stunden)")).toHaveValue("30");
    expect((await database.query("SELECT count(*)::int AS n FROM analytics_events WHERE funnel_id=$1", [funnel.id])).rows[0].n).toBe(2);
  } finally { await other.close(); await anonymous.close(); await database.end(); }
});

test("deleted funnel preview protects leads and keeps the final deletion opt-in", async ({ page, browser }, testInfo) => {
  const database = new pg.Pool({ connectionString: E2E_DATABASE_URL, max: 1 });
  const other = await browser.newContext();
  const headers = async () => ({ "X-CSRF-Token": await getCsrfToken(page.request) });
  try {
    await page.addInitScript(() => { localStorage.setItem("onboarding-completed", "true"); localStorage.setItem("trichterwerk-cookie-consent", "true"); });
    const owner = await registerAndVerify(page.request); await registerAndVerify(other.request);
    const key = runId();
    const empty = await createPublishedFunnel(page.request, { name: `Leer ${key}`, slug: makeSlug(`${key}empty`) });
    const protectedFunnel = await createPublishedFunnel(page.request, { name: `Geschützt ${key}`, slug: makeSlug(`${key}hold`) });
    await database.query("INSERT INTO leads(user_id,funnel_id,name) SELECT id,$1,'Geschützte Bewerbung' FROM users WHERE email=$2", [protectedFunnel.id, owner.email]);
    for (const funnel of [empty, protectedFunnel]) {
      expect((await page.request.delete(`/api/funnels/${funnel.id}`, { headers: await headers() })).status()).toBe(204);
      await database.query("UPDATE funnels SET deleted_at=(now() AT TIME ZONE 'UTC')-interval '40 days' WHERE id=$1", [funnel.id]);
    }
    const url = "/api/retention/deleted-funnels", draft = { expectedVersion: 0, days: 30, purpose: "Alte leere Funnels entfernen" };
    expect(await (await other.request.get(url)).json()).toMatchObject({ total: 0, draft: null });
    expect((await page.request.put(url, { data: draft })).status()).toBe(403);
    expect((await page.request.put(url, { headers: await headers(), data: { ...draft, userId: 123 } })).status()).toBe(400);
    await page.goto("/funnels");
    await page.getByRole("button", { name: "Gelöschte Funnels aufräumen", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByTestId("deleted-funnel-blocked")).toHaveText("1");
    await expect(dialog.getByTestId("deleted-funnel-unknown")).toHaveText("1");
    await dialog.getByLabel("Wartefrist nach Funnel-Löschung in Tagen").fill("30");
    await dialog.getByLabel("Begründung für die Funnel-Frist").fill(draft.purpose);
    await dialog.getByRole("button", { name: "Entwurf speichern und Vorschau aktualisieren" }).click();
    await expect(dialog.getByTestId("deleted-funnel-due")).toHaveText("1");
    await expect(dialog.getByText("Endgültige Funnel-Löschung ist ausgeschaltet.")).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("deleted-funnels-desktop.png") });
    await dialog.getByRole("checkbox").check();
    await expect(dialog.getByRole("button", { name: "Endgültige Funnel-Löschung aktivieren", exact: true })).toBeDisabled();
    const preview = await (await page.request.get(url)).json();
    expect((await page.request.put(`${url}/activation`, { headers: await headers(), data: { expectedVersion: 1, active: true, confirmed: true, previewToken: preview.previewToken } })).status()).toBe(503);
    expect((await page.request.put(url, { headers: await headers(), data: draft })).status()).toBe(409);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("deleted-funnels-mobile.png") });
    expect((await database.query("SELECT count(*)::int AS n FROM funnels WHERE id=ANY($1)", [[empty.id, protectedFunnel.id]])).rows[0].n).toBe(2);
    expect((await database.query("SELECT count(*)::int AS n FROM leads WHERE funnel_id=$1", [protectedFunnel.id])).rows[0].n).toBe(1);
  } finally { await other.close(); await database.end(); }
});
