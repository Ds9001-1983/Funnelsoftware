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
      className="group flex flex-col items-center gap-1 p-2 rounded-lg cursor-pointer transition-all hover:bg-accent border border-transparent hover:border-border text-center"
      title={description}
    >
      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <span className="text-[11px] font-medium leading-tight truncate w-full">{label}</span>
    </div>
  );
}
