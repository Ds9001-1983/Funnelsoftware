import { describe, expect, it } from "vitest";
import { applyFunnelDesign, brandThemeSchema, createBrandStyleSchema, DEFAULT_DESIGN, designOverrideCount, themeForBrand } from "./funnel-design";
import { resolveDesign } from "./funnel-layout";
import type { Funnel, Theme } from "./schema";

const theme: Theme = { primaryColor: "#123456", backgroundColor: "#ffffff", textColor: "#111111", fontFamily: "Inter" };
function fixture() {
  return { theme: { ...theme, opaque: "keep" }, pages: [{ id: "p", title: "Kontakt", type: "contact", backgroundColor: "#abcdef", pageStyles: { fontFamily: "Lora", padding: "12px" }, elements: [{ id: "e", type: "button", content: "Los", buttonVariant: "outline", buttonAction: "page", buttonNextPageId: "p", styles: { color: "#ff0000", fontSize: "22px", borderRadius: "2px", padding: "4px", textAlign: "left" } }], layout: { version: 1, width: "wide", sections: [{ id: "s", backgroundColor: "#eeeeee", textColor: "#222222", padding: 8, gap: 24, columns: [{ id: "c", elementIds: ["e"] }] }] }, sections: [{ id: "legacy", columns: [] }] }], abTests: [{ id: "test", status: "paused", variants: [{ id: "control" }, { id: "other", backgroundColor: "#999999", elements: [{ id: "variant-element", type: "text", styles: { color: "#777777" } }] }] }] } as unknown as Funnel;
}
describe("funnel design application", () => {
  it("copies the brand without changing any local overrides or the source", () => {
    const funnel = fixture(); const original = structuredClone(funnel);
    const brand = { ...theme, design: { ...DEFAULT_DESIGN }, source: { id: 8, version: 2 } };
    const result = applyFunnelDesign(funnel, brand);
    expect(result.pages).toEqual(original.pages);
    expect(result.abTests).toEqual(original.abTests);
    expect(result.theme).toMatchObject({ ...brand, opaque: "keep" });
    brand.design.radius = 30;
    expect(result.theme.design?.radius).toBe(12);
    expect(funnel).toEqual(original);
  });
  it("resets only advertised styles across pages, sections and variant overrides", () => {
    const funnel = fixture();
    expect(designOverrideCount(funnel)).toBe(10);
    const result = applyFunnelDesign(funnel, { ...theme, design: DEFAULT_DESIGN }, true);
    expect(designOverrideCount(result)).toBe(0);
    expect(result.pages[0]).toMatchObject({ id: "p", title: "Kontakt", pageStyles: { padding: "12px" }, elements: [{ id: "e", content: "Los", buttonAction: "page", buttonNextPageId: "p", styles: { padding: "4px", textAlign: "left" } }] });
    expect(result.pages[0].layout?.sections[0]).toMatchObject({ id: "s", padding: 8, gap: 24, columns: [{ id: "c", elementIds: ["e"] }] });
    expect(result.pages[0].sections).toEqual(funnel.pages[0].sections);
    expect(result.abTests?.[0].variants[1].elements?.[0].id).toBe("variant-element");
    expect(designOverrideCount(funnel)).toBe(10);
  });
  it("can replace tokens with an exact legacy theme and removes stale provenance", () => {
    const funnel = fixture(); funnel.theme = { ...theme, design: DEFAULT_DESIGN, source: { id: 7, version: 4 } };
    expect(applyFunnelDesign(funnel, theme).theme).toEqual(theme);
    expect(themeForBrand(funnel.theme)).toEqual({ ...theme, design: DEFAULT_DESIGN });
  });
  it("keeps legacy rendering defaults and resolves explicit page fonts first", () => {
    const page = fixture().pages[0]; delete page.layout;
    expect(resolveDesign(theme, page)).toMatchObject({ headingSize: undefined, radius: undefined, spacing: 16, fontFamily: "Inter", backgroundColor: "#abcdef" });
    expect(resolveDesign({ ...theme, design: DEFAULT_DESIGN }, page).fontFamily).toBe("Lora");
    delete page.pageStyles;
    expect(resolveDesign({ ...theme, fontFamily: "Geist", design: DEFAULT_DESIGN }, page).fontFamily).toBe("Geist Sans");
  });
  it("validates only new brand values, including names, fonts, sizes and mass assignment", () => {
    expect(createBrandStyleSchema.parse({ name: "  Studio  ", theme }).name).toBe("Studio");
    for (const input of [{ ...theme, fontFamily: "url(https://foreign.test/font)" }, { ...theme, primaryColor: "url(https://foreign.test/color)" }, { ...theme, design: { ...DEFAULT_DESIGN, bodySize: 100 } }, { ...theme, source: { id: 1, version: 1 } }]) expect(brandThemeSchema.safeParse(input).success).toBe(false);
    expect(createBrandStyleSchema.safeParse({ name: "", theme }).success).toBe(false);
    expect(createBrandStyleSchema.safeParse({ name: "Studio", theme, userId: 2 }).success).toBe(false);
  });
});
