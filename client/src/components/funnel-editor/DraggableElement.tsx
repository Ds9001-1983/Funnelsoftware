import { useCallback } from "react";
import { Plus } from "lucide-react";

export interface DraggableElementProps {
  type: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  onClick?: () => void;
}

/**
 * Ein Element aus der Element-Palette.
 * Kann per HTML5 Drag & Drop in den Canvas gezogen werden.
 * Unterstützt auch Klick zum Hinzufügen.
 */
export function DraggableElement({ type, label, icon: Icon, description, onClick }: DraggableElementProps) {
  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData("elementType", type);
    e.dataTransfer.effectAllowed = "copy";
  }, [type]);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className="group flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all hover:bg-accent"
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
