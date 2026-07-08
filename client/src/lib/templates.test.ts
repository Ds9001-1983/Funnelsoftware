import { describe, it, expect } from "vitest";
import {
  funnelTemplates,
  visibleTemplates,
  templateCategories,
  getTemplatesByCategory,
  getTemplateById,
  getTemplateBySlug,
} from "./templates";
import { templateMetas } from "@shared/template-meta";

describe("funnel-templates", () => {
  describe("funnelTemplates", () => {
    it("sollte mindestens 5 Templates haben", () => {
      expect(funnelTemplates.length).toBeGreaterThanOrEqual(5);
    });

    it("sollte Templates mit allen erforderlichen Feldern haben", () => {
      funnelTemplates.forEach((template) => {
        expect(template.id).toBeTruthy();
        expect(template.name).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(template.category).toBeTruthy();
        expect(template.pages.length).toBeGreaterThan(0);
        expect(template.theme).toBeDefined();
        expect(template.theme.primaryColor).toBeTruthy();
        expect(template.theme.fontFamily).toBeTruthy();
      });
    });

    it("sollte Templates mit gültigen Seiten haben", () => {
      funnelTemplates.forEach((template) => {
        template.pages.forEach((page) => {
          expect(page.id).toBeTruthy();
          expect(page.type).toBeTruthy();
          expect(page.title).toBeTruthy();
          expect(Array.isArray(page.elements)).toBe(true);
        });
      });
    });

    it("sollte eindeutige Template-IDs haben", () => {
      const ids = funnelTemplates.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("sollte eindeutige Slugs haben", () => {
      const slugs = funnelTemplates.map((t) => t.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    });
  });

  describe("Konsistenz mit shared/template-meta.ts (öffentliche Galerie)", () => {
    it("jedes sichtbare Template hat einen Meta-Eintrag mit gleichem Namen und Kategorie", () => {
      for (const template of visibleTemplates) {
        const meta = templateMetas.find((m) => m.slug === template.slug);
        expect(meta, `template-meta-Eintrag fehlt für Slug "${template.slug}"`).toBeDefined();
        expect(meta?.name).toBe(template.name);
        expect(meta?.category).toBe(template.category);
      }
    });

    it("jeder Meta-Eintrag hat ein sichtbares Template (keine tote Galerie-Seite)", () => {
      for (const meta of templateMetas) {
        const template = getTemplateBySlug(meta.slug);
        expect(template, `Sichtbares Template fehlt für Meta-Slug "${meta.slug}"`).toBeDefined();
      }
    });
  });

  describe("getTemplateBySlug", () => {
    it("liefert das richtige Template für einen gültigen Slug", () => {
      expect(getTemplateBySlug("termin-buchen")?.id).toBe("template-termin");
    });

    it("liefert undefined für unbekannte Slugs und undefined", () => {
      expect(getTemplateBySlug("gibt-es-nicht")).toBeUndefined();
      expect(getTemplateBySlug(undefined)).toBeUndefined();
    });
  });

  describe("templateCategories", () => {
    it("sollte eine 'all' Kategorie passend zu den sichtbaren Templates haben", () => {
      const allCategory = templateCategories.find((c) => c.id === "all");
      expect(allCategory).toBeDefined();
      expect(allCategory?.count).toBe(visibleTemplates.length);
    });

    it("sollte korrekte Zählungen für jede sichtbare Kategorie haben", () => {
      templateCategories.forEach((category) => {
        if (category.id === "all") return;

        const actualCount = visibleTemplates.filter(
          (t) => t.category === category.id
        ).length;
        expect(category.count).toBe(actualCount);
      });
    });

    it("sollte keine leeren Kategorien anzeigen und die Quiz-Kategorie wieder führen", () => {
      templateCategories.forEach((category) => {
        if (category.id === "all") return;
        expect(category.count).toBeGreaterThan(0);
      });
      // Quiz ist seit dem Public-Rendering wieder sichtbar.
      expect(templateCategories.find((c) => c.id === "quiz")).toBeDefined();
    });
  });

  describe("getTemplatesByCategory", () => {
    it("sollte alle sichtbaren Templates für 'all' zurückgeben", () => {
      const templates = getTemplatesByCategory("all");
      expect(templates.length).toBe(visibleTemplates.length);
    });

    it("sollte nur Templates der angegebenen Kategorie zurückgeben", () => {
      const leadsTemplates = getTemplatesByCategory("leads");
      leadsTemplates.forEach((t) => {
        expect(t.category).toBe("leads");
      });
    });

    it("sollte ein leeres Array für unbekannte Kategorien zurückgeben", () => {
      const templates = getTemplatesByCategory("unknown-category");
      expect(templates.length).toBe(0);
    });
  });

  describe("getTemplateById", () => {
    it("sollte das richtige Template für eine gültige ID zurückgeben", () => {
      const template = getTemplateById("template-leadmagnet");
      expect(template).toBeDefined();
      expect(template?.id).toBe("template-leadmagnet");
      expect(template?.name).toBe("Lead Magnet");
    });

    it("sollte undefined für eine ungültige ID zurückgeben", () => {
      const template = getTemplateById("non-existent-id");
      expect(template).toBeUndefined();
    });
  });

  describe("Template-Kategorien", () => {
    it("sollte Lead-Generierung Templates haben", () => {
      const templates = getTemplatesByCategory("leads");
      expect(templates.length).toBeGreaterThan(0);
    });

    it("sollte Recruiting Templates haben", () => {
      const templates = getTemplatesByCategory("recruiting");
      expect(templates.length).toBeGreaterThan(0);
    });

    it("sollte das Quiz-Template wieder anzeigen — mit echtem Quiz-Element", () => {
      const templates = getTemplatesByCategory("quiz");
      expect(templates.length).toBe(1);

      const quizTemplate = getTemplateById("template-quiz");
      expect(quizTemplate).toBeDefined();
      expect(quizTemplate?.hidden).toBeFalsy();

      // Das Template zeigt das Feature wirklich: mindestens eine Seite
      // enthält ein konfiguriertes quiz-Element.
      const quizElement = quizTemplate?.pages
        .flatMap((p) => p.elements)
        .find((el) => el.type === "quiz");
      expect(quizElement).toBeDefined();
      expect(quizElement?.quizConfig?.questions.length).toBeGreaterThan(0);
      expect(quizElement?.quizConfig?.results.length).toBeGreaterThan(0);
    });
  });
});
