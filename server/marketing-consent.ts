import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt, isNull, or, sql } from "drizzle-orm";
import { db } from "./db";
import { marketingConsents, users } from "@shared/schema";
import { CONSENT_MAX_AGE_MS, MARKETING_CONSENT_VERSION } from "@shared/privacy-consent";

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const validToken = (token: unknown): token is string => typeof token === "string" && /^[a-f0-9]{64}$/.test(token);
const active = (now: Date) => and(
  eq(marketingConsents.policyVersion, MARKETING_CONSENT_VERSION),
  isNull(marketingConsents.revokedAt), gt(marketingConsents.expiresAt, now),
);
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
const lockUser = (tx: Transaction, userId: number) => tx.execute(sql`SELECT pg_advisory_xact_lock(74123, ${userId})`);
const lockToken = (tx: Transaction, token: string) => tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${hashToken(token)}, 74124))`);

export async function getBrowserMarketingConsent(token: unknown, userId?: number) {
  if (!validToken(token)) return null;
  const [row] = await db.select().from(marketingConsents).where(and(
    eq(marketingConsents.tokenHash, hashToken(token)), active(new Date()),
  ));
  // Ein gemeinsam genutzter Browser darf keine Zustimmung eines anderen
  // angemeldeten Kontos übernehmen. Ausgeloggt bleibt der Widerruf möglich.
  return row && (!userId || !row.userId || row.userId === userId) ? row : null;
}

export async function grantMarketingConsent(userId?: number, now = new Date()) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(now.getTime() + CONSENT_MAX_AGE_MS);
  await db.transaction(async tx => {
    if (userId) await lockUser(tx, userId);
    await tx.insert(marketingConsents).values({
      tokenHash: hashToken(token), userId, policyVersion: MARKETING_CONSENT_VERSION,
      grantedAt: now, expiresAt,
    });
  });
  return { token, expiresAt };
}

export async function bindMarketingConsent(token: unknown, userId: number): Promise<boolean> {
  if (!validToken(token)) return false;
  return db.transaction(async tx => {
    await lockToken(tx, token);
    await lockUser(tx, userId);
    const rows = await tx.update(marketingConsents).set({ userId }).where(and(
      eq(marketingConsents.tokenHash, hashToken(token)), active(new Date()),
      or(isNull(marketingConsents.userId), eq(marketingConsents.userId, userId)),
    )).returning({ id: marketingConsents.id });
    return rows.length > 0;
  });
}

export async function revokeMarketingConsent(token: unknown, userId?: number, now = new Date()) {
  await db.transaction(tx => revokeInTransaction(tx, token, userId, now));
}

async function revokeInTransaction(tx: Transaction, token: unknown, userId: number | undefined, now: Date) {
    if (validToken(token)) await lockToken(tx, token);
    // Token vor Konto sperren, wie bei der Bindung. Der Versand hält nur die
    // Kontosperre; ein Widerruf wartet auf einen bereits laufenden Versand.
    const [known] = validToken(token) ? await tx.select().from(marketingConsents)
      .where(eq(marketingConsents.tokenHash, hashToken(token))) : [];
    const owners = Array.from(new Set([userId, known?.userId].filter((id): id is number => !!id))).sort((a, b) => a - b);
    for (const id of owners) await lockUser(tx, id);
    const conditions = owners.map(id => eq(marketingConsents.userId, id));
    if (known) conditions.push(eq(marketingConsents.id, known.id));
    if (conditions.length) await tx.update(marketingConsents).set({ revokedAt: now })
      .where(and(or(...conditions), isNull(marketingConsents.revokedAt)));
    for (const id of owners) await tx.update(users).set({ marketingConsent: false }).where(eq(users.id, id));
}

/** Austausch und Widerruf unter denselben Sperren, ohne Lücke zwischen zwei
 * Transaktionen, in die ein konkurrierender Widerruf fallen könnte. */
export async function replaceMarketingConsent(previousToken: unknown, userId?: number, now = new Date()) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(now.getTime() + CONSENT_MAX_AGE_MS);
  await db.transaction(async tx => {
    await revokeInTransaction(tx, previousToken, userId, now);
    await tx.insert(marketingConsents).values({
      tokenHash: hashToken(token), userId, policyVersion: MARKETING_CONSENT_VERSION,
      grantedAt: now, expiresAt,
    });
  });
  return { token, expiresAt };
}

/** Begrenzter Nachweiszeitraum: 365 Tage nach Widerruf bzw. Ablauf. */
export async function purgeMarketingConsentProofs(now = new Date()): Promise<void> {
  const cutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  await db.delete(marketingConsents).where(or(
    lt(marketingConsents.revokedAt, cutoff),
    and(isNull(marketingConsents.revokedAt), lt(marketingConsents.expiresAt, cutoff)),
  ));
}

/** Prüft beim Versand den aktuellen Nachweis, nie den alten users-Boolean.
 * Widerruf und Versand sind pro Konto serialisiert. Nach bestätigtem Widerruf
 * kann kein zuvor geprüfter, aber noch nicht gestarteter Versand nachlaufen. */
export async function withMarketingConsent(userId: number, send: () => Promise<void>): Promise<boolean> {
  return db.transaction(async tx => {
    await lockUser(tx, userId);
    const [consent] = await tx.select({ id: marketingConsents.id }).from(marketingConsents)
      .where(and(eq(marketingConsents.userId, userId), active(new Date()))).limit(1);
    if (!consent) return false;
    await send();
    return true;
  });
}
