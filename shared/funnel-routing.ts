import { visitorRoutingSchema, type ABTest, type AnswerSnapshot, type FunnelPage, type PageElement, type VisitorCondition, type VisitorRouting } from "./schema";
import { getNextPageIndex } from "./legacy-funnel-routing";
import { pageWithVariant } from "./funnel-layout";
import { needsPersonalizationDocument } from "./funnel-personalization";

export const responseTypes = new Set(["input", "textarea", "select", "radio", "checkbox", "date", "slider", "quiz"]);
export const fieldLabel = (element: PageElement) => element.label || element.placeholder || element.content || element.id;
export const elementChoices = (element: PageElement) => element.choices ?? (element.options ?? []).map(label => ({ id: label, label }));
export const answerText = (element: PageElement, value: string) => element.choices?.find(choice => choice.id === value)?.label ?? value;
export const needsRoutingDocument = (pages: FunnelPage[] = [], tests: ABTest[] = []) => needsPersonalizationDocument(pages, tests) || pages.some(page => !!page.routing || page.elements.some(element => !!element.choices)) || tests.some(test => test.variants.some(variant => variant.elements?.some(element => !!element.choices)));

/** Missing answers never satisfy a comparison, including notEquals. */
export function evaluateVisitorCondition(condition: VisitorCondition, values: Record<string, string>): boolean {
  const value = values[condition.fieldId] ?? "";
  if (condition.operator === "isEmpty") return !value.trim();
  if (condition.operator === "isNotEmpty") return !!value.trim();
  if (!value.trim()) return false;
  if (condition.kind === "number") {
    const number = Number(value.replace(",", "."));
    if (!Number.isFinite(number)) return false;
    switch (condition.operator) {
      case "equals": return number === condition.value;
      case "notEquals": return number !== condition.value;
      case "greater": return number > condition.value;
      case "atLeast": return number >= condition.value;
      case "less": return number < condition.value;
      case "atMost": return number <= condition.value;
    }
  }
  if (condition.operator === "equals") return value === condition.value;
  if (condition.operator === "notEquals") return value !== condition.value;
  return condition.operator === "contains" && !!condition.value && value.includes(condition.value);
}

export function evaluateVisitorRules(routing: VisitorRouting, values: Record<string, string>) {
  const trace = routing.rules.map(rule => {
    const conditions = rule.conditions.map(condition => ({ id: condition.id, fieldId: condition.fieldId, matched: evaluateVisitorCondition(condition, values), unanswered: !(values[condition.fieldId] ?? "").trim() }));
    return { id: rule.id, name: rule.name, targetPageId: rule.targetPageId, conditions, matched: !!conditions.length && (rule.match === "all" ? conditions.every(item => item.matched) : conditions.some(item => item.matched)) };
  });
  const winner = trace.find(rule => rule.matched);
  return { targetPageId: winner?.targetPageId ?? routing.fallbackPageId, ruleId: winner?.id ?? null, trace };
}

export function resolveVisitorTransition(pages: FunnelPage[], index: number, values: Record<string, string>, explicitTarget?: string) {
  const page = pages[index];
  if (!page || page.type === "thankyou") return null;
  const target = explicitTarget ?? (!page.routing && page.type === "contact" ? pages.find(candidate => !candidate.hidden && candidate.type === "thankyou")?.id : undefined) ?? (page.routing ? evaluateVisitorRules(page.routing, values).targetPageId : undefined);
  const next = target !== undefined ? pages.findIndex(candidate => candidate.id === target && !candidate.hidden) : getNextPageIndex(pages, index, values);
  return next !== null && next >= 0 && !pages[next]?.hidden ? next : null;
}

/** Keep only the visited branch, including subordinate quiz values. */
export function answersOnPath(pages: FunnelPage[], path: string[], values: Record<string, string>) {
  const keys = new Set(pages.filter(page => path.includes(page.id)).flatMap(page => page.elements.flatMap(element => [element.id, ...(element.quizConfig?.questions.map(question => `${element.id}:${question.id}`) ?? [])])));
  return Object.fromEntries(Object.entries(values).filter(([key]) => keys.has(key)));
}
export function captureAnswers(pages: FunnelPage[], path: string[], values: Record<string, string>, contentRevisionId = 0, variants?: Record<string, string>, documentVersion: 3 | 4 = 3): AnswerSnapshot {
  return { version: 1, documentVersion, contentRevisionId, path: [...path], ...(variants ? { variants } : {}), fields: pages.filter(page => path.includes(page.id)).flatMap(page => page.elements.filter(element => values[element.id] !== undefined && responseTypes.has(element.type)).map(element => {
    const value = values[element.id];
    const choice = element.choices?.find(choice => choice.id === value);
    return { pageId: page.id, elementId: element.id, label: fieldLabel(element), value, ...(choice ? { optionId: choice.id, optionText: choice.label } : {}) };
  })) };
}

