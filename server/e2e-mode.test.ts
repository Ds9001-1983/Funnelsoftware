import { describe, expect, it } from "vitest";
import { isolatedE2EMode } from "./e2e-mode";
const local = { NODE_ENV: "development", E2E_TEST_MODE: "1", HOST: "127.0.0.1", DATABASE_URL: "postgresql://test@localhost:55440/funnelsoftware_e2e" };
describe("E2E rate budget isolation", () => {
  it("permits only explicitly isolated local development", () => { expect(isolatedE2EMode(local)).toBe(true); });
  it.each([{ NODE_ENV: "production" }, { E2E_TEST_MODE: "" }, { HOST: "0.0.0.0" }, { DATABASE_URL: "postgresql://test@db.example.com/funnelsoftware_e2e" }, { DATABASE_URL: "postgresql://test@localhost/production" }, { DATABASE_URL: "postgresql://test@localhost/funnelsoftware_e2e?options=x" }, { DATABASE_URL: "" }])("keeps real-server budgets for %o", change => { expect(isolatedE2EMode({ ...local, ...change })).toBe(false); });
});
