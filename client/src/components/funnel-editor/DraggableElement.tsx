import { useDraggable } from "@dnd-kit/core";

interface DraggableElementProps {
  type: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

/**
 * Ein draggable Element aus der Element-Palette.
 * Kann in den Canvas gezogen werden, um neue Elemente hinzuzufügen.
 */
export function DraggableElement({ type, label, icon: Icon, description }: DraggableElementProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `new-element-${type}`,
    data: { type, isNew: true },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 p-2 rounded-md cursor-grab active:cursor-grabbing transition-all hover:bg-accent ${
        isDragging ? "opacity-50 scale-95" : ""
      }`}
    >
      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{label}</div>
        <div className="text-xs text-muted-foreground truncate">{description}</div>
      </div>
    </div>
  );
}
