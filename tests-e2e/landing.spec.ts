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
    await expect(page.getByTestId("marketing-header").getByRole("link", { name: /^Anmelden$/i })).toBeVisible();

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

for (const width of [320, 390, 768]) {
  test(`mobile navigation fits ${width}px and supports keyboard dismissal`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const header = page.getByTestId("marketing-header");
    const brand = await header.getByRole("link", { name: "Trichterwerk Startseite" }).boundingBox();
    const start = await header.getByRole("link", { name: "Kostenlos starten" }).boundingBox();
    const menu = await header.getByRole("button", { name: "Menü öffnen" }).boundingBox();
    expect(brand!.x + brand!.width).toBeLessThanOrEqual(start!.x);
    expect(start!.x + start!.width).toBeLessThanOrEqual(menu!.x);
    expect(menu!.x + menu!.width).toBeLessThanOrEqual(width);
    await header.getByRole("button", { name: "Menü öffnen" }).click();
    await expect(page.getByRole("navigation", { name: "Mobile Navigation" }).getByRole("link", { name: "Anmelden" })).toBeVisible();
    await page.getByRole("navigation", { name: "Mobile Navigation" }).getByRole("link", { name: "Anmelden" }).focus();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await header.getByRole("button", { name: "Menü öffnen" }).click();
    await page.getByRole("navigation", { name: "Mobile Navigation" }).getByRole("link", { name: "Preise" }).click();
    await expect(page).toHaveURL(/#pricing$/);
    await expect.poll(async () => (await page.locator("#pricing").boundingBox())!.y).toBeLessThan(100);
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
}
