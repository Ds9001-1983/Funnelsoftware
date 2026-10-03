import { needsResponsiveDocument } from "./funnel-responsive";
import { z } from "zod";
import { funnelSchema, type Funnel } from "./schema";
import { needsRoutingDocument } from "./funnel-routing";
import { needsLayoutDocument, needsThemeOverrideDocument } from "./funnel-layout";
import { needsPersonalizationDocument } from "./funnel-personalization";

export const DOCUMENT_VERSION = 1; // Default writers stay on v1 until layout editing is enabled.
export const documentVersionSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]);
// Ausschließlich Inhalt und öffentliche Darstellung. Zugangsdaten, Eigentümer,
// Slug, Freigabestatus, Leads und Messwerte gehören niemals in eine Revision.
export const documentSchema = funnelSchema.pick({
  name: true, description: true, pages: true, theme: true, abTests: true,
  impressumUrl: true, datenschutzUrl: true, ogImageUrl: true,
}).extend({ version: documentVersionSchema }).strict();
export type FunnelDocument = z.infer<typeof documentSchema>;

/** PostgreSQL jsonb reorders object keys; only content and array order matter. */
export function contentKey(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) => item && typeof item === "object" && !Array.isArray(item)
    ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
    : item);
}

export function documentFromFunnel(funnel: Partial<Funnel>): FunnelDocument {
  return {
    version: documentVersionSchema.parse(Math.max(funnel.documentVersion ?? DOCUMENT_VERSION, requiredDocumentVersion(funnel))),
    name: funnel.name!, description: funnel.description ?? null,
    pages: structuredClone(funnel.pages ?? []), theme: structuredClone(funnel.theme!),
    abTests: structuredClone(funnel.abTests ?? []).map(test => ({
      ...test, variants: test.variants.map(variant => ({ ...variant, views: 0, conversions: 0 })),
    })),
    impressumUrl: funnel.impressumUrl ?? null, datenschutzUrl: funnel.datenschutzUrl ?? null,
    ogImageUrl: funnel.ogImageUrl ?? null,
  };
}

/** Layout editing requires an explicit server capability; future versions stay read-only. */
export function canEditFunnelDocument(funnel: Partial<Funnel>, layoutEditing = false, routingEditing = false, personalizationEditing = false, libraryEditing = false, responsiveEditing = false): boolean {
  const version = funnel.documentVersion ?? DOCUMENT_VERSION;
  return documentVersionSchema.safeParse(version).success && version <= (responsiveEditing ? 6 : libraryEditing ? 5 : personalizationEditing ? 4 : routingEditing ? 3 : layoutEditing ? 2 : 1)
    && (responsiveEditing || !needsResponsiveDocument(funnel.pages, funnel.abTests ?? []))
    && (responsiveEditing || libraryEditing || !needsThemeOverrideDocument(funnel.pages, funnel.abTests ?? []))
    && (responsiveEditing || libraryEditing || personalizationEditing || !needsPersonalizationDocument(funnel.pages, funnel.abTests ?? []))
    && (responsiveEditing || routingEditing || personalizationEditing || libraryEditing || !needsRoutingDocument(funnel.pages, funnel.abTests ?? []))
    && (responsiveEditing || layoutEditing || routingEditing || personalizationEditing || libraryEditing || !needsLayoutDocument(funnel.pages, funnel.theme, funnel.abTests));
}

export const writeControlSchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  documentVersion: documentVersionSchema,
  mutationId: z.string().uuid(),
  publish: z.boolean().optional(),
});
export type WriteControl = z.infer<typeof writeControlSchema>;
export interface FunnelRevisionSummary {
  id: number; version: number; action: string; name: string; createdAt: string; published: boolean;
}

export function requiredDocumentVersion(funnel: Partial<Funnel>): 1 | 2 | 3 | 4 | 5 | 6 {
  return needsResponsiveDocument(funnel.pages, funnel.abTests ?? []) ? 6 : needsThemeOverrideDocument(funnel.pages, funnel.abTests ?? []) ? 5 : needsPersonalizationDocument(funnel.pages, funnel.abTests ?? []) ? 4 : needsRoutingDocument(funnel.pages, funnel.abTests ?? []) ? 3 : needsLayoutDocument(funnel.pages, funnel.theme, funnel.abTests) ? 2 : 1;
}
