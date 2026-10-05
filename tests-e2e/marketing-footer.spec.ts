import { test, expect } from "@playwright/test";

for (const width of [320, 390]) {
  test(`footer groups collapse at ${width}px while essential links stay accessible`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await page.getByTestId("cookie-consent-reject").click();
    const footer = page.getByRole("contentinfo");
    const product = footer.getByRole("button", { name: "Produkt", exact: true });
    const comparisons = footer.getByRole("button", { name: "Vergleiche", exact: true });
    await expect(product).toHaveAttribute("aria-expanded", "false");
    await expect(comparisons).toHaveAttribute("aria-expanded", "false");
    await expect(footer.getByRole("link", { name: "Vorlagen", exact: true })).not.toBeVisible();
    await expect(footer.getByRole("link", { name: "Alle Vergleiche", exact: true })).not.toBeVisible();
    for (const name of ["Kostenlos starten", "Anmelden", "Kontakt", "Impressum", "Datenschutz", "AGB"]) {
      await expect(footer.getByRole("link", { name, exact: true })).toBeVisible();
    }
    const cookies = footer.getByRole("button", { name: "Cookie-Einstellungen" });
    await expect(cookies).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await footer.screenshot({ path: testInfo.outputPath(`footer-${width}.png`) });
    await product.focus();
    await page.keyboard.press("Enter");
    await expect(product).toHaveAttribute("aria-expanded", "true");
    await expect(footer.getByRole("link", { name: "Vorlagen", exact: true })).toBeVisible();
    await page.keyboard.press("Space");
    await expect(product).toHaveAttribute("aria-expanded", "false");
    await comparisons.click();
    await expect(footer.getByRole("link", { name: "Alle Vergleiche", exact: true })).toBeVisible();
    await comparisons.click();
    await cookies.click();
    await expect(page.getByTestId("cookie-consent-reject")).toBeVisible();
    await page.getByTestId("cookie-consent-reject").click();
    await footer.getByRole("link", { name: "Kontakt", exact: true }).click();
    await expect(page).toHaveURL(/\/kontakt$/);
    await expect(page.getByRole("heading", { name: "Wie können wir dir helfen?" })).toBeVisible();
  });
}

test("footer links remain visible on desktop and adapt when resizing", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/kontakt");
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("button", { name: "Produkt", exact: true })).not.toBeVisible();
  await expect(footer.getByRole("link", { name: "Vorlagen", exact: true })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Alle Vergleiche", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(footer.getByRole("link", { name: "Vorlagen", exact: true })).not.toBeVisible();
  await footer.getByRole("button", { name: "Produkt", exact: true }).click();
  await expect(footer.getByRole("link", { name: "Vorlagen", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(footer.getByRole("link", { name: "Vorlagen", exact: true })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Alle Vergleiche", exact: true })).toBeVisible();
});
