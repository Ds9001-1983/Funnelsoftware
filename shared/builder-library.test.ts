import { describe, expect, it } from "vitest";
import type { Funnel } from "./schema";
import { captureLibraryContent, externalLibraryReferences, initialLibraryAssignments, insertLibraryTemplate, libraryContentSchema, type ContentTemplate } from "./builder-library";
import { canEditFunnelDocument, requiredDocumentVersion } from "./funnel-document";
import { documentLayoutErrors, resolveDesign } from "./funnel-layout";
import { DEFAULT_DESIGN, applyFunnelDesign } from "./funnel-design";

export const source = (): Funnel => ({ id: 1, uuid: "source", userId: 1, name: "Quelle", status: "draft", webhookSecret: "private-secret", metaCapiToken: "private-token", theme: { primaryColor: "#aa1122", backgroundColor: "#eeeeee", textColor: "#111111", fontFamily: "Inter", design: DEFAULT_DESIGN }, pages: [
  { id: "first", type: "question", title: "Auswahl", elements: [{ id: "choice", type: "radio", label: "Standort", choices: [{ id: "cologne", label: "Köln" }] }] },
  { id: "contact", type: "contact", title: "Kontakt", routing: { version: 1, fallbackPageId: "done", rules: [{ id: "r", name: "Ort", match: "all", targetPageId: "done", conditions: [{ id: "c", fieldId: "choice", kind: "choice", operator: "equals", value: "cologne" }] }] }, elements: [
    { id: "title", type: "heading", content: "Hallo {{Ort}}", personalization: { version: 1, bindings: [{ id: "b", token: "Ort", source: { kind: "answer", fieldId: "choice" }, fallback: "Gast" }] } },
    { id: "image", type: "image", imageUrl: "/uploads/existing.webp" },
    { id: "button", type: "button", content: "Senden", buttonAction: "page", buttonNextPageId: "done" },
  ], layout: { version: 1, width: "wide", sections: [{ id: "section", name: "Kontakt", columns: [{ id: "column", elementIds: ["title", "image", "button"] }] }] } },
  { id: "done", type: "thankyou", title: "Danke", elements: [] },
] } as Funnel);
const template = (funnel = source(), section?: string): ContentTemplate => ({ id: 1, name: "Kontaktvorlage", kind: section ? "section" : "page", content: captureLibraryContent(funnel, funnel.pages[1], section), version: 1, archivedAt: null });

