import { defineConfig, devices } from "@playwright/test";
import { E2E_BASE_URL, E2E_DATABASE_URL, E2E_PORT } from "./tests-e2e/helpers/env";

/**
 * Playwright-Konfiguration für End-to-End-Tests.
 *
 * Lokal ausführen:
 *   npm run test:e2e:install  # einmalig: Chromium herunterladen
 *   E2E_DATABASE_URL=postgresql://testuser@127.0.0.1:55437/funnelsoftware_e2e npm run test:e2e
 *
 * E2E_DATABASE_URL muss explizit auf eine lokale Wegwerf-Datenbank zeigen.
 * Der Runner prüft das Ziel und startet mit einer eigenen Umgebung ohne .env.
 * Fremde laufende Server werden nicht wiederverwendet. In CI übernimmt ein
 * Postgres-Service-Container die DB (siehe .github/workflows/ci.yml).
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
  webServer: {
    command: "npm run test:e2e:server",
    url: `${E2E_BASE_URL}/api/health`,
    reuseExistingServer: false,
    gracefulShutdown: { signal: "SIGTERM", timeout: 10_000 },
    // ensure-db + drizzle-kit push + Vite-Boot brauchen mehr als den Default.
    timeout: 180_000,
    env: {
      E2E_DATABASE_URL,
      BUILDER_LAYOUT_EDITOR: process.env.BUILDER_LAYOUT_EDITOR ?? "false",
      BUILDER_ROUTING_EDITOR: process.env.BUILDER_ROUTING_EDITOR ?? "false",
      BUILDER_PERSONALIZATION_EDITOR: process.env.BUILDER_PERSONALIZATION_EDITOR ?? "false",
      BUILDER_LIBRARY_EDITOR: process.env.BUILDER_LIBRARY_EDITOR ?? "false",
      BUILDER_RESPONSIVE_EDITOR: process.env.BUILDER_RESPONSIVE_EDITOR ?? "false",
      E2E_PORT: String(E2E_PORT),
      PLAYWRIGHT_BASE_URL: E2E_BASE_URL,
    },
  },
});
