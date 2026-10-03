import { describe, expect, it } from "vitest";
import { aiEditInputSchema, applyTextSuggestion, validEditSuggestions } from "./ai-edit";
import type { FunnelPage } from "./schema";
const source = () => aiEditInputSchema.parse({ intent: "shorten", items: [{ id: "e", type: "button", content: "Hallo {{Name}}, jetzt unverbindlich anmelden" }] });
describe("AI text proposals", () => {
  it("preserves exact placeholders and rejects invented IDs or duplicate proposals", () => {
    expect(validEditSuggestions(source(), { suggestions: [{ id: "e", variants: ["Jetzt anmelden, {{Name}}"] }] })).toBe(true);
    for (const value of ["Jetzt anmelden", "Jetzt {{Andere}}", "{{Name}} {{Name}}"])
      expect(validEditSuggestions(source(), { suggestions: [{ id: "e", variants: [value] }] })).toBe(false);
    expect(validEditSuggestions(source(), { suggestions: [{ id: "other", variants: ["{{Name}}"] }] })).toBe(false);
  });
  it("applies only content while retaining links, design and bindings", () => {
    const page: FunnelPage = { id: "p", type: "welcome", title: "Seite", elements: [{ id: "e", type: "button", content: source().items[0].content, buttonUrl: "https://example.test", buttonAction: "url", responsive: { mobile: { fontSize: 20 } } }] };
    const result = applyTextSuggestion(page, "e", source().items[0].content, "Jetzt anmelden, {{Name}}");
    expect(result.elements[0]).toEqual({ ...page.elements[0], content: "Jetzt anmelden, {{Name}}" });
    expect(page.elements[0].content).toBe(source().items[0].content);
    expect(() => applyTextSuggestion(result, "e", source().items[0].content, "Hallo {{Name}}")).toThrow("inzwischen geändert");
  });
  it("requires three alternatives and a target audience when selected", () => {
    const input = { ...source(), intent: "variants" as const };
    expect(validEditSuggestions(input, { suggestions: [{ id: "e", variants: ["{{Name}}"] }] })).toBe(false);
    expect(aiEditInputSchema.safeParse({ ...source(), intent: "audience" }).success).toBe(false);
    expect(aiEditInputSchema.safeParse({ ...source(), items: [...source().items, ...source().items] }).success).toBe(false);
  });
});
