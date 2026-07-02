import { test, expect } from "@playwright/test";

/**
 * Smoke-Test: Lädt die Landing-Page und prüft die wichtigsten sichtbaren
 * Bausteine (Headline, primärer CTA, Login-Link). Den vollen
 * Register-zu-Publish-Flow deckt funnel-lifecycle.spec.ts ab.
 */
test.describe("Landing Page", () => {
  test("rendert Hero, CTA und Login-Link", async ({ page }) => {
    await page.goto("/");

    // H1 mit dem aktuellen Claim ("Funnels, die verkaufen.")
    await expect(page.locator("h1")).toContainText(/Funnels.*verkaufen/i);

    // Primärer CTA
    await expect(
      page.getByRole("link", { name: /14 Tage kostenlos testen/i }).first(),
    ).toBeVisible();

    // Navigation: Login-Link
    await expect(page.getByRole("button", { name: /^Anmelden$/i })).toBeVisible();

    // Trust-Leiste sollte mind. eines der vier Vertrauenssignale anzeigen
    await expect(page.getByText(/DSGVO|Made in Germany|14 Tage gratis/i).first()).toBeVisible();
  });

  test("Footer hat funktionierende Legal-Links", async ({ page }) => {
    await page.goto("/");

    // Scroll zum Footer
    await page.getByRole("link", { name: "Impressum" }).scrollIntoViewIfNeeded();

    await expect(page.getByRole("link", { name: "Impressum" })).toHaveAttribute(
      "href",
      "/impressum",
    );
    await expect(page.getByRole("link", { name: "Datenschutz" })).toHaveAttribute(
      "href",
      "/datenschutz",
    );
    await expect(page.getByRole("link", { name: "AGB" })).toHaveAttribute("href", "/agb");
  });
});
