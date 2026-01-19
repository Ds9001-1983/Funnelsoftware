import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFunnelSchema, insertLeadSchema, funnelSchema, leadSchema, analyticsEventSchema } from "@shared/schema";
import { z } from "zod";

// Partial update schemas for PATCH endpoints
const updateFunnelSchema = funnelSchema.partial().omit({ id: true, createdAt: true, updatedAt: true });
const updateLeadSchema = leadSchema.partial().omit({ id: true, createdAt: true });
const createAnalyticsSchema = analyticsEventSchema.omit({ id: true });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============ FUNNELS ============
  
  // Get all funnels
  app.get("/api/funnels", async (req, res) => {
    try {
      const funnels = await storage.getFunnels();
      res.json(funnels);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch funnels" });
    }
  });

  // Get single funnel
  app.get("/api/funnels/:id", async (req, res) => {
    try {
      const funnel = await storage.getFunnel(req.params.id);
      if (!funnel) {
        return res.status(404).json({ error: "Funnel not found" });
      }
      res.json(funnel);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch funnel" });
    }
  });

  // Create funnel
  app.post("/api/funnels", async (req, res) => {
    try {
      const result = insertFunnelSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid funnel data", details: result.error.errors });
      }
      const funnel = await storage.createFunnel(result.data);
      res.status(201).json(funnel);
    } catch (error) {
      res.status(500).json({ error: "Failed to create funnel" });
    }
  });

  // Update funnel
  app.patch("/api/funnels/:id", async (req, res) => {
    try {
      const result = updateFunnelSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid funnel update data", details: result.error.errors });
      }
      const funnel = await storage.updateFunnel(req.params.id, result.data);
      if (!funnel) {
        return res.status(404).json({ error: "Funnel not found" });
      }
      res.json(funnel);
    } catch (error) {
      res.status(500).json({ error: "Failed to update funnel" });
    }
  });

  // Delete funnel
  app.delete("/api/funnels/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteFunnel(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Funnel not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete funnel" });
    }
  });

  // ============ LEADS ============

  // Get all leads
  app.get("/api/leads", async (req, res) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  // Get leads by funnel
  app.get("/api/funnels/:funnelId/leads", async (req, res) => {
    try {
      const leads = await storage.getLeadsByFunnel(req.params.funnelId);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  // Get single lead
  app.get("/api/leads/:id", async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lead" });
    }
  });

  // Create lead (for funnel submissions)
  app.post("/api/leads", async (req, res) => {
    try {
      const result = insertLeadSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid lead data", details: result.error.errors });
      }
      const lead = await storage.createLead(result.data);
      res.status(201).json(lead);
    } catch (error) {
      res.status(500).json({ error: "Failed to create lead" });
    }
  });

  // Update lead
  app.patch("/api/leads/:id", async (req, res) => {
    try {
      const result = updateLeadSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid lead update data", details: result.error.errors });
      }
      const lead = await storage.updateLead(req.params.id, result.data);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error: "Failed to update lead" });
    }
  });

  // Delete lead
  app.delete("/api/leads/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteLead(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete lead" });
    }
  });

  // ============ TEMPLATES ============

  // Get all templates
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  // Get single template
  app.get("/api/templates/:id", async (req, res) => {
    try {
      const template = await storage.getTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  // ============ ANALYTICS ============

  // Track analytics event
  app.post("/api/analytics", async (req, res) => {
    try {
      const eventData = {
        ...req.body,
        timestamp: new Date().toISOString(),
      };
      const result = createAnalyticsSchema.safeParse(eventData);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid analytics data", details: result.error.errors });
      }
      const event = await storage.createAnalyticsEvent(result.data);
      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to track analytics" });
    }
  });

  // Get analytics for funnel
  app.get("/api/funnels/:funnelId/analytics", async (req, res) => {
    try {
      const analytics = await storage.getAnalytics(req.params.funnelId);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  return httpServer;
}
