import { describe, expect, it } from "vitest";
import { abTestSchema, funnelPageSchema, type FunnelPage } from "./schema";
import { copyPages } from "./funnel-copy";
import { documentFromFunnel } from "./funnel-document";
import { documentReferenceErrors, layoutErrors, orderedElements } from "./funnel-layout";
import { addLayoutSection, deleteLayoutSection, duplicateLayoutSection, enablePageLayout, layoutBlockReason, moveLayoutElement, moveLayoutElementBy, moveLayoutSection, reconcilePageLayout, removedFieldReference, setSectionColumns } from "./funnel-layout-edit";

const flat = (): FunnelPage => funnelPageSchema.parse({ id: "p", title: "Kontakt", type: "contact", elements: [
  { id: "name", type: "input", label: "Name", required: true }, { id: "email", type: "input", label: "E-Mail", required: true },
] });

describe("Abschnitte bearbeiten", () => {
  it("stellt nur auf Wunsch um und lässt Elementinhalte, Reihenfolge und IDs bestehen", () => {
    const original = flat();
    const converted = enablePageLayout(original);
    expect(original.layout).toBeUndefined();
    expect(converted.elements).toBe(original.elements);
    expect(orderedElements(converted)).toEqual(original.elements);
    expect(converted.layout?.width).toBe("narrow");
    expect(documentFromFunnel({ pages: [converted] }).version).toBe(2);
    expect(enablePageLayout(converted)).toBe(converted);
  });

  it("sperrt Umstellung alter Sections und laufender A/B-Tests", () => {
    const page = flat();
    const legacy = { ...page, sections: [{ id: "old", columns: [] }] };
    expect(layoutBlockReason({ pages: [legacy] }, legacy)).toContain("ältere Abschnittsdaten");
    expect(() => enablePageLayout(legacy)).toThrow();
    const test = abTestSchema.parse({ id: "test", name: "Test", pageId: page.id, status: "running", variants: [] });
    expect(layoutBlockReason({ pages: [page], abTests: [test] }, page)).toContain("A/B-Test");
    test.status = "paused";
    expect(layoutBlockReason({ pages: [page], abTests: [test] }, page)).toBeNull();
  });

  it("verschiebt ganze Gruppen, dupliziert unabhängig und löscht nur ihre Elemente", () => {
    let page = addLayoutSection(enablePageLayout(flat()), "Text", [[{ id: "h", type: "heading", content: "Hallo" }], [{ id: "t", type: "text", content: "Text" }]]);
    const originalIds = page.elements.map(element => element.id);
    const sectionId = page.layout!.sections[1].id;
    page = moveLayoutSection(page, sectionId, -1);
    expect(orderedElements(page).slice(0, 2).map(element => element.content)).toEqual(["Hallo", "Text"]);
    expect(page.elements.map(element => element.id)).toEqual(originalIds);
    const duplicated = duplicateLayoutSection(page, sectionId);
    expect(duplicated.elements).toHaveLength(6);
    expect(new Set(duplicated.elements.map(element => element.id)).size).toBe(6);
    const deleted = deleteLayoutSection(duplicated, sectionId);
    expect(deleted.elements).toHaveLength(4);
    expect(deleted.elements.filter(element => element.required).map(element => element.id)).toEqual(["name", "email"]);
    expect(layoutErrors(deleted)).toEqual([]);
    expect(duplicated.layout!.sections).toHaveLength(3);
  });

  it("erhält alle Felder beim Verkleinern der Spaltenzahl", () => {
    let page = enablePageLayout(flat());
    const section = page.layout!.sections[0];
    page = setSectionColumns(page, section.id, 3);
    const third = page.layout!.sections[0].columns[2].id;
    page = moveLayoutElement(page, "email", third);
    expect(page.layout!.sections[0].columns[2].elementIds).toEqual(["email"]);
    const merged = setSectionColumns(page, section.id, 1);
    expect(orderedElements(merged).map(element => element.id)).toEqual(["name", "email"]);
    expect(merged.elements).toBe(page.elements);
    expect(layoutErrors(merged)).toEqual([]);
  });

  it("ordnet neue und entfernte Elemente auch über die bisherigen Editoraktionen korrekt zu", () => {
    let page = enablePageLayout(flat());
    page = setSectionColumns(page, page.layout!.sections[0].id, 2);
    const columnId = page.layout!.sections[0].columns[1].id;
    const next = reconcilePageLayout(page, { elements: [page.elements[1], { id: "new", type: "text", content: "Neu" }] }, columnId);
    expect(next.layout!.sections[0].columns.map(column => column.elementIds)).toEqual([["email"], ["new"]]);
    expect(layoutErrors(next)).toEqual([]);
    expect(page.elements).toHaveLength(2);
  });

  it("bewegt per Tastatur über Spaltengrenzen, ohne die fachliche Elementreihenfolge umzuschreiben", () => {
    let page = enablePageLayout(flat());
    page = setSectionColumns(page, page.layout!.sections[0].id, 2);
    page = moveLayoutElement(page, "email", page.layout!.sections[0].columns[1].id);
    const moved = moveLayoutElementBy(page, "name", 1);
    expect(orderedElements(moved).map(element => element.id)).toEqual(["email", "name"]);
    expect(moved.elements.map(element => element.id)).toEqual(["name", "email"]);
  });

  it("erkennt noch verwendete Felder und ungültige Seitenziele vor Veröffentlichung", () => {
    const page = enablePageLayout(flat());
    page.conditions = [{ elementId: "name", operator: "isEmpty", targetPageId: "p" }];
    const deleted = deleteLayoutSection(page, page.layout!.sections[0].id);
    expect(removedFieldReference({ pages: [page] }, page, deleted)).toContain("Regel");
    expect(documentReferenceErrors([deleted])[0]).toContain("gelöschtes Feld");
    expect(documentReferenceErrors([{ ...page, nextPageId: "missing" }])[0]).toContain("gelöschte Seite");
  });
});

