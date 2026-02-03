import { describe, it, expect } from "vitest";
import {
  personalizationVariables,
  sectionTemplates,
  pageTypeLabels,
  pageTypeIcons,
  elementCategories,
} from "./constants";

describe("Funnel Editor Constants", () => {
  describe("personalizationVariables", () => {
    it("enthält alle erforderlichen Variablen", () => {
      const keys = personalizationVariables.map((v) => v.key);
      
      expect(keys).toContain("{{name}}");
      expect(keys).toContain("{{email}}");
      expect(keys).toContain("{{phone}}");
      expect(keys).toContain("{{company}}");
      expect(keys).toContain("{{date}}");
    });

    it("hat für jede Variable ein Label und eine Beschreibung", () => {
      personalizationVariables.forEach((variable) => {
        expect(variable.key).toBeTruthy();
        expect(variable.label).toBeTruthy();
        expect(variable.description).toBeTruthy();
      });
    });
  });

  describe("sectionTemplates", () => {
    it("enthält mindestens 5 Templates", () => {
      expect(sectionTemplates.length).toBeGreaterThanOrEqual(5);
    });

    it("hat für jedes Template eine ID, Namen und Elemente", () => {
      sectionTemplates.forEach((template) => {
        expect(template.id).toBeTruthy();
        expect(template.name).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(Array.isArray(template.elements)).toBe(true);
      });
    });

    it("enthält das Hero-Template", () => {
      const heroTemplate = sectionTemplates.find((t) => t.id === "hero");
      expect(heroTemplate).toBeDefined();
      expect(heroTemplate?.name).toBe("Hero-Sektion");
    });
  });

  describe("pageTypeLabels", () => {
    it("hat Labels für alle Seitentypen", () => {
      expect(pageTypeLabels.welcome).toBe("Willkommen");
      expect(pageTypeLabels.question).toBe("Frage");
      expect(pageTypeLabels.multiChoice).toBe("Mehrfachauswahl");
      expect(pageTypeLabels.contact).toBe("Kontakt");
      expect(pageTypeLabels.calendar).toBe("Kalender");
      expect(pageTypeLabels.thankyou).toBe("Danke");
    });
  });

  describe("pageTypeIcons", () => {
    it("hat Icons für alle Seitentypen", () => {
      expect(pageTypeIcons.welcome).toBe("W");
      expect(pageTypeIcons.question).toBe("?");
      expect(pageTypeIcons.multiChoice).toBe("C");
      expect(pageTypeIcons.contact).toBe("@");
      expect(pageTypeIcons.calendar).toBe("K");
      expect(pageTypeIcons.thankyou).toBe("T");
    });
  });

  describe("elementCategories", () => {
    it("enthält 4 Kategorien", () => {
      expect(elementCategories.length).toBe(4);
    });

    it("hat die Kategorie 'Inhalt'", () => {
      const inhaltCategory = elementCategories.find((c) => c.name === "Inhalt");
      expect(inhaltCategory).toBeDefined();
      expect(inhaltCategory?.elements.length).toBeGreaterThan(0);
    });

    it("hat die Kategorie 'Formular'", () => {
      const formularCategory = elementCategories.find((c) => c.name === "Formular");
      expect(formularCategory).toBeDefined();
      expect(formularCategory?.elements.some((e) => e.type === "input")).toBe(true);
    });

    it("jedes Element hat type, label, icon und description", () => {
      elementCategories.forEach((category) => {
        category.elements.forEach((element) => {
          expect(element.type).toBeTruthy();
          expect(element.label).toBeTruthy();
          expect(element.icon).toBeTruthy();
          expect(element.description).toBeTruthy();
        });
      });
    });
  });
});
