import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("trichterwerk-cookie-consent", "true"));
});

test("contact works without an account and preserves inputs after a real delivery failure", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 844 });
  const leads: string[] = [];
  page.on("request", request => { if (/\/api\/public\/(leads|analytics)/.test(request.url())) leads.push(request.url()); });
  await page.goto("/");
  await page.getByRole("link", { name: "Fragen? Schreib direkt unserem Team." }).click();
  await expect(page).toHaveURL(/\/kontakt$/);
  const email = page.getByLabel("E-Mail", { exact: true });
  const message = page.getByLabel("Deine Nachricht");
  await email.fill("visitor@example.com");
  await message.fill("Wie kann ich meinen ersten Funnel veröffentlichen?");
  // The isolated E2E server deliberately has no SMTP configuration.
  const failed = page.waitForResponse(response => response.url().endsWith("/api/public/contact") && response.status() === 503);
  await page.getByRole("button", { name: "Nachricht senden" }).click();
  await failed;
  await expect(page.getByRole("alert")).toContainText("Eingaben bleiben erhalten");
  await expect(email).toHaveValue("visitor@example.com");
  await expect(message).toHaveValue("Wie kann ich meinen ersten Funnel veröffentlichen?");
  await expect(page.getByRole("link", { name: "info@superbrand.marketing" })).toHaveAttribute("href", "mailto:info@superbrand.marketing");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("contact-mobile.png") });
  await page.route("**/api/public/contact", route => route.fulfill({ json: { ok: true } }));
  await page.getByRole("button", { name: "Nachricht senden" }).click();
  await expect(page.getByRole("status")).toContainText("Danke für deine Nachricht!");
  await page.getByRole("button", { name: "Weitere Nachricht schreiben" }).click();
  await expect(email).toHaveValue("");
  await expect(message).toHaveValue("");
  expect(leads).toEqual([]);
});

test("contact validates input, supports keyboard submission and prevents double sends", async ({ page }) => {
  await page.goto("/kontakt");
  let requests = 0;
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/public/contact", async route => { requests++; await gate; await route.fulfill({ json: { ok: true } }); });
  const submit = page.getByRole("button", { name: "Nachricht senden" });
  await page.getByLabel("E-Mail", { exact: true }).fill("invalid");
  await submit.click();
  expect(requests).toBe(0);
  await page.getByLabel("E-Mail", { exact: true }).fill("visitor@example.com");
  await page.getByLabel("Deine Nachricht").fill("Ich habe eine Frage zu den Vorlagen.");
  await submit.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Wird gesendet …" })).toBeDisabled();
  await page.keyboard.press("Enter");
  await expect.poll(() => requests).toBe(1);
  release();
  await expect(page.getByRole("status")).toContainText("Danke für deine Nachricht!");
  expect(requests).toBe(1);
});
