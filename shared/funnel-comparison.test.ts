import { describe, expect, it } from "vitest";
import { compareDocuments } from "./funnel-comparison";
import type { FunnelDocument } from "./funnel-document";
const fixture = (): FunnelDocument => ({ version: 1, name: "Name", description: null, theme: { primaryColor: "#000", backgroundColor: "#fff", textColor: "#000", fontFamily: "Inter" }, pages: [{ id: "p", title: "Seite", type: "welcome", elements: [{ id: "e", type: "heading", content: "Alt" }] }], abTests: [], impressumUrl: null, datenschutzUrl: null, ogImageUrl: null });
describe("content comparison", () => {
  it("ignores object key ordering while detecting actual text changes", () => {
    const before = fixture(), after = fixture();
    after.theme = { fontFamily: "Inter", textColor: "#000", backgroundColor: "#fff", primaryColor: "#000" };
    expect(compareDocuments(before, after)).toEqual([]);
    after.pages[0].elements[0].content = "Neu";
    expect(compareDocuments(before, after)).toEqual([{ label: "Seite: Neu", kind: "changed", pageId: "p" }]);
  });
  it("detects removed pages, design, links and branching changes", () => {
    const before = fixture(), after = fixture();
    after.pages = []; after.theme.primaryColor = "#f00"; after.datenschutzUrl = "https://example.test/privacy";
    expect(compareDocuments(before, after)).toEqual(expect.arrayContaining([expect.objectContaining({ label: "Design" }), expect.objectContaining({ label: "Datenschutz-Link" }), expect.objectContaining({ kind: "removed", pageId: "p" })]));
    const routed = fixture(); routed.pages[0].nextPageId = "other";
    expect(compareDocuments(before, routed)[0].label).toContain("Besucherregeln");
  });
  it("preserves both documents", () => {
    const before = fixture(), after = fixture(), original = structuredClone(before);
    after.pages[0].elements = []; compareDocuments(before, after);
    expect(before).toEqual(original); expect(after.pages[0].elements).toEqual([]);
  });
});
