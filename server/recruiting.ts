import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import {
  funnels, leads, users, funnelRecruitingConfigs, recruitingMailRules,
  recruitingMailJobs, leadStageEvents,
  leadSchema, type User,
} from "@shared/schema";
import {
  DEFAULT_PIPELINE, pipelineStageSchema, renderRecruitingText,
  type PipelineStage, type RecruitingBoard, type RecruitingPipeline,
  type RecruitingMailRule, type MailRuleInput, type RecruitingHistoryEntry,
} from "@shared/recruiting-contract";
import { computeLockedLeadIds, maskLockedLeads } from "./lead-limits";
import { lockWorkspace, getWorkspaceFunnelAccess } from "./workspaces";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type LeadRow = typeof leads.$inferSelect;
export class RecruitingError extends Error {
  constructor(public status: number, message: string, public code = "RECRUITING_ERROR") { super(message); }
}
function pro(user: Pick<User, "isAdmin" | "isPro" | "trialEndsAt">): boolean {
  return user.isAdmin || user.isPro || !!(user.trialEndsAt && user.trialEndsAt.getTime() > Date.now());
}
export async function recruitingOwner(funnelId: number, ownerId: number) {
  const [row] = await db.select({ funnel: funnels, owner: users }).from(funnels)
    .innerJoin(users, eq(users.id, funnels.userId))
    .where(and(eq(funnels.id, funnelId), eq(funnels.userId, ownerId), sql`${funnels.deletedAt} IS NULL`, sql`${users.deletedAt} IS NULL`));
  if (!row) throw new RecruitingError(404, "Funnel nicht gefunden");
  return row;
}
export function requireRecruitingPro(owner: User) {
  if (!owner.emailVerifiedAt) throw new RecruitingError(403, "Bitte bestätige zuerst deine E-Mail-Adresse", "EMAIL_UNVERIFIED");
  if (!pro(owner)) throw new RecruitingError(403, "Diese Funktion ist im Pro-Plan verfügbar", "PRO_REQUIRED");
}
async function pipelineFor(tx: Tx | typeof db, funnelId: number): Promise<RecruitingPipeline> {
  const [config] = await tx.select().from(funnelRecruitingConfigs).where(eq(funnelRecruitingConfigs.funnelId, funnelId));
  return { funnelId, version: config?.version ?? 0, stages: config ? pipelineStageSchema.array().parse(config.stages) : DEFAULT_PIPELINE };
}
export async function getRecruitingBoard(funnelId: number, ownerId: number, canConfigure: boolean): Promise<RecruitingBoard> {
  const { funnel, owner } = await recruitingOwner(funnelId, ownerId);
  const rows = await db.select().from(leads).where(and(eq(leads.funnelId, funnelId), eq(leads.userId, ownerId))).orderBy(desc(leads.createdAt));
  const mapped = rows.map(row => ({ ...leadSchema.parse({ ...row, funnelName: funnel.name }), stageId: row.stageId ?? row.status, stageVersion: row.stageVersion }));
  const all = pro(owner) ? [] : await db.select({ id: leads.id, createdAt: leads.createdAt }).from(leads).where(eq(leads.userId, ownerId));
  return {
    funnel: { id: funnel.id, name: funnel.name }, pipeline: await pipelineFor(db, funnelId),
    leads: pro(owner) ? mapped : maskLockedLeads(mapped, computeLockedLeadIds(all)),
    canConfigure: canConfigure && pro(owner) && !!owner.emailVerifiedAt,
    canChangeStatus: !!owner.emailVerifiedAt,
  };
}
async function lockFunnel(tx: Tx, funnelId: number, ownerId: number) {
  const [funnel] = await tx.select().from(funnels)
    .where(and(eq(funnels.id, funnelId), eq(funnels.userId, ownerId), sql`${funnels.deletedAt} IS NULL`)).for("update");
  if (!funnel) throw new RecruitingError(404, "Funnel nicht gefunden");
  return funnel;
}

/** Muss innerhalb derselben Transaktion wie Lead-Erstellung/Statuswechsel laufen. */
export async function queueRecruitingEmails(tx: Tx, lead: LeadRow, trigger: "created" | "stage_entered") {
  if (!lead.email || !lead.email.includes("@")) return;
  const [owner] = await tx.select().from(users).where(eq(users.id, lead.userId));
  if (!owner || owner.deletedAt || !owner.emailVerifiedAt || !pro(owner)) return;
  const [funnel] = await tx.select().from(funnels).where(and(eq(funnels.id, lead.funnelId), eq(funnels.userId, owner.id), sql`${funnels.deletedAt} IS NULL`));
  if (!funnel) return;
  const target = trigger === "created" ? null : lead.stageId ?? lead.status;
  const rules = await tx.select().from(recruitingMailRules).where(and(
    eq(recruitingMailRules.funnelId, funnel.id), eq(recruitingMailRules.enabled, true),
    eq(recruitingMailRules.trigger, trigger),
    target === null ? sql`${recruitingMailRules.stageId} IS NULL` : eq(recruitingMailRules.stageId, target),
  ));
  for (const rule of rules) {
    const values = { name: lead.name, company: lead.company, funnel: funnel.name };
    await tx.insert(recruitingMailJobs).values({
      leadId: lead.id, ruleId: rule.id, ownerId: owner.id, stageId: target,
      recipient: lead.email, replyTo: owner.email, senderName: rule.senderName,
      subject: renderRecruitingText(rule.subject, values).replace(/[\r\n]/g, " "),
      body: renderRecruitingText(rule.body, values),
    }).onConflictDoNothing();
  }
}

