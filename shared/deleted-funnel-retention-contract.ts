import { z } from "zod";
export const deletedFunnelRetentionSchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  days: z.number().int().min(1).max(36500),
  purpose: z.string().trim().min(3).max(1000),
}).strict();
export type DeletedFunnelRetentionInput = z.infer<typeof deletedFunnelRetentionSchema>;
export const DELETED_FUNNEL_STATES = ["due", "waiting", "blocked", "unknown", "committed"] as const;
export type DeletedFunnelState = typeof DELETED_FUNNEL_STATES[number];
export interface DeletedFunnelRetentionPreview {
  draft: { version: number; days: number; purpose: string } | null;
  automaticDeletion: boolean;
  backupReady: boolean;
  previewToken: string;
  asOf: string;
  total: number;
  page: number;
  pageSize: number;
  counts: Record<DeletedFunnelState, number>;
  items: { id: number; name: string; deletedAt: string; state: DeletedFunnelState; leads: number; domains: number }[];
}
