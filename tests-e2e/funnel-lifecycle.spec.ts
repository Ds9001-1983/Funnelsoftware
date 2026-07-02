import { test, expect } from "@playwright/test";
import { getVerificationToken, findLeadsByEmail, closePool } from "./helpers/db";
import { makeCredentials, makeSlug, runId as newRunId } from "./helpers/unique";

/**
 * Der Revenue-Pfad als ein durchgehender Lebenszyklus:
 * Registrieren → E-Mail verifizieren → Funnel aus Template erstellen →
 * Publizieren → als anonymer Besucher durchklicken → Lead absenden →
 * Persistenz beim Owner prüfen.
 *
 * Identifikatoren sind pro Versuch eindeutig (Retries erzeugen frische User/Slugs),
 * deshalb braucht es kein DB-Cleanup zwischen Läufen.
 */

// Overlays (Onboarding-Modal, Cookie-Banner) vorab stummschalten — sie liegen
// sonst über den Buttons, die der Test klicken will.
const SILENCE_OVERLAYS = () => {
  localStorage.setItem("onboarding-completed", "true");
  localStorage.setItem("trichterwerk-cookie-consent", "true");
  localStorage.setItem(
    "trichterwerk-cookie-preferences",
    JSON.stringify({ necessary: true, analytics: false, marketing: false }),
  );
};

test.afterAll(async () => {
  await closePool();
});

test("Kompletter Funnel-Lebenszyklus: Registrieren → Erstellen → Publizieren → Lead", async ({ page, browser }) => {
  test.setTimeout(120_000);

  const id = newRunId();
  const creds = makeCredentials(id);
  const slug = makeSlug(id);
  const leadEmail = `lead-${id}@example.com`;

  await page.addInitScript(SILENCE_OVERLAYS);

  await test.step("Registrieren (ohne Stripe-Redirect)", async () => {
    await page.goto("/register");
    await page.fill("#username", creds.username);
    await page.fill("#email", creds.email);
    await page.fill("#password", creds.password);
    await page.fill("#confirmPassword", creds.password);
    await page.getByTestId("button-register-submit").click();
    // Stripe ist in der E2E-Umgebung deaktiviert → Redirect zurück in die App.
    await page.waitForURL("/");
  });

  await test.step("E-Mail verifizieren (Token aus der Test-DB)", async () => {
    const token = await getVerificationToken(creds.email);
    const res = await page.request.get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
    expect(res.ok()).toBe(true);
  });

  let funnelId = "";
  await test.step("Funnel aus VSL-Demo-Template erstellen", async () => {
    await page.goto("/funnels");
    await page.getByTestId("button-new-funnel").click();
    await page.waitForURL(/\/funnels\/new/);
    await page.getByTestId("template-template-vsl-demo").click();
    await page.getByTestId("button-continue").click();
    await page.getByTestId("input-funnel-name").fill(`E2E Funnel ${id}`);
    await page.getByTestId("button-create-funnel").click();
    await page.waitForURL(/\/funnels\/(\d+)$/);
    funnelId = page.url().match(/\/funnels\/(\d+)$/)![1];
  });

  await test.step("Publizieren mit eigenem Slug", async () => {
    await page.getByTestId("button-publish").click();
    await page.getByTestId("input-publish-slug").fill(slug);
    // Debounce + check-slug-Roundtrip abwarten: Button wird erst danach klickbar.
    await expect(page.getByTestId("button-confirm-publish")).toBeEnabled();
    const [patch] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes(`/api/funnels/${funnelId}`) && r.request().method() === "PATCH",
      ),
      page.getByTestId("button-confirm-publish").click(),
    ]);
    expect(patch.status()).toBe(200);
    expect(((await patch.json()) as { status: string }).status).toBe("published");
  });

  const visitor = await browser.newContext();
  const v = await visitor.newPage();
  await v.addInitScript(SILENCE_OVERLAYS);

  await test.step("Public-View im frischen Besucher-Kontext", async () => {
    await v.goto(`/f/${slug}`);
    // Dev-Server injiziert keine SSR-Meta → auf gerendertes DOM asserten.
    await expect(v.getByText("Entdecke das Geheimnis erfolgreicher Unternehmer")).toBeVisible();
  });

  await test.step("Durchklicken bis zur Kontaktseite", async () => {
    await v.getByTestId("button-funnel-next").click();
    await expect(v.getByText("Wie hat dir das Video gefallen?")).toBeVisible();
    // Radios sind optional — reines Durchklicken testet die Navigation.
    await v.getByTestId("button-funnel-next").click();
    await expect(v.getByText("Wo stehst du gerade?")).toBeVisible();
    await v.getByTestId("button-funnel-next").click();
    await expect(v.getByText("Sichere dir jetzt den Zugang")).toBeVisible();
  });

  await test.step("Lead absenden (Honeypot bleibt unangetastet)", async () => {
    await v.getByPlaceholder("Dein Vorname").fill("E2E Tester");
    await v.getByPlaceholder("Deine E-Mail").fill(leadEmail);
    const [leadRes] = await Promise.all([
      v.waitForResponse(
        (r) => r.url().includes("/api/public/leads") && r.request().method() === "POST",
      ),
      v.getByTestId("button-funnel-submit").click(),
    ]);
    expect(leadRes.status()).toBe(201);
    expect(((await leadRes.json()) as { success: boolean }).success).toBe(true);
    await expect(v.getByText("Willkommen an Bord!")).toBeVisible();
  });

  await test.step("Persistenz: Lead in DB und in der Owner-Ansicht", async () => {
    const leads = await findLeadsByEmail(leadEmail);
    expect(leads).toHaveLength(1);
    expect(leads[0].name).toBe("E2E Tester");

    await page.goto("/leads");
    await expect(page.getByText(leadEmail)).toBeVisible();
  });

  await visitor.close();
});
