import { pageLayoutSchema, type ABTest, type ABTestVariant, type FunnelPage, type PageElement, type PageLayout, type Theme } from "./schema";

export function pageElements(page: FunnelPage): PageElement[] {
  // Legacy sections were never submitted by the public renderer. Do not merge
  // them into the canonical list implicitly; that would reinterpret old leads.
  return page.elements;
}
export function legacySectionKind(page: FunnelPage): "flat" | "sections" | "mixed" | "duplicate" {
  const nested = page.sections?.flatMap(section => section.columns.flatMap(column => column.elements)) ?? [];
  if (!nested.length) return "flat";
  const ids = [...page.elements, ...nested].map(element => element.id);
  if (new Set(ids).size !== ids.length) return "duplicate";
  return page.elements.length ? "mixed" : "sections";
}
export function layoutElementIds(layout: PageLayout): string[] {
  return layout.sections.flatMap(section => section.columns.flatMap(column => column.elementIds));
}
export function layoutErrors(page: FunnelPage): string[] {
  if (!page.layout) return [];
  if (!pageLayoutSchema.safeParse(page.layout).success) return ["Das Layoutformat wird nicht unterstützt."];
  const ids = page.elements.map(element => element.id);
  const placed = layoutElementIds(page.layout);
  const groupIds = page.layout.sections.flatMap(section => [section.id, ...section.columns.map(column => column.id)]);
  const errors: string[] = [];
  if (new Set(ids).size !== ids.length) errors.push("Element-IDs sind nicht eindeutig.");
  if (new Set(placed).size !== placed.length) errors.push("Ein Element ist mehrfach im Layout platziert.");
  if (new Set(groupIds).size !== groupIds.length) errors.push("Abschnitts- und Spalten-IDs sind nicht eindeutig.");
  if (placed.some(id => !ids.includes(id))) errors.push("Das Layout verweist auf gelöschte Elemente.");
  if (ids.some(id => !placed.includes(id))) errors.push("Ein Element fehlt im Layout.");
  return errors;
}
export function documentLayoutErrors(pages: FunnelPage[], tests: ABTest[] = []): string[] {
  const errors = pages.flatMap(page => layoutErrors(page).map(error => `${page.title}: ${error}`));
  const hasLayout = pages.some(page => page.layout) || tests.some(test => test.variants.some(variant => variant.layout));
  const uniqueElements = (candidate: FunnelPage[]) => {
    const ids = candidate.flatMap(page => page.elements.map(element => element.id));
    return new Set(ids).size === ids.length;
  };
  if (hasLayout && !uniqueElements(pages)) errors.push("Element-IDs müssen im ganzen Funnel eindeutig sein.");
  if (hasLayout && new Set(pages.map(page => page.id)).size !== pages.length) errors.push("Seiten-IDs müssen im ganzen Funnel eindeutig sein.");
  for (const test of tests.filter(test => test.status === "running")) {
    const page = pages.find(page => page.id === test.pageId);
    if (!page) {
      if (hasLayout) errors.push(`${test.name}: Die Testseite fehlt.`);
      continue;
    }
    // The control variant always renders the unchanged page.
    for (const variant of test.variants.slice(1)) {
      const candidate = pageWithVariant(page, variant);
      errors.push(...layoutErrors(candidate).map(error => `${test.name} / ${variant.name}: ${error}`));
      if (hasLayout && !uniqueElements(pages.map(p => p === page ? candidate : p))) errors.push(`${test.name} / ${variant.name}: Element-IDs müssen im ganzen Funnel eindeutig sein.`);
    }
  }
  return errors;
}

