import { test, expect, type APIRequestContext } from "@playwright/test";
import pg from "pg";
import { E2E_DATABASE_URL } from "./helpers/env";
import { registerAndVerify, createPublishedFunnel, getCsrfToken } from "./helpers/api";
import { closePool } from "./helpers/db";
import { makeSlug, runId } from "./helpers/unique";

test.afterAll(closePool);

test("Bewerberprozess mit Mailregeln und getrenntem Kundenzugang", async ({ page, browser }) => {
  test.setTimeout(120_000);
  const db = new pg.Pool({ connectionString: E2E_DATABASE_URL, max: 1 });
  const customer = await browser.newContext();
  const outsider = await browser.newContext();
  const id = runId();
  const silence = () => {
    localStorage.setItem("onboarding-completed", "true");
    localStorage.setItem("trichterwerk-cookie-consent", "true");
  };
  async function headers(request: APIRequestContext) { return { "X-CSRF-Token": await getCsrfToken(request) }; }
  try {
    await page.addInitScript(silence);
    await customer.addInitScript(silence);
    await registerAndVerify(page.request);
    const client = await registerAndVerify(customer.request);
    await registerAndVerify(outsider.request);
    // Der Kunde braucht ausdrücklich kein eigenes Pro-Abo.
    await db.query("UPDATE users SET is_pro = false, trial_ends_at = NULL, subscription_status = 'free' WHERE email = $1", [client.email]);
    const funnelName = `Bewerbungen ${id}`;
    const funnel = await createPublishedFunnel(page.request, { name: funnelName, slug: makeSlug(id) });
    const hidden = await createPublishedFunnel(page.request, { name: `Privat ${id}`, slug: makeSlug(`privat-${id}`) });

    await page.goto("/leads");
    await page.getByLabel("Bewerberprozess", { exact: true }).click();
    await page.getByRole("option", { name: funnelName, exact: true }).click();
    await page.getByRole("button", { name: "Board & E-Mails" }).click();
    await page.getByLabel("Name der Spalte 5").fill("Absage");
    await page.getByRole("button", { name: "Spalten speichern", exact: true }).click();
    await expect(page.getByText("Spalten gespeichert", { exact: true })).toBeVisible();
    await page.getByRole("tab", { name: "E-Mails" }).click();
    await page.getByLabel("Betreff", { exact: true }).fill("Eingang {{name}}");
    await page.getByLabel("Automatischen Versand aktivieren").check();
    await page.getByRole("button", { name: "Mailregel speichern", exact: true }).click();
    await expect(page.getByText("Mailregel gespeichert", { exact: true })).toBeVisible();
    await page.getByLabel("Auslöser", { exact: true }).selectOption("stage:lost");
    await page.getByLabel("Betreff", { exact: true }).fill("Rückmeldung {{name}}");
    await page.getByLabel("Automatischen Versand aktivieren").check();
    const savedRule = page.waitForResponse(r => r.url().endsWith(`/api/recruiting/funnels/${funnel.id}/rules`) && r.request().method() === "PUT");
    await page.getByRole("button", { name: "Mailregel speichern", exact: true }).click();
    expect((await savedRule).status()).toBe(200);
    await page.keyboard.press("Escape");

    const applicant = `bewerber-${id}@example.com`;
    const payload = { funnelId: funnel.uuid, name: "Ada Bewerbung", email: applicant };
    expect((await page.request.post("/api/public/leads", { data: payload })).status()).toBe(201);
    expect((await page.request.post("/api/public/leads", { data: payload })).status()).toBe(200);
    const { rows: [lead] } = await db.query("SELECT id FROM leads WHERE email = $1", [applicant]);
    expect((await db.query("SELECT subject FROM recruiting_mail_jobs WHERE lead_id = $1", [lead.id])).rows).toEqual([{ subject: "Eingang Ada Bewerbung" }]);

    await page.goto("/workspaces");
    await page.getByLabel("Name des neuen Kundenbereichs").fill(`Kunde ${id}`);
    await page.getByRole("button", { name: "Kundenbereich anlegen", exact: true }).click();
    await page.waitForURL(/\/workspaces\/\d+$/);
    const workspaceId = Number(page.url().split("/").pop());
    await page.getByRole("button", { name: "Funnels zuordnen", exact: true }).click();
    await page.getByLabel(funnelName, { exact: true }).check();
    await page.getByRole("button", { name: "Zuordnung speichern", exact: true }).click();
    await expect(page.getByTestId(`recruiting-lead-${lead.id}`)).toBeVisible();
    await page.getByLabel("E-Mail für Kundeneinladung").fill(client.email);
    await page.getByRole("button", { name: "Einladen", exact: true }).click();
    await expect(page.getByText("Annahme ausstehend", { exact: true })).toBeVisible();

    const clientPage = await customer.newPage();
    await clientPage.goto("/workspaces");
    await clientPage.getByRole("button", { name: "Weiter im Free-Plan" }).click();
    await clientPage.getByRole("button", { name: "Einladung annehmen" }).click();
    await clientPage.getByRole("link", { name: `Kunde ${id} Kundenzugang` }).click();
    await expect(clientPage.getByTestId(`recruiting-lead-${lead.id}`)).toBeVisible();
    await expect(clientPage.getByRole("button", { name: "Board & E-Mails" })).toHaveCount(0);
    const forbidden = [
      `/api/recruiting/funnels/${hidden.id}/board?workspaceId=${workspaceId}`,
      `/api/recruiting/funnels/${funnel.id}/rules`,
      `/api/funnels/${funnel.id}`,
    ];
    for (const url of forbidden) expect([403, 404]).toContain((await customer.request.get(url)).status());
    expect([403, 404]).toContain((await outsider.request.get(`/api/workspaces/${workspaceId}/leads`)).status());

    const handle = await clientPage.getByRole("button", { name: "Bewerbung ziehen" }).boundingBox();
    const target = await clientPage.getByRole("region", { name: "Kontaktiert", exact: true }).boundingBox();
    if (!handle || !target) throw new Error("Drag-Ziel fehlt");
    await clientPage.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await clientPage.mouse.down();
    await clientPage.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 15 });
    await clientPage.mouse.up();
    await clientPage.getByRole("button", { name: "Status verbindlich ändern" }).click();
    await expect(clientPage.getByLabel("Status für Ada Bewerbung")).toHaveValue("contacted");
    await clientPage.getByLabel("Status für Ada Bewerbung").selectOption("lost");
    await clientPage.getByRole("button", { name: "Status verbindlich ändern" }).click();
    await expect(clientPage.getByLabel("Status für Ada Bewerbung")).toHaveValue("lost");
    const jobs = (await db.query("SELECT subject, status FROM recruiting_mail_jobs WHERE lead_id = $1 ORDER BY id", [lead.id])).rows;
    expect(jobs).toEqual([{ subject: "Eingang Ada Bewerbung", status: "pending" }, { subject: "Rückmeldung Ada Bewerbung", status: "pending" }]);
    // Derselbe veraltete Änderungsstand darf keinen zweiten Versand auslösen.
    const stale = await customer.request.patch(`/api/recruiting/leads/${lead.id}/stage?workspaceId=${workspaceId}`, { headers: await headers(customer.request), data: { stageId: "new", expectedVersion: 0 } });
    expect(stale.status()).toBe(409);
    await clientPage.getByRole("button", { name: /Ada Bewerbung.*example.com/ }).click();
    await expect(clientPage.getByText("Rückmeldung Ada Bewerbung", { exact: true })).toBeVisible();
    await clientPage.keyboard.press("Escape");
    await clientPage.setViewportSize({ width: 390, height: 844 });
    expect(await clientPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "Zugang entziehen", exact: true }).click();
    await expect(page.getByRole("button", { name: "Zugang entziehen", exact: true })).toHaveCount(0);
    expect([403, 404]).toContain((await customer.request.get(`/api/recruiting/funnels/${funnel.id}/board?workspaceId=${workspaceId}`)).status());
    await clientPage.reload();
    await expect(clientPage.getByTestId(`recruiting-lead-${lead.id}`)).toHaveCount(0);
    expect((await db.query("SELECT id FROM leads WHERE id = $1", [lead.id])).rowCount).toBe(1);
  } finally {
    await Promise.allSettled([customer.close(), outsider.close(), db.end()]);
  }
});
