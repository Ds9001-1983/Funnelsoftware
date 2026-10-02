import { describe, expect, it } from "vitest";
import { contrastRatio, publishIssues } from "./publish-check";
import { funnelSchema } from "./schema";
function fixture() { return funnelSchema.parse({ id: 1, uuid: "f", userId: 1, name: "Test", status: "draft", pages: [
  { id: "p", type: "contact", title: "Kontakt", elements: [{ id: "image", type: "image" }, { id: "button", type: "button", content: "Los", buttonAction: "url" }, { id: "text", type: "text", content: "Hallo", styles: { color: "#ffffff" } }] },
], theme: { primaryColor: "#000", backgroundColor: "#fff", textColor: "#000", fontFamily: "Inter" }, views: 0, leads: 0, createdAt: new Date(), updatedAt: new Date() }); }
describe("publish quality check", () => {
  it("finds actionable content issues without mutating a draft", () => {
    const funnel = fixture(), original = structuredClone(funnel);
    const issues = publishIssues(funnel);
    expect(issues).toEqual(expect.arrayContaining([expect.objectContaining({ elementId: "image", severity: "warning" }), expect.objectContaining({ elementId: "button" }), expect.objectContaining({ elementId: "text", message: expect.stringContaining("Textkontrast") })]));
    expect(issues.some(issue => issue.message.includes("kein Eingabefeld"))).toBe(true);
    expect(funnel).toEqual(original);
  });
  it("does not flag next buttons as missing URLs or hidden content", () => {
    const funnel = fixture(); funnel.pages[0].elements = [{ id: "next", type: "button", content: "Weiter", buttonAction: "next" }];
    expect(publishIssues(funnel).some(issue => issue.elementId === "next")).toBe(false);
    funnel.pages[0].hidden = true;
    expect(publishIssues(funnel).filter(issue => issue.severity === "warning")).toHaveLength(0);
  });
  it("uses page and section background overrides and skips unknown colors", () => {
    const funnel = fixture(); funnel.pages[0].backgroundColor = "#000";
    expect(publishIssues(funnel).some(issue => issue.message.includes("Textkontrast"))).toBe(false);
    expect(contrastRatio("transparent", "#fff")).toBeUndefined();
    expect(contrastRatio("#000", "#ffffff")).toBe(21);
  });
  it("includes technical publication errors", () => {
    const funnel = fixture(); funnel.pages = [];
    expect(publishIssues(funnel).some(issue => issue.severity === "error")).toBe(true);
  });
  it("checks running A/B alternatives and labels their target", () => {
    const funnel = fixture(); funnel.abTests = [{ id: "t", name: "Test", pageId: "p", status: "running", variants: [{ id: "a", name: "Original" }, { id: "b", name: "Alternative", elements: [{ id: "missing", type: "image" }] }] }] as typeof funnel.abTests;
    expect(publishIssues(funnel)).toEqual(expect.arrayContaining([expect.objectContaining({ elementId: "missing", variant: "Test · Alternative" })]));
  });
});
