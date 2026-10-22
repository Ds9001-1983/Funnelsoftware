import { z } from "zod";

export const retentionDraftSchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  mode: z.enum(["general_leads", "closed_applications"]),
  days: z.number().int().min(1).max(36500),
  purpose: z.string().trim().min(3).max(1000),
}).strict();
export type RetentionDraftInput = z.infer<typeof retentionDraftSchema>;
export interface RetentionDraft extends Omit<RetentionDraftInput, "expectedVersion"> { version: number }
export const retentionExceptionSchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  exception: z.object({
    reason: z.string().trim().min(3).max(1000),
    reviewAt: z.string().datetime({ offset: true }),
  }).strict().nullable(),
}).strict();
export type RetentionExceptionInput = z.infer<typeof retentionExceptionSchema>;
export const RETENTION_STATES = ["due", "waiting", "open", "unknown", "excluded", "review"] as const;
export type RetentionState = typeof RETENTION_STATES[number];
export interface RetentionException { version: number; reason: string | null; reviewAt: string | null }
export interface RetentionPreview {
  draft: RetentionDraft | null;
  automaticDeletion: false;
  asOf: string;
  counts: Record<RetentionState, number>;
  total: number;
  page: number;
  pageSize: number;
  items: { id: number; state: RetentionState; dueAt: string | null; exception: RetentionException }[];
}

/** A terminal-to-terminal move must not restart an already running period.
 * Legacy terminal rows without evidence remain unknown until reopened/closed. */
export function nextClosedAt(previous: string, next: string, closedAt: Date | null, now: Date): Date | null {
  const terminal = (status: string) => status === "lost" || status === "converted";
  if (!terminal(next)) return null;
  return terminal(previous) ? closedAt : now;
}
