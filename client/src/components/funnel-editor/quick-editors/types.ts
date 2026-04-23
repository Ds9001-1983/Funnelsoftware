import type { PageElement } from "@shared/schema";

export interface QuickEditorProps {
  element: PageElement;
  onUpdate: (updates: Partial<PageElement>) => void;
}
