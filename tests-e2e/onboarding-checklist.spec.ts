import { test, expect } from "@playwright/test";
import { MARKETING_CONSENT_VERSION } from "../shared/privacy-consent";

// UI contract tests: every API response is local, so no real leads or mails are created.
const funnel = {
  id: 10, userId: 1, uuid: "onboarding-demo", name: "Mein erster Funnel", slug: "onboarding-demo",
  status: "draft", documentVersion: 1, editVersion: 0, editorProtocol: true,
  pages: [{ id: "contact", type: "contact", title: "Kontakt aufnehmen", buttonText: "Absenden", elements: [
    { id: "email", type: "input", label: "E-Mail", placeholder: "Deine E-Mail", required: true, mapToLeadField: "email", validation: { type: "email" } },
  ] }, { id: "thanks", type: "thankyou", title: "Vielen Dank", elements: [] }],
  theme: { primaryColor: "#7C3AED", backgroundColor: "#ffffff", textColor: "#111111", fontFamily: "Inter" },
  views: 0, leads: 0, abTests: [], createdAt: "2026-11-28T10:00:00Z", updatedAt: "2026-11-28T10:00:00Z",
};

test("Erste Schritte: Ziele, Vorschau, Veröffentlichung, Anfrage und mobiles Wiedereinblenden", async ({ page }) => {
  let hasFunnel = false;
  let published = false;
  let hasLead = false;
  const publicWrites: string[] = [];
  const pageErrors: string[] = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(version => {
    localStorage.setItem("onboarding-completed", "true");
    localStorage.setItem("tw-consent-v2:platform", JSON.stringify({ version, expiresAt: Date.now() + 86400000, preferences: { necessary: true, analytics: false, marketing: false } }));
  }, MARKETING_CONSENT_VERSION);
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() !== "GET" && path.startsWith("/api/public/")) publicWrites.push(path);
    const current = { ...funnel, status: published ? "published" : "draft" };
    const data = path === "/api/auth/user" ? { user: { id: 1, email: "owner@example.test", displayName: "Alex", plan: "pro", isPro: true, emailVerifiedAt: "2026-11-28T10:00:00Z", subscriptionStatus: "active", subscriptionPlan: "pro" } }
      : path === "/api/funnels" ? (hasFunnel ? [current] : [])
      : path === "/api/funnels/10" || path === "/api/funnels/10/preview" ? current
      : path === "/api/funnels/check-slug" ? { available: true }
      : path === "/api/funnels/editor-capabilities" ? {}
      : path === "/api/leads" ? (hasLead ? [{ id: 8, funnelId: 10, funnelName: funnel.name, name: "Erste Interessentin", email: "lead@example.test", status: "new", answers: {}, createdAt: funnel.createdAt }] : [])
      : path === "/api/recruiting/funnels/10/board" ? { funnel: current, pipeline: { stages: [] }, leads: [], canConfigure: false, canChangeStatus: false }
      : path === "/api/referral/me" ? null
      : path === "/api/privacy/marketing-consent" ? { marketing: false, version: MARKETING_CONSENT_VERSION }
      : [];
    await route.fulfill({ json: data });
  });

  await page.goto("/dashboard");
  const checklist = page.getByTestId("onboarding-checklist");
  await expect(checklist.getByRole("status")).toContainText("0 von 5");
  await checklist.getByRole("link", { name: "Bewerber gewinnen" }).click();
  await expect(page).toHaveURL(/category=recruiting/);
  await expect(page.getByTestId("template-template-recruiting")).toBeVisible();
  await expect(page.getByTestId("template-template-vsl-demo")).toHaveCount(0);

  hasFunnel = true;
  await page.goto("/funnels");
  await page.getByRole("navigation", { name: "Hauptnavigation" }).getByRole("link", { name: "Dashboard" }).click();
  await expect(checklist.getByRole("status")).toContainText("1 von 5");
  await checklist.getByRole("button", { name: "Inhalte sind geprüft" }).click();
  await checklist.getByRole("link", { name: "Vorschau testen" }).click();
  await page.getByTestId("button-funnel-submit").click();
  await expect(page.getByText("Dieses Feld ist erforderlich")).toBeVisible();
  await page.getByPlaceholder("Deine E-Mail").fill("preview@example.test");
  await page.getByTestId("button-funnel-submit").click();
  await expect(page.getByText("Testdurchlauf abgeschlossen. Es wurde keine echte Anfrage versendet.")).toBeVisible();
  expect(publicWrites).toEqual([]);
  await page.getByRole("link", { name: "Zur Checkliste" }).click();
  await expect(checklist.getByRole("status")).toContainText("3 von 5");
  await checklist.getByRole("link", { name: "Veröffentlichung prüfen" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByTestId("button-confirm-publish")).toBeDisabled();
  await expect(page.getByRole("alert")).toContainText("Rechtliche Links vor der Veröffentlichung ergänzen");

  published = true;
  hasLead = true;
  await page.goto("/dashboard");
  await expect(checklist.getByRole("status")).toContainText("Geschafft!");
  await checklist.getByRole("link", { name: "Anfrage ansehen" }).click();
  await expect(page.getByRole("dialog")).toContainText("Erste Interessentin");
  await page.getByRole("dialog").getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await expect(checklist).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/onboarding-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Checkliste ausblenden" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Erste Schritte wieder anzeigen" }).click();
  await expect(checklist.getByRole("status")).toContainText("Geschafft!");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "test-results/onboarding-desktop.png", fullPage: true });
  expect(pageErrors).toEqual([]);
});
