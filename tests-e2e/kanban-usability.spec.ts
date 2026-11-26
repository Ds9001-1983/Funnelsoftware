import { test, expect } from "@playwright/test";
import { DEFAULT_PIPELINE } from "../shared/recruiting-contract";
import { registerAndVerify, createPublishedFunnel, getCsrfToken } from "./helpers/api";
import { closePool } from "./helpers/db";
import { makeSlug, runId } from "./helpers/unique";

test.afterAll(closePool);

test("Board: keyboard confirmation, shared search, column labels in list/export and mobile", async ({ page }) => {
  await registerAndVerify(page.request);
  const funnel = await createPublishedFunnel(page.request, { name: "Bewerbungen", slug: makeSlug(runId()) });
  const headers = { "X-CSRF-Token": await getCsrfToken(page.request) };
  const stages = DEFAULT_PIPELINE.map(stage => stage.id === "contacted" ? { ...stage, name: "In Prüfung" } : stage);
  const saved = await page.request.put(`/api/recruiting/funnels/${funnel.id}/pipeline`, { headers, data: { expectedVersion: 0, stages } });
  expect(saved.status()).toBe(200);
  for (const name of ["Ada Beispiel", "Ben Beispiel"]) {
    expect((await page.request.post("/api/public/leads", { data: { funnelId: funnel.uuid, name, email: `${name.split(" ")[0]}-${runId()}@example.com` } })).status()).toBe(201);
  }
  const leads = await (await page.request.get("/api/leads")).json();
  const ada = leads.find((lead: { name: string }) => lead.name === "Ada Beispiel");
  const ben = leads.find((lead: { name: string }) => lead.name === "Ben Beispiel");
  await page.addInitScript(() => {
    localStorage.setItem("onboarding-completed", "true");
    localStorage.setItem("trichterwerk-cookie-consent", "true");
  });
  await page.goto("/leads");
  await page.getByLabel("Bewerberprozess", { exact: true }).click();
  await page.getByRole("option", { name: "Bewerbungen", exact: true }).click();
  await page.getByTestId("input-search-leads").fill(" Ada ");
  await expect(page.getByTestId(`recruiting-lead-${ada.id}`)).toBeVisible();
  await expect(page.getByTestId(`recruiting-lead-${ben.id}`)).toHaveCount(0);
  const handle = page.getByTestId(`recruiting-lead-${ada.id}`).getByRole("button", { name: "Bewerbung ziehen" });
  await handle.focus();
  await page.keyboard.press("Space");
  await expect(handle).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("status").filter({ hasText: "Ziel: In Prüfung." })).toHaveCount(1);
  await page.keyboard.press("Space");
  await expect(page.getByRole("alertdialog")).toBeVisible();
  expect((await (await page.request.get("/api/leads")).json()).find((lead: { id: number }) => lead.id === ada.id).status).toBe("new");
  await page.getByRole("button", { name: "Status verbindlich ändern" }).click();
  await expect(page.getByLabel("Status für Ada Beispiel")).toHaveValue("contacted");
  await expect(page.getByTestId(`select-status-${ada.id}`)).toContainText("In Prüfung");
  await page.getByTestId("button-export").click();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportieren (1)" }).click();
  const stream = await (await downloaded).createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const csv = Buffer.concat(chunks).toString("utf8");
  expect(csv).toContain("In Prüfung");
  expect(csv).not.toContain("Ben Beispiel");
  await page.reload();
  await expect(page.getByTestId(`select-status-${ada.id}`)).toContainText("In Prüfung");
  // Renaming affects the projection, without modifying the lead or its version.
  const renamed = stages.map(stage => stage.id === "contacted" ? { ...stage, name: "Prüfung läuft" } : stage);
  expect((await page.request.put(`/api/recruiting/funnels/${funnel.id}/pipeline`, { headers, data: { expectedVersion: 1, stages: renamed } })).status()).toBe(200);
  const after = (await (await page.request.get("/api/leads")).json()).find((lead: { id: number }) => lead.id === ada.id);
  expect(after).toMatchObject({ stageName: "Prüfung läuft", stageId: "contacted", stageVersion: 1 });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Bewerberprozess", { exact: true }).click();
  await page.getByRole("option", { name: "Bewerbungen", exact: true }).click();
  await expect(page.getByRole("region", { name: "Prüfung läuft" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath("kanban-mobile.png"), animations: "disabled", fullPage: true });
});
