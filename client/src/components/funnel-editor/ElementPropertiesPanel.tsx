import { X } from "lucide-react";
import type { PageElement } from "@shared/schema";
import { propertyEditors, elementTypeLabels } from "./properties";

interface ElementPropertiesPanelProps {
  element: PageElement;
  onUpdate: (updates: Partial<PageElement>) => void;
  onClose: () => void;
  pages?: Array<{ id: string; title: string }>;
}

/**
 * Panel for editing element properties in the Design tab.
 * Dispatches to the appropriate per-type editor under `./properties/`.
 */
export function ElementPropertiesPanel({
  element,
  onUpdate,
  onClose,
  pages = [],
}: ElementPropertiesPanelProps) {
  const Editor = propertyEditors[element.type];
  const label = elementTypeLabels[element.type] || element.type;

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">{label}</h4>
        <button className="p-1 rounded hover:bg-muted" onClick={onClose}>
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {Editor ? (
        <Editor element={element} onUpdate={onUpdate} pages={pages} />
      ) : (
        <div className="text-sm text-muted-foreground">
          Keine Eigenschaften verfügbar für Typ "{element.type}".
        </div>
      )}
    </div>
  );
}
