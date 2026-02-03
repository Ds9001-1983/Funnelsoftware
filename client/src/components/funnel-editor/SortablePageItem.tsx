import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { pageTypeLabels, pageTypeIcons } from "./constants";
import type { FunnelPage } from "@shared/schema";

interface SortablePageItemProps {
  page: FunnelPage;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  totalPages: number;
}

/**
 * Ein sortierbares Seiten-Element in der Seitenliste.
 * Unterstützt Drag-and-Drop zum Neuanordnen von Seiten.
 */
export function SortablePageItem({
  page,
  index,
  selected,
  onSelect,
  onDelete,
  onDuplicate,
  totalPages,
}: SortablePageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
        selected
          ? "bg-accent ring-2 ring-primary/20"
          : "hover:bg-muted/50"
      } ${isDragging ? "z-50 shadow-xl" : ""}`}
      onClick={onSelect}
      data-testid={`page-item-${index}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none p-1 -ml-1 opacity-50 group-hover:opacity-100 transition-opacity"
        data-testid={`drag-handle-${index}`}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div
        className="h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 shadow-sm"
        style={{ backgroundColor: page.backgroundColor || "#e5e5e5" }}
      >
        <span style={{ color: page.backgroundColor ? "#fff" : "#666" }}>
          {pageTypeIcons[page.type]}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{page.title}</div>
        <div className="text-xs text-muted-foreground">
          {pageTypeLabels[page.type]}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Duplizieren</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={totalPages <= 1}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Löschen</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
