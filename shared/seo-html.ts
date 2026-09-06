/**
 * React-freie HTML-String-Renderer für den <noscript data-seo>-Block der
 * Marketing-Seiten (Marker <!--SSR-CONTENT--> in client/index.html, ersetzt
 * von server/static.ts beim Start).
 *
 * Zweck: Bing, LLM-Crawler (GPTBot, ClaudeBot, PerplexityBot) und Share-Bots
 * rendern kein JavaScript — sie sahen bisher nur Meta-Tags und einen leeren
 * <body>. Dieser Block liefert ihnen den Kerninhalt (H1, Intro, Tabellen,
 * FAQs) als statisches HTML.
 *
 * WICHTIG (kein Cloaking): Es werden ausschließlich Texte aus denselben
 * Registries gerendert, die auch die React-Seiten anzeigen — der noscript-
 * Inhalt ist eine TEILMENGE des sichtbaren Inhalts. shared/seo-routes.test.ts
 * prüft das stichprobenartig.
 */

import type { AudiencePageContent, ComparisonPageContent } from "./seo-content";
import type { SeoFaq } from "./seo-links";
import type { TemplateMeta } from "./template-meta";

/** Minimales HTML-Escaping (shared — bewusst ohne Server-Import). */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function faqsHtml(faqs: SeoFaq[]): string {
  return faqs
    .map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`)
    .join("");
}

function cellText(value: boolean | string): string {
  if (typeof value === "boolean") return value ? "Ja" : "Nein";
  return esc(value);
}

export function renderComparisonHtml(c: ComparisonPageContent): string {
  const rows = c.comparisonRows
    .map(
      (r) =>
        `<tr><td>${esc(r.label)}</td><td>${cellText(r.trichterwerk)}</td><td>${cellText(r.competitor)}</td></tr>`,
    )
    .join("");
  return [
    `<h1>${esc(c.h1)}</h1>`,
    ...c.intro.map((p) => `<p>${esc(p)}</p>`),
    `<p>${esc(c.verdict)}</p>`,
    `<table><thead><tr><th>Feature</th><th>Trichterwerk</th><th>${esc(c.competitorName)}</th></tr></thead><tbody>${rows}</tbody></table>`,
    ...c.painPoints.map((p) => `<h2>${esc(p.title)}</h2><p>${esc(p.text)}</p>`),
    `<h2>${esc(c.honestSection.title)}</h2><p>${esc(c.honestSection.text)}</p>`,
    `<h2>Häufige Fragen</h2>`,
    faqsHtml(c.faqs),
  ].join("\n");
}

export function renderAudienceHtml(c: AudiencePageContent): string {
  return [
    `<h1>${esc(c.h1)}</h1>`,
    ...c.intro.map((p) => `<p>${esc(p)}</p>`),
    ...c.painPoints.map((p) => `<h2>${esc(p.title)}</h2><p>${esc(p.text)}</p>`),
    ...c.industries.map((i) => `<h3>${esc(i.title)}</h3><p>${esc(i.text)}</p>`),
    `<h2>Häufige Fragen</h2>`,
    faqsHtml(c.faqs),
  ].join("\n");
}

export function renderTemplateHtml(t: TemplateMeta): string {
  return [
    `<h1>${esc(t.h1 ?? t.name)}</h1>`,
    `<p>${esc(t.benefit)}</p>`,
    ...(t.longDescription ?? []).map((p) => `<p>${esc(p)}</p>`),
    ...(t.useCases ?? []).map((u) => `<h3>${esc(u.title)}</h3><p>${esc(u.text)}</p>`),
    ...(t.faqs?.length ? [`<h2>Häufige Fragen zur Vorlage</h2>`, faqsHtml(t.faqs)] : []),
  ].join("\n");
}

/** Generischer Renderer für Seiten, die nur H1 + Absätze + FAQ brauchen. */
export function renderSimplePageHtml(
  h1: string,
  paragraphs: string[],
  faqs: SeoFaq[] = [],
): string {
  return [
    `<h1>${esc(h1)}</h1>`,
    ...paragraphs.map((p) => `<p>${esc(p)}</p>`),
    ...(faqs.length ? [`<h2>Häufige Fragen</h2>`, faqsHtml(faqs)] : []),
  ].join("\n");
}