describe("Referenzen beim Kopieren", () => {
  it("remappt Layout, Regeln und interne Seitenziele und erhält externe Ziele", () => {
    const page = enablePageLayout(flat());
    page.nextPageId = page.id;
    page.conditions = [{ elementId: "name", operator: "equals", value: "Ja", targetPageId: page.id }];
    page.elements[0].optionRouting = { Ja: page.id, Nein: "external-page" };
    page.elements.push({ id: "link", type: "button", buttonAction: "page", buttonNextPageId: page.id });
    page.layout!.sections[0].columns[0].elementIds.push("link");
    const before = structuredClone(page);
    const [copy] = copyPages([page]);
    expect(copy.id).not.toBe(page.id);
    expect(copy.nextPageId).toBe(copy.id);
    expect(copy.conditions?.[0]).toMatchObject({ elementId: copy.elements[0].id, targetPageId: copy.id });
    expect(copy.elements[0].optionRouting).toEqual({ Ja: copy.id, Nein: "external-page" });
    expect(copy.elements[2].buttonNextPageId).toBe(copy.id);
    expect(copy.layout!.sections[0].id).not.toBe(page.layout!.sections[0].id);
    expect(layoutErrors(copy)).toEqual([]);
    expect(page).toEqual(before);
  });

  it("kopiert Quiz-IDs und Punktezuordnungen konsistent und ohne gemeinsame Objektverweise", () => {
    const page = enablePageLayout(flat());
    page.elements[0].quizConfig = { questions: [{ id: "q", question: "Frage", answers: [{ id: "a", text: "Ja", points: { result: 2 } }] }], results: [{ id: "result", title: "Ergebnis", description: "Text", minPoints: 0, maxPoints: 10, color: "#ffffff" }], showProgressBar: true, shuffleQuestions: false, shuffleAnswers: false };
    const [copy] = copyPages([page]);
    const quiz = copy.elements[0].quizConfig!;
    expect(quiz.questions[0].id).not.toBe("q");
    expect(quiz.questions[0].answers[0].id).not.toBe("a");
    expect(quiz.questions[0].answers[0].points).toEqual({ [quiz.results[0].id]: 2 });
    quiz.questions[0].question = "Geändert";
    expect(page.elements[0].quizConfig!.questions[0].question).toBe("Frage");
  });

  it("behandelt gleiche Alt-IDs seitenspezifisch und kopierte Seitenziele in zwei Durchgängen", () => {
    const first = flat();
    const second = { ...flat(), id: "second", conditions: [{ elementId: "name", operator: "isEmpty" as const, targetPageId: first.id }] };
    first.nextPageId = second.id;
    const [a, b] = copyPages([first, second]);
    expect(a.nextPageId).toBe(b.id);
    expect(b.conditions![0]).toMatchObject({ elementId: b.elements[0].id, targetPageId: a.id });
    expect(a.elements[0].id).not.toBe(b.elements[0].id);
  });
});
