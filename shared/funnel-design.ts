import { z } from "zod";
import { themeSchema, type Funnel, type FunnelPage, type PageElement, type Theme } from "./schema";
import { FUNNEL_FONT_FAMILIES } from "./funnel-fonts";

export const DEFAULT_DESIGN: NonNullable<Theme["design"]> = { version: 1, headingSize: 32, bodySize: 16, radius: 12, spacing: 16, buttonStyle: "solid" };
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Bitte eine sechsstellige Hex-Farbe verwenden.");
/** Validate new brand values without reinterpreting legacy funnel themes. */
export const brandThemeSchema = themeSchema.omit({ source: true }).extend({
  primaryColor: color, backgroundColor: color, textColor: color, fontFamily: z.enum(FUNNEL_FONT_FAMILIES),
}).strict();
export const createBrandStyleSchema = z.object({ name: z.string().trim().min(1).max(80), theme: brandThemeSchema }).strict();
export const updateBrandStyleSchema = createBrandStyleSchema.partial().extend({ expectedVersion: z.number().int().positive(), archived: z.literal(true).optional() }).strict()
  .refine(value => value.name !== undefined || value.theme !== undefined || value.archived === true, "Eine Änderung fehlt.");
export interface BrandStyle { id: number; name: string; theme: Theme; version: number; createdAt: string; updatedAt: string }

const elementStyleKeys = ["color", "backgroundColor", "fontSize", "borderRadius"] as const;
/** Only these explicitly advertised overrides are reset; layout and content stay intact. */
function resetElement(element: PageElement) {
  delete element.buttonVariant;
  for (const key of elementStyleKeys) if (element.styles) delete element.styles[key];
}
function resetPage(page: FunnelPage) {
  delete page.themeOverride;
  delete page.backgroundColor;
  if (page.pageStyles) delete page.pageStyles.fontFamily;
  page.elements.forEach(resetElement);
  for (const section of page.layout?.sections ?? []) { delete section.backgroundColor; delete section.textColor; delete section.themeOverride; }
}
export function designOverrideCount(funnel: Pick<Funnel, "pages" | "abTests">): number {
  let count = 0;
  const elements = (items: PageElement[]) => { for (const element of items) count += Number(!!element.buttonVariant) + elementStyleKeys.filter(key => element.styles?.[key] !== undefined).length; };
  for (const page of funnel.pages) {
    count += Number(!!page.themeOverride) + Number(!!page.backgroundColor) + Number(!!page.pageStyles?.fontFamily);
    count += (page.layout?.sections ?? []).reduce((sum, section) => sum + Number(!!section.themeOverride) + Number(!!section.backgroundColor) + Number(!!section.textColor), 0);
    elements(page.elements);
  }
  for (const test of funnel.abTests ?? []) for (const variant of test.variants.slice(1)) {
    count += Number(!!variant.backgroundColor);
    count += (variant.layout?.sections ?? []).reduce((sum, section) => sum + Number(!!section.themeOverride) + Number(!!section.backgroundColor) + Number(!!section.textColor), 0);
    elements(variant.elements ?? []);
  }
  return count;
}
export function applyFunnelDesign(funnel: Funnel, theme: Theme, resetOverrides = false): Pick<Funnel, "theme" | "pages" | "abTests"> {
  const pages = structuredClone(funnel.pages);
  const abTests = structuredClone(funnel.abTests ?? []);
  if (resetOverrides) {
    pages.forEach(resetPage);
    for (const test of abTests) for (const variant of test.variants.slice(1)) {
      delete variant.backgroundColor;
      variant.elements?.forEach(resetElement);
      for (const section of variant.layout?.sections ?? []) { delete section.backgroundColor; delete section.textColor; delete section.themeOverride; }
    }
  }
  // Retain opaque theme properties, but replace the known design and provenance.
  const nextTheme = { ...funnel.theme, ...structuredClone(theme) };
  if (!theme.design) delete nextTheme.design;
  if (!theme.source) delete nextTheme.source;
  return { theme: nextTheme, pages, abTests };
}
export function themeForBrand(theme: Theme) {
  return brandThemeSchema.parse({ primaryColor: theme.primaryColor, backgroundColor: theme.backgroundColor, textColor: theme.textColor, fontFamily: theme.fontFamily, ...(theme.design ? { design: theme.design } : {}) });
}
