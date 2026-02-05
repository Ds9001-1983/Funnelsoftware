import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { passport, isAuthenticated, isAdmin, getUserId } from "./auth";
import {
  insertFunnelSchema, insertLeadSchema, funnelSchema, leadSchema,
  loginSchema, registerSchema
} from "@shared/schema";
import { z } from "zod";

// Partial update schemas for PATCH endpoints
const updateFunnelSchema = funnelSchema.partial().omit({ id: true, uuid: true, userId: true, createdAt: true, updatedAt: true });
const updateLeadSchema = leadSchema.partial().omit({ id: true, uuid: true, funnelId: true, userId: true, createdAt: true, funnelName: true });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ============ AUTH ROUTES ============

  // Register new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Ungültige Registrierungsdaten", details: result.error.errors });
      }

      const { username, email, password, displayName } = result.data;

      // Check if username exists
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ error: "Benutzername bereits vergeben" });
      }

      // Check if email exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "E-Mail bereits registriert" });
      }

      // Create user with 14-day trial
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      const user = await storage.createUser({
        username,
        email,
        password,
        displayName,
        trialEndsAt,
        isPro: false,
      });

      // Log user in automatically
      req.login({ ...user, password: undefined } as any, (err) => {
        if (err) {
          return res.status(500).json({ error: "Registrierung erfolgreich, aber Login fehlgeschlagen" });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({ user: userWithoutPassword });
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
  app.post("/api/funnels", isAuthenticated, async (req, res) => {
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
  app.patch("/api/funnels/:id", isAuthenticated, async (req, res) => {
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

      const funnel = await storage.updateFunnel(funnelId, userId, result.data);
      if (!funnel) {
        return res.status(404).json({ error: "Funnel nicht gefunden" });
      }
      res.json(funnel);
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

  // ============ PUBLIC FUNNEL VIEW ============

  // Get published funnel by UUID (public, for viewing)
  app.get("/api/public/funnels/:uuid", async (req, res) => {
    try {
      const funnel = await storage.getFunnelByUuid(req.params.uuid);
      if (!funnel || funnel.status !== "published") {
        return res.status(404).json({ error: "Funnel nicht gefunden oder nicht veröffentlicht" });
      }

      // Return only necessary public data
      res.json({
        uuid: funnel.uuid,
        name: funnel.name,
        pages: funnel.pages,
        theme: funnel.theme,
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
  app.post("/api/public/leads", async (req, res) => {
    try {
      // Get funnel to find owner
      const funnelId = req.body.funnelId;
      if (!funnelId) {
        return res.status(400).json({ error: "Funnel-ID erforderlich" });
      }

      const funnel = await storage.getFunnelByUuid(funnelId.toString());
      if (!funnel || funnel.status !== "published") {
        return res.status(404).json({ error: "Funnel nicht gefunden" });
      }

      const result = insertLeadSchema.safeParse({
        ...req.body,
        funnelId: funnel.id,
      });

      if (!result.success) {
        return res.status(400).json({ error: "Ungültige Lead-Daten", details: result.error.errors });
      }

      const lead = await storage.createLead(result.data, funnel.userId);
      res.status(201).json({ success: true, id: lead.uuid });
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

  // ============ ANALYTICS ============

  // Track analytics event (public, for funnel tracking)
  app.post("/api/public/analytics", async (req, res) => {
    try {
      const { funnelUuid, eventType, pageId, metadata } = req.body;

      if (!funnelUuid || !eventType) {
        return res.status(400).json({ error: "Funnel-UUID und Event-Typ erforderlich" });
      }

      const funnel = await storage.getFunnelByUuid(funnelUuid);
      if (!funnel) {
        return res.status(404).json({ error: "Funnel nicht gefunden" });
      }

      const event = await storage.createAnalyticsEvent({
        funnelId: funnel.id,
        eventType,
        pageId,
        metadata,
      });

      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Create analytics error:", error);
      res.status(500).json({ error: "Analytics konnten nicht erfasst werden" });
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
        return res.status(401).json({ error: info?.message || "Ungültige Anmeldedaten" });
      }

      // Check if user is admin
      const fullUser = await storage.getUser(user.id);
      if (!fullUser?.isAdmin) {
        return res.status(403).json({ error: "Kein Admin-Zugang" });
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

  // Get all users (admin only)
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const limit = parseInt(String(req.query.limit)) || 50;
      const offset = parseInt(String(req.query.offset)) || 0;
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

      if (username !== "Superheld" || password !== "LKW_Peter123!") {
        return res.status(403).json({ error: "Ungültige Initialisierungsdaten" });
      }

      await storage.ensureAdminUser(
        "Superheld",
        "LKW_Peter123!",
        email || "admin@superbrand.marketing"
      );

      res.json({ success: true, message: "Admin-Benutzer wurde initialisiert" });
    } catch (error) {
      console.error("Admin init error:", error);
      res.status(500).json({ error: "Admin konnte nicht initialisiert werden" });
    }
  });

  return httpServer;
}
