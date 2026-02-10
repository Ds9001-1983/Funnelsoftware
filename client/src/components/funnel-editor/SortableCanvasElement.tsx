import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Copy, Trash2 } from "lucide-react";
import type { PageElement } from "@shared/schema";
import { ElementPreviewRenderer } from "./ElementPreviewRenderer";
import { elementTypeLabels } from "./ElementWrapper";

interface SortableCanvasElementProps {
  element: PageElement;
  textColor: string;
  primaryColor: string;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  formValues?: Record<string, string>;
  updateFormValue?: (elementId: string, value: string) => void;
}

/**
 * Sortierbares Element im Editor-Canvas.
 * Kombiniert useSortable (Drag-to-Reorder) mit ElementPreviewRenderer (Vorschau).
 * Zeigt Drag-Handle, Selection-Ring und Aktions-Buttons.
 */
export function SortableCanvasElement({
  element,
  textColor,
  primaryColor,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  formValues = {},
  updateFormValue,
}: SortableCanvasElementProps) {
  const [isHovered, setIsHovered] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: element.id,
    data: { sortableType: "canvas-element", elementType: element.type },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group rounded-lg transition-all duration-150 ${
        isDragging
          ? "opacity-30 scale-[0.98]"
          : isSelected
          ? "ring-2 ring-primary ring-offset-2 bg-primary/5"
          : isHovered
          ? "ring-2 ring-primary/40 ring-offset-1 bg-primary/5"
          : ""
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Drag Handle - linker Rand */}
      <div
        {...attributes}
        {...listeners}
        className={`absolute left-0 top-0 bottom-0 w-7 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none rounded-l-lg z-10 transition-all ${
          isDragging
            ? "bg-primary/20"
            : isSelected || isHovered
            ? "bg-primary/10 opacity-100"
            : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <GripVertical className={`h-4 w-4 ${
          isDragging ? "text-primary" : "text-muted-foreground"
        }`} />
      </div>

      {/* Element-Typ Label */}
      {(isSelected || isHovered) && !isDragging && (
        <div className="absolute -top-3 left-8 z-20">
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded shadow-sm ${
              isSelected
                ? "bg-primary text-primary-foreground"
                : "bg-white text-gray-700 border border-gray-200"
            }`}
          >
            {elementTypeLabels[element.type] || element.type}
          </span>
        </div>
      )}

      {/* Element-Inhalt mit Padding links für Drag-Handle */}
      <div className="ml-7">
        <ElementPreviewRenderer
          element={element}
          textColor={textColor}
          primaryColor={primaryColor}
          selectedElementId={null}
          onSelectElement={() => onSelect()}
          formValues={formValues}
          updateFormValue={updateFormValue}
        />
      </div>

      {/* Aktions-Buttons rechts oben */}
      {(isSelected || isHovered) && !isDragging && (
        <div className="absolute -right-1 -top-1 z-20 flex items-center gap-0.5 bg-white rounded-md shadow-md border p-0.5">
          <button
            className="p-1 rounded hover:bg-primary/10 transition-colors"
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            title="Duplizieren"
          >
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            className="p-1 rounded hover:bg-destructive/10 transition-colors"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Löschen"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </button>
        </div>
      )}
    </div>
  );
}
