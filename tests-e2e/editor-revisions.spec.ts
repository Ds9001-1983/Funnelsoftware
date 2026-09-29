import { test, expect } from "@playwright/test";
import { registerAndVerify, createPublishedFunnel, getCsrfToken } from "./helpers/api";
import { closePool } from "./helpers/db";
import { makeSlug, runId } from "./helpers/unique";

test.afterAll(closePool);
test("Editor speichert Entwürfe, veröffentlicht bewusst und stellt Versionen ohne Live-Änderung wieder her", async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("onboarding-completed", "true"); localStorage.setItem("trichterwerk-cookie-consent", "true"); });
  await registerAndVerify(page.request);
  const funnel = await createPublishedFunnel(page.request, { name: "Live Ausgangsstand", slug: makeSlug(runId()) });
  await page.goto(`/funnels/${funnel.id}`);
  await page.getByTestId("button-settings").click();
  await page.getByTestId("input-funnel-settings-name").fill("Neuer Entwurf");
  await page.keyboard.press("Escape");
  const savedResponse = page.waitForResponse(response => response.url().endsWith(`/api/funnels/${funnel.id}`) && response.request().method() === "PATCH");
  await page.getByTestId("button-save").click();
  expect((await savedResponse).status()).toBe(200);
  await expect(page.getByText(/Gespeichert/).first()).toBeVisible();
  expect((await (await page.request.get(`/api/public/funnels/${funnel.slug}`)).json()).name).toBe("Live Ausgangsstand");
  await page.getByTestId("button-publish").click();
  const publishResponse = page.waitForResponse(response => response.url().endsWith(`/api/funnels/${funnel.id}`) && response.request().method() === "PATCH");
  await page.getByTestId("button-confirm-publish").click();
  expect((await publishResponse).status()).toBe(200);
  expect((await (await page.request.get(`/api/public/funnels/${funnel.slug}`)).json()).name).toBe("Neuer Entwurf");
  await page.getByRole("button", { name: "Gespeicherte Versionen", exact: true }).click();
  const initial = page.getByRole("dialog").locator("div.border.rounded-lg").filter({ hasText: "Version 0" });
  await initial.getByRole("button", { name: "Wiederherstellen", exact: true }).click();
  await page.getByRole("button", { name: "Als Entwurf wiederherstellen", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await (await page.request.get(`/api/funnels/${funnel.id}`)).json()).name).toBe("Live Ausgangsstand");
  expect((await (await page.request.get(`/api/public/funnels/${funnel.slug}`)).json()).name).toBe("Neuer Entwurf");

  // Ein zweiter Editorstand darf den lokalen Entwurf nicht überschreiben.
  const owner = await (await page.request.get(`/api/funnels/${funnel.id}`)).json();
  const changed = await page.request.patch(`/api/funnels/${funnel.id}`, { headers: { "X-CSRF-Token": await getCsrfToken(page.request) }, data: {
    name: "Anderer Tab", documentVersion: 1, expectedVersion: owner.editVersion, mutationId: crypto.randomUUID(),
  } });
  expect(changed.status()).toBe(200);
  await page.getByTestId("button-settings").click();
  await page.getByTestId("input-funnel-settings-name").fill("Meine lokale Arbeit");
  await page.keyboard.press("Escape");
  await page.getByTestId("button-save").click();
  await expect(page.getByRole("button", { name: "Als neuen Funnel sichern" })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Inhalt herunterladen" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("funnel-inhaltssicherung.json");
  expect((await (await page.request.get(`/api/funnels/${funnel.id}`)).json()).name).toBe("Anderer Tab");
  await page.getByRole("button", { name: "Als neuen Funnel sichern" }).click();
  await page.waitForURL(url => /\/funnels\/\d+$/.test(url.pathname) && !url.pathname.endsWith(`/${funnel.id}`));
  await expect(page.getByText("Meine lokale Arbeit (Sicherung)", { exact: true }).first()).toBeVisible();
});
