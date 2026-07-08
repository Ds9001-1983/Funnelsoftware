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
    expect(seoStaticPages.length).toBe(
      1 +
        Object.keys(comparisonPages).length +
        audiencePages.length +
        templateSeoPages.length,
    );
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
