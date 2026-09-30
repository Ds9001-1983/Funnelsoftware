import type { PageElement } from "@shared/schema";

export interface PropertiesProps {
  element: PageElement;
  onUpdate: (updates: Partial<PageElement>) => void;
  routingManaged?: boolean;
  pages?: Array<{ id: string; title: string }>;
}
