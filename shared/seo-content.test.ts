import { describe, it, expect } from "vitest";
import { comparisonPages, seoStaticPages, getComparisonPage } from "./seo-content";
import { comparisonLinks, funnelBuilderPage } from "./seo-links";

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

  it("seoStaticPages enthält die Pillar-Seite und alle Vergleichsseiten", () => {
    const paths = seoStaticPages.map((p) => p.path);
    expect(paths).toContain(funnelBuilderPage.path);
    for (const link of comparisonLinks) {
      expect(paths).toContain(link.path);
    }
    expect(seoStaticPages.length).toBe(1 + Object.keys(comparisonPages).length);
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
