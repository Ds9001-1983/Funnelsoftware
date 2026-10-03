import type { ABTest, FunnelPage, PageElement } from "./schema";
export type ResponsiveDevice = "mobile" | "tablet" | "desktop";
export const responsiveDevice = (width: number): ResponsiveDevice => width < 640 ? "mobile" : width < 1024 ? "tablet" : "desktop";
export function elementResponsiveStyle(element: PageElement, device: ResponsiveDevice) {
  return { ...element.responsive?.desktop, ...(device === "desktop" ? {} : element.responsive?.[device]) };
}
export function needsResponsiveDocument(pages: FunnelPage[] = [], tests: ABTest[] = []) {
  const has = (page: Pick<FunnelPage, "elements" | "sections">) => [...page.elements, ...(page.sections ?? []).flatMap(section => section.columns.flatMap(column => column.elements))].some(element => element.responsive !== undefined);
  return pages.some(has) || tests.some(test => test.variants.some(variant => has({ elements: variant.elements ?? [] })));
}
