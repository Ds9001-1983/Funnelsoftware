// The same guard protects Playwright requests and direct database helpers.
import { readE2EConfig } from "../../scripts/e2e-env.mjs";

const config = readE2EConfig();
export const E2E_PORT: number = config.port;
export const E2E_BASE_URL: string = config.baseUrl;
export const E2E_DATABASE_URL: string = config.databaseUrl;
