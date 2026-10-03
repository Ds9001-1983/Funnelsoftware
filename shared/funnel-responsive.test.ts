import { describe, expect, it } from "vitest";
import { elementResponsiveStyle, needsResponsiveDocument, responsiveDevice } from "./funnel-responsive";
import { canEditFunnelDocument, documentFromFunnel } from "./funnel-document";
import { captureLibraryContent, libraryContentSchema } from "./builder-library";
import { funnelSchema, pageElementSchema } from "./schema";
const fixture = () => funnelSchema.parse({ id: 1, uuid: "f", userId: 1, name: "Responsive", status: "draft", pages: [{ id: "p", type: "welcome", title: "Seite", elements: [{ id: "e", type: "heading", content: "Hallo", responsive: { desktop: { fontSize: 48, padding: 10 }, mobile: { fontSize: 24, padding: 0 } } }] }], theme: { primaryColor: "#000", backgroundColor: "#fff", textColor: "#000", fontFamily: "Inter" }, views: 0, leads: 0, createdAt: new Date(), updatedAt: new Date() });
describe("responsive content", () => {
  it("uses bounded breakpoints and desktop inheritance, including zero", () => {
    expect([639, 640, 1023, 1024].map(responsiveDevice)).toEqual(["mobile", "tablet", "tablet", "desktop"]);
    const element = fixture().pages[0].elements[0];
    expect(elementResponsiveStyle(element, "mobile")).toEqual({ fontSize: 24, padding: 0 });
    expect(elementResponsiveStyle(element, "tablet")).toEqual({ fontSize: 48, padding: 10 });
  });
  it("requires v6 and prevents older editors from writing new content", () => {
    const funnel = fixture();
    expect(documentFromFunnel(funnel).version).toBe(6);
    expect(canEditFunnelDocument(funnel, true, true, true, true)).toBe(false);
    expect(canEditFunnelDocument(funnel, true, true, true, true, true)).toBe(true);
  });
  it("keeps the legacy format and styles when overrides are absent", () => {
    const funnel = fixture(); delete funnel.pages[0].elements[0].responsive;
    expect(documentFromFunnel(funnel).version).toBe(1);
    expect(elementResponsiveStyle(funnel.pages[0].elements[0], "mobile")).toEqual({});
  });
  it("preserves overrides in reusable templates and variant-only content", () => {
    const funnel = fixture();
    const content = captureLibraryContent(funnel, funnel.pages[0]);
    expect(libraryContentSchema.parse(content).documentVersion).toBe(6);
    expect(content.page.elements[0].responsive).toEqual(funnel.pages[0].elements[0].responsive);
    expect(needsResponsiveDocument([], [{ variants: [{ elements: funnel.pages[0].elements }] }] as never)).toBe(true);
  });
  it("rejects CSS injection and excessive style values", () => {
    expect(pageElementSchema.safeParse({ id: "x", type: "text", responsive: { mobile: { fontSize: "url(https://example.test)" } } }).success).toBe(false);
    expect(pageElementSchema.safeParse({ id: "x", type: "text", responsive: { mobile: { padding: 9999 } } }).success).toBe(false);
  });
});
