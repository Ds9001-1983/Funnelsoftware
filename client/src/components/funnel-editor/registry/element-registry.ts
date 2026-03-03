import type { PageElement } from "@shared/schema";
import type { ElementStyles } from "../store/editor-types";

// Props passed to every element's render component
export interface ElementRenderProps {
  element: PageElement;
  textColor: string;
  primaryColor: string;
  isSelected?: boolean;
  isHovered?: boolean;
}

// Props passed to every element's settings component
export interface ElementSettingsProps {
  element: PageElement;
  onUpdate: (updates: Partial<PageElement>) => void;
}

// Element category
export type ElementCategory = "basis" | "formular" | "erweitert" | "funnel";

// Full element definition
export interface ElementDefinition {
  type: PageElement["type"];
  label: string;
  icon: string; // Lucide icon name
  category: ElementCategory;
  defaultProps: Partial<PageElement>;
  defaultStyles: Partial<ElementStyles>;
  renderComponent: React.ComponentType<ElementRenderProps>;
  settingsComponent: React.ComponentType<ElementSettingsProps>;
}

class ElementRegistryImpl {
  private elements = new Map<string, ElementDefinition>();

  register(definition: ElementDefinition): void {
    this.elements.set(definition.type, definition);
  }

  get(type: string): ElementDefinition | undefined {
    return this.elements.get(type);
  }

  getAll(): ElementDefinition[] {
    return Array.from(this.elements.values());
  }

  getByCategory(category: ElementCategory): ElementDefinition[] {
    return this.getAll().filter((el) => el.category === category);
  }

  getCategories(): { name: string; key: ElementCategory; elements: ElementDefinition[] }[] {
    return [
      { name: "Basis", key: "basis", elements: this.getByCategory("basis") },
      { name: "Formular", key: "formular", elements: this.getByCategory("formular") },
      { name: "Erweitert", key: "erweitert", elements: this.getByCategory("erweitert") },
      { name: "Funnel", key: "funnel", elements: this.getByCategory("funnel") },
    ];
  }

  has(type: string): boolean {
    return this.elements.has(type);
  }
}

export const registry = new ElementRegistryImpl();
