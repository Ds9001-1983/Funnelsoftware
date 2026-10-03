/** Larger rate budgets are restricted to the disposable loopback-only E2E server. */
export function isolatedE2EMode(env: NodeJS.ProcessEnv): boolean {
  if (env.NODE_ENV !== "development" || env.E2E_TEST_MODE !== "1" || !["127.0.0.1", "::1", "localhost"].includes(env.HOST ?? "")) return false;
  try {
    const url = new URL(env.DATABASE_URL ?? "");
    return ["postgres:", "postgresql:"].includes(url.protocol) && ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
      && !url.search && !url.hash && /^funnelsoftware_e2e(?:_[a-z0-9_]+)?$/.test(url.pathname.slice(1));
  } catch { return false; }
}
