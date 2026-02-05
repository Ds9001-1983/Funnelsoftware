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
    secret: process.env.SESSION_SECRET || "funnel-software-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "lax",
    },
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

// Get current user ID from request
export function getUserId(req: Express.Request): number | null {
  return req.user?.id || null;
}

export { passport };
