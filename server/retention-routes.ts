import { RetentionCommittedError } from "./erasure-journal";
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
