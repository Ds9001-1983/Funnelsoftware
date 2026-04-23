import type { PageElement } from "@shared/schema";

export interface PropertiesProps {
  element: PageElement;
  onUpdate: (updates: Partial<PageElement>) => void;
  pages?: Array<{ id: string; title: string }>;
}
