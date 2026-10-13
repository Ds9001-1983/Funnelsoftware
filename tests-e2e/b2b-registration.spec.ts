import { test, expect } from "@playwright/test";
import { createHash } from "node:crypto";
import pg from "pg";
import { E2E_DATABASE_URL } from "./helpers/env";
import { makeCredentials } from "./helpers/unique";
import { getCsrfToken } from "./helpers/api";
import { REGISTRATION_CONTRACT, legalDocumentUrl, type RegistrationContract } from "../shared/registration-contract";

test("mobile B2B-Registrierung: Pflichtangaben, archivierte Annahme, kein Abo und geschützter Nachweis", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const credentials = makeCredentials();
  const payload = { ...credentials, businessName: "  Musterbetrieb E2E  ", businessConfirmed: true, termsAccepted: true, legalVersion: REGISTRATION_CONTRACT.version };
  const db = new pg.Client({ connectionString: E2E_DATABASE_URL });
  await db.connect();
  try {
    const missing = await page.request.post("/api/auth/register", { data: { ...payload, termsAccepted: false } });
    expect(missing.status()).toBe(400);
    const stale = await page.request.post("/api/auth/register", { data: { ...payload, legalVersion: "2020-01-01" } });
    expect(stale.status()).toBe(400);
    expect((await stale.json()).error).toContain("lade die Seite neu");
    expect((await db.query("SELECT id FROM users WHERE email = $1", [credentials.email])).rows).toHaveLength(0);

    await page.goto("/register");
    await expect(page.locator("#businessConfirmed")).not.toBeChecked();
    await expect(page.locator("#termsAccepted")).not.toBeChecked();
    await expect(page.getByRole("link", { name: "AGB lesen und speichern" })).toHaveAttribute("href", legalDocumentUrl(REGISTRATION_CONTRACT.version, "agb"));
    await page.locator("#businessName").fill(payload.businessName);
    await page.locator("#email").fill(credentials.email);
    await page.locator("#password").fill(credentials.password);
    expect(await page.locator("form").evaluate((form: HTMLFormElement) => form.checkValidity())).toBe(false);
    await page.locator("#businessConfirmed").check();
    await page.locator("#termsAccepted").check();
    const createdPromise = page.waitForResponse((response) => response.url().endsWith("/api/auth/register") && response.request().method() === "POST");
    const before = Date.now();
    await page.getByTestId("button-register-submit").click();
    const created = await createdPromise;
    expect(created.status()).toBe(201);
    const body = await created.json();
    expect(body).not.toHaveProperty("checkoutUrl");
    expect(body.user.stripeCustomerId).toBeNull();
    expect(body.user.stripeSubscriptionId).toBeNull();
    await page.waitForURL(/\/funnels\/new/);

    const row = (await db.query("SELECT registration_contract, email_verification_token FROM users WHERE email = $1", [credentials.email])).rows[0];
    const contract = row.registration_contract as RegistrationContract;
    expect(contract).toEqual(body.user.registrationContract);
    expect(contract.businessName).toBe("Musterbetrieb E2E");
    expect(contract.businessDeclaration).toBe(REGISTRATION_CONTRACT.businessDeclaration);
    expect(contract.acceptanceDeclaration).toBe(REGISTRATION_CONTRACT.acceptanceDeclaration);
    expect(Date.parse(contract.acceptedAt)).toBeGreaterThanOrEqual(before);
    expect(Date.parse(contract.acceptedAt)).toBeLessThanOrEqual(Date.now());
    const receiptResponse = await page.request.get("/api/auth/registration-contract");
    expect(receiptResponse.headers()["cache-control"]).toContain("no-store");
    const receipt = await receiptResponse.json();
    for (const name of ["agb", "avv"] as const) {
      const archived = await page.request.get(legalDocumentUrl(contract.version, name));
      expect(archived.status()).toBe(200);
      const html = await archived.text();
      expect(createHash("sha256").update(html).digest("hex")).toBe(contract.documents[name].sha256);
      expect(receipt.documentContents[name]).toBe(html);
      const download = await page.request.get(`${legalDocumentUrl(contract.version, name)}?download=1`);
      expect(download.headers()["content-disposition"]).toContain("attachment");
      expect(await download.text()).toBe(html);
    }
    expect((await page.request.get("/api/legal/unknown/agb")).status()).toBe(404);

    // Auch ein angemeldeter Nutzer kann seinen historischen Nachweis nicht umschreiben.
    const csrf = await getCsrfToken(page.request);
    const profile = await page.request.patch("/api/auth/profile", { headers: { "X-CSRF-Token": csrf }, data: { displayName: "Neuer Anzeigename", registrationContract: { acceptedAt: "2000-01-01" } } });
    expect(profile.status()).toBe(200);
    expect((await (await page.request.get("/api/auth/registration-contract")).json())).toEqual(receipt);
    expect((await page.request.get(`/api/auth/verify-email?token=${encodeURIComponent(row.email_verification_token)}`)).ok()).toBe(true);
    await page.goto("/settings");
    await expect(page.getByTestId("registration-contract")).toContainText("Musterbetrieb E2E");
    await expect(page.getByTestId("registration-contract")).toContainText(contract.version);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await page.request.post("/api/auth/logout", { headers: { "X-CSRF-Token": csrf } });
    expect((await page.request.get("/api/auth/registration-contract")).status()).toBe(401);
    expect((await page.request.get(legalDocumentUrl(contract.version, "avv"))).status()).toBe(200);
  } finally { await db.end(); }
});
