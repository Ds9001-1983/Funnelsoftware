import { useDraggable } from "@dnd-kit/core";
import { Plus } from "lucide-react";

export interface DraggableElementProps {
  type: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  onClick?: () => void;
}

/**
 * Ein draggable Element aus der Element-Palette.
 * Kann in den Canvas gezogen werden, um neue Elemente hinzuzufügen.
 * Unterstützt auch Klick zum Hinzufügen.
 */
export function DraggableElement({ type, label, icon: Icon, description, onClick }: DraggableElementProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `new-element-${type}`,
    data: { type, isNew: true },
  });

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger click if not dragging and onClick handler exists
    if (onClick && !isDragging) {
      e.stopPropagation();
      onClick();
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      className={`group flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all hover:bg-accent ${
        isDragging ? "opacity-50 scale-95 cursor-grabbing" : ""
      }`}
    >
      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{label}</div>
        <div className="text-xs text-muted-foreground truncate">{description}</div>
      </div>
      {onClick && (
        <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
    </div>
  );
}
