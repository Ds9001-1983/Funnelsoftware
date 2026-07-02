import { defineConfig, devices } from "@playwright/test";
import { E2E_BASE_URL, E2E_DATABASE_URL, E2E_PORT } from "./tests-e2e/helpers/env";

/**
 * Playwright-Konfiguration für End-to-End-Tests.
 *
 * Lokal ausführen:
 *   npm run test:e2e:install  # einmalig: Chromium herunterladen
 *   npm run test:e2e          # startet Server + E2E-DB automatisch
 *
 * Voraussetzung lokal: ein laufendes PostgreSQL (Homebrew/Postgres.app). Die
 * Wegwerf-Datenbank `funnelsoftware_e2e` wird vom webServer-Command selbst
 * angelegt und migriert (scripts/e2e-ensure-db.mjs + drizzle-kit push) —
 * die eigene Dev-/Prod-DB wird nie angefasst. In CI übernimmt ein
 * Postgres-Service-Container die DB (siehe .github/workflows/ci.yml).
 *
 * PLAYWRIGHT_NO_SERVER=1 überspringt den verwalteten Server — dann muss der
 * Zielserver mit DERSELBEN Datenbank laufen wie E2E_DATABASE_URL, sonst lesen
 * die DB-Helper (Verifikations-Token, Lead-Checks) die falsche Datenbank.
 */
export default defineConfig({
  testDir: "./tests-e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: E2E_BASE_URL,
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
        command: "npm run test:e2e:server",
        url: E2E_BASE_URL,
        reuseExistingServer: !process.env.CI,
        // ensure-db + drizzle-kit push + Vite-Boot brauchen mehr als den Default.
        timeout: 180_000,
        env: {
          DATABASE_URL: E2E_DATABASE_URL,
          PORT: String(E2E_PORT),
          // Stripe MUSS leer sein: mit konfiguriertem Stripe leitet /register
          // hart zu Stripe Checkout um — der Browser verließe die App. Leere
          // Strings überstimmen die lokale .env (dotenv überschreibt gesetzte
          // Variablen nicht, auch leere nicht).
          STRIPE_SECRET_KEY: "",
          STRIPE_PRICE_ID: "",
          STRIPE_WEBHOOK_SECRET: "",
          // Ohne SMTP bleibt der Verifikations-Token nur in der DB — genau da
          // holen ihn die Tests ab (helpers/db.ts).
          SMTP_HOST: "",
          SENTRY_DSN: "",
          SESSION_SECRET: "e2e-session-secret",
          CSRF_SECRET: "e2e-csrf-secret",
        },
      },
});
