import { z } from "zod";
import type { Lead } from "./schema";

export const legacyLeadStatusSchema = z.enum(["new", "contacted", "qualified", "converted", "lost"]);
export const stageIdSchema = z.string().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/);
export const pipelineStageSchema = z.object({
  id: stageIdSchema,
  name: z.string().trim().min(1).max(60),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  legacyStatus: legacyLeadStatusSchema,
}).strict();
export type PipelineStage = z.infer<typeof pipelineStageSchema>;
export const DEFAULT_PIPELINE: PipelineStage[] = [
  { id: "new", name: "Neu", color: "#3b82f6", legacyStatus: "new" },
  { id: "contacted", name: "Kontaktiert", color: "#eab308", legacyStatus: "contacted" },
  { id: "qualified", name: "Qualifiziert", color: "#a855f7", legacyStatus: "qualified" },
  { id: "converted", name: "Konvertiert", color: "#10b981", legacyStatus: "converted" },
  { id: "lost", name: "Verloren", color: "#9ca3af", legacyStatus: "lost" },
];
export const pipelineUpdateSchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  stages: z.array(pipelineStageSchema).min(2).max(20)
    .refine(stages => new Set(stages.map(s => s.id)).size === stages.length, "Status-IDs müssen eindeutig sein")
    .refine(stages => stages[0]?.id === "new" && stages[0]?.legacyStatus === "new", "Die erste Stufe muss Neu bleiben"),
}).strict();
export interface RecruitingPipeline { funnelId: number; version: number; stages: PipelineStage[] }
export const changeStageSchema = z.object({
  stageId: stageIdSchema,
  expectedVersion: z.number().int().nonnegative(),
}).strict();
export type RecruitingLead = Lead & { stageId: string; stageVersion: number; locked?: boolean };
export interface RecruitingBoard {
  funnel: { id: number; name: string };
  pipeline: RecruitingPipeline;
  leads: RecruitingLead[];
  canConfigure: boolean;
  canChangeStatus: boolean;
}
const headerText = (max: number) => z.string().trim().min(1).max(max).refine(v => !/[\r\n]/.test(v), "Zeilenumbrüche sind hier nicht erlaubt");
export const mailRuleInputSchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  trigger: z.enum(["created", "stage_entered"]),
  stageId: stageIdSchema.nullable(),
  subject: headerText(160),
  body: z.string().trim().min(1).max(10000),
  senderName: headerText(80),
  enabled: z.boolean(),
}).strict().refine(v => v.trigger === "created" ? v.stageId === null : v.stageId !== null, "Bitte eine passende Zielstufe wählen");
export type MailRuleInput = z.infer<typeof mailRuleInputSchema>;
export interface RecruitingMailRule extends Omit<MailRuleInput, "expectedVersion"> {
  id: number; funnelId: number; version: number; ruleKey: string;
}
export const MAIL_JOB_STATUSES = ["pending", "processing", "sent", "failed", "uncertain", "cancelled"] as const;
export type MailJobStatus = typeof MAIL_JOB_STATUSES[number];
export interface RecruitingHistoryEntry {
  id: number; kind: "stage" | "email"; createdAt: string;
  fromStageId?: string | null; toStageId?: string; actorName?: string | null;
  subject?: string; status?: MailJobStatus; attempts?: number; errorCode?: string | null;
}

/** Nur bekannte Variablen ersetzen, einmalig und als Text. */
export function renderRecruitingText(template: string, values: { name?: string | null; company?: string | null; funnel: string }): string {
  return template.replace(/\{\{\s*(name|company|funnel)\s*\}\}/g, (_match, key: "name" | "company" | "funnel") => {
    return (values[key] || (key === "name" ? "Interessent/in" : "")).slice(0, 200);
  });
}
