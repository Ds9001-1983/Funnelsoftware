import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Section, Column, PageElement } from "@shared/schema";

interface SectionPreviewProps {
  sections: Section[];
  onUpdateSection: (sectionId: string, updates: Partial<Section>) => void;
  onDeleteSection: (sectionId: string) => void;
  onSelectSection: (sectionId: string | null) => void;
  selectedSectionId: string | null;
  onAddElementToColumn: (sectionId: string, columnId: string, type: PageElement["type"]) => void;
  renderElement: (element: PageElement) => React.ReactNode;
}

interface DroppableColumnProps {
  column: Column;
  sectionId: string;
  isSelected: boolean;
  onAddElement: (type: PageElement["type"]) => void;
  renderElement: (element: PageElement) => React.ReactNode;
}

/**
 * Droppable Column - Einzelne Spalte in einer Sektion, die Elemente aufnehmen kann.
 */
function DroppableColumn({
  column,
  sectionId,
  isSelected,
  onAddElement,
  renderElement,
}: DroppableColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${sectionId}-${column.id}`,
    data: { type: "column", sectionId, columnId: column.id },
  });

  const [showAddMenu, setShowAddMenu] = useState(false);

  return (
    <div
      ref={setNodeRef}
      className={`
        relative min-h-[100px] p-2 rounded-lg transition-all
        ${isOver ? "bg-primary/10 ring-2 ring-primary ring-dashed" : "bg-muted/20"}
        ${isSelected ? "ring-1 ring-primary/30" : ""}
      `}
      style={{ width: `${column.width}%` }}
    >
      {/* Column Elements */}
      {column.elements.length > 0 ? (
        <div className="space-y-2">
          {column.elements.map((element) => (
            <SortableColumnElement key={element.id} element={element}>
              {renderElement(element)}
            </SortableColumnElement>
          ))}
        </div>
      ) : (
        <div
          className={`
            h-full min-h-[80px] flex flex-col items-center justify-center
            border-2 border-dashed rounded-lg transition-colors cursor-pointer
            ${isOver ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50"}
          `}
          onClick={() => setShowAddMenu(!showAddMenu)}
        >
          <Plus className={`h-6 w-6 mb-1 ${isOver ? "text-primary" : "text-muted-foreground/50"}`} />
          <span className="text-xs text-muted-foreground">
            {isOver ? "Hier ablegen" : "Element hinzufügen"}
          </span>
        </div>
      )}

      {/* Column width indicator */}
      <div className="absolute -top-5 left-1/2 -translate-x-1/2">
        <span className="text-[10px] text-muted-foreground bg-background px-1 rounded">
          {column.width}%
        </span>
      </div>
    </div>
  );
}

interface SortableColumnElementProps {
  element: PageElement;
  children: React.ReactNode;
}

/**
 * Sortable Element innerhalb einer Spalte.
 */
function SortableColumnElement({ element, children }: SortableColumnElementProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative ${isDragging ? "z-50" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      {children}
    </div>
  );
}

/**
 * Vorschau-Komponente für Sektionen mit Spalten.
 * Ermöglicht Drag & Drop von Elementen in Spalten.
 */
export function SectionPreview({
  sections,
  onUpdateSection,
  onDeleteSection,
  onSelectSection,
  selectedSectionId,
  onAddElementToColumn,
  renderElement,
}: SectionPreviewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    // Handle element reordering within columns
    // (Implementation depends on your data structure)
  };

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mt-4">
      {sections.map((section) => {
        const isSelected = selectedSectionId === section.id;

        return (
          <div
            key={section.id}
            className={`
              relative rounded-lg transition-all
              ${isSelected ? "ring-2 ring-primary ring-offset-2" : "hover:ring-1 hover:ring-primary/30"}
            `}
            style={{
              backgroundColor: section.styles?.backgroundColor || "transparent",
              padding: section.styles?.padding || "16px",
            }}
            onClick={() => onSelectSection(section.id)}
          >
            {/* Section header - visible when selected */}
            {isSelected && (
              <div className="absolute -top-3 left-2 right-2 flex items-center justify-between z-10">
                <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded">
                  {section.name || "Sektion"}
                </span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-6 px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Open section settings
                    }}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-6 px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSection(section.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Columns */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-2 pt-2">
                {section.columns.map((column) => (
                  <DroppableColumn
                    key={column.id}
                    column={column}
                    sectionId={section.id}
                    isSelected={isSelected}
                    onAddElement={(type) => onAddElementToColumn(section.id, column.id, type)}
                    renderElement={renderElement}
                  />
                ))}
              </div>
            </DndContext>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Schnell-Aktion zum Hinzufügen einer Sektion.
 */
export function AddSectionButton({ onAddSection }: { onAddSection: (layout: string, columns: number[]) => void }) {
  const [showLayouts, setShowLayouts] = useState(false);

  const layouts = [
    { id: "single", name: "1 Spalte", columns: [100] },
    { id: "two-equal", name: "2 Spalten", columns: [50, 50] },
    { id: "three-equal", name: "3 Spalten", columns: [33, 34, 33] },
    { id: "two-left", name: "2/3 + 1/3", columns: [66, 34] },
    { id: "two-right", name: "1/3 + 2/3", columns: [34, 66] },
  ];

  if (showLayouts) {
    return (
      <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg">
        {layouts.map((layout) => (
          <button
            key={layout.id}
            onClick={() => {
              onAddSection(layout.id, layout.columns);
              setShowLayouts(false);
            }}
            className="flex flex-col items-center p-2 rounded hover:bg-primary/10 transition-colors"
          >
            <div className="flex gap-0.5 w-16 h-6">
              {layout.columns.map((width, idx) => (
                <div
                  key={idx}
                  className="bg-muted-foreground/30 rounded-sm"
                  style={{ width: `${width}%` }}
                />
              ))}
            </div>
            <span className="text-[10px] mt-1 text-muted-foreground">{layout.name}</span>
          </button>
        ))}
        <button
          onClick={() => setShowLayouts(false)}
          className="p-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Abbrechen
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowLayouts(true)}
      className="w-full p-3 border-2 border-dashed border-muted-foreground/20 rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-muted-foreground hover:text-primary"
    >
      <Plus className="h-4 w-4" />
      <span className="text-sm">Sektion hinzufügen</span>
    </button>
  );
}