export async function updateRecruitingPipeline(funnelId: number, ownerId: number, expectedVersion: number, stages: PipelineStage[]) {
  const { owner } = await recruitingOwner(funnelId, ownerId);
  requireRecruitingPro(owner);
  return db.transaction(async tx => {
    await lockFunnel(tx, funnelId, ownerId);
    const current = await pipelineFor(tx, funnelId);
    if (current.version !== expectedVersion) throw new RecruitingError(409, "Die Spalten wurden inzwischen geändert. Bitte neu laden.", "VERSION_CONFLICT");
    const ids = new Set(stages.map(s => s.id));
    const occupied = await tx.select({ stageId: leads.stageId, status: leads.status }).from(leads).where(eq(leads.funnelId, funnelId));
    if (occupied.some(row => !ids.has(row.stageId ?? row.status))) throw new RecruitingError(409, "Diese Spalte enthält noch Bewerber. Verschiebe sie zuerst.");
    const rules = await tx.select({ stageId: recruitingMailRules.stageId }).from(recruitingMailRules).where(eq(recruitingMailRules.funnelId, funnelId));
    if (rules.some(rule => rule.stageId && !ids.has(rule.stageId))) throw new RecruitingError(409, "Für diese Spalte ist eine Mailregel gespeichert. Behalte die Spalte bei.");
    const next = current.version + 1;
    await tx.insert(funnelRecruitingConfigs).values({ funnelId, stages, version: next })
      .onConflictDoUpdate({ target: funnelRecruitingConfigs.funnelId, set: { stages, version: next, updatedAt: new Date() } });
    return { funnelId, stages, version: next };
  });
}

export interface ChangeStageOptions { leadId: number; ownerId: number; actorId: number; stageId: string; expectedVersion: number; workspaceId?: number }
export async function changeRecruitingStage(options: ChangeStageOptions) {
  return db.transaction(async tx => {
    // Wie Freigabeentzug zuerst den Workspace sperren; anschließend Lead vor
    // Funnel wie bei der bestehenden Lead-Löschung (keine inverse Sperrfolge).
    if (options.workspaceId !== undefined) await lockWorkspace(options.workspaceId, tx);
    const [initial] = await tx.select().from(leads).where(and(eq(leads.id, options.leadId), eq(leads.userId, options.ownerId)));
    if (!initial) throw new RecruitingError(404, "Bewerbung nicht gefunden");
    if (options.workspaceId !== undefined) {
      const [actor] = await tx.select().from(users).where(eq(users.id, options.actorId));
      const access = await getWorkspaceFunnelAccess(options.workspaceId, initial.funnelId, options.actorId, actor?.emailVerifiedAt ? actor.email : null, tx);
      if (access.ownerId !== options.ownerId) throw new RecruitingError(404, "Bewerbung nicht gefunden");
    } else if (options.actorId !== options.ownerId) throw new RecruitingError(404, "Bewerbung nicht gefunden");
    const [lead] = await tx.select().from(leads).where(and(eq(leads.id, initial.id), eq(leads.userId, options.ownerId))).for("update");
    if (!lead) throw new RecruitingError(404, "Bewerbung nicht gefunden");
    const funnel = await lockFunnel(tx, lead.funnelId, options.ownerId);
    const [owner] = await tx.select().from(users).where(eq(users.id, options.ownerId));
    if (!owner || owner.deletedAt || !owner.emailVerifiedAt) throw new RecruitingError(403, "E-Mail-Bestätigung erforderlich");
    if (options.workspaceId !== undefined) requireRecruitingPro(owner);
    if (!pro(owner)) {
      const all = await tx.select({ id: leads.id, createdAt: leads.createdAt }).from(leads).where(eq(leads.userId, owner.id));
      if (computeLockedLeadIds(all).has(initial.id)) throw new RecruitingError(403, "Diese Bewerbung ist im Free-Plan gesperrt");
    }
    if (lead.stageVersion !== options.expectedVersion) throw new RecruitingError(409, "Der Status wurde inzwischen geändert. Bitte neu laden.", "VERSION_CONFLICT");
    const pipeline = await pipelineFor(tx, funnel.id);
    const target = pipeline.stages.find(s => s.id === options.stageId);
    if (!target) throw new RecruitingError(400, "Unbekannte Statusspalte");
    const previous = lead.stageId ?? lead.status;
    if (previous === target.id) return leadSchema.parse({ ...lead, funnelName: funnel.name });
    const [updated] = await tx.update(leads).set({ stageId: target.id, status: target.legacyStatus, stageVersion: lead.stageVersion + 1 }).where(eq(leads.id, lead.id)).returning();
    await tx.insert(leadStageEvents).values({ leadId: lead.id, actorId: options.actorId, fromStageId: previous, toStageId: target.id, version: updated.stageVersion });
    // Noch nicht versandte Nachrichten eines verlassenen Status sofort verwerfen.
    await tx.update(recruitingMailJobs).set({ status: "cancelled", errorCode: "STATUS_CHANGED" }).where(and(eq(recruitingMailJobs.leadId, lead.id), eq(recruitingMailJobs.status, "pending"), sql`${recruitingMailJobs.stageId} IS NOT NULL`, sql`${recruitingMailJobs.stageId} <> ${target.id}`));
    await queueRecruitingEmails(tx, updated, "stage_entered");
    return leadSchema.parse({ ...updated, funnelName: funnel.name });
  });
}

