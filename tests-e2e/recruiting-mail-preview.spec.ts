import { test, expect } from "@playwright/test";
import { registerAndVerify, createPublishedFunnel } from "./helpers/api";
import { closePool } from "./helpers/db";
import { makeSlug, runId } from "./helpers/unique";

test.afterAll(closePool);

test("Mail preview renders the unsaved draft without sending or enabling mail", async ({ page }) => {
  await registerAndVerify(page.request);
  await createPublishedFunnel(page.request, { name: "Pflege-Team", slug: makeSlug(runId()) });
  await page.addInitScript(() => {
    localStorage.setItem("onboarding-completed", "true");
    localStorage.setItem("trichterwerk-cookie-consent", "true");
  });
  const mailRequests: string[] = [];
  page.on("request", request => { if (request.url().includes("/test-mail")) mailRequests.push(request.url()); });
  await page.goto("/leads");
  await page.getByLabel("Bewerberprozess", { exact: true }).click();
  await page.getByRole("option", { name: "Pflege-Team", exact: true }).click();
  await page.getByRole("button", { name: "Board & E-Mails" }).click();
  await page.getByRole("tab", { name: "E-Mails", exact: true }).click();
  const testMail = page.getByRole("button", { name: "Gespeicherte Vorlage an mich testen" });
  await expect(testMail).toBeDisabled();
  await page.getByLabel("Betreff", { exact: true }).fill("Danke {{name}} – {{funnel}}");
  await page.getByLabel("Nachricht", { exact: true }).fill("Hallo {{name}},\nFirma: {{company}}\nTermin: {{frist}}");
  await page.getByLabel("Beispielname").fill("Ada");
  await page.getByLabel("Beispielfirma").fill("Praxis");
  await expect(page.getByTestId("mail-preview-subject")).toHaveText("Danke Ada – Pflege-Team");
  await expect(page.getByTestId("mail-preview-body")).toContainText("Firma: Praxis");
  await expect(page.getByRole("status").filter({ hasText: "Unbekannte Platzhalter" })).toBeVisible();
  await expect(page.getByLabel("Automatischen Versand aktivieren")).not.toBeChecked();
  await page.getByRole("button", { name: "Mailregel speichern", exact: true }).click();
  await expect(testMail).toBeEnabled();
  await page.getByLabel("Betreff", { exact: true }).fill("Neuer Entwurf {{name}}");
  await expect(testMail).toBeDisabled();
  await expect(page.getByTestId("mail-preview-subject")).toHaveText("Neuer Entwurf Ada");
  expect(mailRequests).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
