import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { doubleCsrf } from "csrf-csrf";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { setupAuth, apiKeyAuth } from "./auth";
import { storage } from "./storage";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com", "https://js.stripe.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://www.google-analytics.com", "https://api.stripe.com", "https://fonts.googleapis.com"],
        frameSrc: ["'self'", "https://js.stripe.com", "https://www.youtube.com", "https://player.vimeo.com", "https://calendly.com"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        mediaSrc: ["'self'", "https:", "blob:"],
      },
    },
    crossOriginEmbedderPolicy: false, // Erlaubt Einbettung von externen Ressourcen (Bilder, Videos)
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);

// Rate Limiting - Auth Endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 20, // Max 20 Versuche pro Fenster
  message: { error: "Zu viele Anfragen. Bitte versuche es in 15 Minuten erneut." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Rate Limiting - Public Endpoints (Leads, Analytics)
const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 Minute
  max: 60, // Max 60 Anfragen pro Minute
  message: { error: "Zu viele Anfragen. Bitte versuche es später erneut." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/public", publicLimiter);

// Request Size Limit
app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "1mb" }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Cookie parser (needed for CSRF)
app.use(cookieParser());

// Setup authentication (session + passport)
setupAuth(app);

// API-Key Auth (Enterprise): Bearer-Token als Alternative zu Session
app.use("/api", apiKeyAuth);

// CSRF Protection (Double Submit Cookie)
const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || process.env.SESSION_SECRET || "dev-csrf-secret",
  getSessionIdentifier: (req: Request) => (req as any).sessionID || "",
  cookieName: "__csrf",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
  getCsrfTokenFromRequest: (req: Request) => req.headers["x-csrf-token"] as string,
});

// CSRF Token Endpoint
app.get("/api/auth/csrf-token", (req, res) => {
  const token = generateCsrfToken(req, res);
  res.json({ csrfToken: token });
});

// Apply CSRF protection to state-changing API requests
// Exclude: Stripe webhook, public endpoints, GET/HEAD/OPTIONS
app.use("/api", (req: Request, res: Response, next: NextFunction) => {
  // Skip safe methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }
  // Skip Stripe webhook (uses its own signature verification)
  if (req.path.startsWith("/webhooks/stripe")) {
    return next();
  }
  // Skip public endpoints (anonymous visitors)
  if (req.path.startsWith("/public/")) {
    return next();
  }
  // Skip API-Key authenticated requests (Bearer token replaces CSRF)
  if (req.headers.authorization?.startsWith("Bearer tw_")) {
    return next();
  }
  // Apply CSRF protection
  return doubleCsrfProtection(req, res, next);
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      // Keine Response-Bodies für sensitive Pfade loggen
      if (capturedJsonResponse && !path.startsWith("/api/auth")) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database (seed templates)
  try {
    await storage.seedTemplates();
    log("Database initialized", "database");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    // Continue anyway - database might not be configured yet
  }

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;

    // Stack Traces nur intern loggen, nie an Client senden
    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    // In Production nur generische Fehlermeldungen an Client
    const message =
      process.env.NODE_ENV === "production" && status >= 500
        ? "Ein interner Fehler ist aufgetreten."
        : err.message || "Internal Server Error";

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
