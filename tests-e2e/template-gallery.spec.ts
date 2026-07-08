import { test, expect } from "@playwright/test";

/**
 * Öffentliche Template-Galerie (/vorlagen): rendert ohne Login, und die
 * interaktive Live-Vorschau lässt sich bis zur Danke-Seite durchspielen,
 * OHNE dass Leads oder Analytics-Events entstehen — das ist die zentrale
 * Zusicherung des Preview-Modus (FunnelRenderer ohne Callbacks).
 */

// Cookie-Banner vorab stummschalten — er liegt sonst über den Buttons.
const SILENCE_OVERLAYS = () => {
  localStorage.setItem("trichterwerk-cookie-consent", "true");
  localStorage.setItem(
    "trichterwerk-cookie-preferences",
    JSON.stringify({ necessary: true, analytics: false, marketing: false }),
  );
};

test("Galerie rendert ohne Anmeldung mit Kacheln und CTAs", async ({ page }) => {
  await page.addInitScript(SILENCE_OVERLAYS);
  await page.goto("/vorlagen");

  await expect(
    page.getByRole("heading", { name: "Funnel-Vorlagen zum Live-Ausprobieren" }),
  ).toBeVisible();

  // Mindestens die Termin-Kachel ist da und verlinkt korrekt.
  const tile = page.getByRole("link", { name: "Live-Vorschau: Termin buchen" });
  await expect(tile).toBeVisible();
  await expect(tile).toHaveAttribute("href", "/vorlagen/termin-buchen");

  // Start-CTA trägt den Template-Slug in die Registrierung.
  await expect(
    page.getByRole("link", { name: "Mit Template starten" }).first(),
  ).toHaveAttribute("href", /\/register\?template=/);
});

test("Live-Vorschau: kompletter Durchlauf ohne Lead- oder Analytics-Requests", async ({ page }) => {
  await page.addInitScript(SILENCE_OVERLAYS);

  // Jeden Request auf die öffentlichen Schreib-Endpunkte mitschneiden —
  // die Vorschau darf exakt null davon auslösen.
  const trackedCalls: string[] = [];
  page.on("request", (req) => {
    if (
      req.url().includes("/api/public/leads") ||
      req.url().includes("/api/public/analytics")
    ) {
      trackedCalls.push(`${req.method()} ${req.url()}`);
    }
  });

  await page.goto("/vorlagen/termin-buchen");
  await expect(
    page.getByText("Bereit für dein kostenloses Strategiegespräch?"),
  ).toBeVisible();

  // Welcome → Frage 1 → Frage 2 → Kalender → Kontakt
  await page.getByTestId("button-funnel-next").click();
  await expect(page.getByText("Was beschreibt deine Situation am besten?")).toBeVisible();
  await page.getByText("Ich möchte wachsen").click();
  await page.getByTestId("button-funnel-next").click();
  await expect(page.getByText("Was ist dein monatliches Budget?")).toBeVisible();
  await page.getByTestId("button-funnel-next").click();
  await expect(page.getByText("Wähle deinen Wunschtermin")).toBeVisible();
  await page.getByTestId("button-funnel-next").click();
  await expect(page.getByText("Fast geschafft!")).toBeVisible();

  // Kontaktdaten ausfüllen und "absenden" — Preview simuliert nur den Erfolg.
  await page.getByPlaceholder("Dein Vorname").fill("Preview");
  await page.getByPlaceholder("Dein Nachname").fill("Test");
  await page.getByPlaceholder("Deine E-Mail").fill("preview@example.com");
  await page.getByPlaceholder("Deine Telefonnummer").fill("0151 2345678");
  await page.getByTestId("button-funnel-submit").click();

  await expect(page.getByText("Dein Termin ist gebucht!")).toBeVisible();

  // Die zentrale Zusicherung: kein einziger Schreib-Request.
  expect(trackedCalls).toEqual([]);
});

test("Unbekannter Template-Slug zeigt die öffentliche 404 mit Galerie-Link", async ({ page }) => {
  await page.addInitScript(SILENCE_OVERLAYS);
  await page.goto("/vorlagen/gibt-es-nicht");
  await expect(page.getByRole("heading", { name: "Vorlage nicht gefunden" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Zur Vorlagen-Galerie/ })).toBeVisible();
});
