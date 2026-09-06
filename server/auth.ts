import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { storage, comparePasswords } from "./storage";
import { type User } from "@shared/schema";

// Extend Express types for session
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      displayName: string | null;
      isAdmin: boolean;
      trialEndsAt: Date | null;
      isPro: boolean;
      subscriptionStatus: string;
      subscriptionPlan: string | null;
      stripeCustomerId: string | null;
      stripeSubscriptionId: string | null;
      emailVerifiedAt: Date | null;
      leadNotificationsEnabled: boolean;
      hideBranding: boolean;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}

// Configure Passport Local Strategy
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      // Try to find user by username or email
      let user = await storage.getUserByUsername(username);
      if (!user) {
        user = await storage.getUserByEmail(username);
      }

      if (!user) {
        return done(null, false, { message: "Benutzer nicht gefunden" });
      }

      const isValid = await comparePasswords(password, user.password);
      if (!isValid) {
        return done(null, false, { message: "Falsches Passwort" });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return done(null, userWithoutPassword as Express.User);
    } catch (error) {
      return done(error);
    }
  })
);

// Serialize user to session (store only ID)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session (retrieve full user)
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    if (!user) {
      return done(null, false);
    }
    const { password: _, ...userWithoutPassword } = user;
    done(null, userWithoutPassword as Express.User);
  } catch (error) {
    done(error);
  }
});

// Setup session and authentication middleware
export function setupAuth(app: Express) {
  // PostgreSQL session store
  const PgSession = connectPgSimple(session);

  // Session configuration
  const sessionSettings: session.SessionOptions = {
    store: new PgSession({
      pool: pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: (() => {
      const secret = process.env.SESSION_SECRET;
      if (!secret && process.env.NODE_ENV === "production") {
        throw new Error("SESSION_SECRET muss in Production gesetzt sein!");
      }
      return secret || "dev-only-secret-not-for-production";
    })(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "lax",
    },
    rolling: true, // Session bei Aktivität erneuern
  };

  // Trust proxy in production
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  // Apply middleware
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());
}

// Authentication middleware for protecting routes
export function isAuthenticated(
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Nicht autorisiert. Bitte melde dich an." });
}

// Admin authentication middleware
export function isAdmin(
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) {
  if (req.isAuthenticated() && req.user?.isAdmin) {
    return next();
  }
  res.status(403).json({ error: "Zugriff verweigert. Admin-Berechtigung erforderlich." });
}

// E-Mail-Verifikation: Blockiert Zugriff wenn E-Mail nicht verifiziert
export function requireVerifiedEmail(
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Nicht autorisiert." });
  }

  // Admins überspringen Verifikation
  if (req.user.isAdmin) {
    return next();
  }

  if (!req.user.emailVerifiedAt) {
    return res.status(403).json({
      error: "Bitte bestätige zuerst deine E-Mail-Adresse.",
      code: "EMAIL_NOT_VERIFIED",
    });
  }

  return next();
}

/**
 * Verifizierung nur beim VERÖFFENTLICHEN verlangen, nicht beim Bearbeiten.
 *
 * Vorher hing `requireVerifiedEmail` auch an `POST /api/funnels` — ein neuer
 * Nutzer landete damit in einem leeren Dashboard und einer Fehlermeldung, ohne
 * je einen Funnel anlegen zu können. Die Sperre war nicht falsch, nur an der
 * falschen Stelle: Missbrauch eines unverifizierten Accounts bedeutet
 * Phishing-Seiten unter einer trichterwerk.de-URL hosten, Mails über unseren
 * SMTP auslösen oder Speicher/KI-Budget verbrennen. Ein privater Entwurf trifft
 * davon nichts — erst das Veröffentlichen tut es. Dort ist der Wert der
 * Bestätigung für den Nutzer auch offensichtlich.
 *
 * Uploads, KI-Endpoints und Domains behalten die harte Sperre.
 */
export function requireVerifiedEmailForPublish(
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) {
  if (req.body?.status !== "published") {
    return next();
  }
  return requireVerifiedEmail(req, res, next);
}

/**
 * Leitet den Plan eines Accounts zur Laufzeit ab — bewusst KEINE eigene
 * DB-Spalte als Wahrheitsquelle (subscriptionStatus bleibt Stripe-Spiegel):
 * - "pro":   zahlendes Abo oder Admin (volle Features)
 * - "trial": laufende 14-Tage-Testphase (volle Pro-Features)
 * - "free":  dauerhaft kostenloser Plan (1 veröffentlichter Funnel,
 *            FREE_MONTHLY_LEAD_LIMIT Leads/Monat sichtbar, Badge Pflicht)
 *
 * Es gibt keinen Zustand "kein Plan" mehr — nach Trial-Ende wird niemand
 * gesperrt, sondern auf Free heruntergestuft (server/scheduler.ts
 * materialisiert das zusätzlich in subscriptionStatus).
 */
export function getUserPlan(user: {
  isAdmin: boolean;
  isPro: boolean;
  trialEndsAt: Date | string | null;
}): import("@shared/schema").PlanId {
  if (user.isAdmin || user.isPro) return "pro";
  if (user.trialEndsAt && new Date(user.trialEndsAt).getTime() > Date.now()) {
    return "trial";
  }
  return "free";
}

/** Pro-Features verfügbar? (Trial zählt mit — volle Features zum Testen.) */
export function hasProFeatures(user: {
  isAdmin: boolean;
  isPro: boolean;
  trialEndsAt: Date | string | null;
}): boolean {
  return getUserPlan(user) !== "free";
}

// Pro-Gate: Blockiert Pro-Features (KI, Custom Domains, Teams) für Free-Accounts.
export function requirePro(
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Nicht autorisiert." });
  }

  if (hasProFeatures(req.user)) {
    return next();
  }

  return res.status(403).json({
    error: "Diese Funktion ist im Pro-Plan enthalten. Upgrade, um sie zu nutzen.",
    code: "PRO_REQUIRED",
  });
}

// API-Key Authentifizierung (Alternative zu Session für Enterprise)
export async function apiKeyAuth(
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer tw_")) {
    return next(); // Kein API-Key → Fallback auf Session-Auth
  }

  try {
    const rawKey = authHeader.slice(7);
    const { createHash } = await import("crypto");
    const keyHash = createHash("sha256").update(rawKey).digest("hex");

    const apiKey = await storage.getApiKeyByHash(keyHash);
    if (!apiKey) {
      return res.status(401).json({ error: "Ungültiger API-Key." });
    }

    const user = await storage.getUser(apiKey.userId);
    if (!user) {
      return res.status(401).json({ error: "Benutzer nicht gefunden." });
    }

    // Update last used timestamp (non-blocking)
    storage.updateApiKeyLastUsed(apiKey.id).catch(() => {});

    const { password: _, ...userWithoutPassword } = user;
    req.user = userWithoutPassword as Express.User;
    next();
  } catch (error) {
    return res.status(500).json({ error: "Authentifizierung fehlgeschlagen." });
  }
}

// Get current user ID from request
export function getUserId(req: Express.Request): number | null {
  return req.user?.id || null;
}

export { passport };
