import type { Express, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import {
  acceptWorkspaceInvitationSchema, assignWorkspaceFunnelsSchema, createWorkspaceSchema,
  inviteWorkspaceMemberSchema, updateWorkspaceSchema,
} from "@shared/workspace-contract";
import { isAuthenticated, requireVerifiedEmail } from "./auth";
import { sendWorkspaceInviteEmail } from "./email";
import {
  acceptWorkspaceInvitation, assignWorkspaceFunnels, createWorkspace, deleteWorkspace, getWorkspaceAccess,
  getWorkspaceFunnels, getWorkspaceLeads, inviteWorkspaceMember, listWorkspaceInvitations,
  listWorkspaceMembers, listWorkspaces, removeWorkspaceMember, renameWorkspace, WorkspaceError,
} from "./workspaces";

const positiveId = z.string().regex(/^[1-9]\d*$/).transform(Number).refine(Number.isSafeInteger);
const inviteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user!.id),
  message: { error: "Zu viele Einladungen. Bitte versuche es später erneut." },
});

function actor(req: Request) {
  if (!req.user) throw new WorkspaceError(401, "Nicht autorisiert");
  return { userId: req.user.id, verifiedEmail: req.user.emailVerifiedAt ? req.user.email : null };
}

function id(req: Request, key = "id") {
  return positiveId.parse(req.params[key]);
}

const handle = (handler: (req: Request, res: Response) => Promise<unknown>) => async (req: Request, res: Response) => {
  try {
    await handler(req, res);
  } catch (error) {
    if (error instanceof WorkspaceError) {
      res.status(error.status).json({ error: error.message, ...(error.code ? { code: error.code } : {}) });
    } else if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Ungültige Eingabe", details: error.errors });
    } else {
      console.error("[Workspace] Request failed:", error instanceof Error ? error.name : "unknown");
      res.status(500).json({ error: "Der Kundenbereich konnte nicht aktualisiert oder geladen werden." });
    }
  }
};

export function registerWorkspaceRoutes(app: Express) {
  const auth = [isAuthenticated, requireVerifiedEmail];

  app.get("/api/workspaces", ...auth, handle(async (req, res) => {
    const { userId, verifiedEmail } = actor(req);
    res.json(await listWorkspaces(userId, verifiedEmail));
  }));

  app.post("/api/workspaces", ...auth, handle(async (req, res) => {
    const { userId, verifiedEmail } = actor(req);
    const { name } = createWorkspaceSchema.parse(req.body);
    res.status(201).json(await createWorkspace(userId, verifiedEmail, name));
  }));

  app.get("/api/workspaces/:id", ...auth, handle(async (req, res) => {
    const { userId, verifiedEmail } = actor(req);
    const { userId: _actorId, ...workspace } = await getWorkspaceAccess(id(req), userId, verifiedEmail, { requirePro: false });
    res.json(workspace);
  }));

  app.patch("/api/workspaces/:id", ...auth, handle(async (req, res) => {
    const { userId, verifiedEmail } = actor(req);
    const { name } = updateWorkspaceSchema.parse(req.body);
    const { userId: _actorId, ...workspace } = await renameWorkspace(id(req), userId, verifiedEmail, name);
    res.json(workspace);
  }));

  app.delete("/api/workspaces/:id", ...auth, handle(async (req, res) => {
    const { userId, verifiedEmail } = actor(req);
    await deleteWorkspace(id(req), userId, verifiedEmail);
    res.status(204).send();
  }));

  app.get("/api/workspaces/:id/funnels", ...auth, handle(async (req, res) => {
    const { userId, verifiedEmail } = actor(req);
    res.json(await getWorkspaceFunnels(id(req), userId, verifiedEmail));
  }));

  app.put("/api/workspaces/:id/funnels", ...auth, handle(async (req, res) => {
    const { userId, verifiedEmail } = actor(req);
    const { funnelIds } = assignWorkspaceFunnelsSchema.parse(req.body);
    await assignWorkspaceFunnels(id(req), userId, verifiedEmail, funnelIds);
    res.status(204).send();
  }));

  app.get("/api/workspaces/:id/leads", ...auth, handle(async (req, res) => {
    const { userId, verifiedEmail } = actor(req);
    res.json(await getWorkspaceLeads(id(req), userId, verifiedEmail));
  }));

  app.get("/api/workspaces/:id/leads/:leadId", ...auth, handle(async (req, res) => {
    const { userId, verifiedEmail } = actor(req);
    const [lead] = await getWorkspaceLeads(id(req), userId, verifiedEmail, id(req, "leadId"));
    res.json(lead);
  }));

  app.get("/api/workspaces/:id/members", ...auth, handle(async (req, res) => {
    const { userId, verifiedEmail } = actor(req);
    res.json(await listWorkspaceMembers(id(req), userId, verifiedEmail));
  }));

  app.post("/api/workspaces/:id/invitations", ...auth, inviteLimiter, handle(async (req, res) => {
    const { userId, verifiedEmail } = actor(req);
    const { email } = inviteWorkspaceMemberSchema.parse(req.body);
    const workspaceId = id(req);
    const workspace = await getWorkspaceAccess(workspaceId, userId, verifiedEmail, { ownerOnly: true });
    const member = await inviteWorkspaceMember(workspaceId, userId, verifiedEmail, email);
    let emailSent = false;
    try {
      emailSent = await sendWorkspaceInviteEmail(email, workspace.name, req.user!.displayName || req.user!.username);
    } catch (error) {
      console.error("[Workspace] Invitation email failed:", error instanceof Error ? error.name : "unknown");
    }
    // The invitation survives SMTP failure and can be accepted after login.
    res.status(201).json({ member, emailSent });
  }));

  app.delete("/api/workspaces/:id/members/:memberId", ...auth, handle(async (req, res) => {
    const { userId, verifiedEmail } = actor(req);
    await removeWorkspaceMember(id(req), id(req, "memberId"), userId, verifiedEmail);
    res.status(204).send();
  }));

  app.get("/api/workspace-invitations", ...auth, handle(async (req, res) => {
    const { userId, verifiedEmail } = actor(req);
    res.json(await listWorkspaceInvitations(userId, verifiedEmail));
  }));

  app.post("/api/workspace-invitations/:id/accept", ...auth, handle(async (req, res) => {
    const { userId, verifiedEmail } = actor(req);
    acceptWorkspaceInvitationSchema.parse(req.body ?? {});
    res.json(await acceptWorkspaceInvitation(id(req), userId, verifiedEmail));
  }));
}
