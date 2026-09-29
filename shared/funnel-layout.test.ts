import { describe, expect, it } from "vitest";
import { abTestSchema, funnelPageSchema, pageLayoutSchema, type FunnelPage, type Theme } from "./schema";
import { applyVariantOverrides, documentLayoutErrors, layoutErrors, legacySectionKind, needsLayoutDocument, orderedElements, resolveDesign } from "./funnel-layout";
import { canEditFunnelDocument, documentFromFunnel, documentSchema, writeControlSchema } from "./funnel-document";

const theme: Theme = { primaryColor: "#123456", backgroundColor: "#ffffff", textColor: "#111111", fontFamily: "Inter" };
function page(): FunnelPage {
  return funnelPageSchema.parse({ id: "page", type: "contact", title: "Kontakt", elements: [
    { id: "name", type: "input", label: "Name", required: true },
    { id: "email", type: "input", label: "E-Mail", required: true },
  ], layout: { version: 1, sections: [{ id: "section", columns: [
    { id: "left", elementIds: ["email"] }, { id: "right", elementIds: ["name"] },
  ] }] } });
}

describe("Layout-Leser und Dokumentkompatibilität", () => {
  it("ordnet nach Spalten, ohne Inhalte, IDs oder die gespeicherte Reihenfolge zu ändern", () => {
    const input = page();
    const before = structuredClone(input);
    const elements = orderedElements(input);
    expect(elements.map(element => element.id)).toEqual(["email", "name"]);
    expect(elements[0]).toBe(input.elements[1]);
    expect(input).toEqual(before);
    expect(layoutErrors(input)).toEqual([]);
  });

  it.each(["missing", "duplicate", "unknown", "group", "element"])("blockiert fehlerhafte Referenzen: %s", kind => {
    const input = page();
    const columns = input.layout!.sections[0].columns;
    if (kind === "missing") columns[0].elementIds = [];
    if (kind === "duplicate") columns[0].elementIds.push("name");
    if (kind === "unknown") columns[0].elementIds = ["deleted"];
    if (kind === "group") columns[0].id = "section";
    if (kind === "element") input.elements[0].id = "email";
    expect(layoutErrors(input).length).toBeGreaterThan(0);
    expect(orderedElements(input)).toBe(input.elements);
  });

  it("lehnt unbekannte Layoutversionen ab und zeigt im Entwurf trotzdem alle Inhalte", () => {
    const input = page();
    input.layout = { ...input.layout!, version: 99 } as unknown as FunnelPage["layout"];
    expect(pageLayoutSchema.safeParse(input.layout).success).toBe(false);
    expect(orderedElements(input)).toBe(input.elements);
  });

  it("lässt Alt-Funnels und unbekannte Alt-Felder unverändert", () => {
    const { layout, ...flat } = page();
    const legacy = { ...flat, legacySetting: { keep: true }, pageStyles: { fontFamily: "Poppins" } };
    const nested = { ...legacy, sections: [{ id: "old", columns: [{ id: "old-column", width: 100, elements: [{ id: "nested", type: "text" }] }] }] } as FunnelPage;
    expect(orderedElements(nested)).toBe(nested.elements);
    expect(legacySectionKind(nested)).toBe("mixed");
    expect(legacySectionKind({ ...nested, elements: [] })).toBe("sections");
    expect(legacySectionKind({ ...nested, elements: [{ id: "nested", type: "text" }] })).toBe("duplicate");
    expect(needsLayoutDocument([nested], theme, null)).toBe(false);
    expect(resolveDesign(theme, legacy)).toMatchObject({ width: 512, spacing: 16, fontFamily: "Inter" });
    const snapshot = documentFromFunnel({ name: "Alt", pages: [nested], theme });
    expect(snapshot.version).toBe(1);
    expect(snapshot.pages).toEqual([nested]);
    expect(snapshot.pages[0]).not.toBe(nested);
  });

  it("erkennt neue Inhalte und schützt sie vor dem bisherigen Editor", () => {
    expect(needsLayoutDocument([page()], theme)).toBe(true);
    expect(canEditFunnelDocument({ pages: [page()], theme })).toBe(false);
    expect(canEditFunnelDocument({ documentVersion: 2, pages: [], theme })).toBe(false);
    expect(canEditFunnelDocument({ documentVersion: 3, pages: [], theme })).toBe(false);
    expect(canEditFunnelDocument({ pages: [], theme })).toBe(true);
    const snapshot = documentFromFunnel({ documentVersion: 2, name: "Neu", pages: [page()], theme, webhookSecret: "secret", views: 12, leads: 5 });
    expect(documentSchema.safeParse(snapshot).success).toBe(true);
    expect(snapshot.version).toBe(2);
    expect(snapshot).not.toHaveProperty("webhookSecret");
    expect(snapshot).not.toHaveProperty("leads");
    expect(snapshot).not.toHaveProperty("views");
    expect(() => documentFromFunnel({ documentVersion: 3 })).toThrow();
    expect(writeControlSchema.safeParse({ expectedVersion: 0, documentVersion: 3, mutationId: crypto.randomUUID() }).success).toBe(false);
  });

  it("wendet Varianten-Inhalte und Layout gemeinsam an und erhält die Kontrollvariante", () => {
    const input = page();
    const variantPage = page();
    variantPage.elements = [{ id: "variant", type: "text", content: "Variante" }];
    variantPage.layout!.sections[0].columns = [{ id: "column", elementIds: ["variant"] }];
    const test = abTestSchema.parse({ id: "ab", name: "Test", pageId: input.id, status: "running", variants: [
      { id: "control", name: "Kontrolle", elements: [] },
      { id: "variant", name: "Variante", elements: variantPage.elements, layout: variantPage.layout },
    ] });
    expect(documentLayoutErrors([input], [test])).toEqual([]);
    const [rendered] = applyVariantOverrides([input], [test], { ab: "variant" });
    expect(rendered.elements).toEqual(variantPage.elements);
    expect(orderedElements(rendered).map(element => element.id)).toEqual(["variant"]);
    expect(applyVariantOverrides([input], [test], { ab: "control" })[0]).toBe(input);
    delete test.variants[1].layout;
    expect(documentLayoutErrors([input], [test]).length).toBeGreaterThan(0);
    test.status = "paused";
    expect(documentLayoutErrors([input], [test])).toEqual([]);
    expect(applyVariantOverrides([input], [test], { ab: "variant" })[0]).toBe(input);
  });

  it("verhindert ID-Kollisionen zwischen Seiten und Varianten", () => {
    const input = page();
    const other = { ...page(), id: "other" };
    expect(documentLayoutErrors([input, other]).length).toBeGreaterThan(0);
    other.elements = [{ id: "variant", type: "text" }];
    delete other.layout;
    const test = abTestSchema.parse({ id: "ab", name: "Test", pageId: input.id, status: "running", variants: [
      { id: "control", name: "Kontrolle" },
      { id: "variant", name: "Variante", elements: other.elements, layout: { version: 1, sections: [{ id: "s", columns: [{ id: "c", elementIds: ["variant"] }] }] } },
    ] });
    expect(documentLayoutErrors([input, other], [test]).some(error => error.includes("im ganzen Funnel"))).toBe(true);
  });
});