export interface RoutingEdge { id: string; source: string; target: string; label: string; kind: "rule" | "default" | "direct" }
/** One graph definition for publication checks and the flow view. */
export function routingEdges(pages: FunnelPage[]): RoutingEdge[] {
  const edges: RoutingEdge[] = [];
  const add = (page: FunnelPage, target: string | undefined, label: string, kind: RoutingEdge["kind"]) => {
    if (target) edges.push({ id: `${page.id}:${edges.length}`, source: page.id, target, label, kind });
  };
  pages.forEach((page, index) => {
    if (page.hidden || page.type === "thankyou") return;
    if (page.routing) {
      page.routing.rules.forEach((rule, index) => add(page, rule.targetPageId, `${index + 1}. ${rule.name || "Regel"} (${rule.match === "all" ? "UND" : "ODER"})`, "rule"));
      add(page, page.routing.fallbackPageId, "Standard", "default");
    } else {
      if (page.type === "contact" && needsRoutingDocument(pages)) add(page, pages.find(candidate => !candidate.hidden && candidate.type === "thankyou")?.id, "Nach Absenden", "default");
      else {
        for (const element of page.elements) for (const [value, target] of Object.entries(element.optionRouting ?? {})) add(page, target, answerText(element, value), "rule");
        for (const [value, target] of Object.entries(page.conditionalRouting ?? {})) add(page, target, value, "rule");
        page.conditions?.forEach((condition, index) => add(page, condition.targetPageId, `Bedingung ${index + 1}`, "rule"));
        add(page, page.nextPageId ?? pages.slice(index + 1).find(candidate => !candidate.hidden)?.id, "Standard", "default");
      }
    }
    for (const element of page.elements) {
      if (element.buttonAction === "page") add(page, element.buttonNextPageId, element.content || "Button", "direct");
      for (const item of element.listItems ?? []) add(page, item.targetPageId, item.text || "Listeneintrag", "direct");
    }
  });
  return edges;
}

