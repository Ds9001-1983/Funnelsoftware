import type { Express, Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { db } from "./db";
import { leads, recruitingMailRules } from "@shared/schema";
import { changeStageSchema, pipelineUpdateSchema, mailRuleInputSchema, renderRecruitingText } from "@shared/recruiting-contract";
import { isAuthenticated, requireVerifiedEmail } from "./auth";
import { getWorkspaceFunnelAccess, getWorkspaceLeads, WorkspaceError } from "./workspaces";
import { getRecruitingBoard, updateRecruitingPipeline, getRecruitingRules, saveRecruitingRule, changeRecruitingStage, getRecruitingHistory, recruitingOwner, requireRecruitingPro, RecruitingError } from "./recruiting";
import { sendRecruitingEmail } from "./email";

const idSchema = z.coerce.number().int().positive();
function id(value: unknown): number { return idSchema.parse(value); }
function workspaceId(req: Request): number | undefined { return req.query.workspaceId === undefined ? undefined : id(req.query.workspaceId); }
function fail(res: Response, error: unknown) {
  if (error instanceof z.ZodError) return res.status(400).json({ error: "Ungültige Eingabe", details: error.errors });
  if (error instanceof RecruitingError || error instanceof WorkspaceError) return res.status(error.status).json({ error: error.message, code: error.code });
  console.error("Recruiting-Anfrage fehlgeschlagen:", error instanceof Error ? error.name : "unknown");
  return res.status(500).json({ error: "Die Anfrage konnte nicht verarbeitet werden" });
}
async function funnelScope(req: Request, funnelId: number) {
  const spaceId = workspaceId(req);
  if (spaceId !== undefined) {
    const context = await getWorkspaceFunnelAccess(spaceId, funnelId, req.user!.id, req.user!.emailVerifiedAt ? req.user!.email : null);
    return { ownerId: context.ownerId, workspaceId: spaceId };
  }
  await recruitingOwner(funnelId, req.user!.id);
  return { ownerId: req.user!.id, workspaceId: undefined };
}
async function leadScope(req: Request, leadId: number) {
  const spaceId = workspaceId(req);
  if (spaceId !== undefined) {
    const scoped = await getWorkspaceLeads(spaceId, req.user!.id, req.user!.emailVerifiedAt ? req.user!.email : null, leadId);
    if (!scoped.length) throw new RecruitingError(404, "Bewerbung nicht gefunden");
    return { ownerId: scoped[0].userId, workspaceId: spaceId };
  }
  const [lead] = await db.select({ id: leads.id }).from(leads).where(and(eq(leads.id, leadId), eq(leads.userId, req.user!.id)));
  if (!lead) throw new RecruitingError(404, "Bewerbung nicht gefunden");
  return { ownerId: req.user!.id, workspaceId: undefined };
}
export function registerRecruitingRoutes(app: Express) {
  app.get("/api/recruiting/funnels/:id/board", isAuthenticated, async (req, res) => {
    try { const funnelId = id(req.params.id); const scope = await funnelScope(req, funnelId); res.json(await getRecruitingBoard(funnelId, scope.ownerId, scope.workspaceId === undefined)); }
    catch (error) { fail(res, error); }
  });
  app.put("/api/recruiting/funnels/:id/pipeline", isAuthenticated, requireVerifiedEmail, async (req, res) => {
    try { const input = pipelineUpdateSchema.parse(req.body); res.json(await updateRecruitingPipeline(id(req.params.id), req.user!.id, input.expectedVersion, input.stages)); }
    catch (error) { fail(res, error); }
  });
  app.get("/api/recruiting/funnels/:id/rules", isAuthenticated, requireVerifiedEmail, async (req, res) => {
    try { res.json(await getRecruitingRules(id(req.params.id), req.user!.id)); } catch (error) { fail(res, error); }
  });
  app.put("/api/recruiting/funnels/:id/rules", isAuthenticated, requireVerifiedEmail, async (req, res) => {
    try { res.json(await saveRecruitingRule(id(req.params.id), req.user!.id, mailRuleInputSchema.parse(req.body))); } catch (error) { fail(res, error); }
  });
  app.patch("/api/recruiting/leads/:id/stage", isAuthenticated, requireVerifiedEmail, async (req, res) => {
    try { const leadId = id(req.params.id); const scope = await leadScope(req, leadId); const input = changeStageSchema.parse(req.body); res.json(await changeRecruitingStage({ leadId, ...scope, actorId: req.user!.id, ...input })); }
    catch (error) { fail(res, error); }
  });
  app.get("/api/recruiting/leads/:id/history", isAuthenticated, requireVerifiedEmail, async (req, res) => {
    try { const leadId = id(req.params.id); const scope = await leadScope(req, leadId); res.json(await getRecruitingHistory(leadId, scope.ownerId)); }
    catch (error) { fail(res, error); }
  });
  const testLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false, message: { error: "Bitte warte vor weiteren Testmails kurz." } });
  app.post("/api/recruiting/funnels/:id/test-mail", isAuthenticated, requireVerifiedEmail, testLimiter, async (req, res) => {
    try {
      const funnelId = id(req.params.id);
      const { ruleId } = z.object({ ruleId: idSchema }).strict().parse(req.body);
      const { funnel, owner } = await recruitingOwner(funnelId, req.user!.id); requireRecruitingPro(owner);
      const [rule] = await db.select().from(recruitingMailRules).where(and(eq(recruitingMailRules.id, ruleId), eq(recruitingMailRules.funnelId, funnelId)));
      if (!rule) throw new RecruitingError(404, "Mailregel nicht gefunden");
      const values = { name: "Max Beispiel", company: "Beispielfirma", funnel: funnel.name };
      const result = await sendRecruitingEmail({ recipient: owner.email, replyTo: owner.email, senderName: rule.senderName, subject: `[Test] ${renderRecruitingText(rule.subject, values)}`, body: renderRecruitingText(rule.body, values) });
      if (result.status !== "sent") return res.status(502).json({ error: "Die Testmail konnte nicht bestätigt werden. Bitte prüfe die Versandeinstellungen.", code: result.errorCode });
      res.json({ sent: true });
    } catch (error) { fail(res, error); }
  });
}
