import type { Express, Request } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { CONSENT_MAX_AGE_MS, MARKETING_CONSENT_VERSION } from "@shared/privacy-consent";
import { getBrowserMarketingConsent, replaceMarketingConsent, revokeMarketingConsent } from "./marketing-consent";

export const CONSENT_COOKIE = "tw_marketing_consent";
export const consentToken = (req: Request): unknown => req.cookies?.[CONSENT_COOKIE];
const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" });
const input = z.object({ marketing: z.boolean(), version: z.literal(MARKETING_CONSENT_VERSION) }).strict();

export function registerPrivacyRoutes(app: Express) {
  // CSRF-Middleware aus server/index.ts gilt auch für diese Route.
  app.use("/api/privacy/marketing-consent", rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true, legacyHeaders: false }));
  app.get("/api/privacy/marketing-consent", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      const consent = await getBrowserMarketingConsent(consentToken(req), req.user?.id);
      res.json({ marketing: !!consent, version: MARKETING_CONSENT_VERSION, expiresAt: consent?.expiresAt.toISOString() ?? null });
    } catch {
      res.status(503).json({ error: "Einwilligung konnte nicht geprüft werden." });
    }
  });
  app.post("/api/privacy/marketing-consent", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const parsed = input.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Bitte lade die aktuellen Datenschutzeinstellungen neu." });
    try {
      if (!parsed.data.marketing) {
        await revokeMarketingConsent(consentToken(req), req.user?.id);
        res.clearCookie(CONSENT_COOKIE, cookieOptions());
        return res.json({ marketing: false, version: MARKETING_CONSENT_VERSION, expiresAt: null });
      }
      const consent = await replaceMarketingConsent(consentToken(req), req.user?.id);
      res.cookie(CONSENT_COOKIE, consent.token, { ...cookieOptions(), maxAge: CONSENT_MAX_AGE_MS });
      res.json({ marketing: true, version: MARKETING_CONSENT_VERSION, expiresAt: consent.expiresAt.toISOString() });
    } catch {
      res.status(503).json({ error: "Einwilligung konnte nicht gespeichert werden. Bitte versuche es erneut." });
    }
  });
}
