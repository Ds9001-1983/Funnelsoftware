import type { Funnel, FunnelPage, Theme } from "./schema";
import { documentLayoutErrors, documentReferenceErrors, pageWithVariant, resolveDesign } from "./funnel-layout";
import { visitorRoutingErrors } from "./funnel-routing";
import { personalizationErrors } from "./funnel-personalization";
import { documentFromFunnel, documentSchema } from "./funnel-document";

export interface PublishIssue { id: string; severity: "error" | "warning"; message: string; pageId?: string; elementId?: string; variant?: string }
/** Only opaque hex colors can be reliably compared without a rendered background. */
export function contrastRatio(foreground: string, background: string): number | undefined {
  const luminance = (color: string) => {
    if (!/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(color)) return undefined;
    const hex = color.length === 4 ? color.slice(1).split("").map(c => c + c).join("") : color.slice(1);
    const channels = [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
  };
  const a = luminance(foreground), b = luminance(background);
  return a === undefined || b === undefined ? undefined : (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}
export function publishIssues(funnel: Funnel): PublishIssue[] {
  const issues: PublishIssue[] = [];
  const add = (issue: Omit<PublishIssue, "id">) => issues.push({ ...issue, id: String(issues.length) });
  try {
    if (!documentSchema.safeParse(documentFromFunnel(funnel)).success || !funnel.pages.length) add({ severity: "error", message: "Inhalt unvollständig. Bitte Seiten und Einstellungen prüfen." });
  } catch { add({ severity: "error", message: "Das Dokumentformat kann nicht veröffentlicht werden." }); }
  const errors = [...documentLayoutErrors(funnel.pages, funnel.abTests), ...((funnel.documentVersion ?? 1) >= 2 ? documentReferenceErrors(funnel.pages, funnel.abTests) : []), ...visitorRoutingErrors(funnel.pages, funnel.abTests), ...personalizationErrors(funnel.pages, funnel.abTests)];
  for (const message of Array.from(new Set(errors))) add({ severity: "error", message, pageId: funnel.pages.find(page => message.startsWith(`${page.title}:`))?.id });
  const checkPage = (page: FunnelPage, theme: Theme, variant?: string) => {
    if (page.hidden) return;
    const warn = (message: string, elementId?: string) => add({ severity: "warning", message: `${page.title}${variant ? ` / ${variant}` : ""}: ${message}`, pageId: page.id, elementId, variant });
    if (!page.elements.length && page.type !== "thankyou") warn("Diese Seite enthält noch keine Elemente.");
    if (page.type === "contact" && !page.elements.some(el => ["input", "textarea"].includes(el.type))) warn("Das Kontaktformular enthält kein Eingabefeld.");
    const design = resolveDesign(theme, page);
    for (const element of page.elements) {
      if (element.type === "image" && !element.imageUrl?.trim()) warn("Bild fehlt. Wähle ein Bild aus.", element.id);
      if (element.type === "button" && element.buttonAction === "url" && !element.buttonUrl?.trim()) warn("Der Button hat noch keine Zieladresse.", element.id);
      if (["heading", "text", "button"].includes(element.type) && !element.content?.trim()) warn("Beschriftung oder Text fehlt.", element.id);
      if (["input", "textarea", "select", "radio", "checkbox"].includes(element.type) && !element.label?.trim() && !element.placeholder?.trim()) warn("Das Formularfeld hat keine Beschriftung.", element.id);
      if (["select", "radio"].includes(element.type) && !(element.choices?.length || element.options?.length)) warn("Das Auswahlfeld hat noch keine Antworten.", element.id);
      if (!["heading", "text"].includes(element.type)) continue;
      const section = page.layout?.sections.find(section => section.columns.some(column => column.elementIds.includes(element.id)));
      const effective = section?.themeOverride ? resolveDesign(section.themeOverride, { ...page, themeOverride: undefined }) : design;
      const background = element.styles?.backgroundColor || section?.backgroundColor || effective.backgroundColor;
      if (page.backgroundImage && !element.styles?.backgroundColor && !section?.backgroundColor) continue;
      const ratio = contrastRatio(element.styles?.color || section?.textColor || effective.textColor, background);
      const size = element.styles?.fontSize?.endsWith("px") ? parseFloat(element.styles.fontSize) : element.type === "heading" ? effective.headingSize ?? 24 : effective.bodySize ?? 16;
      const threshold = size >= 24 ? 3 : 4.5;
      if (ratio !== undefined && ratio < threshold) warn(`Textkontrast möglicherweise zu gering (${ratio.toFixed(1)}:1). Bitte Farben prüfen.`, element.id);
    }
  };
  for (const page of funnel.pages) checkPage(page, funnel.theme);
  for (const test of (funnel.abTests ?? []).filter(test => test.status === "running")) {
    const page = funnel.pages.find(page => page.id === test.pageId);
    if (page) for (const variant of test.variants.slice(1)) checkPage(pageWithVariant(page, variant), funnel.theme, `${test.name} · ${variant.name}`);
  }
  return issues;
}
