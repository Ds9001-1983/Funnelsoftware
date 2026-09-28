import { and, desc, eq, inArray, isNotNull, isNull, or, sql } from "drizzle-orm";
import {
  funnels, leads, leadSchema, users, workspaces, workspaceMembers, workspaceFunnels,
} from "@shared/schema";
import type {
  WorkspaceFunnel, WorkspaceInvitation, WorkspaceLead, WorkspaceMember, WorkspaceRole, WorkspaceSummary,
} from "@shared/workspace-contract";
import { db } from "./db";
import { getUserPlan } from "./auth";

type Executor = Pick<typeof db, "select" | "insert" | "update" | "delete">;
type WorkspaceRow = typeof workspaces.$inferSelect;
type MemberRow = typeof workspaceMembers.$inferSelect;

export class WorkspaceError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
    this.name = "WorkspaceError";
  }
}

export interface WorkspaceAccess extends WorkspaceSummary {
  userId: number;
}

const missing = () => new WorkspaceError(404, "Kundenbereich oder Ressource nicht gefunden");
const unverified = () => new WorkspaceError(403, "Bitte bestätige zuerst deine E-Mail-Adresse.", "EMAIL_NOT_VERIFIED");

async function verifiedUser(userId: number, verifiedEmail: string | null, executor: Executor) {
  const [user] = await executor.select({
    id: users.id, email: users.email, emailVerifiedAt: users.emailVerifiedAt,
    isAdmin: users.isAdmin, isPro: users.isPro, trialEndsAt: users.trialEndsAt,
  }).from(users).where(and(eq(users.id, userId), isNull(users.deletedAt)));
  if (!user) throw new WorkspaceError(401, "Nicht autorisiert");
  // Recheck the live account, including after changing the email address.
  if (!user.emailVerifiedAt || !verifiedEmail || user.email.toLowerCase() !== verifiedEmail.toLowerCase()) {
    throw unverified();
  }
  return user;
}

function summary(workspace: WorkspaceRow, role: WorkspaceRole, owner: Parameters<typeof getUserPlan>[0]): WorkspaceSummary {
  const ownerPlan = getUserPlan(owner);
  const paused = ownerPlan === "free";
  return {
    id: workspace.id, name: workspace.name, ownerId: workspace.ownerId,
    role, ownerPlan, paused,
    canManage: role === "owner" && !paused,
    canChangeStatus: !paused,
    createdAt: workspace.createdAt.toISOString(), updatedAt: workspace.updatedAt.toISOString(),
  };
}

/**
 * A shared authorization boundary for every workspace resource route.
 * `verifiedEmail` must be the authenticated account email, never request input.
 * Owner identity and plan are fetched afresh; a client's own plan is irrelevant.
 */
export async function getWorkspaceAccess(
  workspaceId: number,
  userId: number,
  verifiedEmail: string | null,
  options: { ownerOnly?: boolean; requirePro?: boolean } = {},
  executor: Executor = db,
): Promise<WorkspaceAccess> {
  await verifiedUser(userId, verifiedEmail, executor);
  const [row] = await executor.select({
    workspace: workspaces,
    owner: { isAdmin: users.isAdmin, isPro: users.isPro, trialEndsAt: users.trialEndsAt },
  }).from(workspaces).innerJoin(users, eq(users.id, workspaces.ownerId))
    .where(and(eq(workspaces.id, workspaceId), isNull(users.deletedAt)));
  if (!row) throw missing();
  let role: WorkspaceRole = "owner";
  if (row.workspace.ownerId !== userId) {
    if (options.ownerOnly) throw missing();
    const [membership] = await executor.select({ id: workspaceMembers.id }).from(workspaceMembers).where(and(
      eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId),
      eq(workspaceMembers.role, "client"), isNotNull(workspaceMembers.acceptedAt),
    ));
    if (!membership) throw missing();
    role = "client";
  }
  const result = { ...summary(row.workspace, role, row.owner), userId };
  if (options.requirePro !== false && result.paused) {
    throw new WorkspaceError(403,
      role === "owner" ? "Kundenbereiche sind im Pro-Plan enthalten." : "Dieser Kundenbereich ist pausiert. Bitte kontaktiere die Agentur.",
      role === "owner" ? "PRO_REQUIRED" : "WORKSPACE_PAUSED");
  }
  return result;
}

