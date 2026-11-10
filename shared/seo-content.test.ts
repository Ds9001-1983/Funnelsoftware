import { describe, it, expect } from "vitest";
import {
  comparisonPages,
  seoStaticPages,
  getComparisonPage,
  audiencePagesContent,
  getAudiencePage,
} from "./seo-content";
import {
  audiencePages,
  comparisonLinks,
  funnelBuilderPage,
  vergleichIndexPage,
  TEMPLATE_GALLERY_PATH,
} from "./seo-links";
import { templateSeoPages, templateMetas, getTemplateMeta } from "./template-meta";

describe("seo-content ↔ seo-links Konsistenz", () => {
  it("jeder comparisonLink hat einen Registry-Eintrag mit passendem Slug", () => {
    for (const link of comparisonLinks) {
      const slug = link.path.replace("/vergleich/", "");
      const page = comparisonPages[slug];
      expect(page, `Registry-Eintrag fehlt für ${link.path}`).toBeDefined();
      expect(page.competitorName).toBe(link.competitor);
    }
  });

  it("jede Registry-Seite hat einen comparisonLink (keine unverlinkte SEO-Seite)", () => {
    for (const page of Object.values(comparisonPages)) {
      const link = comparisonLinks.find((l) => l.path === `/vergleich/${page.slug}`);
      expect(link, `comparisonLink fehlt für ${page.slug}`).toBeDefined();
    }
  });

  it("seoStaticPages enthält Pillar-, Vergleichs-, Zielgruppen- und Galerie-Seiten", () => {
    const paths = seoStaticPages.map((p) => p.path);
    expect(paths).toContain(funnelBuilderPage.path);
    // Der Vergleichs-Index fehlte früher in Sitemap UND SSR-Meta — nie wieder.
    expect(paths).toContain(vergleichIndexPage.path);
    for (const link of comparisonLinks) {
      expect(paths).toContain(link.path);
    }
    for (const page of audiencePages) {
      expect(paths).toContain(page.path);
    }
    expect(paths).toContain(TEMPLATE_GALLERY_PATH);
    for (const meta of templateMetas) {
      expect(paths).toContain(`${TEMPLATE_GALLERY_PATH}/${meta.slug}`);
    }
    // 3 = Pillar (/funnel-builder) + Vergleichs-Index (/vergleich) + /partner.
    expect(seoStaticPages.length).toBe(
      3 +
        Object.keys(comparisonPages).length +
        audiencePages.length +
        templateSeoPages.length,
    );
  });

  it("Vergleichs- und Zielgruppen-Seiten liefern JSON-LD für die SSR-Injektion", () => {
    for (const link of comparisonLinks) {
      const page = seoStaticPages.find((p) => p.path === link.path);
      expect(page?.jsonLd, `jsonLd fehlt für ${link.path}`).toBeDefined();
      expect(JSON.stringify(page?.jsonLd)).toContain("FAQPage");
    }
    for (const audience of audiencePages) {
      const page = seoStaticPages.find((p) => p.path === audience.path);
      expect(page?.jsonLd, `jsonLd fehlt für ${audience.path}`).toBeDefined();
      expect(JSON.stringify(page?.jsonLd)).toContain("BreadcrumbList");
    }
    const pillar = seoStaticPages.find((p) => p.path === funnelBuilderPage.path);
    expect(JSON.stringify(pillar?.jsonLd)).toContain("FAQPage");
  });

  it("jede Zielgruppen-Seite hat Content, und jeder Content eine Seite", () => {
    for (const page of audiencePages) {
      const slug = page.path.replace(/^\//, "");
      expect(getAudiencePage(slug), `Content fehlt für ${page.path}`).toBeDefined();
    }
    for (const content of Object.values(audiencePagesContent)) {
      const page = audiencePages.find((p) => p.path === `/${content.slug}`);
      expect(page, `seo-links-Eintrag fehlt für ${content.slug}`).toBeDefined();
      // Showcase-Slugs müssen auf echte Template-Metas zeigen.
      for (const slug of content.templateShowcase) {
        expect(getTemplateMeta(slug), `Showcase-Slug "${slug}" existiert nicht`).toBeDefined();
      }
    }
    expect(getAudiencePage("gibt-es-nicht")).toBeUndefined();
    expect(getAudiencePage("__proto__")).toBeUndefined();
  });

  it("relatedSlugs verweisen nur auf existierende Registry-Einträge", () => {
    for (const page of Object.values(comparisonPages)) {
      for (const slug of page.relatedSlugs) {
        expect(comparisonPages[slug], `relatedSlug "${slug}" in ${page.slug} existiert nicht`).toBeDefined();
      }
    }
  });

  it("Meta-Längen bleiben im SEO-Rahmen", () => {
    for (const page of seoStaticPages) {
      expect(page.metaTitle.length, `metaTitle zu lang: ${page.path}`).toBeLessThanOrEqual(60);
      expect(page.metaDescription.length, `metaDescription zu lang: ${page.path}`).toBeLessThanOrEqual(160);
    }
  });
});

describe("template-meta", () => {
  it("Template-Slugs sind eindeutig und URL-tauglich", () => {
    const slugs = templateMetas.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("getTemplateMeta liefert bekannte Slugs und ist gehärtet", () => {
    expect(getTemplateMeta("termin-buchen")?.name).toBe("Termin buchen");
    expect(getTemplateMeta("gibt-es-nicht")).toBeUndefined();
    expect(getTemplateMeta(undefined)).toBeUndefined();
    for (const key of ["constructor", "__proto__", "toString"]) {
      expect(getTemplateMeta(key)).toBeUndefined();
    }
  });
});

describe("getComparisonPage", () => {
  it("liefert bekannte Slugs", () => {
    expect(getComparisonPage("typeform-alternative")?.competitorName).toBe("Typeform");
  });

  it("liefert undefined für unbekannte Slugs und undefined", () => {
    expect(getComparisonPage("gibt-es-nicht")).toBeUndefined();
    expect(getComparisonPage(undefined)).toBeUndefined();
  });

  it("ist gehärtet gegen Prototype-Keys", () => {
    for (const key of ["constructor", "__proto__", "toString", "hasOwnProperty"]) {
      expect(getComparisonPage(key)).toBeUndefined();
    }
  });
});

describe("Perspective-Preisübersicht", () => {
  const page = comparisonPages["perspective-alternative"];
  const staticPage = seoStaticPages.find((p) => p.path === "/vergleich/perspective-alternative");
  const bodyHtml = staticPage?.bodyHtml ?? "";
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  it("nennt die vier Tarife mit Preisen und Kontingenten der Anbieterquellen", () => {
    // Werte aus perspective.co/pricing und dem Hilfeartikel zu den Tarifen.
    // Bei einer Änderung zuerst die Quellen prüfen, dann Werte und Prüfdatum
    // (shared/comparison-evidence.ts) gemeinsam anpassen.
    expect(page.priceOverview?.plans).toEqual([
      { plan: "Base", monthly: "59 €", yearly: "47 €", liveFunnels: "2", leads: "100", seats: "1" },
      { plan: "Grow", monthly: "184 €", yearly: "147 €", liveFunnels: "10", leads: "500", seats: "3" },
      { plan: "Expand", monthly: "369 €", yearly: "297 €", liveFunnels: "20", leads: "1.000", seats: "5" },
      { plan: "Scale", monthly: "–", yearly: "individuell", liveFunnels: "ab 60", leads: "individuell", seats: "individuell" },
    ]);
  });

  it("steht mit Tabelle, Zusatzkosten und eigenem Tarif im Crawler-HTML", () => {
    const overview = page.priceOverview;
    expect(overview).toBeDefined();
    if (!overview) return;
    expect(bodyHtml).toContain(`<h2>${esc(overview.title)}</h2>`);
    expect(bodyHtml).toContain(esc(overview.intro));
    for (const plan of overview.plans) {
      expect(bodyHtml).toContain(
        `<tr><td>${esc(plan.plan)}</td><td>${esc(plan.monthly)}</td><td>${esc(plan.yearly)}</td><td>${esc(plan.liveFunnels)}</td><td>${esc(plan.leads)}</td><td>${esc(plan.seats)}</td></tr>`,
      );
    }
    expect(overview.notes.length).toBeGreaterThan(0);
    for (const note of overview.notes) {
      expect(bodyHtml).toContain(esc(note));
    }
    expect(bodyHtml).toContain(esc(overview.ownOffer));
  });

  it("beantwortet die Preisfragen in den FAQ und im JSON-LD", () => {
    const questions = page.faqs.map((faq) => faq.q);
    const jsonLd = JSON.stringify(staticPage?.jsonLd);
    for (const question of ["Was kostet Perspective?", "Welche Preispläne hat Perspective?"]) {
      expect(questions).toContain(question);
      expect(jsonLd).toContain(question);
    }
  });

  it("lässt Vergleichsseiten ohne eigene Preisübersicht unverändert", () => {
    const typeform = seoStaticPages.find((p) => p.path === "/vergleich/typeform-alternative");
    expect(comparisonPages["typeform-alternative"].priceOverview).toBeUndefined();
    expect(typeform?.bodyHtml).not.toContain("Was kosten die Tarife?");
  });
});
