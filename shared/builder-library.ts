import { z } from "zod";
import { funnelPageSchema, themeSchema, type Funnel, type FunnelPage, type PageElement, type Theme } from "./schema";
import { copyPages } from "./funnel-copy";
import { layoutErrors, resolveDesign } from "./funnel-layout";
import { requiredDocumentVersion } from "./funnel-document";
import { elementChoices, fieldLabel, responseTypes } from "./funnel-routing";

export const libraryNameSchema = z.string().trim().min(1).max(100);
export const libraryContentSchema = z.object({
  format: z.literal(1),
  documentVersion: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  page: funnelPageSchema,
  theme: themeSchema.omit({ source: true }),
  origin: z.object({
    funnelUuid: z.string().max(100),
    pages: z.array(z.object({ id: z.string().max(100), label: z.string().max(500) })).max(500),
    fields: z.array(z.object({ id: z.string().max(100), label: z.string().max(500), type: z.string().max(30), choices: z.array(z.object({ id: z.string().max(500), label: z.string().max(500) })).max(500) })).max(3000),
  }).strict(),
}).strict().superRefine((content, ctx) => {
  const error = layoutErrors(content.page)[0];
  if (error) ctx.addIssue({ code: "custom", message: error });
  if (content.page.sections?.length) ctx.addIssue({ code: "custom", message: "Ältere Abschnittsdaten zuerst ausdrücklich in ein aktuelles Layout übernehmen." });
  if (new Set(content.page.elements.map(element => element.id)).size !== content.page.elements.length) ctx.addIssue({ code: "custom", message: "Element-IDs müssen eindeutig sein." });
  if (JSON.stringify(content).length > 500_000) ctx.addIssue({ code: "custom", message: "Die Vorlage ist zu groß (maximal 500 KB Inhalt)." });
  if (content.documentVersion < requiredDocumentVersion({ pages: [content.page], theme: content.theme })) ctx.addIssue({ code: "custom", message: "Die Dokumentversion passt nicht zum Vorlageninhalt." });
});
export type LibraryContent = z.infer<typeof libraryContentSchema>;
export const createContentTemplateSchema = z.object({ name: libraryNameSchema, kind: z.enum(["page", "section"]), content: libraryContentSchema }).strict();
export const updateContentTemplateSchema = z.object({ name: libraryNameSchema.optional(), content: libraryContentSchema.optional(), archived: z.boolean().optional(), expectedVersion: z.number().int().positive() }).strict()
  .refine(input => input.name !== undefined || input.content !== undefined || input.archived !== undefined, "Eine Änderung fehlt.");
export interface ContentTemplate { id: number; name: string; kind: "page" | "section"; content: LibraryContent; version: number; archivedAt: string | null }
export interface MediaFolder { id: number; name: string; version: number }
export interface MediaAsset { id: number; name: string; originalName: string; url: string; mimeType: string; bytes: number; width: number; height: number; folderId: number | null; version: number; archivedAt: string | null }
export interface LibraryList<T> { items: T[]; nextCursor: number | null }

/** Only content and labels cross the library boundary, never funnel settings or answers. */
export function captureLibraryContent(funnel: Funnel, page: FunnelPage, sectionId?: string): LibraryContent {
  let source = structuredClone(page);
  const theme = structuredClone(page.themeOverride ?? funnel.theme);
  delete theme.source;
  if (sectionId) {
    const section = source.layout?.sections.find(section => section.id === sectionId);
    if (!section) throw new Error("Abschnitt nicht gefunden.");
    const ids = new Set(section.columns.flatMap(column => column.elementIds));
    source = { id: page.id, type: "question", title: section.name || "Abschnitt", elements: source.elements.filter(element => ids.has(element.id)), layout: { version: 1, width: source.layout!.width, sections: [section] } };
    const design = resolveDesign(theme, page);
    theme.fontFamily = design.fontFamily;
    theme.backgroundColor = design.backgroundColor;
  }
  return libraryContentSchema.parse({ format: 1, documentVersion: requiredDocumentVersion({ pages: [source], theme }), page: source, theme,
    origin: { funnelUuid: funnel.uuid, pages: funnel.pages.map(page => ({ id: page.id, label: page.title })), fields: funnel.pages.flatMap(page => page.elements.filter(element => responseTypes.has(element.type)).map(element => ({ id: element.id, label: `${page.title} · ${fieldLabel(element)}`, type: element.type, choices: elementChoices(element) }))) } });
}

