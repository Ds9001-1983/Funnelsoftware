import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PageElement } from "@shared/schema";

interface SortableElementItemProps {
  element: PageElement;
  onDelete: () => void;
  onDuplicate: () => void;
  children: React.ReactNode;
  isOverlay?: boolean;
}

/**
 * Ein sortierbares Element innerhalb einer Seite.
 * Unterstützt Drag-and-Drop zum Neuanordnen von Elementen.
 * Mit verbessertem visuellen Feedback während des Ziehens.
 */
export function SortableElementItem({
  element,
  onDelete,
  onDuplicate,
  children,
  isOverlay = false,
}: SortableElementItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Overlay-Ansicht für DragOverlay
  if (isOverlay) {
    return (
      <div className="bg-white rounded-lg shadow-2xl ring-2 ring-primary ring-offset-2 opacity-95 transform scale-[1.02]">
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center bg-primary/10 rounded-l-lg">
            <GripVertical className="h-4 w-4 text-primary" />
          </div>
          <div className="ml-8">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Drop-Indikator oben */}
      {isOver && (
        <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary rounded-full z-10 animate-pulse" />
      )}

      <div
        ref={setNodeRef}
        style={style}
        className={`group relative transition-all duration-200 ${
          isDragging
            ? "opacity-40 scale-[0.98] ring-2 ring-primary/30 ring-offset-1 rounded-lg bg-muted/20"
            : ""
        }`}
      >
        <div
          {...attributes}
          {...listeners}
          className={`absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none rounded-l-lg transition-all duration-200 ${
            isDragging
              ? "bg-primary/20"
              : "bg-muted/50 hover:bg-primary/10 opacity-50 group-hover:opacity-100"
          }`}
          data-testid={`element-drag-handle-${element.id}`}
        >
          <GripVertical className={`h-4 w-4 transition-colors ${
            isDragging ? "text-primary" : "text-muted-foreground"
          }`} />
        </div>
        <div className="ml-8">
          {children}
        </div>
        <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 hover:bg-primary/10"
            onClick={onDuplicate}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
