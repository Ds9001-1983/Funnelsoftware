import { z } from "zod";

export const analyticsRetentionDraftSchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  days: z.number().int().min(1).max(36500),
  purpose: z.string().trim().min(3).max(1000),
}).strict();
export type AnalyticsRetentionDraftInput = z.infer<typeof analyticsRetentionDraftSchema>;
export interface AnalyticsRetentionPreview {
  draft: { version: number; days: number; purpose: string } | null;
  automaticDeletion: boolean;
  backupReady: boolean;
  previewToken: string;
  asOf: string;
  cutoff: string | null;
  total: number;
  counts: { due: number; waiting: number; unknown: number; committed: number };
  eventTypes: { eventType: string; total: number; due: number; committed: number }[];
}
