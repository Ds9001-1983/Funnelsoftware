import type { Funnel, FunnelPage, PageElement, PageLayout } from "./schema";
import { documentLayoutErrors, layoutErrors, orderedElements } from "./funnel-layout";
import { copyElements, copyLayout } from "./funnel-copy";

export type LayoutSection = PageLayout["sections"][number];
const newId = () => crypto.randomUUID();
const emptyColumn = () => ({ id: newId(), elementIds: [] as string[] });

export function layoutBlockReason(funnel: Pick<Funnel, "pages" | "abTests">, page: FunnelPage): string | null {
  if (funnel.abTests?.some(test => test.pageId === page.id && test.status === "running")) return "Beende oder pausiere zuerst den A/B-Test dieser Seite, bevor du die Abschnittsstruktur änderst.";
  if (!page.layout && page.sections?.length) return "Diese Seite enthält ältere Abschnittsdaten. Übernimm die Inhalte zuerst in eine neue Seite; eine automatische Umstellung ist nicht möglich.";
  const candidate = page.layout ? page : enablePageLayout(page);
  const errors = documentLayoutErrors(funnel.pages.map(p => p.id === page.id ? candidate : p));
  return errors.length ? errors[0] : null;
}

export function enablePageLayout(page: FunnelPage): FunnelPage {
  if (page.layout) return page;
  if (page.sections?.length) throw new Error("Ältere Abschnittsdaten werden nicht automatisch umgestellt.");
  return { ...page, layout: { version: 1, width: "narrow", sections: [{ id: newId(), name: "Bestehende Inhalte", columns: [{ id: newId(), elementIds: page.elements.map(element => element.id) }] }] } };
}

/** Existing element editing uses this too, so no add/delete path loses placement. */
export function reconcilePageLayout(page: FunnelPage, updates: Partial<FunnelPage>, targetColumnId?: string): FunnelPage {
  const next = { ...page, ...updates };
  if (!page.layout || updates.layout || !updates.elements) return next;
  const layout = structuredClone(page.layout);
  const remaining = new Set(updates.elements.map(element => element.id));
  for (const section of layout.sections) for (const column of section.columns) column.elementIds = column.elementIds.filter(id => remaining.has(id));
  const placed = new Set(layout.sections.flatMap(section => section.columns.flatMap(column => column.elementIds)));
  const added = updates.elements.filter(element => !placed.has(element.id));
  if (added.length) {
    if (!layout.sections.length) layout.sections.push({ id: newId(), name: "Inhalte", columns: [emptyColumn()] });
    const columns = layout.sections.flatMap(section => section.columns);
    const target = columns.find(column => column.id === targetColumnId) ?? columns[columns.length - 1];
    target.elementIds.push(...added.map(element => element.id));
  }
  return { ...next, layout };
}

export function addLayoutSection(page: FunnelPage, name: string, columns: PageElement[][]): FunnelPage {
  if (!page.layout) throw new Error("Aktiviere zuerst Abschnitte für diese Seite.");
  const copied = copyElements(columns.flat());
  const section: LayoutSection = { id: newId(), name, columns: columns.map(elements => ({ id: newId(), elementIds: elements.map(element => copied.ids.get(element.id)!) })) };
  return { ...page, elements: [...page.elements, ...copied.elements], layout: { ...page.layout, sections: [...page.layout.sections, section] } };
}

export function moveLayoutSection(page: FunnelPage, id: string, offset: number): FunnelPage {
  if (!page.layout) return page;
  const sections = [...page.layout.sections];
  const index = sections.findIndex(section => section.id === id);
  const target = index + offset;
  if (index < 0 || target < 0 || target >= sections.length) return page;
  const [section] = sections.splice(index, 1);
  sections.splice(target, 0, section);
  return { ...page, layout: { ...page.layout, sections } };
}

