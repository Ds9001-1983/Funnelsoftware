import type { FunnelPage, PageElement, PageLayout, VisitorCondition } from "./schema";
import { remapPersonalization } from "./funnel-personalization";

const newId = () => crypto.randomUUID();

/** Only known ID references are remapped. Text, URLs and unknown fields survive. */
export function copyElements(elements: PageElement[], pageIds = new Map<string, string>()) {
  const ids = new Map(elements.map(element => [element.id, newId()]));
  const target = (id: string) => pageIds.get(id) ?? id;
  const optionIds = new Map<string, string>();
  const copies = structuredClone(elements).map(element => {
    const originalId = element.id;
    const choices = new Map((element.choices ?? []).map(choice => [choice.id, newId()]));
    for (const choice of element.choices ?? []) { optionIds.set(`${originalId}:${choice.id}`, choices.get(choice.id)!); choice.id = choices.get(choice.id)!; }
    element.id = ids.get(element.id)!;
    if (element.buttonNextPageId) element.buttonNextPageId = target(element.buttonNextPageId);
    if (element.optionRouting) element.optionRouting = Object.fromEntries(Object.entries(element.optionRouting).map(([option, id]) => [choices.get(option) ?? option, target(id)]));
    for (const item of element.listItems ?? []) {
      item.id = newId();
      if (item.targetPageId) item.targetPageId = target(item.targetPageId);
    }
    for (const items of [element.slides, element.faqItems, element.socialProofItems, element.teamMembers]) {
      for (const item of items ?? []) item.id = newId();
    }
    if (element.quizConfig) {
      const resultIds = new Map(element.quizConfig.results.map(result => [result.id, newId()]));
      for (const result of element.quizConfig.results) result.id = resultIds.get(result.id)!;
      for (const question of element.quizConfig.questions) {
        question.id = newId();
        for (const answer of question.answers) {
          answer.id = newId();
          answer.points = Object.fromEntries(Object.entries(answer.points).map(([id, points]) => [resultIds.get(id) ?? id, points]));
        }
      }
    }
    if (element.personalization) for (const binding of element.personalization.bindings) binding.id = newId();
    return remapPersonalization(element, ids);
  });
  return { elements: copies, ids, optionIds };
}

export function copyLayout(layout: PageLayout, ids: Map<string, string>): PageLayout {
  return { ...structuredClone(layout), sections: layout.sections.map(section => ({
    ...structuredClone(section), id: newId(), columns: section.columns.map(column => ({
      ...structuredClone(column), id: newId(), elementIds: column.elementIds.map(id => ids.get(id) ?? id),
    })),
  })) };
}

/** Copies inside the same funnel retain references to pages outside the copy. */
export function copyPages(pages: FunnelPage[], replacePageIds = true): FunnelPage[] {
  const pageIds = new Map(pages.map(page => [page.id, replacePageIds ? newId() : page.id]));
  const elementIds = new Map<string, string>();
  const optionIds = new Map<string, string>();
  const scopedIds = new Map<string, Map<string, string>>();
  const copies = pages.map(source => {
    const page = structuredClone(source);
    page.id = pageIds.get(source.id)!;
    const copied = copyElements(source.elements, pageIds);
    scopedIds.set(page.id, copied.ids);
    copied.optionIds.forEach((id, key) => optionIds.set(key, id));
    copied.ids.forEach((id, oldId) => elementIds.set(oldId, id));
    page.elements = copied.elements;
    // Legacy page-wide conditions can match any field. Keep literal keys for
    // text fields and add the copied stable option IDs for selection fields.
    if (source.conditionalRouting) page.conditionalRouting = Object.fromEntries(Object.entries(source.conditionalRouting).flatMap(([value, target]) => [
      [value, target], ...source.elements.flatMap(element => { const option = copied.optionIds.get(`${element.id}:${value}`); return option ? [[option, target]] : []; }),
    ]));
    if (source.layout) page.layout = copyLayout(source.layout, copied.ids);
    // Legacy nested sections stay separate, including any opaque properties.
    page.sections = source.sections?.map(section => ({ ...structuredClone(section), id: newId(), columns: section.columns.map(column => {
      const nested = copyElements(column.elements, pageIds);
      nested.ids.forEach((id, oldId) => { if (!elementIds.has(oldId)) elementIds.set(oldId, id); });
      return { ...structuredClone(column), id: newId(), elements: nested.elements };
    }) }));
    return page;
  });
  const target = (id: string) => pageIds.get(id) ?? id;
  return copies.map(page => ({
    ...page,
    elements: page.elements.map(element => remapPersonalization(element, elementIds)),
    ...(page.routing ? { routing: { ...page.routing, fallbackPageId: target(page.routing.fallbackPageId), rules: page.routing.rules.map(rule => ({ ...rule, id: newId(), targetPageId: target(rule.targetPageId), conditions: rule.conditions.map((condition): VisitorCondition => { const base = { id: newId(), fieldId: elementIds.get(condition.fieldId) ?? condition.fieldId }; return condition.kind === "choice" ? { ...condition, ...base, value: optionIds.get(`${condition.fieldId}:${condition.value}`) ?? condition.value } : { ...condition, ...base }; }) })) } } : {}),
    ...(page.nextPageId ? { nextPageId: target(page.nextPageId) } : {}),
    ...(page.conditionalRouting ? { conditionalRouting: Object.fromEntries(Object.entries(page.conditionalRouting).map(([value, id]) => [value, target(id)])) } : {}),
    ...(page.conditions ? { conditions: page.conditions.map(condition => ({ ...condition, elementId: scopedIds.get(page.id)?.get(condition.elementId) ?? elementIds.get(condition.elementId) ?? condition.elementId, value: condition.value === undefined ? undefined : optionIds.get(`${condition.elementId}:${condition.value}`) ?? condition.value, targetPageId: target(condition.targetPageId) })) } : {}),
  }));
}
