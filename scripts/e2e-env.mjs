/** Shared, fail-closed settings for the E2E runner and direct database helpers. */
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);
const DATABASE_NAME = /^funnelsoftware_e2e(?:_[a-z0-9_]+)?$/;

function parseUrl(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} muss ausdrücklich für die lokale Testumgebung gesetzt sein.`);
  }
  try {
    return new URL(value);
  } catch {
    // Never echo credentials from the URL in an error message.
    throw new Error(`${label} ist keine gültige URL.`);
  }
}

export function validateE2EDatabaseUrl(value) {
  const url = parseUrl(value, "E2E_DATABASE_URL");
  if (!["postgres:", "postgresql:"].includes(url.protocol) ||
      !LOOPBACK_HOSTS.has(url.hostname) || !url.username ||
      url.search || url.hash || !DATABASE_NAME.test(url.pathname.slice(1))) {
    throw new Error("E2E_DATABASE_URL muss auf eine lokale PostgreSQL-Datenbank funnelsoftware_e2e[_suffix] zeigen; URL-Parameter sind verboten.");
  }
  if (url.port && (!/^\d+$/.test(url.port) || Number(url.port) < 1 || Number(url.port) > 65535)) {
    throw new Error("E2E_DATABASE_URL enthält einen ungültigen Port.");
  }
  return url.toString();
}

export function validateE2EBaseUrl(value, port) {
  const url = parseUrl(value, "PLAYWRIGHT_BASE_URL");
  if (url.protocol !== "http:" || !LOOPBACK_HOSTS.has(url.hostname) ||
      url.username || url.password || url.search || url.hash ||
      url.pathname !== "/" || Number(url.port || 80) !== port) {
    throw new Error("PLAYWRIGHT_BASE_URL muss eine lokale HTTP-Adresse am E2E_PORT ohne Pfad, Zugangsdaten oder Parameter sein.");
  }
  return url.origin;
}

export function readE2EConfig(source = process.env) {
  if (source.PLAYWRIGHT_NO_SERVER) {
    throw new Error("PLAYWRIGHT_NO_SERVER ist deaktiviert: E2E-Tests starten immer ihren eigenen Testserver.");
  }
  const rawPort = source.E2E_PORT ?? "5137";
  if (!/^\d+$/.test(rawPort) || Number(rawPort) < 1024 || Number(rawPort) > 65535) {
    throw new Error("E2E_PORT muss eine ganze Zahl zwischen 1024 und 65535 sein.");
  }
  const port = Number(rawPort);
  const databaseUrl = validateE2EDatabaseUrl(source.E2E_DATABASE_URL);
  const baseUrl = validateE2EBaseUrl(source.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`, port);
  return { port, databaseUrl, baseUrl };
}

/** Do not inherit credentials, PG* overrides, NODE_OPTIONS or dotenv settings. */
export function createE2EServerEnvironment(source = process.env) {
  const config = readE2EConfig(source);
  const env = {};
  for (const key of ["PATH", "HOME", "USER", "LOGNAME", "TMPDIR", "TMP", "TEMP", "SystemRoot", "LANG", "LC_ALL", "CI"]) {
    if (source[key] !== undefined) env[key] = source[key];
  }
  return {
    ...env,
    NODE_ENV: "development",
    E2E_TEST_MODE: "1",
    BUILDER_LAYOUT_EDITOR: source.BUILDER_LAYOUT_EDITOR === "true" ? "true" : "false",
    BUILDER_ROUTING_EDITOR: source.BUILDER_ROUTING_EDITOR === "true" ? "true" : "false",
    BUILDER_PERSONALIZATION_EDITOR: source.BUILDER_PERSONALIZATION_EDITOR === "true" ? "true" : "false",
    BUILDER_LIBRARY_EDITOR: source.BUILDER_LIBRARY_EDITOR === "true" ? "true" : "false",
    DOTENV_CONFIG_PATH: "/dev/null",
    DATABASE_URL: config.databaseUrl,
    E2E_DATABASE_URL: config.databaseUrl,
    E2E_PORT: String(config.port),
    PLAYWRIGHT_BASE_URL: config.baseUrl,
    PORT: String(config.port),
    HOST: new URL(config.baseUrl).hostname === "[::1]" ? "::1" : "127.0.0.1",
    APP_URL: config.baseUrl,
    STRIPE_SECRET_KEY: "",
    STRIPE_PRICE_ID: "",
    STRIPE_WEBHOOK_SECRET: "",
    SMTP_HOST: "",
    SMTP_USER: "",
    SMTP_PASS: "",
    FROM_EMAIL: "noreply@example.test",
    BUG_REPORT_EMAIL: "bugs@example.test",
    SENTRY_DSN: "",
    DISABLE_SCHEDULER: "1",
    DISABLE_RECRUITING_MAIL_WORKER: "1",
    SESSION_SECRET: "isolated-e2e-session-secret",
    CSRF_SECRET: "isolated-e2e-csrf-secret",
  };
}
