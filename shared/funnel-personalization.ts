import { personalizationSchema, type ABTest, type FunnelPage, type PageElement, type PersonalizationBinding } from "./schema";

export const personalizedElementTypes = new Set(["heading", "text", "button"]);
export const personalizationAnswerTypes = new Set(["input", "textarea", "select", "radio", "checkbox", "date", "slider", "quiz"]);
const tokenPattern = /\{\{([A-Za-z][A-Za-z0-9_]{0,39})\}\}/g;
export const templateTokens = (content = "") => Array.from(new Set(Array.from(content.matchAll(tokenPattern), match => match[1])));
const allElements = (pages: FunnelPage[], tests: ABTest[] = []) => [...pages.flatMap(page => page.elements), ...tests.flatMap(test => test.variants.flatMap(variant => variant.elements ?? []))];
export const needsPersonalizationDocument = (pages: FunnelPage[] = [], tests: ABTest[] = []) => allElements(pages, tests).some(element => !!element.personalization);

/** Short plain text only. Replacement is performed once against the template. */
export const personalizationValue = (value: string) => Array.from(value.replace(/[\u0000-\u001f\u007f]/g, " ").trim()).slice(0, 200).join("");
export interface PersonalizationContext {
  pages: FunnelPage[];
  path: string[];
  answers: Record<string, string>;
  campaign: Record<string, string>;
}

/** Each configured campaign binding explicitly allows exactly one URL key. */
export function campaignValues(search: string, pages: FunnelPage[], tests: ABTest[] = []): Record<string, string> {
  if (search.length > 8192) return {};
  const params = new URLSearchParams(search);
  if (Array.from(params).length > 50) return {};
  const keys = new Set(allElements(pages, tests).flatMap(element => element.personalization?.bindings.flatMap(binding => binding.source.kind === "campaign" ? [binding.source.key] : []) ?? []));
  return Object.fromEntries(Array.from(keys).flatMap(key => {
    const values = params.getAll(key);
    return values.length === 1 ? [[key, personalizationValue(values[0])]] : [];
  }));
}

export function resolvePersonalizedContent(element: PageElement, context: PersonalizationContext): string {
  const content = element.content ?? "";
  if (!element.personalization || !personalizedElementTypes.has(element.type)) return content;
  const bindings = new Map(element.personalization.bindings.map(binding => [binding.token, binding]));
  return content.replace(tokenPattern, (original, token: string) => {
    const binding = bindings.get(token);
    if (!binding) return original;
    let value: string | undefined;
    if (binding.source.kind === "campaign") value = Object.hasOwn(context.campaign, binding.source.key) ? context.campaign[binding.source.key] : undefined;
    else {
      const fieldId = binding.source.fieldId;
      const matches = context.pages.filter(page => !page.hidden && context.path.includes(page.id)).flatMap(page => page.elements.filter(field => field.id === fieldId && personalizationAnswerTypes.has(field.type)));
      if (matches.length === 1 && Object.hasOwn(context.answers, fieldId)) {
        const field = matches[0], raw = context.answers[fieldId];
        value = field.choices ? field.choices.find(choice => choice.id === raw)?.label
          : ["select", "radio"].includes(field.type) ? field.options?.find(option => option === raw) : raw;
      }
    }
    return personalizationValue(value ?? "") || binding.fallback;
  });
}

export function remapPersonalization(element: PageElement, fieldIds: Map<string, string>): PageElement {
  if (!element.personalization) return element;
  return { ...element, personalization: { ...element.personalization, bindings: element.personalization.bindings.map(binding => ({
    ...binding, source: binding.source.kind === "answer" ? { ...binding.source, fieldId: fieldIds.get(binding.source.fieldId) ?? binding.source.fieldId } : binding.source,
  })) } };
}

export function personalizationErrors(pages: FunnelPage[], tests: ABTest[] = []): string[] {
  const active = tests.filter(test => test.status === "running");
  const fields = new Set(allElements(pages.filter(page => !page.hidden), active).filter(element => personalizationAnswerTypes.has(element.type)).map(element => element.id));
  const errors: string[] = [];
  for (const element of allElements(pages, active)) {
    const config = element.personalization;
    if (!config) continue;
    if (!personalizedElementTypes.has(element.type)) errors.push("Personalisierung ist nur für Überschriften, Texte und Button-Beschriftungen verfügbar.");
    if (!personalizationSchema.safeParse(config).success) { errors.push("Eine Personalisierung ist unvollständig."); continue; }
    if (new Set(config.bindings.map(binding => binding.token)).size !== config.bindings.length || new Set(config.bindings.map(binding => binding.id)).size !== config.bindings.length) errors.push("Platzhalter und ihre IDs müssen innerhalb eines Textes eindeutig sein.");
    for (const binding of config.bindings) if (binding.source.kind === "answer" && !fields.has(binding.source.fieldId)) errors.push(`{{${binding.token}}}: Antwortfeld fehlt oder ist verborgen. Bitte die Quelle zuordnen oder den Platzhalter entfernen.`);
  }
  return Array.from(new Set(errors));
}

/** Labels are presentation only; a binding's source always stores the field ID. */
export function suggestedToken(label: string, bindings: PersonalizationBinding[]): string {
  const base = label.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9_]/g, "_").replace(/^[^A-Za-z]+/, "").slice(0, 32) || "Antwort";
  const used = new Set(bindings.map(binding => binding.token));
  let token = base, index = 2;
  while (used.has(token)) token = `${base}_${index++}`;
  return token;
}
