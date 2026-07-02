import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import rateLimit from "express-rate-limit";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { storage, hashPassword, comparePasswords } from "./storage";
import { randomBytes, randomUUID, createHash, timingSafeEqual } from "crypto";
import { sendPasswordResetEmail, sendVerificationEmail, sendWelcomeEmail, sendLeadNotificationEmail } from "./email";
import {
  stripe,
  isStripeConfigured,
  getOrCreateStripeCustomer,
  createCheckoutSession,
  createPortalSession,
  constructWebhookEvent,
  findBlockingSubscription,
  cancelAllSubscriptions,
} from "./stripe";
import { sendWebhook, buildWebhookPayload, generateWebhookSecret } from "./webhooks";
import { sendCapiEvent } from "./capi";
import { passport, isAuthenticated, isAdmin, getUserId, requireActivePlan, requireVerifiedEmail, hasActivePlan, PUBLIC_GRACE_PERIOD_MS } from "./auth";
import {
  insertFunnelSchema, insertLeadSchema, funnelSchema, leadSchema, insertDomainSchema,
  loginSchema, registerSchema, slugSchema, passwordSchema, trackEventSchema,
  aiCredentialInputSchema, generateFunnelInputSchema,
  MAX_IMAGE_UPLOAD_BYTES, MAX_AUDIO_UPLOAD_BYTES
} from "@shared/schema";
import { dailyVisitorHash, deriveReferrerHost, deriveDeviceClass, deriveCountry, isTrackablePath } from "./tracking";
import { encryptSecret, decryptSecret, last4 } from "./crypto";
import { generateFunnel, testConnection, AiError, type DecryptedCredential } from "./ai";
import { z } from "zod";

// Partial update schemas for PATCH endpoints
// views/leads sind server-verwaltete Zähler — nicht vom Client setzbar (Mass-Assignment)
const updateFunnelSchema = funnelSchema.partial().omit({ id: true, uuid: true, userId: true, createdAt: true, updatedAt: true, views: true, leads: true });