export const requireWorkspaceAccess = getWorkspaceAccess;

export async function listWorkspaces(userId: number, verifiedEmail: string | null): Promise<WorkspaceSummary[]> {
  await verifiedUser(userId, verifiedEmail, db);
  const rows = await db.select({
    workspace: workspaces,
    owner: { isAdmin: users.isAdmin, isPro: users.isPro, trialEndsAt: users.trialEndsAt },
  }).from(workspaces).innerJoin(users, eq(users.id, workspaces.ownerId)).where(and(
    isNull(users.deletedAt),
    or(eq(workspaces.ownerId, userId), sql`EXISTS (
      SELECT 1 FROM ${workspaceMembers}
      WHERE ${workspaceMembers.workspaceId} = ${workspaces.id}
        AND ${workspaceMembers.userId} = ${userId}
        AND ${workspaceMembers.role} = 'client'
        AND ${workspaceMembers.acceptedAt} IS NOT NULL
    )`),
  )).orderBy(desc(workspaces.createdAt));
  return rows.map((row) => summary(row.workspace, row.workspace.ownerId === userId ? "owner" : "client", row.owner));
}

export async function createWorkspace(userId: number, verifiedEmail: string | null, name: string): Promise<WorkspaceSummary> {
  const user = await verifiedUser(userId, verifiedEmail, db);
  if (getUserPlan(user) === "free") throw new WorkspaceError(403, "Kundenbereiche sind im Pro-Plan enthalten.", "PRO_REQUIRED");
  const [workspace] = await db.insert(workspaces).values({ ownerId: userId, name }).returning();
  return summary(workspace, "owner", user);
}

export async function lockWorkspace(workspaceId: number, executor: Executor) {
  await executor.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.id, workspaceId)).for("update");
}

export async function renameWorkspace(workspaceId: number, userId: number, verifiedEmail: string | null, name: string) {
  return db.transaction(async (tx) => {
    await lockWorkspace(workspaceId, tx);
    const access = await getWorkspaceAccess(workspaceId, userId, verifiedEmail, { ownerOnly: true }, tx);
    const [updated] = await tx.update(workspaces).set({ name, updatedAt: new Date() })
      .where(eq(workspaces.id, workspaceId)).returning();
    return { ...access, name: updated.name, updatedAt: updated.updatedAt.toISOString() };
  });
}

export async function deleteWorkspace(workspaceId: number, userId: number, verifiedEmail: string | null) {
  await db.transaction(async (tx) => {
    await lockWorkspace(workspaceId, tx);
    await getWorkspaceAccess(workspaceId, userId, verifiedEmail, { ownerOnly: true, requirePro: false }, tx);
    await tx.delete(workspaces).where(eq(workspaces.id, workspaceId));
  });
}

function scopedFunnelCondition(workspaceId: number, ownerId: number) {
  return and(eq(workspaceFunnels.workspaceId, workspaceId), eq(funnels.userId, ownerId), isNull(funnels.deletedAt));
}

export async function getWorkspaceFunnels(workspaceId: number, userId: number, verifiedEmail: string | null): Promise<WorkspaceFunnel[]> {
  const access = await getWorkspaceAccess(workspaceId, userId, verifiedEmail);
  const rows = await db.select({ id: funnels.id, name: funnels.name, status: funnels.status })
    .from(workspaceFunnels).innerJoin(funnels, eq(funnels.id, workspaceFunnels.funnelId))
    .where(scopedFunnelCondition(workspaceId, access.ownerId)).orderBy(funnels.name);
  return rows.map((row) => ({ ...row, status: row.status as WorkspaceFunnel["status"] }));
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if ("code" in error && error.code === "23505") return true;
  return "cause" in error && error.cause !== error && isUniqueViolation(error.cause);
}