describe("private independent content copies", () => {
  it("captures only content, source design and reference labels", () => {
    const content = template().content;
    expect(JSON.stringify(content)).not.toMatch(/private-secret|private-token|webhookSecret|metaCapiToken/);
    expect(content.page.elements[1].imageUrl).toBe("/uploads/existing.webp");
    expect(libraryContentSchema.safeParse({ ...content, leads: [] }).success).toBe(false);
    const legacy = source(); legacy.pages[1].sections = [{ id: "old", columns: [] }];
    expect(() => captureLibraryContent(legacy, legacy.pages[1])).toThrow("Ältere Abschnittsdaten");
  });
  it("requires explicit cross-funnel mapping even for coincidentally equal IDs", () => {
    const item = template(), target = source(); target.uuid = "different";
    expect(initialLibraryAssignments(item.content, target)).toEqual({});
    expect(() => insertLibraryTemplate(item, target, "first", "source", {})).toThrow("zuordnen");
    const assignments = initialLibraryAssignments(item.content, source());
    const result = insertLibraryTemplate(item, target, "first", "source", assignments);
    expect(result[1].id).not.toBe("contact");
    expect(result[1].elements[0].id).not.toBe("title");
    expect(result[1].routing!.rules[0].conditions[0].fieldId).toBe("choice");
    expect(result[1].themeOverride).toEqual(item.content.theme);
    expect(target.pages[1].themeOverride).toBeUndefined();
    expect(documentLayoutErrors(result)).toEqual([]);
  });
  it("remaps external fields and option IDs, and never mutates the saved template", () => {
    const item = template(), before = structuredClone(item), target = source();
    target.uuid = "different"; target.pages[0].elements = [{ id: "new-field", type: "radio", choices: [{ id: "new-option", label: "Bonn" }] }];
    const assignments = Object.fromEntries(externalLibraryReferences(item.content).map(ref => [ref.key, ref.kind === "page" ? "done" : ref.kind === "field" ? "new-field" : "new-option"]));
    const [ , copy ] = insertLibraryTemplate(item, target, "first", "target", assignments);
    expect(copy.routing!.rules[0].conditions[0]).toMatchObject({ fieldId: "new-field", value: "new-option" });
    expect(copy.elements[0].personalization!.bindings[0].source).toEqual({ kind: "answer", fieldId: "new-field" });
    expect(item).toEqual(before);
    expect(() => insertLibraryTemplate(item, { ...target, pages: target.pages.slice(1) }, "contact", "target", assignments)).toThrow("nicht mehr verfügbar");
  });
  it("explicit removal drops the whole affected rule and uses the placeholder fallback", () => {
    const item = template(), target = source();
    const assignments = Object.fromEntries(externalLibraryReferences(item.content).map(ref => [ref.key, ref.kind === "page" ? "done" : null]));
    const copy = insertLibraryTemplate(item, target, "first", "target", assignments)[1];
    expect(copy.routing!.rules).toEqual([]);
    expect(copy.elements[0].content).toBe("Hallo Gast");
    const required = externalLibraryReferences(item.content).find(ref => ref.required)!;
    expect(() => insertLibraryTemplate(item, target, "first", "target", { ...assignments, [required.key]: null })).toThrow("Standardziel");
  });
  it("copies all internal section references with fresh field, option and layout IDs", () => {
    const original = source();
    original.pages[1].elements.unshift(original.pages[0].elements[0]);
    original.pages[0].elements = [];
    original.pages[1].layout!.sections[0].columns[0].elementIds.unshift("choice");
    const item = template(original, "section"), target = source();
    const assignment = Object.fromEntries(externalLibraryReferences(item.content).map(ref => [ref.key, "done"]));
    const inserted = insertLibraryTemplate(item, target, "contact", "source", assignment)[1];
    const section = inserted.layout!.sections[1], ids = section.columns[0].elementIds;
    const field = inserted.elements.find(element => element.id === ids[0])!;
    const heading = inserted.elements.find(element => element.id === ids[1])!;
    expect(field.id).not.toBe("choice"); expect(field.choices![0].id).not.toBe("cologne");
    expect(heading.personalization!.bindings[0].source).toEqual({ kind: "answer", fieldId: field.id });
    expect(section.id).not.toBe("section"); expect(section.columns[0].id).not.toBe("column");
    expect(section.themeOverride).toEqual(item.content.theme);
    expect(documentLayoutErrors([inserted])).toEqual([]);
    expect(target.pages[1].layout!.sections).toHaveLength(1);
  });
  it("keeps source design locally or adopts the target design without changing media", () => {
    const item = template(), target = source(); target.theme.primaryColor = "#123abc";
    item.content.page.elements[0].styles = { color: "#ff0000", fontSize: "64px" };
    item.content.page.layout!.sections[0].themeOverride = item.content.theme;
    item.content.documentVersion = 5;
    const mapping = initialLibraryAssignments(item.content, target);
    const kept = insertLibraryTemplate(item, target, "first", "source", mapping)[1];
    const adopted = insertLibraryTemplate(item, target, "first", "target", mapping)[1];
    expect(resolveDesign(target.theme, kept).primaryColor).toBe("#aa1122");
    expect(adopted.themeOverride).toBeUndefined(); expect(adopted.layout!.sections[0].themeOverride).toBeUndefined();
    expect(adopted.elements[0].styles?.color).toBeUndefined();
    expect(adopted.elements[1].imageUrl).toBe("/uploads/existing.webp");
    const doc = { ...target, pages: [kept] };
    expect(requiredDocumentVersion(doc)).toBe(5);
    expect(canEditFunnelDocument(doc, true, true, true)).toBe(false);
    expect(canEditFunnelDocument(doc, true, true, true, true)).toBe(true);
    expect(applyFunnelDesign(doc, target.theme, true).pages[0].themeOverride).toBeUndefined();
  });
  it("keeps internal legacy choice conditions attached to copied options", () => {
    const original = source();
    original.pages[0].conditions = [{ elementId: "choice", operator: "equals", value: "cologne", targetPageId: "done" }];
    original.pages[0].conditionalRouting = { cologne: "done" };
    const item: ContentTemplate = { id: 1, name: "Auswahl", kind: "page", content: captureLibraryContent(original, original.pages[0]), version: 1, archivedAt: null };
    const copy = insertLibraryTemplate(item, original, "first", "target", initialLibraryAssignments(item.content, original))[1];
    expect(copy.conditions![0]).toMatchObject({ elementId: copy.elements[0].id, value: copy.elements[0].choices![0].id, targetPageId: "done" });
    expect(copy.conditionalRouting![copy.elements[0].choices![0].id]).toBe("done");
  });
  it("rejects insertion during running experiments and invalid section placement", () => {
    const item = template(); const target = source();
    target.abTests = [{ id: "t", name: "Test", pageId: "first", status: "running", variants: [] }];
    expect(() => insertLibraryTemplate(item, target, "first", "target", {})).toThrow("A/B-Tests");
    expect(() => insertLibraryTemplate(template(source(), "section"), source(), "first", "target", {})).toThrow("Abschnitte");
  });
});
