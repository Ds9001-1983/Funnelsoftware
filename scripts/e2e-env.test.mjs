// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createE2EServerEnvironment, readE2EConfig, validateE2EDatabaseUrl } from "./e2e-env.mjs";

const localDatabase = "postgresql://e2e_user@127.0.0.1:55437/funnelsoftware_e2e";

describe("isolated E2E database", () => {
  it.each([
    localDatabase,
    "postgres://postgres:postgres@localhost:5432/funnelsoftware_e2e_ci",
    "postgresql://e2e_user@[::1]:55437/funnelsoftware_e2e_recruiting_2",
  ])("accepts an explicit local test database: %s", (url) => {
    expect(validateE2EDatabaseUrl(url)).toBe(url);
  });

  it.each([
    undefined,
    "",
    "not-a-url",
    "postgresql://user:secret@production.example.com/funnelsoftware_e2e",
    "postgresql://user@127.0.0.1/funnelflow",
    "postgresql://user@localhost/funnelsoftware_e2e_backup/other",
    "postgresql://user@localhost/funnelsoftware_e2e?host=production.example.com",
    "postgresql://user@localhost/funnelsoftware_e2e?port=5433",
    "postgresql://user@localhost/funnelsoftware_e2e#anything",
    "postgresql://user@localhost/%66unnelsoftware_e2e",
    "postgresql://user@127.0.0.1:0/funnelsoftware_e2e",
    "postgresql://user@127.0.0.1:65536/funnelsoftware_e2e",
    "postgresql://127.0.0.1/funnelsoftware_e2e",
    "postgresql://user@0.0.0.0/funnelsoftware_e2e",
    "postgresql://user@localhost.example.com/funnelsoftware_e2e",
    "https://user@localhost/funnelsoftware_e2e",
    "file:///funnelsoftware_e2e",
  ])("rejects missing, ambiguous or non-test destinations: %s", (url) => {
    expect(() => validateE2EDatabaseUrl(url)).toThrow();
  });

  it("never uses a production DATABASE_URL as fallback", () => {
    expect(() => readE2EConfig({ DATABASE_URL: localDatabase })).toThrow("E2E_DATABASE_URL");
  });

  it("does not expose URL credentials in rejection messages", () => {
    try {
      validateE2EDatabaseUrl("postgresql://user:do-not-print-me@production.example.com/funnelsoftware_e2e");
      expect.fail("Expected unsafe database URL to be rejected");
    } catch (error) {
      expect(error.message).not.toContain("do-not-print-me");
      expect(error.message).not.toContain("production.example.com");
    }
  });
});

describe("managed E2E application", () => {
  it("uses the validated database and a loopback HTTP server", () => {
    expect(readE2EConfig({ E2E_DATABASE_URL: localDatabase })).toEqual({
      databaseUrl: localDatabase,
      port: 5137,
      baseUrl: "http://127.0.0.1:5137",
    });
  });

  it.each(["0", "1", "NaN", "12.3", "65536", "5137junk", ""]) ("rejects invalid test port %s", (port) => {
    expect(() => readE2EConfig({ E2E_DATABASE_URL: localDatabase, E2E_PORT: port })).toThrow("E2E_PORT");
  });

  it.each([
    "https://trichterwerk.de",
    "http://localhost:5138",
    "http://localhost:5137/f/customer-funnel",
    "http://user:password@localhost:5137",
    "http://localhost:5137?target=remote",
    "http://localhost:5137#fragment",
    "http://0.0.0.0:5137",
  ])("rejects an unsafe or mismatched application URL: %s", (baseUrl) => {
    expect(() => readE2EConfig({ E2E_DATABASE_URL: localDatabase, PLAYWRIGHT_BASE_URL: baseUrl })).toThrow();
  });

  it("does not permit unmanaged servers", () => {
    expect(() => readE2EConfig({ E2E_DATABASE_URL: localDatabase, PLAYWRIGHT_NO_SERVER: "1" })).toThrow("PLAYWRIGHT_NO_SERVER");
  });

  it("keeps production credentials and connection overrides out of the child environment", () => {
    const env = createE2EServerEnvironment({
      E2E_DATABASE_URL: localDatabase,
      PATH: "/usr/bin:/bin",
      DATABASE_URL: "postgresql://secret@production.example.com/production",
      APP_URL: "https://trichterwerk.de",
      SMTP_HOST: "smtp.production.example.com",
      SMTP_USER: "production-user",
      SMTP_PASS: "production-password",
      STRIPE_SECRET_KEY: "production-stripe-key",
      SENTRY_DSN: "production-sentry-dsn",
      PGHOST: "production.example.com",
      PGPASSWORD: "production-db-password",
      NODE_OPTIONS: "--import ./production-bootstrap.mjs",
      DOTENV_CONFIG_PATH: "/private/production.env",
      CUSTOM_SECRET: "another-production-secret",
    });
    expect(env).toMatchObject({
      PATH: "/usr/bin:/bin",
      DATABASE_URL: localDatabase,
      DOTENV_CONFIG_PATH: "/dev/null",
      E2E_TEST_MODE: "1",
      APP_URL: "http://127.0.0.1:5137",
      HOST: "127.0.0.1",
      SMTP_HOST: "",
      SMTP_USER: "",
      SMTP_PASS: "",
      STRIPE_SECRET_KEY: "",
      SENTRY_DSN: "",
    });
    expect(env).not.toHaveProperty("PGHOST");
    expect(env).not.toHaveProperty("PGPASSWORD");
    expect(env).not.toHaveProperty("NODE_OPTIONS");
    expect(env).not.toHaveProperty("CUSTOM_SECRET");
    expect(JSON.stringify(env)).not.toContain("production");
  });

  it("binds IPv6 tests only to IPv6 loopback", () => {
    const env = createE2EServerEnvironment({
      E2E_DATABASE_URL: localDatabase,
      PLAYWRIGHT_BASE_URL: "http://[::1]:5137",
    });
    expect(env.HOST).toBe("::1");
  });
});
