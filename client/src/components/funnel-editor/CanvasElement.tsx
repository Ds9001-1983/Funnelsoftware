import React, { useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Copy, Trash2 } from "lucide-react";
import type { PageElement } from "@shared/schema";
import { registry } from "./registry/element-registry";
import { useEditorStore } from "./store/editor-store";

interface CanvasElementProps {
  element: PageElement;
  textColor: string;
  primaryColor: string;
}

/**
 * Wrapper für jedes Element auf dem Canvas.
 * Zeigt das Render-Component aus der Registry, Selection/Hover-State und Drag-Handle.
 */
export const CanvasElement = React.memo(function CanvasElement({
  element,
  textColor,
  primaryColor,
}: CanvasElementProps) {
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const hoveredElementId = useEditorStore((s) => s.hoveredElementId);
  const selectElement = useEditorStore((s) => s.selectElement);
  const hoverElement = useEditorStore((s) => s.hoverElement);
  const deleteElement = useEditorStore((s) => s.deleteElement);
  const duplicateElement = useEditorStore((s) => s.duplicateElement);

  const isSelected = selectedElementId === element.id;
  const isHovered = hoveredElementId === element.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: element.id,
    data: { type: "canvas-element", element },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const definition = registry.get(element.type);
  const RenderComponent = definition?.renderComponent;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    selectElement(element.id);
  }, [element.id, selectElement]);

  const handleMouseEnter = useCallback(() => {
    hoverElement(element.id);
  }, [element.id, hoverElement]);

  const handleMouseLeave = useCallback(() => {
    hoverElement(null);
  }, [hoverElement]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElement(element.id);
  }, [element.id, deleteElement]);

  const handleDuplicate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateElement(element.id);
  }, [element.id, duplicateElement]);

  // Apply element styles
  const elementStyles: React.CSSProperties = {};
  if (element.styles) {
    if (element.styles.backgroundColor) elementStyles.backgroundColor = element.styles.backgroundColor;
    if (element.styles.padding) elementStyles.padding = element.styles.padding;
    if (element.styles.margin) elementStyles.margin = element.styles.margin;
    if (element.styles.borderRadius) elementStyles.borderRadius = element.styles.borderRadius;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg transition-all duration-150 ${
        isSelected
          ? "ring-2 ring-primary ring-offset-2"
          : isHovered
          ? "ring-1 ring-primary/40 ring-offset-1"
          : ""
      }`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-element-id={element.id}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className={`absolute -left-6 top-1/2 -translate-y-1/2 w-5 h-8 flex items-center justify-center cursor-grab rounded-l transition-opacity ${
          isSelected || isHovered ? "opacity-100" : "opacity-0"
        }`}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {/* Quick actions (top right) */}
      <div
        className={`absolute -top-3 right-1 flex gap-1 z-10 transition-opacity ${
          isSelected || isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <button
          onClick={handleDuplicate}
          className="h-6 w-6 rounded bg-card border shadow-sm flex items-center justify-center hover:bg-muted"
        >
          <Copy className="h-3 w-3 text-muted-foreground" />
        </button>
        <button
          onClick={handleDelete}
          className="h-6 w-6 rounded bg-card border shadow-sm flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Element content */}
      <div style={elementStyles}>
        {RenderComponent ? (
          <RenderComponent
            element={element}
            textColor={textColor}
            primaryColor={primaryColor}
            isSelected={isSelected}
            isHovered={isHovered}
          />
        ) : (
          <div className="p-3 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg border border-dashed">
            Unbekannt: {element.type}
          </div>
        )}
      </div>
    </div>
  );
});
