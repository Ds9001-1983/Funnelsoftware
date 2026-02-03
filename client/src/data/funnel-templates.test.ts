import { describe, it, expect } from "vitest";
import {
  funnelTemplates,
  templateCategories,
  getTemplatesByCategory,
  getTemplateById,
} from "./funnel-templates";

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
  });

  describe("templateCategories", () => {
    it("sollte eine 'all' Kategorie haben", () => {
      const allCategory = templateCategories.find((c) => c.id === "all");
      expect(allCategory).toBeDefined();
      expect(allCategory?.count).toBe(funnelTemplates.length);
    });

    it("sollte korrekte Zählungen für jede Kategorie haben", () => {
      templateCategories.forEach((category) => {
        if (category.id === "all") return;
        
        const actualCount = funnelTemplates.filter(
          (t) => t.category === category.id
        ).length;
        expect(category.count).toBe(actualCount);
      });
    });
  });

  describe("getTemplatesByCategory", () => {
    it("sollte alle Templates für 'all' zurückgeben", () => {
      const templates = getTemplatesByCategory("all");
      expect(templates.length).toBe(funnelTemplates.length);
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
      const template = getTemplateById("lead-magnet");
      expect(template).toBeDefined();
      expect(template?.id).toBe("lead-magnet");
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

    it("sollte Quiz Templates haben", () => {
      const templates = getTemplatesByCategory("quiz");
      expect(templates.length).toBeGreaterThan(0);
    });
  });
});
