import { test, expect } from "@playwright/test";

/**
 * Smoke-Test: Lädt die Landing-Page und prüft die wichtigsten sichtbaren
 * Bausteine (Headline, primärer CTA, Login-Link). Den vollen
 * Register-zu-Publish-Flow deckt funnel-lifecycle.spec.ts ab.
 */
test.describe("Landing Page", () => {
  test("rendert Hero, CTA und Login-Link", async ({ page }) => {
    await page.goto("/");

    // Konkreter Nutzen und dauerhafter kostenloser Einstieg.
    await expect(page.locator("h1")).toContainText("Gewinne Kunden und Bewerber");

    // Primärer CTA
    await expect(
      page.getByTestId("landing-hero").getByRole("link", { name: "Kostenlos starten" }),
    ).toBeVisible();

    // Navigation: Login-Link
    await expect(page.getByTestId("marketing-header").getByRole("link", { name: /^Anmelden$/i })).toBeVisible();

    // Trust-Leiste sollte mind. eines der vier Vertrauenssignale anzeigen
    await expect(page.getByText(/Hosting in der EU/i).first()).toBeVisible();
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

test("free offer remains consistent from landing to signup", async ({ page }) => {
  await page.goto("/");
  const hero = page.getByTestId("landing-hero");
  await expect(hero).toContainText("100 Leads pro Monat kostenlos");
  await expect(hero.locator('img[src="/images/landing-editor.webp"]')).toBeVisible();
  await hero.getByRole("link", { name: "Kostenlos starten" }).click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByText("1 veröffentlichter Funnel · 100 Leads pro Monat", { exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("14 Tage");
});

test("demos follow the hero and each card opens its matching interactive example", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("landing-hero")).toBeVisible();
  const sections = await page.locator("section").evaluateAll(nodes => nodes.slice(0, 2).map(node => node.getAttribute("data-testid")));
  expect(sections).toEqual(["landing-hero", "landing-demos"]);
  await expect(page.getByTestId("landing-hero").getByRole("link", { name: "Live-Demo ausprobieren" })).toHaveAttribute("href", "/vorlagen/express-bewerbung");
  for (const [name, slug] of [["Anfragen & Termine", "termin-buchen"], ["Express-Bewerbung", "express-bewerbung"], ["Webinar-Anmeldung", "masterclass"]]) {
    const card = page.getByTestId("landing-demos").getByRole("link", { name: `${name}: Live-Demo öffnen` });
    await expect(card).toHaveAttribute("href", `/vorlagen/${slug}`);
    await card.click();
    await expect(page.getByRole("link", { name: "Mit diesem Template starten" })).toHaveAttribute("href", `/register?template=${slug}`);
    await expect(page.getByText("Die Vorschau ist voll interaktiv", { exact: false })).toBeVisible();
    await page.goto("/");
  }
});

test("pricing explains the monthly free limit without a time-limited trial offer", async ({ page }) => {
  await page.goto("/");
  const pricing = page.locator("#pricing");
  await expect(pricing.getByRole("article", { name: "Free-Plan" })).toContainText("100 sichtbare Leads pro Monat");
  await expect(pricing.getByRole("article", { name: "Pro-Plan" })).toContainText("49 €");
  await page.getByRole("button", { name: "Was passiert nach 100 Leads?" }).click();
  await expect(page.locator("#faq")).toContainText("keine automatischen Kosten");
  await expect(page.locator("body")).not.toContainText("14 Tage");
  await expect(page.locator("body")).not.toContainText("Alles aus Agency");
});

test("free-plan preview shows the published branding without submitting leads and returns focus", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.addInitScript(() => localStorage.setItem("trichterwerk-cookie-consent", "true"));
  const writes: string[] = [];
  page.on("request", request => { if (/\/api\/public\/(leads|analytics)/.test(request.url())) writes.push(request.url()); });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "So sieht dein Free-Funnel aus" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Dein Funnel im Free-Plan" });
  await expect(dialog.getByText("Beispieladresse", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Erstellt mit Trichterwerk" })).toHaveAttribute("href", "https://trichterwerk.de/?utm_source=funnel&utm_medium=badge&utm_campaign=powered-by");
  await dialog.getByTestId("button-funnel-next").click();
  await expect(dialog.getByTestId("button-funnel-back")).toBeVisible();
  const box = (await dialog.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(320);
  await dialog.evaluate(async node => { await document.fonts.ready; await Promise.allSettled(node.getAnimations({ subtree: true }).map(animation => animation.finished)); });
  await page.screenshot({ path: testInfo.outputPath("free-preview-mobile.png") });
  await dialog.getByRole("button", { name: "Vorschau schließen" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(writes).toEqual([]);
});