export function visitorRoutingErrors(pages: FunnelPage[], tests: ABTest[] = []): string[] {
  if (!needsRoutingDocument(pages, tests)) return [];
  const check = (candidate: FunnelPage[], possibleEdges = routingEdges(candidate)) => {
    const errors: string[] = [];
    const visible = candidate.filter(page => !page.hidden);
    const pageMap = new Map(visible.map(page => [page.id, page]));
    const fields = visible.flatMap(page => page.elements.map(element => ({ page, element })));
    const fieldMap = new Map(fields.map(field => [field.element.id, field]));
    if (pageMap.size !== visible.length || fieldMap.size !== fields.length) errors.push("Seiten- und Feld-IDs müssen eindeutig sein.");
    if (!visible.length || visible[0].type === "thankyou") errors.push("Der Einstieg muss eine sichtbare Eingabeseite sein.");
    const edges = possibleEdges;
    const reaches = (source: string, target: string, seen = new Set<string>()): boolean => {
      if (source === target) return true;
      if (seen.has(source)) return false;
      seen.add(source);
      return edges.some(edge => edge.source === source && reaches(edge.target, target, seen));
    };
    for (const page of visible) {
      for (const element of page.elements) if (element.choices) {
        if (!["select", "radio"].includes(element.type) || !element.choices.length || new Set(element.choices.map(choice => choice.id)).size !== element.choices.length) errors.push(`${page.title}: Auswahl-IDs fehlen oder sind nicht eindeutig.`);
      }
      if (page.routing) {
        if (!visitorRoutingSchema.safeParse(page.routing).success) { errors.push(`${page.title}: Ungültiges Regelformat.`); continue; }
        if (new Set(page.routing.rules.map(rule => rule.id)).size !== page.routing.rules.length) errors.push(`${page.title}: Regel-IDs müssen eindeutig sein.`);
        if (!page.routing.fallbackPageId && page.type !== "thankyou") errors.push(`${page.title}: Standardziel fehlt.`);
        for (const rule of page.routing.rules) {
          if (!rule.targetPageId) errors.push(`${page.title}: Regelziel fehlt.`);
          for (const condition of rule.conditions) {
            const field = fieldMap.get(condition.fieldId)?.element;
            if (!field || !responseTypes.has(field.type)) errors.push(`${page.title}: Eine Regel verweist auf ein gelöschtes oder verborgenes Antwortfeld.`);
            else if (condition.kind === "choice" && !elementChoices(field).some(choice => choice.id === condition.value)) errors.push(`${page.title}: Eine referenzierte Auswahloption fehlt.`);
            else if (field.choices && condition.kind !== "choice" && !["isEmpty", "isNotEmpty"].includes(condition.operator)) errors.push(`${page.title}: Auswahlregeln müssen die feste Options-ID verwenden.`);
            if (condition.kind === "text" && !["isEmpty", "isNotEmpty"].includes(condition.operator) && !condition.value) errors.push(`${page.title}: Ein Vergleichswert fehlt.`);
            const source = fieldMap.get(condition.fieldId)?.page;
            if (source && !reaches(source.id, page.id)) errors.push(`${page.title}: Das Feld „${fieldLabel(field!)}“ kann vor dieser Regel nicht beantwortet werden.`);
          }
        }
      }
      if (page.type !== "thankyou" && !edges.some(edge => edge.source === page.id)) errors.push(`${page.title}: Der Besucherweg endet ohne Ergebnisseite.`);
    }
    for (const edge of edges) {
      if (!pageMap.has(edge.target)) errors.push(`${pageMap.get(edge.source)?.title}: Zielseite fehlt oder ist verborgen.`);
      if (pageMap.get(edge.source)?.type === "contact" && pageMap.get(edge.target)?.type !== "thankyou") errors.push(`${pageMap.get(edge.source)?.title}: Nach Absenden muss eine Danke-/Ergebnisseite folgen.`);
    }
    const active = new Set<string>(), done = new Set<string>();
    const walk = (id: string) => {
      if (active.has(id)) { errors.push("Besucherwege dürfen keine Vorwärts-Schleife enthalten. Nutze zum Zurückgehen die Zurück-Taste."); return; }
      if (done.has(id)) return;
      active.add(id);
      edges.filter(edge => edge.source === id).forEach(edge => walk(edge.target));
      active.delete(id); done.add(id);
    };
    visible.forEach(page => walk(page.id));
    return Array.from(new Set(errors));
  };
  const alternatives: FunnelPage[][] = [];
  for (const test of tests.filter(test => test.status === "running")) for (const variant of test.variants.slice(1)) {
    alternatives.push(pages.map(page => page.id === test.pageId ? pageWithVariant(page, variant) : page));
  }
  // The union also catches cycles and field-ID collisions that arise only when
  // variants on different pages are shown together; no exponential product.
  const errors = check(pages, [...routingEdges(pages), ...alternatives.flatMap(routingEdges)]);
  const possibleOwners = new Map<string, Set<string>>();
  for (const candidate of [pages, ...alternatives]) for (const page of candidate) for (const element of page.elements) {
    const owners = possibleOwners.get(element.id) ?? new Set<string>();
    owners.add(page.id); possibleOwners.set(element.id, owners);
  }
  if (Array.from(possibleOwners.values()).some(owners => owners.size > 1)) errors.push("Aktive A/B-Varianten verwenden dieselbe Feld-ID auf unterschiedlichen Seiten.");
  let index = 0;
  for (const test of tests.filter(test => test.status === "running")) for (const variant of test.variants.slice(1)) errors.push(...check(alternatives[index++]).map(error => `${test.name} / ${variant.name}: ${error}`));
  return Array.from(new Set(errors));
}

/** Explicit activation retains legacy values; the proposal shows translated rules. */
export function proposedVisitorRouting(pages: FunnelPage[], page: FunnelPage): VisitorRouting {
  const rules: VisitorRouting["rules"] = [];
  const add = (fieldId: string, operator: "equals" | "notEquals" | "contains" | "isEmpty", value: string | undefined, targetPageId: string) => {
    const element = pages.flatMap(page => page.elements).find(element => element.id === fieldId);
    const condition: VisitorCondition = element?.choices && value && (operator === "equals" || operator === "notEquals")
      ? { id: crypto.randomUUID(), kind: "choice", fieldId, operator, value }
      : { id: crypto.randomUUID(), kind: "text", fieldId, operator, value };
    rules.push({ id: crypto.randomUUID(), name: `Übernommene Regel ${rules.length + 1}`, match: "all", conditions: [condition], targetPageId });
  };
  for (const element of page.elements) for (const [value, target] of Object.entries(element.optionRouting ?? {})) add(element.id, "equals", value, target);
  for (const element of page.elements) for (const [value, target] of Object.entries(page.conditionalRouting ?? {})) add(element.id, "equals", value, target);
  for (const condition of page.conditions ?? []) add(condition.elementId, condition.operator, condition.value, condition.targetPageId);
  const button = page.elements.find(element => element.buttonAction === "page" && element.buttonNextPageId);
  const fallbackPageId = button?.buttonNextPageId ?? (page.type === "contact" ? pages.find(candidate => candidate.type === "thankyou" && !candidate.hidden)?.id : page.nextPageId ?? pages.slice(pages.indexOf(page) + 1).find(candidate => !candidate.hidden)?.id) ?? "";
  return { version: 1, rules: button ? [] : rules, fallbackPageId };
}
