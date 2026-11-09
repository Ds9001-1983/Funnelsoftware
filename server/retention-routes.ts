import { RetentionCommittedError } from "./erasure-journal";
import { analyticsRetentionDraftSchema } from "@shared/analytics-retention-contract";
import { deletedFunnelRetentionSchema } from "@shared/deleted-funnel-retention-contract";
import { activateDeletedFunnelRetention, previewDeletedFunnelRetention, saveDeletedFunnelRetention } from "./deleted-funnel-retention";
import { activateAnalyticsRetention, previewAnalyticsRetention, saveAnalyticsRetention } from "./analytics-retention";
import type { Express, Response } from "express";
import { z } from "zod";
import { isAuthenticated, requireVerifiedEmail } from "./auth";
import { retentionDraftSchema, retentionExceptionSchema, retentionActivationSchema } from "@shared/retention-contract";
import { setRetentionActivation, previewRetention, saveRetentionDraft, saveRetentionException, RetentionError } from "./retention";

const id = z.coerce.number().int().positive();
function fail(res: Response, error: unknown) {
  if (error instanceof z.ZodError) return res.status(400).json({ error: "Bitte prüfe die Eingaben." });
  if (error instanceof RetentionCommittedError || error instanceof RetentionError) return res.status(error.status).json({ error: error.message });
  console.error("Aufbewahrungsanfrage fehlgeschlagen:", error instanceof Error ? error.name : "unknown");
  return res.status(500).json({ error: "Die Anfrage konnte nicht verarbeitet werden." });
}
export function registerRetentionRoutes(app: Express) {
  app.get("/api/retention/deleted-funnels", isAuthenticated, requireVerifiedEmail, async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store");
      res.json(await previewDeletedFunnelRetention(req.user!.id, z.coerce.number().int().min(0).max(1_000_000).parse(req.query.page ?? 0)));
    } catch (error) { fail(res, error); }
  });
  app.put("/api/retention/deleted-funnels", isAuthenticated, requireVerifiedEmail, async (req, res) => {
    try { res.json(await saveDeletedFunnelRetention(req.user!.id, deletedFunnelRetentionSchema.parse(req.body))); }
    catch (error) { fail(res, error); }
  });
  app.put("/api/retention/deleted-funnels/activation", isAuthenticated, requireVerifiedEmail, async (req, res) => {
    try { res.json(await activateDeletedFunnelRetention(req.user!.id, retentionActivationSchema.parse(req.body))); }
    catch (error) { fail(res, error); }
  });
  app.get("/api/retention/analytics/:id", isAuthenticated, requireVerifiedEmail, async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store");
      res.json(await previewAnalyticsRetention(id.parse(req.params.id), req.user!.id));
    } catch (error) { fail(res, error); }
  });
  app.put("/api/retention/analytics/:id", isAuthenticated, requireVerifiedEmail, async (req, res) => {
    try { res.json(await saveAnalyticsRetention(id.parse(req.params.id), req.user!.id, analyticsRetentionDraftSchema.parse(req.body))); }
    catch (error) { fail(res, error); }
  });
  app.put("/api/retention/analytics/:id/activation", isAuthenticated, requireVerifiedEmail, async (req, res) => {
    try { res.json(await activateAnalyticsRetention(id.parse(req.params.id), req.user!.id, retentionActivationSchema.parse(req.body))); }
    catch (error) { fail(res, error); }
  });
  // Only the authenticated owner can plan retention; workspace membership does not grant this right.
  app.get("/api/retention/funnels/:id", isAuthenticated, requireVerifiedEmail, async (req, res) => {
    try {
      const page = z.coerce.number().int().min(0).max(1_000_000).parse(req.query.page ?? 0);
      res.setHeader("Cache-Control", "no-store");
      res.json(await previewRetention(id.parse(req.params.id), req.user!.id, page));
    } catch (error) { fail(res, error); }
  });
  app.put("/api/retention/funnels/:id", isAuthenticated, requireVerifiedEmail, async (req, res) => {
    try { res.json(await saveRetentionDraft(id.parse(req.params.id), req.user!.id, retentionDraftSchema.parse(req.body))); }
    catch (error) { fail(res, error); }
  });
  app.put("/api/retention/funnels/:id/activation", isAuthenticated, requireVerifiedEmail, async (req, res) => {
    try { res.json(await setRetentionActivation(id.parse(req.params.id), req.user!.id, retentionActivationSchema.parse(req.body))); }
    catch (error) { fail(res, error); }
  });
  app.put("/api/retention/leads/:id/exception", isAuthenticated, requireVerifiedEmail, async (req, res) => {
    try { res.json(await saveRetentionException(id.parse(req.params.id), req.user!.id, retentionExceptionSchema.parse(req.body))); }
    catch (error) { fail(res, error); }
  });
}