function toRule(row: typeof recruitingMailRules.$inferSelect): RecruitingMailRule {
  return { id: row.id, funnelId: row.funnelId, ruleKey: row.ruleKey, version: row.version, trigger: row.trigger as RecruitingMailRule["trigger"], stageId: row.stageId, subject: row.subject, body: row.body, senderName: row.senderName, enabled: row.enabled };
}
export async function getRecruitingRules(funnelId: number, ownerId: number) {
  const { owner } = await recruitingOwner(funnelId, ownerId); requireRecruitingPro(owner);
  const rows = await db.select().from(recruitingMailRules).where(eq(recruitingMailRules.funnelId, funnelId));
  return { rules: rows.map(toRule), replyTo: owner.email };
}
export async function saveRecruitingRule(funnelId: number, ownerId: number, input: MailRuleInput) {
  const { owner } = await recruitingOwner(funnelId, ownerId); requireRecruitingPro(owner);
  return db.transaction(async tx => {
    await lockFunnel(tx, funnelId, ownerId);
    if (input.stageId && !(await pipelineFor(tx, funnelId)).stages.some(s => s.id === input.stageId)) throw new RecruitingError(400, "Unbekannte Statusspalte");
    const ruleKey = input.trigger === "created" ? "created" : `stage:${input.stageId}`;
    const [existing] = await tx.select().from(recruitingMailRules).where(and(eq(recruitingMailRules.funnelId, funnelId), eq(recruitingMailRules.ruleKey, ruleKey)));
    if ((existing?.version ?? 0) !== input.expectedVersion) throw new RecruitingError(409, "Die Mailregel wurde inzwischen geändert.", "VERSION_CONFLICT");
    const { expectedVersion: _, ...fields } = input;
    const [row] = await tx.insert(recruitingMailRules).values({ funnelId, ruleKey, ...fields, version: (existing?.version ?? 0) + 1 })
      .onConflictDoUpdate({ target: [recruitingMailRules.funnelId, recruitingMailRules.ruleKey], set: { ...fields, version: (existing?.version ?? 0) + 1, updatedAt: new Date() } }).returning();
    if (!row.enabled) await tx.update(recruitingMailJobs).set({ status: "cancelled", errorCode: "RULE_DISABLED" }).where(and(eq(recruitingMailJobs.ruleId, row.id), eq(recruitingMailJobs.status, "pending")));
    return toRule(row);
  });
}
export async function getRecruitingHistory(leadId: number, ownerId: number): Promise<RecruitingHistoryEntry[]> {
  const [lead] = await db.select().from(leads).where(and(eq(leads.id, leadId), eq(leads.userId, ownerId)));
  if (!lead) throw new RecruitingError(404, "Bewerbung nicht gefunden");
  const { owner } = await recruitingOwner(lead.funnelId, ownerId);
  if (!pro(owner)) {
    const all = await db.select({ id: leads.id, createdAt: leads.createdAt }).from(leads).where(eq(leads.userId, ownerId));
    if (computeLockedLeadIds(all).has(lead.id)) throw new RecruitingError(403, "Diese Bewerbung ist im Free-Plan gesperrt");
  }
  const events = await db.select({ event: leadStageEvents, actorName: users.displayName }).from(leadStageEvents).leftJoin(users, eq(users.id, leadStageEvents.actorId)).where(eq(leadStageEvents.leadId, leadId));
  const jobs = await db.select().from(recruitingMailJobs).where(eq(recruitingMailJobs.leadId, leadId));
  const history: RecruitingHistoryEntry[] = [
    ...events.map(({ event, actorName }) => ({ id: event.id, kind: "stage" as const, createdAt: event.createdAt.toISOString(), fromStageId: event.fromStageId, toStageId: event.toStageId, actorName })),
    ...jobs.map(job => ({ id: job.id, kind: "email" as const, createdAt: job.createdAt.toISOString(), subject: job.subject, status: job.status as RecruitingHistoryEntry["status"], attempts: job.attempts, errorCode: job.errorCode })),
  ];
  return history.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
}
