import { z } from "zod";
import type { Lead, PlanId } from "./schema";

export const workspaceIdSchema = z.number().int().positive();
export const workspaceNameSchema = z.string().trim().min(1, "Name ist erforderlich").max(100);
export const createWorkspaceSchema = z.object({ name: workspaceNameSchema }).strict();
export const updateWorkspaceSchema = createWorkspaceSchema;
export const assignWorkspaceFunnelsSchema = z.object({
  funnelIds: z.array(workspaceIdSchema).max(1000).refine(
    (ids) => new Set(ids).size === ids.length,
    "Ein Funnel darf nur einmal zugeordnet werden",
  ),
}).strict();
export const inviteWorkspaceMemberSchema = z.object({
  email: z.string().trim().email("Gültige E-Mail-Adresse erforderlich").max(254).transform((email) => email.toLowerCase()),
}).strict();
export const acceptWorkspaceInvitationSchema = z.object({}).strict();

export type WorkspaceRole = "owner" | "client";

export interface WorkspaceSummary {
  id: number;
  name: string;
  ownerId: number;
  role: WorkspaceRole;
  ownerPlan: PlanId;
  paused: boolean;
  canManage: boolean;
  canChangeStatus: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Deliberate allowlist: no editor data, tracking tokens or integration secrets. */
export interface WorkspaceFunnel {
  id: number;
  name: string;
  status: "draft" | "published" | "archived";
}

export interface WorkspaceMember {
  id: number;
  workspaceId: number;
  userId: number | null;
  invitedEmail: string;
  role: "client";
  acceptedAt: string | null;
  createdAt: string;
  displayName: string | null;
}

export interface WorkspaceInvitation {
  id: number;
  workspaceId: number;
  workspaceName: string;
  invitedEmail: string;
  createdAt: string;
}

export interface WorkspaceInviteResponse {
  member: WorkspaceMember;
  emailSent: boolean;
}

export type WorkspaceLead = Lead;