// Rate-Limit für die DNS-Verifikation: begrenzt DNS-Lookup-Floods.
// Route-Level statt app.use, weil der Pfad einen :id-Parameter hat.
const domainVerifyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 Minute
  max: 10,
  message: { error: "Zu viele Verifizierungs-Versuche. Bitte kurz warten." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Zusätzlich zum globalen publicLimiter (60/min/IP über alle /api/public/*):
// engeres Limit speziell fürs Lead-Anlegen, um Bot-/Spam-Submissions auf einem
// veröffentlichten Funnel zu bremsen. Echte Nutzer füllen selten >12 Formulare/Min.
const leadCreateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 Minute
  max: 12,
  message: { error: "Zu viele Übermittlungen. Bitte einen Moment warten." },
  standardHeaders: true,
  legacyHeaders: false,
});

// KI-Endpoints sind teuer beim Kunden-Provider → pro angemeldetem User drosseln.
const aiUserKey = (req: Request) => String((req as any).user?.id ?? "anon");
const aiGenerateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: aiUserKey,
  message: { error: "Zu viele KI-Anfragen. Bitte kurz warten." },
  standardHeaders: true,
  legacyHeaders: false,
});
const aiTestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: aiUserKey,
  message: { error: "Zu viele Test-Anfragen. Bitte kurz warten." },
  standardHeaders: true,
  legacyHeaders: false,
});
const updateLeadSchema = leadSchema.partial().omit({ id: true, uuid: true, funnelId: true, userId: true, createdAt: true, funnelName: true });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ============ SEO ============

  // Dynamische Sitemap: statische Marketing-/Legal-Seiten + alle veröffentlichten
  // Funnels. Wird vor der statischen Auslieferung registriert und ersetzt die alte
  // statische sitemap.xml. robots.txt verweist bereits hierauf.
  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const funnelRows = await storage.getPublishedFunnelsForSitemap();
      const staticPaths = ["/", "/impressum", "/datenschutz", "/agb", "/avv", "/login", "/register"];
      const entries = [
        ...staticPaths.map((p) => `  <url><loc>https://trichterwerk.de${p}</loc></url>`),
        ...funnelRows.map(
          (f) =>
            `  <url><loc>https://trichterwerk.de/f/${encodeURIComponent(f.slug || f.uuid)}</loc><lastmod>${new Date(f.updatedAt).toISOString().slice(0, 10)}</lastmod></url>`,
        ),
      ];
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
      res.set("Content-Type", "application/xml; charset=utf-8").send(xml);
    } catch (error) {
      console.error("Sitemap error:", error);
      res.status(500).send("");
    }
  });

  // ============ AUTH ROUTES ============

  // Register new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Ungültige Registrierungsdaten", details: result.error.errors });
      }

      const { username, password, displayName } = result.data;
      // E-Mail normalisieren — sonst existieren "Max@Web.de" und "max@web.de"
      // als zwei Accounts und Login/Reset scheitern an der Schreibweise.
      const email = result.data.email.toLowerCase();

      // Parallel uniqueness checks
      const [existingUsername, existingEmail] = await Promise.all([
        storage.getUserByUsername(username),
        storage.getUserByEmail(email),
      ]);
      if (existingUsername) {
        return res.status(400).json({ error: "Benutzername bereits vergeben" });
      }
      if (existingEmail) {
        return res.status(400).json({ error: "E-Mail bereits registriert" });
      }

      // Create user with 14-day trial
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      // Generate email verification token
      const emailVerificationToken = randomBytes(32).toString("hex");

      const user = await storage.createUser({
        username,
        email,
        password,
        displayName,
        trialEndsAt,
        isPro: false,
        emailVerificationToken,
      } as any);

      // E-Mails asynchron senden (nicht blockierend)
      sendVerificationEmail(email, emailVerificationToken).catch((err) => console.error("[Email] Verification send failed:", err));
      sendWelcomeEmail(email, displayName).catch((err) => console.error("[Email] Welcome send failed:", err));

      // Reichweiten-Conversion (serverseitig, nicht manipulierbar): jede
      // Registrierung als 'register'-Event in der cookieless Plattform-Statistik →
      // erlaubt die Auswertung Landing-Besuche → Registrierungen.
      storage.createPlatformVisit({
        visitorHash: dailyVisitorHash(req.ip || req.socket.remoteAddress || "", req.get("user-agent") || ""),
        path: "/register",
        referrerHost: deriveReferrerHost(req.get("referer")),
        deviceClass: deriveDeviceClass(req.get("user-agent")),
        country: deriveCountry(req.headers),
        eventType: "register",
      }).catch((err) => console.error("[Track] register event failed:", err));

      // Log user in automatically
      req.login({ ...user, password: undefined } as any, async (err) => {
        if (err) {
          return res.status(500).json({ error: "Registrierung erfolgreich, aber Login fehlgeschlagen" });
        }

        const { password: _, ...userWithoutPassword } = user;

        // Create Stripe Checkout Session with 14-day trial.
        // success_url/cancel_url MÜSSEN sich unterscheiden — sonst kann der Client
        // eine erfolgreiche Zahlung nicht von einem Abbruch trennen.
        let checkoutUrl: string | null = null;
        let checkoutError = false;
        if (isStripeConfigured() && process.env.STRIPE_PRICE_ID) {
          try {
            const customerId = await getOrCreateStripeCustomer(user);
            await storage.updateStripeCustomerId(user.id, customerId);
            const appUrl = `${req.protocol}://${req.get("host")}`;
            const session = await createCheckoutSession(
              customerId,
              process.env.STRIPE_PRICE_ID,
              `${appUrl}/?checkout=success`,
              `${appUrl}/?checkout=cancelled`,
              { trialDays: 14, clientReferenceId: String(user.id) }
            );
            checkoutUrl = session.url;
          } catch (stripeErr) {
            console.error("Stripe checkout creation during registration failed:", stripeErr);
            // Registrierung ist trotzdem erfolgreich — aber die Weiterleitung zur
            // Zahlung schlug fehl. Das signalisieren wir dem Client (checkoutError),
            // damit der Nutzer nicht stumm ohne hinterlegte Zahlungsart im Dashboard
            // landet und glaubt, alles sei in Ordnung.
            checkoutError = true;
          }
        }

        res.status(201).json({ user: userWithoutPassword, checkoutUrl, checkoutError });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registrierung fehlgeschlagen" });
    }
  });

  // Login
  app.post("/api/auth/login", (req, res, next) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Ungültige Anmeldedaten", details: result.error.errors });
    }

    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: "Login fehlgeschlagen" });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Ungültige Anmeldedaten" });
      }

      req.login(user, async (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ error: "Session konnte nicht erstellt werden" });
        }
        // Update last login timestamp
        await storage.updateLastLogin(user.id);
        res.json({ user });
      });
    })(req, res, next);
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout fehlgeschlagen" });
      }
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error("Session destroy error:", destroyErr);
        }
        res.clearCookie("connect.sid");
        res.json({ message: "Erfolgreich abgemeldet" });
      });
    });
  });

  // Get current user
  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated() && req.user) {
      res.json({ user: req.user });
    } else {
      res.json({ user: null });
    }
  });

  // Verify email
  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const token = req.query.token as string;
      if (!token) {
        return res.status(400).json({ error: "Token erforderlich" });
      }

      const user = await storage.verifyEmail(token);
      if (!user) {
        // Idempotenz: Doppelklick auf den Mail-Link (Token schon verbraucht)
        // ist KEIN Fehler, wenn der eingeloggte Nutzer längst verifiziert ist —
        // vorher endete das in der Sackgasse "Verifizierung fehlgeschlagen".
        if (req.isAuthenticated() && req.user?.emailVerifiedAt) {
          return res.json({ message: "Deine E-Mail ist bereits bestätigt." });
        }
        return res.status(400).json({ error: "Token ungültig oder bereits verwendet" });
      }

      res.json({ message: "E-Mail erfolgreich verifiziert" });
    } catch (error) {
      console.error("Verify email error:", error);
      res.status(500).json({ error: "Verifizierung fehlgeschlagen" });
    }
  });

  // Resend verification email
  app.post("/api/auth/resend-verification", isAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      if (user.emailVerifiedAt) {
        return res.json({ message: "E-Mail bereits verifiziert" });
      }

      const emailVerificationToken = randomBytes(32).toString("hex");
      await storage.updateEmailVerificationToken(user.id, emailVerificationToken);
      const sent = await sendVerificationEmail(user.email, emailVerificationToken);

      if (!sent) {
        return res.status(500).json({ error: "E-Mail konnte nicht gesendet werden. Bitte kontaktiere den Support." });
      }

      res.json({ message: "Bestätigungs-E-Mail wurde erneut gesendet" });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ error: "Fehler beim Senden der Bestätigungs-E-Mail" });
    }
  });

  // Request password reset
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "E-Mail ist erforderlich" });
      }

      const user = await storage.getUserByEmail(email);
      if (user) {
        const token = await storage.createPasswordResetToken(user.id);
        await sendPasswordResetEmail(email, token);
      }

      // Immer Erfolg melden (verhindert User-Enumeration)
      res.json({ message: "Falls ein Account mit dieser E-Mail existiert, wurde eine Anleitung zum Zurücksetzen gesendet." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Anfrage fehlgeschlagen" });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ error: "Token und Passwort sind erforderlich" });
      }

      // Gleiche Policy wie bei der Registrierung (vorher reichten 8 Zeichen)
      const passwordCheck = passwordSchema.safeParse(password);
      if (!passwordCheck.success) {
        return res.status(400).json({ error: passwordCheck.error.errors[0]?.message || "Passwort zu schwach" });
      }

      const userId = await storage.validatePasswordResetToken(token);
      if (!userId) {
        return res.status(400).json({ error: "Token ungültig oder abgelaufen" });
      }

      const hashedPassword = await hashPassword(password);
      await storage.updateUserPassword(userId, hashedPassword);
      await storage.markTokenUsed(token);
      // Bestehende Sessions invalidieren — gestohlene Sessions überleben
      // den Reset sonst.
      await storage.deleteUserSessions(userId);

      res.json({ message: "Passwort wurde erfolgreich zurückgesetzt" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Passwort konnte nicht zurückgesetzt werden" });
    }
  });

  // Update user profile
  app.patch("/api/auth/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const updateSchema = z.object({
        displayName: z.string().max(100).optional(),
        email: z.string().email("Ungültige E-Mail-Adresse").optional(),
        leadNotificationsEnabled: z.boolean().optional(),
      });

      const result = updateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Ungültige Daten", details: result.error.errors });
      }

      const { email, ...profileUpdates } = result.data;

      let user = await storage.updateUserProfile(userId, profileUpdates);
      if (!user) {
        return res.status(404).json({ error: "Benutzer nicht gefunden" });
      }

      // E-Mail-Änderung: Duplikat-Check, Verifikation zurücksetzen, neue
      // Bestätigungs-Mail, Stripe-Customer synchronisieren (Rechnungen!).
      let emailChanged = false;
      if (email && email.toLowerCase() !== user.email.toLowerCase()) {
        const existing = await storage.getUserByEmail(email);
        if (existing && existing.id !== userId) {
          return res.status(400).json({ error: "Diese E-Mail wird bereits verwendet" });
        }

        const verificationToken = randomBytes(32).toString("hex");
        user = await storage.changeUserEmail(userId, email, verificationToken);
        if (!user) {
          return res.status(404).json({ error: "Benutzer nicht gefunden" });
        }
        emailChanged = true;

        sendVerificationEmail(user.email, verificationToken).catch((err) =>
          console.error("[Email] Verification send failed:", err)
        );

        if (user.stripeCustomerId && isStripeConfigured()) {
          stripe!.customers
            .update(user.stripeCustomerId, { email: user.email })
            .catch((err) => console.error("Stripe-Customer-E-Mail-Sync fehlgeschlagen:", err));
        }
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({
        user: userWithoutPassword,
        ...(emailChanged
          ? { message: "Bitte bestätige deine neue E-Mail-Adresse über den zugesendeten Link." }
          : {}),
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Profil-Update fehlgeschlagen" });
    }
  });

  // Passwort ändern (eingeloggt)
  app.post("/api/auth/change-password", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const { currentPassword, newPassword } = req.body as {
        currentPassword?: string;
        newPassword?: string;
      };
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Aktuelles und neues Passwort sind erforderlich" });
      }

      const passwordCheck = passwordSchema.safeParse(newPassword);
      if (!passwordCheck.success) {
        return res.status(400).json({ error: passwordCheck.error.errors[0]?.message || "Passwort zu schwach" });
      }

      const user = await storage.getUser(userId);
      if (!user || !(await comparePasswords(currentPassword, user.password))) {
        return res.status(400).json({ error: "Aktuelles Passwort ist falsch" });
      }

      await storage.updateUserPassword(userId, await hashPassword(newPassword));

      res.json({ message: "Passwort wurde geändert" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Passwort konnte nicht geändert werden" });
    }
  });

  // Account löschen (Self-Service, Art. 17 DSGVO)
  app.delete("/api/auth/account", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const { password } = req.body as { password?: string };
      if (!password) {
        return res.status(400).json({ error: "Passwort-Bestätigung erforderlich" });
      }

      const user = await storage.getUser(userId);
      if (!user || !(await comparePasswords(password, user.password))) {
        return res.status(400).json({ error: "Passwort ist falsch" });
      }

      // Stripe-Abos ZUERST kündigen — nach dem Löschen findet kein Webhook
      // mehr einen User und Stripe würde dauerhaft weiter abbuchen.
      if (user.stripeCustomerId && isStripeConfigured()) {
        try {
          await cancelAllSubscriptions(user.stripeCustomerId);
        } catch (stripeErr) {
          console.error("Stripe-Kündigung bei Account-Löschung fehlgeschlagen:", stripeErr);
          return res.status(409).json({
            error:
              "Dein Abo konnte nicht gekündigt werden. Bitte versuche es erneut oder kontaktiere den Support.",
          });
        }
      }

      await storage.deleteUserAdmin(userId);

      req.logout(() => {
        req.session?.destroy(() => {
          res.json({ success: true, message: "Dein Konto wurde gelöscht." });
        });
      });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({ error: "Konto konnte nicht gelöscht werden" });
    }
  });

  // ============ FILE UPLOADS ============

  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_UPLOAD_BYTES }, // gemeinsam mit dem Client
    fileFilter: (_req, file, cb) => {
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      cb(null, allowed.includes(file.mimetype));
    },
  });

  app.post("/api/uploads", isAuthenticated, requireVerifiedEmail, requireActivePlan, upload.single("file"), async (req, res) => {
    let outputPath: string | undefined;
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Keine Datei hochgeladen oder ungültiges Format." });
      }

      const filename = `${randomUUID()}.webp`;
      outputPath = path.join(uploadsDir, filename);

      await sharp(req.file.buffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);

      const url = `/uploads/${filename}`;
      res.json({ url, filename });
    } catch (error) {
      console.error("Upload error:", error);
      // Teilweise geschriebene Datei aufräumen (kein verwaister WebP-Müll).
      if (outputPath) {
        await fs.promises.unlink(outputPath).catch(() => {});
      }
      res.status(500).json({ error: "Fehler beim Hochladen" });
    }
  });

  // Audio-Upload: andere Limits & MIME-Whitelist als Bilder, keine Konvertierung
  // (Audio direkt im Original-Format speichern).
  const audioUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_AUDIO_UPLOAD_BYTES }, // gemeinsam mit dem Client
    fileFilter: (_req, file, cb) => {
      const allowed = [
        "audio/mpeg", // .mp3 (RFC-konform)
        "audio/mp3", // .mp3 (Browser senden teils diesen alten Wert)
        "audio/wav",
        "audio/wave",
        "audio/x-wav",
        "audio/ogg",
        "audio/webm",
      ];
      cb(null, allowed.includes(file.mimetype));
    },
  });

  app.post(
    "/api/uploads/audio",
    isAuthenticated,
    requireVerifiedEmail,
    requireActivePlan,
    audioUpload.single("file"),
    async (req, res) => {
      let outputPath: string | undefined;
      try {
        if (!req.file) {
          return res.status(400).json({
            error: "Keine Datei hochgeladen oder ungültiges Format.",
          });
        }

        // Endung aus MIME ableiten (sicherer als req.file.originalname).
        const mimeToExt: Record<string, string> = {
          "audio/mpeg": "mp3",
          "audio/mp3": "mp3",
          "audio/wav": "wav",
          "audio/wave": "wav",
          "audio/x-wav": "wav",
          "audio/ogg": "ogg",
          "audio/webm": "webm",
        };
        const ext = mimeToExt[req.file.mimetype] || "bin";
        const filename = `${randomUUID()}.${ext}`;
        outputPath = path.join(uploadsDir, filename);

        await fs.promises.writeFile(outputPath, req.file.buffer);

        const url = `/uploads/${filename}`;
        res.json({ url, filename });
      } catch (error) {
        console.error("Audio upload error:", error);
        // Teilweise geschriebene Datei aufräumen.
        if (outputPath) {
          await fs.promises.unlink(outputPath).catch(() => {});
        }
        res.status(500).json({ error: "Fehler beim Hochladen" });
      }
    },
  );

  // Serve uploaded files
  app.use("/uploads", (await import("express")).default.static(uploadsDir, {
    maxAge: "30d",
    immutable: true,
  }));

  // ============ FUNNELS (Protected) ============

  // Get all funnels for current user
  app.get("/api/funnels", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const funnels = await storage.getFunnels(userId);
      res.json(funnels);
    } catch (error) {
      console.error("Get funnels error:", error);
      res.status(500).json({ error: "Funnels konnten nicht geladen werden" });
    }
  });

  // Check slug availability — MUSS vor /api/funnels/:id registriert sein,
  // sonst verschattet die Param-Route den Pfad ("check-slug" wird als :id
  // geparst → immer 400, die Verfügbarkeitsprüfung im Publish-Flow war defekt).
  app.get("/api/funnels/check-slug", isAuthenticated, async (req, res) => {
    try {
      const slug = req.query.slug as string;
      const funnelId = req.query.funnelId ? parseInt(String(req.query.funnelId)) : undefined;

      if (!slug) {
        return res.status(400).json({ error: "Slug erforderlich" });
      }

      const slugResult = slugSchema.safeParse(slug);
      if (!slugResult.success) {
        return res.json({ available: false, error: "Ungültiges Format" });
      }

      const available = await storage.isSlugAvailable(slug, funnelId);
      res.json({ available });
    } catch (error) {
      console.error("Check slug error:", error);
      res.status(500).json({ error: "Slug-Prüfung fehlgeschlagen" });
    }
  });

  // Get single funnel
  app.get("/api/funnels/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const funnelId = parseInt(String(req.params.id));
      if (isNaN(funnelId)) {
        return res.status(400).json({ error: "Ungültige Funnel-ID" });
      }

      const funnel = await storage.getFunnel(funnelId, userId);
      if (!funnel) {
        return res.status(404).json({ error: "Funnel nicht gefunden" });
      }
      res.json(funnel);
    } catch (error) {
      console.error("Get funnel error:", error);
      res.status(500).json({ error: "Funnel konnte nicht geladen werden" });
    }
  });

  // Create funnel
  app.post("/api/funnels", isAuthenticated, requireVerifiedEmail, requireActivePlan, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const result = insertFunnelSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Ungültige Funnel-Daten", details: result.error.errors });
      }

      const funnel = await storage.createFunnel(result.data, userId);
      res.status(201).json(funnel);
    } catch (error) {
      console.error("Create funnel error:", error);
      res.status(500).json({ error: "Funnel konnte nicht erstellt werden" });
    }
  });

  // Update funnel
  app.patch("/api/funnels/:id", isAuthenticated, requireVerifiedEmail, requireActivePlan, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const funnelId = parseInt(String(req.params.id));
      if (isNaN(funnelId)) {
        return res.status(400).json({ error: "Ungültige Funnel-ID" });
      }

      const result = updateFunnelSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Ungültige Update-Daten", details: result.error.errors });
      }

      // Konfliktschutz (zwei Tabs/Geräte): Schickt der Client den ihm
      // bekannten Stand mit und der Server hat inzwischen einen neueren,
      // würde Last-Write-Wins die fremden Änderungen still überschreiben.
      const expectedUpdatedAt =
        typeof req.body.expectedUpdatedAt === "string" ? req.body.expectedUpdatedAt : null;
      if (expectedUpdatedAt) {
        const current = await storage.getFunnel(funnelId, userId);
        if (!current) {
          return res.status(404).json({ error: "Funnel nicht gefunden" });
        }
        const serverTime = new Date(String(current.updatedAt)).getTime();
        const clientTime = new Date(expectedUpdatedAt).getTime();
        if (!isNaN(clientTime) && serverTime !== clientTime) {
          return res.status(409).json({
            error: "Der Funnel wurde zwischenzeitlich in einer anderen Sitzung geändert.",
            code: "EDIT_CONFLICT",
          });
        }
      }

      // Auto-generate webhook secret when enabling webhook
      if (result.data.webhookEnabled && !result.data.webhookSecret) {
        const existingFunnel = await storage.getFunnel(funnelId, userId);
        if (existingFunnel && !existingFunnel.webhookSecret) {
          result.data.webhookSecret = generateWebhookSecret();
        }
      }

      // Validate slug if provided
      if (result.data.slug !== undefined && result.data.slug !== null) {
        const slugResult = slugSchema.safeParse(result.data.slug);
        if (!slugResult.success) {
          return res.status(400).json({ error: "Ungültiger Slug", details: slugResult.error.errors });
        }
        const available = await storage.isSlugAvailable(result.data.slug, funnelId);
        if (!available) {
          return res.status(409).json({ error: "Dieser Slug ist bereits vergeben" });
        }
      }

      try {
        const funnel = await storage.updateFunnel(funnelId, userId, result.data);
        if (!funnel) {
          return res.status(404).json({ error: "Funnel nicht gefunden" });
        }
        res.json(funnel);
      } catch (dbError: any) {
        // Handle unique constraint violation (slug already taken - race condition)
        if (dbError?.code === "23505" && dbError?.constraint?.includes("slug")) {
          return res.status(409).json({ error: "Dieser Slug ist bereits vergeben" });
        }
        throw dbError;
      }
    } catch (error) {
      console.error("Update funnel error:", error);
      res.status(500).json({ error: "Funnel konnte nicht aktualisiert werden" });
    }
  });

  // Delete funnel
  app.delete("/api/funnels/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const funnelId = parseInt(String(req.params.id));
      if (isNaN(funnelId)) {
        return res.status(400).json({ error: "Ungültige Funnel-ID" });
      }

      const deleted = await storage.deleteFunnel(funnelId, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Funnel nicht gefunden" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Delete funnel error:", error);
      res.status(500).json({ error: "Funnel konnte nicht gelöscht werden" });
    }
  });

  // Restore soft-deleted funnel
  app.patch("/api/funnels/:id/restore", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const funnelId = parseInt(String(req.params.id));
      if (isNaN(funnelId)) {
        return res.status(400).json({ error: "Ungültige Funnel-ID" });
      }

      const restored = await storage.restoreFunnel(funnelId, userId);
      if (!restored) {
        return res.status(404).json({ error: "Funnel nicht gefunden" });
      }

      res.json({ message: "Funnel wiederhergestellt" });
    } catch (error) {
      console.error("Restore funnel error:", error);
      res.status(500).json({ error: "Funnel konnte nicht wiederhergestellt werden" });
    }
  });

  // Clone funnel
  app.post("/api/funnels/:id/clone", isAuthenticated, requireVerifiedEmail, requireActivePlan, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const funnelId = parseInt(String(req.params.id));
      if (isNaN(funnelId)) {
        return res.status(400).json({ error: "Ungültige Funnel-ID" });
      }

      const original = await storage.getFunnel(funnelId, userId);
      if (!original) {
        return res.status(404).json({ error: "Funnel nicht gefunden" });
      }

      const cloned = await storage.createFunnel({
        name: `${original.name} (Kopie)`,
        description: original.description ?? undefined,
        pages: original.pages,
        theme: original.theme,
        status: "draft",
      }, userId);

      res.status(201).json(cloned);
    } catch (error) {
      console.error("Clone funnel error:", error);
      res.status(500).json({ error: "Funnel konnte nicht dupliziert werden" });
    }
  });

  // Get funnel metrics (analytics aggregation)
  app.get("/api/funnels/:id/metrics", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const funnelId = parseInt(String(req.params.id));
      if (isNaN(funnelId)) return res.status(400).json({ error: "Ungültige Funnel-ID" });

      const funnel = await storage.getFunnel(funnelId, userId);
      if (!funnel) return res.status(404).json({ error: "Funnel nicht gefunden" });

      const [analytics, leads] = await Promise.all([
        storage.getAnalytics(funnelId),
        storage.getLeadsByFunnel(funnelId, userId),
      ]);

      // Aggregate metrics
      const totalViews = analytics.filter(e => e.eventType === "view").length;
      const totalLeads = leads.length;
      const conversionRate = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : "0.0";

      // Page-by-page conversion (step funnel)
      const pageViews: Record<string, number> = {};
      analytics.filter(e => e.eventType === "pageView" && e.pageId).forEach(e => {
        pageViews[e.pageId!] = (pageViews[e.pageId!] || 0) + 1;
      });

      const stepConversion = funnel.pages.map((page, idx) => ({
        pageId: page.id,
        title: page.title,
        stepNumber: idx + 1,
        visitors: pageViews[page.id] || (idx === 0 ? totalViews : 0),
      }));

      // Answer distribution per question page
      const answerDistribution: Array<{
        pageId: string;
        title: string;
        totalResponses: number;
        answers: Array<{ text: string; count: number; percentage: number }>;
      }> = [];

      for (const page of funnel.pages) {
        const questionElements = page.elements.filter(
          (el: any) => el.type === "radio" || el.type === "select" || el.type === "checkbox"
        );
        for (const el of questionElements) {
          const answerCounts: Record<string, number> = {};
          let total = 0;
          for (const lead of leads) {
            const answer = (lead.answers as Record<string, any>)?.[el.id];
            if (answer) {
              const answerText = String(answer);
              answerCounts[answerText] = (answerCounts[answerText] || 0) + 1;
              total++;
            }
          }
          if (total > 0) {
            answerDistribution.push({
              pageId: page.id,
              title: page.title,
              totalResponses: total,
              answers: Object.entries(answerCounts)
                .map(([text, count]) => ({ text, count, percentage: Math.round((count / total) * 100) }))
                .sort((a, b) => b.count - a.count),
            });
          }
        }
      }

      // Views over time (last 14 days).
      // toDayKey normalisiert Date UND ISO-String auf "YYYY-MM-DD" —
      // Date.toString() ("Wed Jun 11 …") matchte nie, der Chart war immer leer.
      const toDayKey = (d: Date | string) => new Date(d).toISOString().split("T")[0];
      const now = new Date();
      const viewsOverTime: Array<{ date: string; views: number; leads: number }> = [];
      for (let i = 13; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const dayViews = analytics.filter(e =>
          e.eventType === "view" && toDayKey(e.timestamp) === dateStr
        ).length;
        const dayLeads = leads.filter(l => toDayKey(l.createdAt) === dateStr).length;
        viewsOverTime.push({ date: dateStr, views: dayViews, leads: dayLeads });
      }

      res.json({
        totalViews,
        totalLeads,
        conversionRate: parseFloat(conversionRate),
        stepConversion,
        answerDistribution,
        viewsOverTime,
      });
    } catch (error) {
      console.error("Get funnel metrics error:", error);
      res.status(500).json({ error: "Metriken konnten nicht geladen werden" });
    }
  });

  // ============ PUBLIC FUNNEL VIEW ============

  // Preview funnel (authenticated, shows drafts too)
  app.get("/api/funnels/:id/preview", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const funnelId = parseInt(String(req.params.id));
      if (isNaN(funnelId)) {
        return res.status(400).json({ error: "Ungültige Funnel-ID" });
      }

      const funnel = await storage.getFunnel(funnelId, userId);
      if (!funnel) {
        return res.status(404).json({ error: "Funnel nicht gefunden" });
      }

      res.json({
        uuid: funnel.uuid,
        name: funnel.name,
        pages: funnel.pages,
        theme: funnel.theme,
        status: funnel.status,
        impressumUrl: funnel.impressumUrl || null,
        datenschutzUrl: funnel.datenschutzUrl || null,
      });
    } catch (error) {
      console.error("Preview funnel error:", error);
      res.status(500).json({ error: "Vorschau konnte nicht geladen werden" });
    }
  });

  // Get published funnel by UUID or slug (public, for viewing)
  app.get("/api/public/funnels/:identifier", async (req, res) => {
    try {
      const funnel = await storage.getFunnelBySlugOrUuid(req.params.identifier);
      if (!funnel || funnel.status !== "published") {
        return res.status(404).json({ error: "Funnel nicht gefunden oder nicht veröffentlicht" });
      }

      // Trial-Enforcement: Funnels von Accounts ohne aktiven Plan werden nach
      // einer Grace-Period nicht mehr ausgeliefert — sonst liefe der Kern-
      // Geschäftswert (Funnel live + Leads sammeln) nach Trial-Ende ewig gratis.
      const owner = await storage.getUser(funnel.userId);
      if (!owner || !hasActivePlan(owner, PUBLIC_GRACE_PERIOD_MS)) {
        return res.status(410).json({ error: "Dieser Funnel ist derzeit pausiert.", code: "FUNNEL_PAUSED" });
      }

      // Return only necessary public data (including A/B tests for traffic splitting)
      const abTests = Array.isArray(funnel.abTests) ? funnel.abTests : [];
      const activeTests = abTests.filter((t: any) => t.status === "running");

      res.json({
        uuid: funnel.uuid,
        slug: funnel.slug,
        name: funnel.name,
        pages: funnel.pages,
        theme: funnel.theme,
        gtmId: funnel.gtmId || null,
        abTests: activeTests,
        impressumUrl: funnel.impressumUrl || null,
        datenschutzUrl: funnel.datenschutzUrl || null,
      });
    } catch (error) {
      console.error("Get public funnel error:", error);
      res.status(500).json({ error: "Funnel konnte nicht geladen werden" });
    }
  });

  // ============ LEADS (Protected) ============

  // Get all leads for current user
  app.get("/api/leads", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const leads = await storage.getLeads(userId);
      res.json(leads);
    } catch (error) {
      console.error("Get leads error:", error);
      res.status(500).json({ error: "Leads konnten nicht geladen werden" });
    }
  });

  // Get leads by funnel
  app.get("/api/funnels/:funnelId/leads", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const funnelId = parseInt(String(req.params.funnelId));
      if (isNaN(funnelId)) {
        return res.status(400).json({ error: "Ungültige Funnel-ID" });
      }

      const leads = await storage.getLeadsByFunnel(funnelId, userId);
      res.json(leads);
    } catch (error) {
      console.error("Get funnel leads error:", error);
      res.status(500).json({ error: "Leads konnten nicht geladen werden" });
    }
  });

  // ---- DSGVO-Betroffenenrechte (Owner-getrieben) ----
  // MÜSSEN vor "/api/leads/:id" stehen, sonst matcht die GET-Route den :id-Handler.
  const gdprEmailSchema = z.object({ email: z.string().email().max(254) });

  // Art. 20 (Datenportabilität): Export aller Lead-Daten zu einer E-Mail als JSON.
  app.get("/api/leads/gdpr-export", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });
    const parsed = gdprEmailSchema.safeParse({ email: req.query.email });
    if (!parsed.success) return res.status(400).json({ error: "Gültige E-Mail-Adresse erforderlich" });
    const rows = await storage.getLeadsByEmail(userId, parsed.data.email);
    const safeName = parsed.data.email.replace(/[^a-z0-9._@-]/gi, "_");
    res.setHeader("Content-Disposition", `attachment; filename="dsgvo-export-${safeName}.json"`);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.send(JSON.stringify(
      { email: parsed.data.email, exportedAt: new Date().toISOString(), count: rows.length, leads: rows },
      null,
      2,
    ));
  });

  // Art. 17 (Löschung): alle Lead-Daten zu einer E-Mail löschen. Idempotent,
  // gibt die Anzahl gelöschter Datensätze als Nachweis zurück.
  app.post("/api/leads/gdpr-erasure", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });
    const parsed = gdprEmailSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Gültige E-Mail-Adresse erforderlich" });
    const deletedCount = await storage.deleteLeadsByEmail(userId, parsed.data.email);
    res.json({ email: parsed.data.email, deletedCount });
  });

  // Get single lead
  app.get("/api/leads/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const leadId = parseInt(String(req.params.id));
      if (isNaN(leadId)) {
        return res.status(400).json({ error: "Ungültige Lead-ID" });
      }

      const lead = await storage.getLead(leadId, userId);
      if (!lead) {
        return res.status(404).json({ error: "Lead nicht gefunden" });
      }
      res.json(lead);
    } catch (error) {
      console.error("Get lead error:", error);
      res.status(500).json({ error: "Lead konnte nicht geladen werden" });
    }
  });

  // Create lead (public, for funnel submissions)
  app.post("/api/public/leads", leadCreateLimiter, async (req, res) => {
    try {
      // Honeypot: Bots füllen typischerweise alle Felder aus. Ein für Menschen
      // unsichtbares Feld (website) wird nur von Bots befüllt → wir tun so, als
      // wäre alles ok (200), legen aber keinen Lead an. Das verrät dem Bot nicht,
      // dass er erkannt wurde.
      if (typeof req.body.website === "string" && req.body.website.trim() !== "") {
        return res.status(200).json({ success: true, id: randomUUID() });
      }

      // Get funnel to find owner
      const funnelId = req.body.funnelId;
      if (!funnelId) {
        return res.status(400).json({ error: "Funnel-ID erforderlich" });
      }

      const funnel = await storage.getFunnelBySlugOrUuid(funnelId.toString());
      if (!funnel || funnel.status !== "published") {
        return res.status(404).json({ error: "Funnel nicht gefunden" });
      }

      // Trial-Enforcement: Kein Lead-Capture für Funnels von Accounts ohne
      // aktiven Plan (gleiche Grace-Period wie bei der Auslieferung).
      const funnelOwner = await storage.getUser(funnel.userId);
      if (!funnelOwner || !hasActivePlan(funnelOwner, PUBLIC_GRACE_PERIOD_MS)) {
        return res.status(410).json({ error: "Dieser Funnel ist derzeit pausiert.", code: "FUNNEL_PAUSED" });
      }

      const result = insertLeadSchema.safeParse({
        ...req.body,
        funnelId: funnel.id,
      });

      if (!result.success) {
        return res.status(400).json({ error: "Ungültige Lead-Daten", details: result.error.errors });
      }

      // Idempotenz: identische E-Mail auf demselben Funnel innerhalb von 30s →
      // kein Duplikat anlegen (Doppelklick/Retry), bestehende ID zurückgeben.
      if (result.data.email) {
        const dup = await storage.findRecentLead(funnel.id, result.data.email, 30_000);
        if (dup) {
          return res.status(200).json({ success: true, id: dup.uuid, deduplicated: true });
        }
      }

      const lead = await storage.createLead(result.data, funnel.userId);
      res.status(201).json({ success: true, id: lead.uuid });

      // Async: Webhook + E-Mail Benachrichtigung (non-blocking)
      if (funnel.webhookEnabled && funnel.webhookUrl) {
        const payload = buildWebhookPayload(funnel, lead);
        sendWebhook(funnel.webhookUrl, payload, funnel.webhookSecret).catch(() => {});
      }

      // E-Mail an Funnel-Owner — abbestellbar über Settings → Benachrichtigungen
      const owner = await storage.getUser(funnel.userId);
      if (owner?.email && owner.leadNotificationsEnabled !== false) {
        sendLeadNotificationEmail(owner.email, lead, funnel.name).catch(() => {});
      }

      // Async: Server-Side Meta Conversions API. DSGVO: nur bei aktivem
      // Marketing-Consent des Besuchers feuern. Funktioniert nur, wenn der
      // Funnel-Owner Pixel-ID + CAPI-Token konfiguriert und capiEnabled=true
      // gesetzt hat. eventId = lead.uuid → dedupliziert sauber mit einem
      // client-seitigen Pixel-Event, wenn das später ergänzt wird.
      const consent = !!result.data.marketingConsent;
      if (consent && funnel.capiEnabled && funnel.metaPixelId && funnel.metaCapiToken) {
        const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol;
        const host = req.get("host");
        const referer = req.headers.referer;
        const eventSourceUrl =
          (typeof referer === "string" && referer) ||
          `${proto}://${host}/f/${funnel.slug || funnel.uuid}`;
        const fwd = req.headers["x-forwarded-for"];
        const ip =
          (typeof fwd === "string" ? fwd.split(",")[0]?.trim() : undefined) ||
          req.socket.remoteAddress ||
          undefined;
        const ua = req.headers["user-agent"];
        const cookies = (req.headers.cookie || "").split(";").reduce(
          (acc, part) => {
            const [k, ...rest] = part.trim().split("=");
            if (k) acc[k] = rest.join("=");
            return acc;
          },
          {} as Record<string, string>,
        );
        // Name in firstName + lastName aufteilen (Meta erwartet getrennt).
        const [firstName, ...nameRest] = (lead.name || "").trim().split(/\s+/);
        const lastName = nameRest.join(" ") || undefined;
        sendCapiEvent({
          pixelId: funnel.metaPixelId,
          accessToken: funnel.metaCapiToken,
          eventName: "Lead",
          eventId: lead.uuid,
          eventSourceUrl,
          userData: {
            email: lead.email,
            phone: lead.phone,
            firstName: firstName || undefined,
            lastName,
            clientIpAddress: ip,
            clientUserAgent: typeof ua === "string" ? ua : undefined,
            fbc: cookies._fbc,
            fbp: cookies._fbp,
          },
        })
          .then(() => {
            // Letztes Event OK → eventuellen Fehlerstatus löschen.
            storage.setCapiError(funnel.id, null).catch(() => {});
          })
          .catch((err) => {
            console.error("Meta CAPI failed:", err);
            // Fehler am Funnel festhalten → Warnung im Editor (statt stummem Log).
            storage
              .setCapiError(funnel.id, String(err?.message || err).slice(0, 500))
              .catch(() => {});
          });
      }
    } catch (error) {
      console.error("Create public lead error:", error);
      res.status(500).json({ error: "Lead konnte nicht erstellt werden" });
    }
  });

  // Update lead
  app.patch("/api/leads/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const leadId = parseInt(String(req.params.id));
      if (isNaN(leadId)) {
        return res.status(400).json({ error: "Ungültige Lead-ID" });
      }

      const result = updateLeadSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Ungültige Update-Daten", details: result.error.errors });
      }

      const lead = await storage.updateLead(leadId, userId, result.data);
      if (!lead) {
        return res.status(404).json({ error: "Lead nicht gefunden" });
      }
      res.json(lead);
    } catch (error) {
      console.error("Update lead error:", error);
      res.status(500).json({ error: "Lead konnte nicht aktualisiert werden" });
    }
  });

  // Delete lead
  app.delete("/api/leads/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const leadId = parseInt(String(req.params.id));
      if (isNaN(leadId)) {
        return res.status(400).json({ error: "Ungültige Lead-ID" });
      }

      const deleted = await storage.deleteLead(leadId, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Lead nicht gefunden" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Delete lead error:", error);
      res.status(500).json({ error: "Lead konnte nicht gelöscht werden" });
    }
  });

  // ============ TEMPLATES (Public Read) ============

  // Get all templates
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Get templates error:", error);
      res.status(500).json({ error: "Templates konnten nicht geladen werden" });
    }
  });

  // Get single template
  app.get("/api/templates/:id", async (req, res) => {
    try {
      const templateId = parseInt(String(req.params.id));
      if (isNaN(templateId)) {
        return res.status(400).json({ error: "Ungültige Template-ID" });
      }

      const template = await storage.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ error: "Template nicht gefunden" });
      }
      res.json(template);
    } catch (error) {
      console.error("Get template error:", error);
      res.status(500).json({ error: "Template konnte nicht geladen werden" });
    }
  });

  // ============ TEAMS (Enterprise) ============

  // Get user's teams
  app.get("/api/teams", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });
      const teams = await storage.getTeamsByUser(userId);
      res.json(teams);
    } catch (error) {
      console.error("Get teams error:", error);
      res.status(500).json({ error: "Teams konnten nicht geladen werden" });
    }
  });

  // Create team
  app.post("/api/teams", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      // Enterprise plan check
      const user = await storage.getUser(userId);
      if (!user?.isPro && user?.subscriptionPlan !== "enterprise") {
        return res.status(403).json({ error: "Team-Funktion erfordert einen Enterprise-Plan." });
      }

      const { name } = req.body;
      if (!name?.trim()) {
        return res.status(400).json({ error: "Teamname ist erforderlich" });
      }

      const team = await storage.createTeam(name.trim(), userId);
      res.status(201).json(team);
    } catch (error) {
      console.error("Create team error:", error);
      res.status(500).json({ error: "Team konnte nicht erstellt werden" });
    }
  });

  // Get team members
  app.get("/api/teams/:id/members", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const teamId = parseInt(String(req.params.id));
      if (isNaN(teamId)) return res.status(400).json({ error: "Ungültige Team-ID" });

      const team = await storage.getTeam(teamId, userId);
      if (!team) return res.status(404).json({ error: "Team nicht gefunden" });

      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      console.error("Get team members error:", error);
      res.status(500).json({ error: "Mitglieder konnten nicht geladen werden" });
    }
  });

  // Invite team member
  app.post("/api/teams/:id/invite", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const teamId = parseInt(String(req.params.id));
      if (isNaN(teamId)) return res.status(400).json({ error: "Ungültige Team-ID" });

      const isAdmin = await storage.isTeamOwnerOrAdmin(teamId, userId);
      if (!isAdmin) return res.status(403).json({ error: "Nur Team-Admins können Mitglieder einladen" });

      const { email, role } = req.body;
      if (!email?.trim()) return res.status(400).json({ error: "E-Mail ist erforderlich" });

      const member = await storage.addTeamMember(teamId, email.trim(), role || "member");
      res.status(201).json(member);
    } catch (error) {
      console.error("Invite team member error:", error);
      res.status(500).json({ error: "Einladung fehlgeschlagen" });
    }
  });

  // Remove team member
  app.delete("/api/teams/:teamId/members/:memberId", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const teamId = parseInt(String(req.params.teamId));
      const memberId = parseInt(String(req.params.memberId));
      if (isNaN(teamId) || isNaN(memberId)) return res.status(400).json({ error: "Ungültige IDs" });

      const isAdmin = await storage.isTeamOwnerOrAdmin(teamId, userId);
      if (!isAdmin) return res.status(403).json({ error: "Nur Team-Admins können Mitglieder entfernen" });

      const removed = await storage.removeTeamMember(teamId, memberId);
      if (!removed) return res.status(404).json({ error: "Mitglied nicht gefunden" });
      res.status(204).send();
    } catch (error) {
      console.error("Remove team member error:", error);
      res.status(500).json({ error: "Mitglied konnte nicht entfernt werden" });
    }
  });

  // Delete team
  app.delete("/api/teams/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const teamId = parseInt(String(req.params.id));
      if (isNaN(teamId)) return res.status(400).json({ error: "Ungültige Team-ID" });

      const deleted = await storage.deleteTeam(teamId, userId);
      if (!deleted) return res.status(404).json({ error: "Team nicht gefunden oder keine Berechtigung" });
      res.status(204).send();
    } catch (error) {
      console.error("Delete team error:", error);
      res.status(500).json({ error: "Team konnte nicht gelöscht werden" });
    }
  });

  // ============ API KEYS (Enterprise) ============

  // Get user's API keys
  app.get("/api/api-keys", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });
      const keys = await storage.getApiKeys(userId);
      res.json(keys);
    } catch (error) {
      console.error("Get API keys error:", error);
      res.status(500).json({ error: "API-Keys konnten nicht geladen werden" });
    }
  });

  // Create API key
  app.post("/api/api-keys", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      // Enterprise plan check — als Enterprise verkauftes Feature darf nicht
      // für jeden Pro-/Trial-Account frei sein (Umsatzleck). Admins ausgenommen.
      const user = await storage.getUser(userId);
      if (!user?.isAdmin && user?.subscriptionPlan !== "enterprise") {
        return res.status(403).json({ error: "API-Zugang erfordert einen Enterprise-Plan." });
      }

      const { name } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: "Name ist erforderlich" });

      // Generate API key: tw_live_<random>
      const rawKey = `tw_live_${randomBytes(32).toString("hex")}`;
      const keyHash = (await import("crypto")).createHash("sha256").update(rawKey).digest("hex");
      const keyPrefix = `tw_...${rawKey.slice(-8)}`;

      const apiKey = await storage.createApiKey(userId, name.trim(), keyHash, keyPrefix);

      // Return the raw key ONLY on creation — user must save it
      res.status(201).json({ ...apiKey, key: rawKey });
    } catch (error) {
      console.error("Create API key error:", error);
      res.status(500).json({ error: "API-Key konnte nicht erstellt werden" });
    }
  });

  // Delete API key
  app.delete("/api/api-keys/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const keyId = parseInt(String(req.params.id));
      if (isNaN(keyId)) return res.status(400).json({ error: "Ungültige Key-ID" });

      const deleted = await storage.deleteApiKey(keyId, userId);
      if (!deleted) return res.status(404).json({ error: "API-Key nicht gefunden" });
      res.status(204).send();
    } catch (error) {
      console.error("Delete API key error:", error);
      res.status(500).json({ error: "API-Key konnte nicht gelöscht werden" });
    }
  });

  // ============ BILLING (Stripe) ============

  // Create Stripe Checkout Session for subscription upgrade
  app.post("/api/billing/create-checkout", isAuthenticated, async (req, res) => {
    try {
      if (!isStripeConfigured()) {
        return res.status(503).json({ error: "Zahlungssystem nicht konfiguriert" });
      }

      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "Benutzer nicht gefunden" });

      if (user.isPro) {
        return res.status(400).json({ error: "Du hast bereits ein aktives Abo" });
      }

      const priceId = process.env.STRIPE_PRICE_ID;
      if (!priceId) return res.status(500).json({ error: "Preis nicht konfiguriert" });

      // Get or create Stripe customer — Customer-ID VOR der Session-Erstellung
      // persistieren, damit der Webhook den User sicher findet.
      const customerId = await getOrCreateStripeCustomer(user);
      if (!user.stripeCustomerId) {
        await storage.updateStripeCustomerId(userId, customerId);
      }

      // Doppel-Abos verhindern: Die Registrierung erzeugt bereits eine 24h
      // gültige Checkout-Session. Ohne diesen Guard kann derselbe Customer
      // zwei Subscriptions abschließen und wird doppelt abgebucht.
      const existing = await findBlockingSubscription(customerId);
      if (existing) {
        return res.status(400).json({
          error: "Du hast bereits ein aktives Abo. Verwalte es über das Kundenportal in den Einstellungen.",
        });
      }

      // Versprochenen Trial beim Upgrade übernehmen: "Zahlungsdaten hinterlegen"
      // darf laufende Gratis-Tage nicht verfallen lassen (sofortige Abbuchung).
      const trialEnd =
        user.trialEndsAt && user.trialEndsAt.getTime() > Date.now() ? user.trialEndsAt : null;

      const appUrl = `${req.protocol}://${req.get("host")}`;
      const session = await createCheckoutSession(
        customerId,
        priceId,
        `${appUrl}/settings?tab=billing&upgraded=true`,
        `${appUrl}/settings?tab=billing&cancelled=true`,
        { trialEnd, clientReferenceId: String(userId) }
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Create checkout error:", error);
      res.status(500).json({ error: "Checkout konnte nicht erstellt werden" });
    }
  });

  // Create Stripe Customer Portal session
  app.post("/api/billing/portal", isAuthenticated, async (req, res) => {
    try {
      if (!isStripeConfigured()) {
        return res.status(503).json({ error: "Zahlungssystem nicht konfiguriert" });
      }

      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const user = await storage.getUser(userId);
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ error: "Kein Stripe-Konto vorhanden" });
      }

      const appUrl = `${req.protocol}://${req.get("host")}`;
      const session = await createPortalSession(
        user.stripeCustomerId,
        `${appUrl}/settings?tab=billing`
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Create portal error:", error);
      res.status(500).json({ error: "Portal konnte nicht geöffnet werden" });
    }
  });

  // ============ KI (Bring-Your-Own-Key) ============

  // Lädt + entschlüsselt die Kunden-Zugangsdaten (Key nur transient im RAM).
  async function loadDecryptedCredential(userId: number): Promise<DecryptedCredential | null> {
    const row = await storage.getAiCredential(userId);
    if (!row) return null;
    return {
      provider: row.provider as DecryptedCredential["provider"],
      model: row.model,
      baseUrl: row.baseUrl,
      apiKey: decryptSecret(row.keyCiphertext),
    };
  }

  function handleAiError(e: unknown, res: Response) {
    if (e instanceof AiError) {
      const clientErrorCodes = ["AI_KEY_INVALID", "AI_PROVIDER_QUOTA", "AI_NO_KEY", "AI_INVALID_OUTPUT"];
      const status = clientErrorCodes.includes(e.code) ? 400 : 502;
      return res.status(status).json({ error: e.message, code: e.code });
    }
    // z. B. Entschlüsselungsfehler → Key ist beschädigt/nicht lesbar.
    console.error("AI route error:", e);
    return res.status(400).json({
      error: "Der hinterlegte KI-Key konnte nicht gelesen werden. Bitte neu hinterlegen.",
      code: "AI_KEY_CORRUPTED",
    });
  }

  // Status (maskiert) — NIE der Key selbst.
  app.get("/api/ai/credentials", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });
    const row = await storage.getAiCredential(userId);
    if (!row) return res.json({ configured: false });
    res.json({
      configured: true,
      provider: row.provider,
      model: row.model,
      baseUrl: row.baseUrl,
      keyLast4: row.keyLast4,
      testedAt: row.testedAt ? row.testedAt.toISOString() : null,
    });
  });

  // Speichern (verschlüsselt at-rest).
  app.put("/api/ai/credentials", isAuthenticated, requireVerifiedEmail, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });
    const parsed = aiCredentialInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Ungültige KI-Zugangsdaten", details: parsed.error.errors });
    const { provider, model, apiKey, baseUrl } = parsed.data;
    await storage.upsertAiCredential(userId, {
      provider,
      model,
      baseUrl: provider === "openai-compatible" ? (baseUrl ?? null) : null,
      keyCiphertext: encryptSecret(apiKey),
      keyLast4: last4(apiKey),
    });
    res.json({
      configured: true,
      provider,
      model,
      baseUrl: provider === "openai-compatible" ? (baseUrl ?? null) : null,
      keyLast4: last4(apiKey),
      testedAt: null,
    });
  });

  // Löschen.
  app.delete("/api/ai/credentials", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });
    await storage.deleteAiCredential(userId);
    res.json({ configured: false });
  });

  // Verbindung testen.
  app.post("/api/ai/test-key", isAuthenticated, aiTestLimiter, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });
    try {
      const cred = await loadDecryptedCredential(userId);
      if (!cred) return res.status(400).json({ error: "Keine KI hinterlegt.", code: "AI_NO_KEY" });
      await testConnection(cred);
      await storage.touchAiCredentialTested(userId);
      res.json({ ok: true });
    } catch (e) {
      handleAiError(e, res);
    }
  });

  // Funnel per KI generieren — gibt { pages, theme } zurück. Der Client remappt die
  // Element-IDs und legt den Funnel über den bestehenden POST /api/funnels-Pfad an.
  app.post("/api/ai/generate-funnel", isAuthenticated, requireVerifiedEmail, requireActivePlan, aiGenerateLimiter, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });
    const parsed = generateFunnelInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Ungültige Eingabe", details: parsed.error.errors });
    try {
      const cred = await loadDecryptedCredential(userId);
      if (!cred) {
        return res.status(400).json({
          error: "Keine KI hinterlegt. Bitte zuerst in den Einstellungen einen KI-Anbieter verbinden.",
          code: "AI_NO_KEY",
        });
      }
      const funnel = await generateFunnel(cred, parsed.data);
      res.json(funnel);
    } catch (e) {
      handleAiError(e, res);
    }
  });

  // Stripe Webhook (no auth - called by Stripe)
  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      const signature = req.headers["stripe-signature"] as string;
      if (!signature || !req.rawBody) {
        return res.status(400).json({ error: "Ungültige Webhook-Anfrage" });
      }

      const event = constructWebhookEvent(req.rawBody as Buffer, signature);

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as any;
          const customerId = session.customer as string;
          const subscriptionId = (session.subscription as string) || null;

          let user = await storage.getUserByStripeCustomerId(customerId);
          // Fallback: Falls die Customer-ID (noch) nicht am User hängt
          // (Race bei der Anlage), trägt die Session unsere User-ID.
          if (!user && session.client_reference_id) {
            const refId = parseInt(String(session.client_reference_id), 10);
            if (!isNaN(refId)) {
              user = await storage.getUser(refId);
              if (user) {
                await storage.updateStripeCustomerId(user.id, customerId);
              }
            }
          }

          if (user && subscriptionId) {
            // Trial-Status und -Ende frisch von Stripe lesen
            let isTrial = false;
            let trialEndsAt: Date | null = null;
            try {
              const sub = await stripe!.subscriptions.retrieve(subscriptionId);
              isTrial = sub.status === "trialing";
              trialEndsAt = sub.trial_end ? new Date(sub.trial_end * 1000) : null;
            } catch {
              // Fallback: ohne Stripe-Antwort als aktiv behandeln
            }

            await storage.updateSubscriptionFromStripe(user.id, {
              isPro: true,
              subscriptionStatus: isTrial ? "trial" : "active",
              subscriptionPlan: "pro",
              stripeSubscriptionId: subscriptionId,
              subscriptionStartedAt: new Date(),
              ...(trialEndsAt ? { trialEndsAt } : {}),
            });
          }
          break;
        }

        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const subscription = event.data.object as any;
          const customerId = subscription.customer as string;

          const user = await storage.getUserByStripeCustomerId(customerId);
          if (!user) break;

          // Nur Events der hinterlegten Subscription wirken auf den Account.
          // Sonst setzt z.B. die Kündigung einer verwaisten Zweit-Subscription
          // (Doppel-Checkout) den zahlenden Account auf "cancelled".
          if (user.stripeSubscriptionId && user.stripeSubscriptionId !== subscription.id) {
            console.warn(
              `Stripe-Webhook: Event ${event.type} für fremde Subscription ${subscription.id} ignoriert (User ${user.id} hat ${user.stripeSubscriptionId})`
            );
            break;
          }

          // Verspätete/umsortierte Events: maßgeblich ist der aktuelle Zustand
          // bei Stripe, nicht der Payload-Schnappschuss.
          let status = subscription.status as string;
          let trialEnd: number | null = subscription.trial_end ?? null;
          try {
            const fresh = await stripe!.subscriptions.retrieve(subscription.id);
            status = fresh.status;
            trialEnd = fresh.trial_end;
          } catch {
            // Vollständig gelöschte Subscriptions: Payload-Daten verwenden
          }

          const mappedStatus =
            status === "active" ? "active" :
            status === "trialing" ? "trial" :
            status === "past_due" ? "past_due" :
            status === "canceled" ? "cancelled" :
            "expired"; // unpaid, incomplete, incomplete_expired, paused, unbekannt

          const hasAccess =
            status === "active" || status === "trialing" || status === "past_due";

          await storage.updateSubscriptionFromStripe(user.id, {
            isPro: hasAccess,
            subscriptionStatus: mappedStatus,
            stripeSubscriptionId: status === "canceled" ? null : (user.stripeSubscriptionId ?? subscription.id),
            ...(trialEnd ? { trialEndsAt: new Date(trialEnd * 1000) } : {}),
          });
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as any;
          const customerId = invoice.customer as string;
          const invoiceSubId = (invoice.subscription as string) || null;

          const user = await storage.getUserByStripeCustomerId(customerId);
          if (user && (!invoiceSubId || !user.stripeSubscriptionId || invoiceSubId === user.stripeSubscriptionId)) {
            await storage.updateSubscriptionFromStripe(user.id, {
              subscriptionStatus: "past_due",
            });

            // Dunning-Fallback: Nach dem 4. Fehlversuch (letzte Smart-Retry-
            // Stufe) das Abo serverseitig kündigen — sonst hängt der Account
            // je nach Dashboard-Einstellung unbegrenzt in past_due mit
            // Vollzugriff. Die Kündigung löst customer.subscription.deleted
            // aus, das isPro/Status über den bestehenden Handler zurücksetzt.
            const attemptCount = Number(invoice.attempt_count || 0);
            if (attemptCount >= 4 && invoiceSubId) {
              try {
                await stripe!.subscriptions.cancel(invoiceSubId);
                console.warn(
                  `Dunning: Subscription ${invoiceSubId} nach ${attemptCount} Fehlversuchen gekündigt (User ${user.id})`
                );
              } catch (cancelErr) {
                console.error("Dunning-Kündigung fehlgeschlagen:", cancelErr);
              }
            }
          }
          break;
        }

        case "charge.dispute.created": {
          // Chargeback: Zugriff sperren, bis der Fall geklärt ist.
          const dispute = event.data.object as any;
          let customerId: string | null = null;
          try {
            const charge = await stripe!.charges.retrieve(dispute.charge as string);
            customerId = (charge.customer as string) || null;
          } catch (chargeErr) {
            console.error("Stripe-Webhook: Charge zum Dispute nicht ladbar:", chargeErr);
          }
          if (customerId) {
            const user = await storage.getUserByStripeCustomerId(customerId);
            if (user) {
              console.error(
                `⚠️ CHARGEBACK: Dispute über ${dispute.amount} ${dispute.currency} für User ${user.id} (${user.email}) — Zugriff gesperrt`
              );
              await storage.updateSubscriptionFromStripe(user.id, {
                isPro: false,
                subscriptionStatus: "expired",
              });
            }
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Stripe webhook error:", error);
      res.status(400).json({ error: "Webhook-Verarbeitung fehlgeschlagen" });
    }
  });

  // ============ ANALYTICS ============

  // Track analytics event (public, for funnel tracking)
  // Striktes Schema: Vorher waren beliebige eventTypes und unbegrenzte
  // metadata-Blobs möglich (Datenmüll + Metrik-Inflation per curl).
  const publicAnalyticsSchema = z.object({
    funnelUuid: z.string().min(1).max(100),
    eventType: z.enum(["view", "pageView", "submit", "complete"]),
    pageId: z.string().max(100).optional(),
    metadata: z
      .object({
        abVariants: z.record(z.string().max(100), z.string().max(100)).optional(),
      })
      .optional(),
  });

  app.post("/api/public/analytics", async (req, res) => {
    try {
      const parsed = publicAnalyticsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Ungültige Analytics-Daten" });
      }
      const { funnelUuid, eventType, pageId, metadata } = parsed.data;

      const funnel = await storage.getFunnelBySlugOrUuid(funnelUuid);
      // Nur publizierte Funnels tracken — Draft-Views verfälschen sonst die
      // Statistiken (und der Public-Funnel liefert Drafts ohnehin nicht aus).
      if (!funnel || funnel.status !== "published") {
        return res.status(404).json({ error: "Funnel nicht gefunden" });
      }

      await storage.createAnalyticsEvent({
        funnelId: funnel.id,
        eventType,
        pageId: pageId ?? null,
        metadata: metadata ?? null,
      });

      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Create analytics error:", error);
      res.status(500).json({ error: "Analytics konnten nicht erfasst werden" });
    }
  });

  // Cookieless Reichweitenmessung für trichterwerk.de selbst (getrennt von der
  // Funnel-Analytics oben). Liegt unter /api/public/ → erbt automatisch
  // publicLimiter (60/min/IP) und CSRF-Freiheit. IP + User-Agent werden NUR zur
  // Bildung des tages-rotierenden Anonym-Hashes genutzt und NICHT gespeichert.
  app.post("/api/public/track", async (req, res) => {
    try {
      const parsed = trackEventSchema.safeParse(req.body);
      if (!parsed.success) return res.status(204).end();

      const { path, referrer, utmSource, utmMedium, utmCampaign, eventType } = parsed.data;
      // Nur Marketing-/Legal-/Auth-Pfade zählen (Whitelist) — sonst still verwerfen.
      if (!isTrackablePath(path)) return res.status(204).end();

      const ip = req.ip || req.socket.remoteAddress || "";
      const userAgent = req.get("user-agent") || "";

      await storage.createPlatformVisit({
        visitorHash: dailyVisitorHash(ip, userAgent),
        path: (path.split(/[?#]/)[0] || "/").slice(0, 200),
        referrerHost: deriveReferrerHost(referrer),
        utmSource: utmSource ?? null,
        utmMedium: utmMedium ?? null,
        utmCampaign: utmCampaign ?? null,
        deviceClass: deriveDeviceClass(userAgent),
        country: deriveCountry(req.headers),
        eventType,
      });

      res.status(204).end();
    } catch (error) {
      // Tracking darf den Besucher nie stören → still schlucken, nur loggen.
      console.error("Platform track error:", error);
      res.status(204).end();
    }
  });

  // Get analytics for funnel (protected)
  app.get("/api/funnels/:funnelId/analytics", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const funnelId = parseInt(String(req.params.funnelId));
      if (isNaN(funnelId)) {
        return res.status(400).json({ error: "Ungültige Funnel-ID" });
      }

      // Verify user owns the funnel
      const funnel = await storage.getFunnel(funnelId, userId);
      if (!funnel) {
        return res.status(404).json({ error: "Funnel nicht gefunden" });
      }

      const analytics = await storage.getAnalytics(funnelId);
      res.json(analytics);
    } catch (error) {
      console.error("Get analytics error:", error);
      res.status(500).json({ error: "Analytics konnten nicht geladen werden" });
    }
  });

  // ============ ADMIN ROUTES ============

  // Admin login (separate endpoint for admin panel)
  app.post("/api/admin/login", (req, res, next) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Ungültige Anmeldedaten" });
    }

    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: "Login fehlgeschlagen" });
      }
      if (!user) {
        return res.status(401).json({ error: "Ungültige Anmeldedaten" });
      }

      // Check if user is admin — identische Antwort wie bei falschem Passwort,
      // sonst entsteht ein Credential-Orakel (401 vs. 403 verrät, dass das
      // Passwort eines Nicht-Admin-Accounts korrekt war).
      const fullUser = await storage.getUser(user.id);
      if (!fullUser?.isAdmin) {
        return res.status(401).json({ error: "Ungültige Anmeldedaten" });
      }

      req.login(user, async (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ error: "Session konnte nicht erstellt werden" });
        }
        // Update last login
        await storage.updateLastLogin(user.id);
        res.json({ user: { ...user, isAdmin: true } });
      });
    })(req, res, next);
  });

  // Get admin statistics
  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Get admin stats error:", error);
      res.status(500).json({ error: "Statistiken konnten nicht geladen werden" });
    }
  });

  // Cookieless Plattform-Reichweite (wer besucht trichterwerk.de) — nur Betreiber.
  app.get("/api/admin/platform-stats", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const days = Math.min(Math.max(parseInt(String(req.query.days)) || 30, 1), 365);
      const stats = await storage.getPlatformStats(days);
      res.json({ days, ...stats });
    } catch (error) {
      console.error("Get platform stats error:", error);
      res.status(500).json({ error: "Plattform-Statistiken konnten nicht geladen werden" });
    }
  });

  // Get all users (admin only)
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const limit = Math.min(parseInt(String(req.query.limit)) || 50, 100);
      const offset = Math.max(parseInt(String(req.query.offset)) || 0, 0);
      const search = req.query.search as string | undefined;

      const result = await storage.getAllUsers(limit, offset, search);

      // Map users to response format
      const users = result.users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        isAdmin: user.isAdmin,
        isPro: user.isPro,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        trialEndsAt: user.trialEndsAt?.toISOString() || null,
        subscriptionStartedAt: user.subscriptionStartedAt?.toISOString() || null,
        lastLoginAt: user.lastLoginAt?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        funnelCount: user.funnelCount,
        leadCount: user.leadCount,
        daysInTrial: user.trialEndsAt
          ? Math.ceil((user.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null,
        isTrialExpired: user.trialEndsAt
          ? user.trialEndsAt.getTime() < Date.now()
          : false,
      }));

      res.json({ users, total: result.total });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Benutzer konnten nicht geladen werden" });
    }
  });

  // Update user (admin only)
  app.patch("/api/admin/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(String(req.params.id));
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Ungültige Benutzer-ID" });
      }

      const updates: {
        isPro?: boolean;
        isAdmin?: boolean;
        subscriptionStatus?: string;
        subscriptionPlan?: string;
        trialEndsAt?: Date | null;
        subscriptionStartedAt?: Date | null;
      } = {};

      if (req.body.isPro !== undefined) updates.isPro = req.body.isPro;
      if (req.body.isAdmin !== undefined) updates.isAdmin = req.body.isAdmin;
      if (req.body.subscriptionStatus !== undefined) updates.subscriptionStatus = req.body.subscriptionStatus;
      if (req.body.subscriptionPlan !== undefined) updates.subscriptionPlan = req.body.subscriptionPlan;
      if (req.body.trialEndsAt !== undefined) {
        updates.trialEndsAt = req.body.trialEndsAt ? new Date(req.body.trialEndsAt) : null;
      }
      if (req.body.subscriptionStartedAt !== undefined) {
        updates.subscriptionStartedAt = req.body.subscriptionStartedAt ? new Date(req.body.subscriptionStartedAt) : null;
      }

      const user = await storage.updateUserAdmin(userId, updates);
      if (!user) {
        return res.status(404).json({ error: "Benutzer nicht gefunden" });
      }

      res.json({ success: true, user });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Benutzer konnte nicht aktualisiert werden" });
    }
  });

  // Delete user (admin only)
  app.delete("/api/admin/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(String(req.params.id));
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Ungültige Benutzer-ID" });
      }

      // Prevent deleting yourself
      if (userId === req.user?.id) {
        return res.status(400).json({ error: "Du kannst dich nicht selbst löschen" });
      }

      // Aktive Stripe-Abos zuerst kündigen — nach dem Löschen der DB-Zeile
      // finden Webhooks keinen User mehr und Stripe würde dauerhaft weiter
      // abbuchen, ohne dass es auffällt.
      const userToDelete = await storage.getUser(userId);
      if (!userToDelete) {
        return res.status(404).json({ error: "Benutzer nicht gefunden" });
      }
      if (userToDelete.stripeCustomerId && isStripeConfigured()) {
        try {
          await cancelAllSubscriptions(userToDelete.stripeCustomerId);
        } catch (stripeErr) {
          console.error("Stripe-Kündigung vor User-Löschung fehlgeschlagen:", stripeErr);
          return res.status(409).json({
            error:
              "Stripe-Abo konnte nicht gekündigt werden — Benutzer NICHT gelöscht. Bitte erneut versuchen oder das Abo im Stripe-Dashboard kündigen.",
          });
        }
      }

      const deleted = await storage.deleteUserAdmin(userId);
      if (!deleted) {
        return res.status(404).json({ error: "Benutzer nicht gefunden" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Benutzer konnte nicht gelöscht werden" });
    }
  });

  // Initialize admin user
  app.post("/api/admin/init", async (req, res) => {
    try {
      // Check if request contains correct credentials
      const { username, password, email } = req.body;

      const adminUser = process.env.ADMIN_USERNAME || "admin";
      const adminPass = process.env.ADMIN_PASSWORD;

      if (!adminPass) {
        return res.status(500).json({ error: "ADMIN_PASSWORD Umgebungsvariable nicht gesetzt" });
      }

      // Konstantzeit-Vergleich gegen Timing-Angriffe auf das Admin-Passwort
      const safeEqual = (a: unknown, b: string) => {
        const ha = createHash("sha256").update(String(a ?? "")).digest();
        const hb = createHash("sha256").update(b).digest();
        return timingSafeEqual(ha, hb);
      };
      if (!safeEqual(username, adminUser) || !safeEqual(password, adminPass)) {
        return res.status(403).json({ error: "Ungültige Initialisierungsdaten" });
      }

      await storage.ensureAdminUser(
        adminUser,
        adminPass,
        email || "admin@superbrand.marketing"
      );

      res.json({ success: true, message: "Admin-Benutzer wurde initialisiert" });
    } catch (error) {
      console.error("Admin init error:", error);
      res.status(500).json({ error: "Admin konnte nicht initialisiert werden" });
    }
  });

  // ============ CUSTOM DOMAINS ============

  app.get("/api/domains", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });
      const list = await storage.listDomains(userId);
      res.json(list);
    } catch (error) {
      console.error("List domains error:", error);
      res.status(500).json({ error: "Domains konnten nicht geladen werden" });
    }
  });

  app.post("/api/domains", isAuthenticated, requireVerifiedEmail, requireActivePlan, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const result = insertDomainSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Ungültige Domain-Daten", details: result.error.errors });
      }

      // Funnel muss dem Nutzer gehören
      const funnel = await storage.getFunnel(result.data.funnelId, userId);
      if (!funnel) return res.status(404).json({ error: "Funnel nicht gefunden" });

      // Eigene Plattform-Hosts dürfen nicht claimbar sein (Squatting würde
      // die Auflösung über funnel-by-host kapern)
      const reservedHosts = ["trichterwerk.de", "www.trichterwerk.de", "localhost"];
      if (reservedHosts.includes(result.data.hostname)) {
        return res.status(400).json({ error: "Dieser Hostname ist reserviert" });
      }

      // Squatting-Bremse: max. 5 UNVERIFIZIERTE Domains pro Account —
      // unverifizierte Einträge blockieren den Hostname global.
      const ownDomains = await storage.listDomains(userId);
      const unverified = ownDomains.filter((d) => !d.verified).length;
      if (unverified >= 5) {
        return res.status(400).json({
          error: "Zu viele unbestätigte Domains. Bitte verifiziere oder lösche bestehende Einträge zuerst.",
        });
      }

      // Hostname darf nicht doppelt vergeben sein (Vorab-Check für schnelles Feedback)
      const existing = await storage.getDomainByHostname(result.data.hostname);
      if (existing) return res.status(409).json({ error: "Diese Domain ist bereits registriert" });

      const domain = await storage.createDomain(funnel.id, userId, result.data.hostname);
      res.status(201).json(domain);
    } catch (error: any) {
      // Race-Condition: zwei parallele Requests passieren beide den Vorab-Check.
      // Der DB-Unique-Constraint auf hostname schlägt zu → sauberer 409 statt 500.
      if (error?.code === "23505" && error?.constraint?.includes("hostname")) {
        return res.status(409).json({ error: "Diese Domain ist bereits registriert" });
      }
      console.error("Create domain error:", error);
      res.status(500).json({ error: "Domain konnte nicht angelegt werden" });
    }
  });

  app.post("/api/domains/:id/verify", domainVerifyLimiter, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const id = parseInt(String(req.params.id));
      if (isNaN(id)) return res.status(400).json({ error: "Ungültige ID" });

      const domain = await storage.getDomain(id, userId);
      if (!domain) return res.status(404).json({ error: "Domain nicht gefunden" });
      if (domain.verified) return res.json({ ...domain, alreadyVerified: true });

      // DNS-TXT-Lookup an _trichterwerk-verify.<hostname>
      const { promises: dns } = await import("dns");
      let records: string[][] = [];
      try {
        records = await dns.resolveTxt(`_trichterwerk-verify.${domain.hostname}`);
      } catch {
        return res.status(400).json({
          error: "DNS-TXT-Eintrag nicht gefunden. Bitte 1–5 Minuten warten und erneut versuchen.",
        });
      }

      const flat = records.map((parts) => parts.join("")).map((v) => v.trim());
      if (!flat.includes(domain.verificationToken)) {
        // Bewusst KEIN expected/found zurückgeben (Information Disclosure) —
        // den erwarteten Token zeigt die UI ohnehin im Setup-Bereich.
        return res.status(400).json({
          error: "Verifikations-Token stimmt nicht überein. DNS-Eintrag prüfen und 1–5 Minuten warten.",
        });
      }

      const verified = await storage.markDomainVerified(id, userId);
      res.json(verified);
    } catch (error) {
      console.error("Verify domain error:", error);
      res.status(500).json({ error: "Domain konnte nicht verifiziert werden" });
    }
  });

  app.delete("/api/domains/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

      const id = parseInt(String(req.params.id));
      if (isNaN(id)) return res.status(400).json({ error: "Ungültige ID" });

      const ok = await storage.deleteDomain(id, userId);
      if (!ok) return res.status(404).json({ error: "Domain nicht gefunden" });
      res.status(204).send();
    } catch (error) {
      console.error("Delete domain error:", error);
      res.status(500).json({ error: "Domain konnte nicht gelöscht werden" });
    }
  });

  // Public: Funnel anhand des Host-Headers/Querys auflösen — nutzt die SPA,
  // um auf einer Custom-Domain den richtigen Funnel zu rendern.
  app.get("/api/public/funnel-by-host", async (req, res) => {
    try {
      const rawHost = (req.query.host as string | undefined) || req.headers.host || "";
      const host = String(rawHost).toLowerCase().split(":")[0].trim();
      if (!host) return res.status(400).json({ error: "Host fehlt" });

      const domain = await storage.getDomainByHostname(host);
      if (!domain || !domain.verified) return res.status(404).json({ error: "Keine verifizierte Domain" });

      const funnel = await storage.getFunnel(domain.funnelId, domain.userId);
      if (!funnel || funnel.status !== "published") {
        return res.status(404).json({ error: "Funnel nicht verfügbar" });
      }

      // Trial-Enforcement (siehe /api/public/funnels/:identifier)
      const owner = await storage.getUser(domain.userId);
      if (!owner || !hasActivePlan(owner, PUBLIC_GRACE_PERIOD_MS)) {
        return res.status(410).json({ error: "Dieser Funnel ist derzeit pausiert.", code: "FUNNEL_PAUSED" });
      }

      // Reduzierter Payload (öffentliche Sicht — Sensitive Felder weglassen)
      res.json({
        uuid: funnel.uuid,
        slug: funnel.slug,
        name: funnel.name,
      });
    } catch (error) {
      console.error("Funnel-by-host error:", error);
      res.status(500).json({ error: "Funnel konnte nicht aufgelöst werden" });
    }
  });

  return httpServer;
}
