import { z } from "zod";
import type { FunnelPage } from "./schema";
export const aiEditItemSchema = z.object({ id: z.string().min(1).max(100), type: z.enum(["heading", "text", "button"]), content: z.string().trim().min(1).max(4000) }).strict();
export const aiEditInputSchema = z.object({
  intent: z.enum(["shorten", "variants", "audience"]),
  audience: z.string().trim().max(500).optional(),
  items: z.array(aiEditItemSchema).min(1).max(20),
}).strict().superRefine((input, ctx) => {
  if (input.intent === "audience" && !input.audience) ctx.addIssue({ code: "custom", message: "Bitte eine Zielgruppe beschreiben." });
  if (input.intent === "variants" && input.items.length !== 1) ctx.addIssue({ code: "custom", message: "Varianten bitte für einen einzelnen Text erstellen." });
  if (new Set(input.items.map(item => item.id)).size !== input.items.length) ctx.addIssue({ code: "custom", message: "Texte müssen eindeutig sein." });
  if (input.items.reduce((sum, item) => sum + item.content.length, 0) > 8000) ctx.addIssue({ code: "custom", message: "Bitte höchstens 8.000 Zeichen auf einmal bearbeiten." });
});
export type AiEditInput = z.infer<typeof aiEditInputSchema>;
export const aiEditOutputSchema = z.object({ suggestions: z.array(z.object({ id: z.string().min(1).max(100), variants: z.array(z.string().trim().min(1).max(4000)).min(1).max(3) }).strict()).min(1).max(20) }).strict();
export type AiEditOutput = z.infer<typeof aiEditOutputSchema>;
const tokens = (text: string) => (text.match(/\{\{[^{}]+\}\}/g) ?? []).sort().join("\n");
export function validEditSuggestions(input: AiEditInput, output: AiEditOutput) {
  return output.suggestions.length === input.items.length && new Set(output.suggestions.map(item => item.id)).size === input.items.length
    && output.suggestions.every(suggestion => {
      const source = input.items.find(item => item.id === suggestion.id);
      return !!source && suggestion.variants.length === (input.intent === "variants" ? 3 : 1)
        && suggestion.variants.every(value => tokens(value) === tokens(source.content) && (input.intent !== "shorten" || value.length <= source.content.length));
    });
}
/** Apply only text, against the exact captured source; all other element data survive. */
export function applyTextSuggestion(page: FunnelPage, id: string, original: string, replacement: string): FunnelPage {
  const element = page.elements.find(element => element.id === id);
  if (!element || !["heading", "text", "button"].includes(element.type) || (element.content ?? "").trim() !== original.trim()) throw new Error("Der Ausgangstext wurde inzwischen geändert. Bitte neue Vorschläge erstellen.");
  if (!replacement.trim() || tokens(original) !== tokens(replacement)) throw new Error("Der Vorschlag enthält ungültige Platzhalter.");
  return { ...page, elements: page.elements.map(element => element.id === id ? { ...element, content: replacement } : element) };
}