export function duplicateLayoutSection(page: FunnelPage, id: string): FunnelPage {
  if (!page.layout || layoutErrors(page).length) return page;
  const index = page.layout.sections.findIndex(section => section.id === id);
  if (index < 0) return page;
  const section = page.layout.sections[index];
  const ids = new Set(section.columns.flatMap(column => column.elementIds));
  const copied = copyElements(page.elements.filter(element => ids.has(element.id)));
  const [duplicate] = copyLayout({ ...page.layout, sections: [section] }, copied.ids).sections;
  duplicate.name = `${section.name || "Abschnitt"} (Kopie)`;
  const sections = [...page.layout.sections];
  sections.splice(index + 1, 0, duplicate);
  return { ...page, elements: [...page.elements, ...copied.elements], layout: { ...page.layout, sections } };
}

export function deleteLayoutSection(page: FunnelPage, id: string): FunnelPage {
  if (!page.layout) return page;
  const removed = new Set(page.layout.sections.find(section => section.id === id)?.columns.flatMap(column => column.elementIds));
  return { ...page, elements: page.elements.filter(element => !removed.has(element.id)), layout: { ...page.layout, sections: page.layout.sections.filter(section => section.id !== id) } };
}

export function setSectionColumns(page: FunnelPage, id: string, count: number): FunnelPage {
  if (!page.layout || ![1, 2, 3].includes(count)) return page;
  return { ...page, layout: { ...page.layout, sections: page.layout.sections.map(section => {
    if (section.id !== id) return section;
    const columns = structuredClone(section.columns.slice(0, count));
    if (columns.length < count) while (columns.length < count) columns.push(emptyColumn());
    else columns[count - 1].elementIds.push(...section.columns.slice(count).flatMap(column => column.elementIds));
    return { ...section, columns };
  }) } };
}

export function moveLayoutElement(page: FunnelPage, elementId: string, columnId: string, targetIndex?: number): FunnelPage {
  if (!page.layout || !page.elements.some(element => element.id === elementId)) return page;
  const layout = structuredClone(page.layout);
  const columns = layout.sections.flatMap(section => section.columns);
  const target = columns.find(column => column.id === columnId);
  if (!target) return page;
  for (const column of columns) column.elementIds = column.elementIds.filter(id => id !== elementId);
  target.elementIds.splice(targetIndex === undefined ? target.elementIds.length : Math.max(0, Math.min(targetIndex, target.elementIds.length)), 0, elementId);
  return { ...page, layout };
}

export function moveLayoutElementBy(page: FunnelPage, id: string, offset: number): FunnelPage {
  const ids = orderedElements(page).map(element => element.id);
  const index = ids.indexOf(id);
  const neighbor = ids[index + offset];
  const column = page.layout?.sections.flatMap(section => section.columns).find(column => column.elementIds.includes(neighbor));
  if (!column || index < 0) return page;
  const sameColumn = column.elementIds.includes(id);
  const targetIndex = column.elementIds.indexOf(neighbor) + (offset > 0 && !sameColumn ? 1 : 0);
  return moveLayoutElement(page, id, column.id, targetIndex);
}

/** Deleting a field must not silently turn an existing branch into a fallback. */
export function removedFieldReference(funnel: Pick<Funnel, "pages" | "abTests">, page: FunnelPage, next: FunnelPage): string | null {
  const remaining = new Set(next.elements.map(element => element.id));
  const removed = new Set(page.elements.filter(element => !remaining.has(element.id)).map(element => element.id));
  const elements = [...funnel.pages.flatMap(p => p.id === page.id ? next.elements : p.elements), ...(funnel.abTests ?? []).flatMap(test => test.variants.flatMap(variant => variant.elements ?? []))];
  const binding = elements.flatMap(element => element.personalization?.bindings ?? []).find(binding => binding.source.kind === "answer" && removed.has(binding.source.fieldId));
  if (binding) return `Das Feld wird noch für {{${binding.token}}} verwendet. Passe zuerst die Personalisierung an.`;
  const referrer = funnel.pages.find(p => p.routing ? p.routing.rules.some(rule => rule.conditions.some(condition => removed.has(condition.fieldId))) : p.conditions?.some(condition => removed.has(condition.elementId)));
  return referrer ? `Ein Feld wird noch in einer Regel auf „${referrer.title}“ verwendet. Passe zuerst die Regel an.` : null;
}