export async function assignWorkspaceFunnels(workspaceId: number, userId: number, verifiedEmail: string | null, funnelIds: number[]) {
  try {
    await db.transaction(async (tx) => {
      await lockWorkspace(workspaceId, tx);
      const access = await getWorkspaceAccess(workspaceId, userId, verifiedEmail, { ownerOnly: true, requirePro: false }, tx);
      const current = await tx.select({ funnelId: workspaceFunnels.funnelId }).from(workspaceFunnels)
        .where(eq(workspaceFunnels.workspaceId, workspaceId));
      const currentIds = new Set(current.map((row) => row.funnelId));
      // Revoking existing assignments remains possible after an agency downgrade.
      if (access.paused && funnelIds.some((id) => !currentIds.has(id))) {
        throw new WorkspaceError(403, "Neue Freigaben sind im Pro-Plan enthalten.", "PRO_REQUIRED");
      }
      if (funnelIds.length) {
        const owned = await tx.select({ id: funnels.id }).from(funnels).where(and(
          inArray(funnels.id, funnelIds), eq(funnels.userId, access.ownerId), isNull(funnels.deletedAt),
        )).for("update");
        if (owned.length !== funnelIds.length) throw missing();
        const assigned = await tx.select({ workspaceId: workspaceFunnels.workspaceId }).from(workspaceFunnels)
          .where(inArray(workspaceFunnels.funnelId, funnelIds));
        if (assigned.some((row) => row.workspaceId !== workspaceId)) {
          throw new WorkspaceError(409, "Ein Funnel ist bereits einem anderen Kundenbereich zugeordnet.");
        }
      }
      await tx.delete(workspaceFunnels).where(eq(workspaceFunnels.workspaceId, workspaceId));
      if (funnelIds.length) await tx.insert(workspaceFunnels).values(funnelIds.map((funnelId) => ({ workspaceId, funnelId })));
      await tx.update(workspaces).set({ updatedAt: new Date() }).where(eq(workspaces.id, workspaceId));
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new WorkspaceError(409, "Ein Funnel wurde inzwischen einem anderen Kundenbereich zugeordnet.");
    throw error;
  }
}

/** Never delegate to owner-wide getLeads: scope resource ownership in SQL. */
export async function getWorkspaceLeads(workspaceId: number, userId: number, verifiedEmail: string | null, leadId?: number, executor: Executor = db): Promise<WorkspaceLead[]> {
  const access = await getWorkspaceAccess(workspaceId, userId, verifiedEmail, {}, executor);
  const rows = await executor.select({ lead: leads, funnelName: funnels.name }).from(workspaceFunnels)
    .innerJoin(funnels, eq(funnels.id, workspaceFunnels.funnelId))
    .innerJoin(leads, eq(leads.funnelId, funnels.id))
    .where(and(scopedFunnelCondition(workspaceId, access.ownerId), eq(leads.userId, access.ownerId),
      leadId === undefined ? undefined : eq(leads.id, leadId)))
    .orderBy(desc(leads.createdAt));
  if (leadId !== undefined && !rows.length) throw missing();
  return rows.map(({ lead, funnelName }) => leadSchema.parse({
    ...lead, funnelName, createdAt: lead.createdAt.toISOString(), consentAt: lead.consentAt?.toISOString() ?? null,
  }));
}

/** Reuse for board/config access without ever disclosing the editor's Funnel DTO. */
export async function getWorkspaceFunnelAccess(workspaceId: number, funnelId: number, userId: number, verifiedEmail: string | null, executor: Executor = db) {
  const access = await getWorkspaceAccess(workspaceId, userId, verifiedEmail, {}, executor);
  const [funnel] = await executor.select({ id: funnels.id }).from(workspaceFunnels)
    .innerJoin(funnels, eq(funnels.id, workspaceFunnels.funnelId))
    .where(and(scopedFunnelCondition(workspaceId, access.ownerId), eq(funnels.id, funnelId)));
  if (!funnel) throw missing();
  return access;
}

function memberDto(member: MemberRow, displayName: string | null = null): WorkspaceMember {
  return {
    id: member.id, workspaceId: member.workspaceId, userId: member.userId,
    invitedEmail: member.invitedEmail, role: "client", acceptedAt: member.acceptedAt?.toISOString() ?? null,
    createdAt: member.createdAt.toISOString(), displayName,
  };
}

export async function listWorkspaceMembers(workspaceId: number, userId: number, verifiedEmail: string | null): Promise<WorkspaceMember[]> {
  await getWorkspaceAccess(workspaceId, userId, verifiedEmail, { ownerOnly: true, requirePro: false });
  const rows = await db.select({ member: workspaceMembers, displayName: users.displayName }).from(workspaceMembers)
    .leftJoin(users, eq(users.id, workspaceMembers.userId)).where(eq(workspaceMembers.workspaceId, workspaceId))
    .orderBy(workspaceMembers.createdAt);
  return rows.map((row) => memberDto(row.member, row.displayName));
}

export async function inviteWorkspaceMember(workspaceId: number, userId: number, verifiedEmail: string | null, email: string): Promise<WorkspaceMember> {
  try {
    return await db.transaction(async (tx) => {
      await lockWorkspace(workspaceId, tx);
      await getWorkspaceAccess(workspaceId, userId, verifiedEmail, { ownerOnly: true }, tx);
      const normalized = email.trim().toLowerCase();
      if (normalized === verifiedEmail?.toLowerCase()) throw new WorkspaceError(400, "Du besitzt diesen Kundenbereich bereits.");
      const [member] = await tx.insert(workspaceMembers).values({
        workspaceId, invitedEmail: normalized, role: "client", userId: null, acceptedAt: null,
      }).returning();
      return memberDto(member);
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new WorkspaceError(409, "Diese Person ist bereits eingeladen oder Mitglied.");
    throw error;
  }
}

export async function removeWorkspaceMember(workspaceId: number, memberId: number, userId: number, verifiedEmail: string | null) {
  await db.transaction(async (tx) => {
    await lockWorkspace(workspaceId, tx);
    await getWorkspaceAccess(workspaceId, userId, verifiedEmail, { ownerOnly: true, requirePro: false }, tx);
    const deleted = await tx.delete(workspaceMembers).where(and(
      eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.id, memberId),
    )).returning({ id: workspaceMembers.id });
    if (!deleted.length) throw missing();
  });
}

export async function listWorkspaceInvitations(userId: number, verifiedEmail: string | null): Promise<WorkspaceInvitation[]> {
  const user = await verifiedUser(userId, verifiedEmail, db);
  const rows = await db.select({
    id: workspaceMembers.id, workspaceId: workspaceMembers.workspaceId, workspaceName: workspaces.name,
    invitedEmail: workspaceMembers.invitedEmail, createdAt: workspaceMembers.createdAt,
  }).from(workspaceMembers).innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .innerJoin(users, eq(users.id, workspaces.ownerId)).where(and(
      eq(workspaceMembers.invitedEmail, user.email.toLowerCase()), isNull(workspaceMembers.userId),
      isNull(workspaceMembers.acceptedAt), isNull(users.deletedAt),
    )).orderBy(desc(workspaceMembers.createdAt));
  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

export async function acceptWorkspaceInvitation(invitationId: number, userId: number, verifiedEmail: string | null): Promise<WorkspaceSummary> {
  try {
    return await db.transaction(async (tx) => {
      const user = await verifiedUser(userId, verifiedEmail, tx);
      const [invitation] = await tx.select().from(workspaceMembers).where(and(
        eq(workspaceMembers.id, invitationId), eq(workspaceMembers.invitedEmail, user.email.toLowerCase()),
      ));
      if (!invitation || (invitation.userId !== null && invitation.userId !== userId)) throw missing();
      await lockWorkspace(invitation.workspaceId, tx);
      // Owner revocation and acceptance use the same workspace lock.
      const [accepted] = await tx.update(workspaceMembers).set({ userId, acceptedAt: new Date() }).where(and(
        eq(workspaceMembers.id, invitationId), eq(workspaceMembers.invitedEmail, user.email.toLowerCase()),
        or(isNull(workspaceMembers.userId), eq(workspaceMembers.userId, userId)),
      )).returning();
      if (!accepted) throw missing();
      const { userId: _actorId, ...workspace } = await getWorkspaceAccess(
        invitation.workspaceId, userId, verifiedEmail, { requirePro: false }, tx,
      );
      return workspace;
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new WorkspaceError(409, "Du bist bereits Mitglied dieses Kundenbereichs.");
    throw error;
  }
}