export function documentReferenceErrors(pages: FunnelPage[], tests: ABTest[] = []): string[] {
  const check = (candidate: FunnelPage[]) => {
    const pageIds = new Set(candidate.map(page => page.id));
    const elementIds = new Set(candidate.flatMap(page => page.elements.map(element => element.id)));
    const errors: string[] = [];
    for (const page of candidate) {
      const targets = [page.nextPageId, ...Object.values(page.conditionalRouting ?? {}), ...(page.conditions ?? []).map(condition => condition.targetPageId)];
      if (page.conditions?.some(condition => !elementIds.has(condition.elementId))) errors.push(`${page.title}: Eine Regel verweist auf ein gelöschtes Feld.`);
      for (const element of page.elements) {
        if (element.buttonAction === "page") targets.push(element.buttonNextPageId);
        targets.push(...Object.values(element.optionRouting ?? {}), ...(element.listItems ?? []).map(item => item.targetPageId));
      }
      if (targets.some(id => id && !pageIds.has(id))) errors.push(`${page.title}: Eine Verknüpfung verweist auf eine gelöschte Seite.`);
    }
    return errors;
  };
  const errors = check(pages);
  for (const test of tests.filter(test => test.status === "running")) {
    for (const variant of test.variants.slice(1)) errors.push(...check(pages.map(page => page.id === test.pageId ? pageWithVariant(page, variant) : page)).map(error => `${test.name} / ${variant.name}: ${error}`));
  }
  return errors;
}
export function orderedElements(page: FunnelPage): PageElement[] {
  if (!page.layout || layoutErrors(page).length) return page.elements;
  const byId = new Map(page.elements.map(element => [element.id, element]));
  return layoutElementIds(page.layout).map(id => byId.get(id)!);
}
export function needsLayoutDocument(pages: FunnelPage[] = [], theme?: Theme | null, tests?: ABTest[] | null): boolean {
  return !!theme?.design || pages.some(page => !!page.layout) || !!tests?.some(test => test.variants.some(variant => !!variant.layout));
}

export function pageWithVariant(page: FunnelPage, variant: ABTestVariant): FunnelPage {
  return {
    ...page,
    title: variant.title || page.title,
    subtitle: variant.subtitle || page.subtitle,
    elements: variant.elements || page.elements,
    layout: variant.layout || page.layout,
    backgroundColor: variant.backgroundColor || page.backgroundColor,
    buttonText: variant.buttonText || page.buttonText,
  };
}

export function applyVariantOverrides(pages: FunnelPage[], tests: ABTest[], assignments: Record<string, string>): FunnelPage[] {
  return pages.map(page => {
    for (const test of tests) {
      if (test.pageId !== page.id || test.status !== "running") continue;
      const variant = test.variants.find(candidate => candidate.id === assignments[test.id]);
      if (!variant || variant.id === test.variants[0]?.id) continue;
      return pageWithVariant(page, variant);
    }
    return page;
  });
}

/** Defaults intentionally match the old public renderer; no stored values change. */
export function resolveDesign(theme: Theme, page: FunnelPage) {
  const font = ((page.layout || theme.design) && page.pageStyles?.fontFamily) || theme.fontFamily || "system-ui, sans-serif";
  return {
    primaryColor: theme.primaryColor,
    backgroundColor: page.backgroundColor || theme.backgroundColor,
    textColor: theme.textColor,
    fontFamily: theme.design && font === "Geist" ? "Geist Sans" : font,
    width: page.layout && !layoutErrors(page).length ? ({ narrow: 512, wide: 960, full: 1280 } as const)[page.layout.width ?? "wide"] : 512,
    headingSize: theme.design?.headingSize,
    bodySize: theme.design?.bodySize,
    spacing: theme.design?.spacing ?? 16,
    radius: theme.design?.radius,
    buttonStyle: theme.design?.buttonStyle,
  };
}

export function designButtonStyle(primaryColor: string, design: Theme["design"]) {
  if (!design) return { backgroundColor: primaryColor };
  return {
    borderRadius: design.radius,
    fontSize: design.bodySize,
    backgroundColor: design.buttonStyle === "outline" ? "transparent" : design.buttonStyle === "soft" ? `color-mix(in srgb, ${primaryColor} 12%, transparent)` : primaryColor,
    color: design.buttonStyle === "solid" ? "#ffffff" : primaryColor,
    ...(design.buttonStyle === "outline" ? { border: `2px solid ${primaryColor}` } : {}),
  };
}
