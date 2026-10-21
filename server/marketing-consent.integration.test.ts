// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createHash, randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { marketingConsents, users } from "@shared/schema";
import { MARKETING_CONSENT_VERSION } from "@shared/privacy-consent";

const connection = process.env.PRIVACY_TEST_DATABASE_URL;
if (connection) {
  const url = new URL(connection);
  if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) || !/^\/funnelsoftware_e2e(?:_[a-z0-9_]+)?$/.test(url.pathname) || url.search || url.hash || !["postgres:", "postgresql:"].includes(url.protocol)) throw new Error("Privacy tests require a dedicated local *_e2e database");
}
describe.skipIf(!connection)("Widerrufbare Marketing-Einwilligungen", () => {
  let database: typeof import("./db");
  let consent: typeof import("./marketing-consent");
  const createdUsers: number[] = [];
  const tokenHashes: string[] = [];
  const previous = process.env.DATABASE_URL;
  beforeAll(async () => {
    process.env.DATABASE_URL = connection;
    database = await import("./db");
    consent = await import("./marketing-consent");
  });
  afterAll(async () => {
    if (database) {
      if (tokenHashes.length) await database.db.delete(marketingConsents).where(inArray(marketingConsents.tokenHash, tokenHashes));
      if (createdUsers.length) await database.db.delete(users).where(inArray(users.id, createdUsers));
      await database.pool.end();
    }
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  });
  async function user() {
    const id = randomUUID();
    const [row] = await database.db.insert(users).values({ username: `privacy-${id}`, email: `${id}@example.com`, password: "fixture", marketingConsent: true }).returning();
    createdUsers.push(row.id);
    return row.id;
  }
  async function grant(userId?: number) {
    const result = await consent.grantMarketingConsent(userId);
    tokenHashes.push(createHash("sha256").update(result.token).digest("hex"));
    return result.token;
  }
  it("ignoriert einen historischen Konto-Boolean ohne gültigen Nachweis", async () => {
    const send = vi.fn();
    expect(await consent.withMarketingConsent(await user(), send)).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });
  it("bindet die anonyme Zustimmung und sperrt Folgerechnungen nach ausgeloggtem Widerruf", async () => {
    const token = await grant();
    const userId = await user();
    expect(await consent.bindMarketingConsent(token, userId)).toBe(true);
    const send = vi.fn().mockResolvedValue(undefined);
    expect(await consent.withMarketingConsent(userId, send)).toBe(true);
    await consent.revokeMarketingConsent(token);
    expect(await consent.getBrowserMarketingConsent(token)).toBeNull();
    expect(await consent.withMarketingConsent(userId, send)).toBe(false);
    expect(send).toHaveBeenCalledOnce();
  });
  it("widerruft alle Einwilligungen desselben Kontos, auch ohne Browser-Cookie", async () => {
    const userId = await user();
    const tokens = [await grant(userId), await grant(userId)];
    await consent.revokeMarketingConsent(undefined, userId);
    for (const token of tokens) expect(await consent.getBrowserMarketingConsent(token)).toBeNull();
    expect(await consent.withMarketingConsent(userId, vi.fn())).toBe(false);
  });
  it("übernimmt keinen Nachweis eines anderen Kontos", async () => {
    const owner = await user();
    const other = await user();
    const token = await grant(owner);
    expect(await consent.bindMarketingConsent(token, other)).toBe(false);
    expect(await consent.getBrowserMarketingConsent(token, other)).toBeNull();
    expect(await consent.getBrowserMarketingConsent(token, owner)).toMatchObject({ userId: owner, policyVersion: MARKETING_CONSENT_VERSION });
  });
  it("sperrt abgelaufene oder alte Fassungen und speichert keine Klartext-Widerrufstoken", async () => {
    const userId = await user();
    const token = await grant(userId);
    const hash = createHash("sha256").update(token).digest("hex");
    const [row] = await database.db.select().from(marketingConsents).where(eq(marketingConsents.tokenHash, hash));
    expect(JSON.stringify(row)).not.toContain(token);
    await database.db.update(marketingConsents).set({ policyVersion: "old" }).where(eq(marketingConsents.id, row.id));
    expect(await consent.withMarketingConsent(userId, vi.fn())).toBe(false);
    await database.db.update(marketingConsents).set({ policyVersion: MARKETING_CONSENT_VERSION, expiresAt: new Date(0) }).where(eq(marketingConsents.id, row.id));
    expect(await consent.getBrowserMarketingConsent(token)).toBeNull();
    expect(await consent.withMarketingConsent(userId, vi.fn())).toBe(false);
  });
  it("ein unbekanntes Token verändert die Zustimmung eines anderen Besuchers nicht", async () => {
    const token = await grant();
    await consent.revokeMarketingConsent("a".repeat(64));
    expect(await consent.getBrowserMarketingConsent(token)).not.toBeNull();
  });
  it("bestätigt den Widerruf erst nach einem bereits laufenden Versand und sperrt alle folgenden", async () => {
    const userId = await user();
    const token = await grant(userId);
    let started!: () => void;
    let finish!: () => void;
    const sending = new Promise<void>(resolve => { started = resolve; });
    const release = new Promise<void>(resolve => { finish = resolve; });
    const delivery = consent.withMarketingConsent(userId, async () => { started(); await release; });
    await sending;
    const revoking = consent.revokeMarketingConsent(token);
    finish();
    expect(await delivery).toBe(true);
    await revoking;
    const nextDelivery = vi.fn();
    expect(await consent.withMarketingConsent(userId, nextDelivery)).toBe(false);
    expect(nextDelivery).not.toHaveBeenCalled();
  });
  it("ersetzt den Nachweis und lässt ihn anschließend kontoweit widerrufen", async () => {
    const userId = await user();
    const previousToken = await grant(userId);
    const replacement = await consent.replaceMarketingConsent(previousToken, userId);
    expect(await consent.getBrowserMarketingConsent(previousToken)).toBeNull();
    expect(await consent.getBrowserMarketingConsent(replacement.token, userId)).not.toBeNull();
    await consent.revokeMarketingConsent(undefined, userId);
    expect(await consent.getBrowserMarketingConsent(replacement.token, userId)).toBeNull();
  });
  it("bereinigt abgelaufene Nachweise erst nach der Aufbewahrungsfrist", async () => {
    const userId = await user();
    const token = await grant(userId);
    const hash = createHash("sha256").update(token).digest("hex");
    const now = new Date();
    const cutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    await database.db.update(marketingConsents).set({ revokedAt: cutoff }).where(eq(marketingConsents.tokenHash, hash));
    await consent.purgeMarketingConsentProofs(now);
    expect(await database.db.select().from(marketingConsents).where(eq(marketingConsents.tokenHash, hash))).toHaveLength(1);
    await consent.purgeMarketingConsentProofs(new Date(now.getTime() + 1));
    expect(await database.db.select().from(marketingConsents).where(eq(marketingConsents.tokenHash, hash))).toHaveLength(0);
  });
});
