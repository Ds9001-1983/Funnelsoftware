import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright-Konfiguration für End-to-End-Smoke-Tests.
 *
 * Lokal ausführen:
 *   npx playwright install   # einmalig: Browser herunterladen
 *   npm run test:e2e         # Tests gegen `npm run dev` auf Port 5000
 *
 * Voraussetzung: `.env` mit gültiger `DATABASE_URL` ist gesetzt (siehe
 * DEVELOPMENT.md). Der Dev-Server wird von Playwright automatisch gestartet.
 *
 * CI-Integration folgt separat — sie braucht einen Postgres-Service plus
 * `db:push`, Stripe-Test-Modus und SMTP-Mock.
 */
export default defineConfig({
  testDir: "./tests-e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_NO_SERVER
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:5000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
