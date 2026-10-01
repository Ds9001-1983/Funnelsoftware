import { defineConfig, devices } from "@playwright/test";

/** Static UI checks with mocked APIs; never starts Express or a database. */
export default defineConfig({
  testDir: "./tests-e2e",
  testMatch: ["layout-reader.spec.ts", "personalization-reader.spec.ts", "library-reader.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:5141", screenshot: "only-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5141 --strictPort",
    url: "http://127.0.0.1:5141",
    reuseExistingServer: false,
  },
});
