import { describe, expect, it } from "vitest";
import { answerSnapshotSchema, type FunnelPage, type VisitorRouting, type VisitorCondition, type ABTest } from "./schema";
import { answersOnPath, captureAnswers, evaluateVisitorCondition, evaluateVisitorRules, proposedVisitorRouting, resolveVisitorTransition, routingEdges, visitorRoutingErrors } from "./funnel-routing";
import { canEditFunnelDocument, documentFromFunnel } from "./funnel-document";
import { copyPages } from "./funnel-copy";

const number: VisitorCondition = { id: "budget-rule", fieldId: "budget", kind: "number", operator: "atLeast", value: 1000 };
const choice: VisitorCondition = { id: "need-rule", fieldId: "need", kind: "choice", operator: "equals", value: "now-id" };
const routing: VisitorRouting = { version: 1, fallbackPageId: "later", rules: [
  { id: "qualified", name: "Qualifiziert", match: "all", targetPageId: "now", conditions: [number, choice] },
  { id: "interested", name: "Interessiert", match: "any", targetPageId: "later", conditions: [number, choice] },
] };
function pages(): FunnelPage[] { return [
  { id: "start", title: "Fragen", type: "question", elements: [{ id: "budget", type: "input" }, { id: "need", type: "radio", label: "Bedarf", choices: [{ id: "now-id", label: "Kurzfristig" }, { id: "later-id", label: "Später" }] }], routing: structuredClone(routing) },
  { id: "now", title: "Termin", type: "contact", elements: [{ id: "email-now", type: "input", mapToLeadField: "email" }], routing: { version: 1, rules: [], fallbackPageId: "thanks-now" } },
  { id: "later", title: "Information", type: "contact", elements: [{ id: "email-later", type: "input", mapToLeadField: "email" }], routing: { version: 1, rules: [], fallbackPageId: "thanks-later" } },
  { id: "thanks-now", title: "Danke Termin", type: "thankyou", elements: [] },
  { id: "thanks-later", title: "Danke Information", type: "thankyou", elements: [] },
]; }
describe("versioned visitor rules", () => {
  it("evaluates AND, OR, priority and an explicit fallback with one trace", () => {
    expect(evaluateVisitorRules(routing, { budget: "1000", need: "now-id" })).toMatchObject({ ruleId: "qualified", targetPageId: "now", trace: [{ matched: true }, { matched: true }] });
    expect(evaluateVisitorRules(routing, { budget: "999", need: "now-id" })).toMatchObject({ ruleId: "interested", targetPageId: "later" });
    expect(evaluateVisitorRules(routing, {})).toMatchObject({ ruleId: null, targetPageId: "later" });
    expect(evaluateVisitorRules({ ...routing, rules: [...routing.rules].reverse() }, { budget: "1000", need: "now-id" }).ruleId).toBe("interested");
  });
  it("does not treat unanswered or invalid numeric answers as comparisons", () => {
    for (const value of ["", "  ", "abc"]) expect(evaluateVisitorCondition({ ...number, operator: "notEquals" }, { budget: value })).toBe(false);
    expect(evaluateVisitorCondition({ ...number, value: 1000.5 }, { budget: "1000,5" })).toBe(true);
    expect(evaluateVisitorCondition({ ...choice, operator: "notEquals" }, {})).toBe(false);
    expect(evaluateVisitorCondition({ id: "empty", fieldId: "need", kind: "text", operator: "isEmpty" }, {})).toBe(true);
  });
  it("keeps option identity after renaming and records the text at capture time", () => {
    const p = pages();
    p[0].elements[1].choices![0].label = "Gleich jetzt";
    expect(resolveVisitorTransition(p, 0, { budget: "2000", need: "now-id" })).toBe(1);
    const captured = captureAnswers(p, ["start", "now"], { need: "now-id", budget: "2000", "email-now": "a@example.test" }, 123);
    expect(captured.fields[1]).toMatchObject({ elementId: "need", optionId: "now-id", optionText: "Gleich jetzt" });
    p[0].elements[1].choices![0].label = "Noch ein anderer Text";
    expect(captured.fields[1].optionText).toBe("Gleich jetzt");
    expect(answerSnapshotSchema.safeParse(captured).success).toBe(true);
  });
  it("removes abandoned branch values, including nested quiz answers", () => {
    const p = pages();
    const values = { budget: "2000", need: "now-id", "email-now": "stale@example.test", "email-later": "new@example.test", "deleted:quiz-question": "old" };
    expect(answersOnPath(p, ["start"], values)).toEqual({ budget: "2000", need: "now-id" });
    expect(captureAnswers(p, ["start", "later"], values).fields.map(field => field.elementId)).toEqual(["budget", "need", "email-later"]);
    expect(answerSnapshotSchema.safeParse({ ...captureAnswers(p, ["start"], values), path: ["start", "start"] }).success).toBe(false);
  });
  it("rejects cycles, hidden/deleted targets, missing fields/options and incomplete routes", () => {
    expect(visitorRoutingErrors(pages())).toEqual([]);
    const broken = pages(); broken[0].routing!.fallbackPageId = "start";
    expect(visitorRoutingErrors(broken).join()).toContain("Schleife");
    broken[0].routing!.fallbackPageId = "";
    expect(visitorRoutingErrors(broken).join()).toContain("Standardziel");
    const hidden = pages(); hidden[1].hidden = true;
    expect(visitorRoutingErrors(hidden).join()).toContain("verborgen");
    const missing = pages(); missing[0].elements[1].choices!.shift();
    expect(visitorRoutingErrors(missing).join()).toContain("Auswahloption fehlt");
    const future = pages(); future[0].routing!.rules[0].conditions = [{ id: "future", kind: "text", fieldId: "email-now", operator: "isEmpty" }];
    expect(visitorRoutingErrors(future).join()).toContain("kann vor dieser Regel nicht");
  });
  it("checks active A/B variants against references without substituting unrelated field IDs", () => {
    const p = pages();
    const test = { id: "ab", name: "AB", pageId: "start", status: "running", variants: [{ id: "control", name: "A" }, { id: "other", name: "B", elements: [{ id: "foreign-budget", type: "input" }] }] } as ABTest;
    expect(visitorRoutingErrors(p, [test]).join()).toContain("AB / B");
    expect(visitorRoutingErrors(p, [{ ...test, status: "paused" }])).toEqual([]);
  });
  it("copies rule, field, page and option references together without changing originals", () => {
    const p = pages(); const original = structuredClone(p); const copied = copyPages(p);
    const condition = copied[0].routing!.rules[0].conditions[1];
    expect(condition.fieldId).toBe(copied[0].elements[1].id);
    expect(condition.value).toBe(copied[0].elements[1].choices![0].id);
    expect(copied[0].routing!.rules[0].targetPageId).toBe(copied[1].id);
    expect(visitorRoutingErrors(copied)).toEqual([]);
    expect(p).toEqual(original);
  });
  it("rejects cycles and ID collisions formed by simultaneous variants on different pages", () => {
    const p: FunnelPage[] = [
      { id: "a", title: "A", type: "question", elements: [], routing: { version: 1, rules: [], fallbackPageId: "done" } },
      { id: "b", title: "B", type: "question", elements: [], routing: { version: 1, rules: [], fallbackPageId: "done" } },
      { id: "done", title: "Danke", type: "thankyou", elements: [] },
    ];
    const tests = ["a", "b"].map((pageId, index) => ({ id: pageId, name: pageId, pageId, status: "running", variants: [
      { id: `${pageId}-control`, name: "Kontrolle" },
      { id: `${pageId}-variant`, name: "Alternative", elements: [{ id: "same-button", type: "button", buttonAction: "page", buttonNextPageId: index === 0 ? "b" : "a" }] },
    ] })) as ABTest[];
    expect(visitorRoutingErrors(p, tests).join()).toContain("Schleife");
    expect(visitorRoutingErrors(p, tests).join()).toContain("Feld-ID auf unterschiedlichen Seiten");
  });
  it("requires a version 3 editor, including restore/copy inference", () => {
    const data = { pages: pages(), name: "Regeln", theme: { primaryColor: "#123456", textColor: "#111111", backgroundColor: "#ffffff", fontFamily: "Inter" } };
    expect(documentFromFunnel(data).version).toBe(3);
    expect(canEditFunnelDocument(data, true)).toBe(false);
    expect(canEditFunnelDocument(data, true, true)).toBe(true);
  });
  it("keeps legacy evaluation and exposes every condition and direct target to the graph", () => {
    const p: FunnelPage[] = [{ id: "a", title: "A", type: "question", elements: [{ id: "field", type: "input" }], conditions: [{ elementId: "field", operator: "contains", value: "x", targetPageId: "c" }] }, { id: "b", title: "B", type: "thankyou", elements: [] }, { id: "c", title: "C", type: "thankyou", elements: [] }];
    expect(visitorRoutingErrors(p)).toEqual([]);
    expect(resolveVisitorTransition(p, 0, { field: "x" })).toBe(2);
    expect(routingEdges(p).map(edge => edge.target)).toEqual(["c", "b"]);
    const proposal = proposedVisitorRouting(p, p[0]);
    expect(evaluateVisitorRules(proposal, { field: "x" }).targetPageId).toBe("c");
    expect(p[0].routing).toBeUndefined();
  });
});
