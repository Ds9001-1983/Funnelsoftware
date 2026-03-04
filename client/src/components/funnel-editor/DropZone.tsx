import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface DropZoneProps {
  id: string;
  index: number;
  isActive?: boolean;
  className?: string;
}

export function DropZone({ id, index, isActive = false, className }: DropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      type: "dropzone",
      index,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative transition-all duration-200 ease-in-out",
        // Default state: thin line
        !isOver && !isActive && "h-1 my-0.5 opacity-0 hover:opacity-100 hover:h-8 group",
        // Active drag state: visible but not hovered
        !isOver && isActive && "h-8 my-1 opacity-100",
        // Hover state during drag
        isOver && "h-16 my-2 opacity-100",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-0 rounded-lg border-2 border-dashed transition-all duration-200",
          "flex items-center justify-center",
          // Default hover state
          !isOver && !isActive && "border-muted-foreground/20 group-hover:border-muted-foreground/40",
          // Active drag state
          !isOver && isActive && "border-primary/30 bg-primary/5",
          // Hover during drag
          isOver && "border-primary bg-primary/10 scale-[1.02]"
        )}
      >
        {(isOver || isActive) && (
          <div className={cn(
            "flex items-center gap-1 text-xs transition-opacity duration-150",
            isOver ? "text-primary opacity-100" : "text-muted-foreground opacity-60"
          )}>
            <Plus className="h-3 w-3" />
            <span>Hier ablegen</span>
          </div>
        )}
      </div>
    </div>
  );
}
