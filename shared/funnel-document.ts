import { z } from "zod";
import { funnelSchema, type Funnel } from "./schema";

export const DOCUMENT_VERSION = 1;
// Ausschließlich Inhalt und öffentliche Darstellung. Zugangsdaten, Eigentümer,
// Slug, Freigabestatus, Leads und Messwerte gehören niemals in eine Revision.
export const documentSchema = funnelSchema.pick({
  name: true, description: true, pages: true, theme: true, abTests: true,
  impressumUrl: true, datenschutzUrl: true, ogImageUrl: true,
}).extend({ version: z.literal(DOCUMENT_VERSION) }).strict();
export type FunnelDocument = z.infer<typeof documentSchema>;

export function documentFromFunnel(funnel: Partial<Funnel>): FunnelDocument {
  return {
    version: DOCUMENT_VERSION,
    name: funnel.name!, description: funnel.description ?? null,
    pages: structuredClone(funnel.pages ?? []), theme: structuredClone(funnel.theme!),
    abTests: structuredClone(funnel.abTests ?? []).map(test => ({
      ...test, variants: test.variants.map(variant => ({ ...variant, views: 0, conversions: 0 })),
    })),
    impressumUrl: funnel.impressumUrl ?? null, datenschutzUrl: funnel.datenschutzUrl ?? null,
    ogImageUrl: funnel.ogImageUrl ?? null,
  };
}

export const writeControlSchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  documentVersion: z.literal(DOCUMENT_VERSION),
  mutationId: z.string().uuid(),
  publish: z.boolean().optional(),
});
export type WriteControl = z.infer<typeof writeControlSchema>;
export interface FunnelRevisionSummary {
  id: number; version: number; action: string; name: string; createdAt: string; published: boolean;
}