export interface LibraryReference { key: string; kind: "page" | "field" | "choice"; id: string; fieldId?: string; label: string; required: boolean }
export type ReferenceAssignments = Record<string, string | null>;
const refKey = (kind: LibraryReference["kind"], id: string, fieldId?: string) => JSON.stringify([kind, fieldId ?? "", id]);
type Resolve = (kind: LibraryReference["kind"], id: string, fieldId?: string, required?: boolean) => string | null;

/** Explicit removal drops an affected rule, never broadens it by dropping one condition. */
function rewriteReferences(page: FunnelPage, resolve: Resolve, origin: LibraryContent["origin"]): FunnelPage {
  const copy = structuredClone(page);
  const target = (id?: string) => id ? resolve("page", id) ?? undefined : undefined;
  copy.nextPageId = target(copy.nextPageId);
  if (copy.conditionalRouting) copy.conditionalRouting = Object.fromEntries(Object.entries(copy.conditionalRouting).flatMap(([value, id]) => { const next = target(id); return next ? [[value, next]] : []; }));
  if (copy.conditions) copy.conditions = copy.conditions.flatMap(condition => {
    const field = resolve("field", condition.elementId), pageId = target(condition.targetPageId);
    const isChoice = ["equals", "notEquals"].includes(condition.operator) && origin.fields.find(field => field.id === condition.elementId)?.choices.some(choice => choice.id === condition.value);
    const value = isChoice ? resolve("choice", condition.value!, condition.elementId) : condition.value;
    return field && pageId && value !== null ? [{ ...condition, elementId: field, targetPageId: pageId, value }] : [];
  });
  if (copy.routing) {
    copy.routing.fallbackPageId = resolve("page", copy.routing.fallbackPageId, undefined, true) ?? "";
    copy.routing.rules = copy.routing.rules.flatMap(rule => {
      const pageId = target(rule.targetPageId);
      const conditions = rule.conditions.map(condition => {
        const fieldId = resolve("field", condition.fieldId);
        if (!fieldId) return null;
        if (condition.kind !== "choice") return { ...condition, fieldId };
        const value = resolve("choice", condition.value, condition.fieldId);
        return value !== null ? { ...condition, fieldId, value } : null;
      });
      return pageId && conditions.every(condition => condition !== null) ? [{ ...rule, targetPageId: pageId, conditions: conditions.filter(condition => condition !== null) }] : [];
    });
  }
  for (const element of copy.elements) {
    if (element.buttonNextPageId) {
      element.buttonNextPageId = target(element.buttonNextPageId);
      if (!element.buttonNextPageId && element.buttonAction === "page") element.buttonAction = "next";
    }
    if (element.optionRouting) element.optionRouting = Object.fromEntries(Object.entries(element.optionRouting).flatMap(([value, id]) => { const next = target(id); return next ? [[value, next]] : []; }));
    for (const item of element.listItems ?? []) item.targetPageId = target(item.targetPageId);
    if (element.personalization) element.personalization.bindings = element.personalization.bindings.flatMap(binding => {
      if (binding.source.kind !== "answer") return [binding];
      const id = resolve("field", binding.source.fieldId);
      if (id) return [{ ...binding, source: { ...binding.source, fieldId: id } }];
      element.content = (element.content ?? "").split(`{{${binding.token}}}`).join(binding.fallback);
      return [];
    });
  }
  return copy;
}

export function externalLibraryReferences(content: LibraryContent): LibraryReference[] {
  const internal = new Set(content.page.elements.map(element => element.id));
  const references = new Map<string, LibraryReference>();
  rewriteReferences(content.page, (kind, id, fieldId, required = false) => {
    if (kind === "page" ? id === content.page.id : internal.has(fieldId ?? id)) return id;
    const field = content.origin.fields.find(field => field.id === (fieldId ?? id));
    const label = kind === "page" ? content.origin.pages.find(page => page.id === id)?.label : kind === "field" ? field?.label : `${field?.label ?? fieldId} · ${field?.choices.find(choice => choice.id === id)?.label ?? id}`;
    const key = refKey(kind, id, fieldId);
    references.set(key, { key, kind, id, fieldId, label: label || id, required: required || references.get(key)?.required || false });
    return id;
  }, content.origin);
  return Array.from(references.values());
}

export function initialLibraryAssignments(content: LibraryContent, funnel: Funnel): ReferenceAssignments {
  if (content.origin.funnelUuid !== funnel.uuid) return {};
  return Object.fromEntries(externalLibraryReferences(content).filter(ref => {
    if (ref.kind === "page") return funnel.pages.some(page => page.id === ref.id && !page.hidden);
    const field = funnel.pages.filter(page => !page.hidden).flatMap(page => page.elements).find(field => field.id === (ref.fieldId ?? ref.id));
    return field && (ref.kind === "field" || elementChoices(field).some(choice => choice.id === ref.id));
  }).map(ref => [ref.key, ref.id]));
}

function adoptTargetDesign(page: FunnelPage): FunnelPage {
  delete page.themeOverride; delete page.backgroundColor;
  if (page.pageStyles) delete page.pageStyles.fontFamily;
  for (const section of page.layout?.sections ?? []) { delete section.themeOverride; delete section.backgroundColor; delete section.textColor; }
  for (const element of page.elements) {
    delete element.buttonVariant;
    for (const key of ["color", "backgroundColor", "fontSize", "borderRadius"] as const) if (element.styles) delete element.styles[key];
  }
  return page;
}

/** All references are decided before allocating copies; validation errors leave the draft untouched. */
export function insertLibraryTemplate(template: ContentTemplate, funnel: Funnel, selectedPageId: string, design: "source" | "target", assignments: ReferenceAssignments): FunnelPage[] {
  const content = libraryContentSchema.parse(template.content);
  if (funnel.abTests?.some(test => test.status === "running")) throw new Error("Pausiere laufende A/B-Tests vor dem Einfügen einer Vorlage.");
  const destination = funnel.pages.find(page => page.id === selectedPageId);
  if (!destination) throw new Error("Zielseite fehlt.");
  if (template.kind === "section" && !destination.layout) throw new Error("Aktiviere zuerst Abschnitte auf der Zielseite.");
  const references = externalLibraryReferences(content);
  const targetFields = funnel.pages.filter(page => !page.hidden).flatMap(page => page.elements).filter(field => responseTypes.has(field.type));
  for (const ref of references) {
    if (!Object.hasOwn(assignments, ref.key)) throw new Error(`Bitte „${ref.label}“ zuordnen oder ausdrücklich entfernen.`);
    const value = assignments[ref.key];
    if (value === null) { if (ref.required) throw new Error("Das Standardziel muss zugeordnet werden."); continue; }
    const valid = ref.kind === "page" ? funnel.pages.some(page => page.id === value && !page.hidden) : ref.kind === "field" ? targetFields.some(field => field.id === value) : targetFields.some(field => field.id === assignments[refKey("field", ref.fieldId!)] && elementChoices(field).some(choice => choice.id === value));
    if (!valid) throw new Error(`Die Zuordnung für „${ref.label}“ ist nicht mehr verfügbar.`);
  }
  // Copy first, then resolve external references: coincidentally equal IDs in a
  // different funnel must never be remapped to an internal copied element.
  let [page] = copyPages([content.page]);
  const byKey = new Map(references.map(ref => [ref.key, ref]));
  page = rewriteReferences(page, (kind, id, fieldId) => {
    if (kind === "page" && id === page.id && template.kind === "section") return destination.id;
    const key = refKey(kind, id, fieldId);
    return byKey.has(key) ? assignments[key] : id;
  }, content.origin);
  if (design === "target") page = adoptTargetDesign(page);
  if (template.kind === "page") {
    if (design === "source") page.themeOverride = content.theme;
    const index = funnel.pages.indexOf(destination) + 1;
    return [...funnel.pages.slice(0, index), page, ...funnel.pages.slice(index)];
  }
  if (page.layout?.sections.length !== 1) throw new Error("Die Vorlage muss genau einen Abschnitt enthalten.");
  const [section] = page.layout.sections;
  if (design === "source") section.themeOverride = section.themeOverride ?? content.theme;
  const next = { ...destination, elements: [...destination.elements, ...page.elements], layout: { ...destination.layout!, sections: [...destination.layout!.sections, section] } };
  const error = layoutErrors(next)[0]; if (error) throw new Error(error);
  return funnel.pages.map(page => page.id === destination.id ? next : page);
}
