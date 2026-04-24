import { memo, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Copy, Trash2, Edit2, Eye, EyeOff } from "lucide-react";
import { PageActionsMenu } from "./PageActionsMenu";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { pageTypeLabels, pageTypeIcons } from "./constants";
import type { FunnelPage } from "@shared/schema";

interface SortablePageItemProps {
  page: FunnelPage;
  index: number;
  selected: boolean;
  totalPages: number;
  isHidden?: boolean;
  onSelect: (index: number) => void;
  onDelete: (index: number) => void;
  onDuplicate: (index: number) => void;
  onRename?: (index: number, currentTitle: string) => void;
  onToggleVisibility?: (index: number) => void;
}

/**
 * Ein sortierbares Seiten-Element in der Seitenliste.
 * Unterstützt Drag-and-Drop zum Neuanordnen von Seiten.
 *
 * Callbacks nehmen den `index` als Argument entgegen, damit der Parent stabile
 * Handler (via `useCallback`) durchreichen kann. Der innere `memo()`-Wrapper
 * verhindert dann Re-Renders, wenn sich nur entfernte State-Slices ändern.
 */
function SortablePageItemImpl({
  page,
  index,
  selected,
  totalPages,
  isHidden,
  onSelect,
  onDelete,
  onDuplicate,
  onRename,
  onToggleVisibility,
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

  const handleSelect = useCallback(() => onSelect(index), [onSelect, index]);
  const handleDelete = useCallback(() => onDelete(index), [onDelete, index]);
  const handleDuplicate = useCallback(() => onDuplicate(index), [onDuplicate, index]);
  const handleRename = useCallback(
    () => onRename?.(index, page.title),
    [onRename, index, page.title],
  );
  const handleToggleVisibility = useCallback(
    () => onToggleVisibility?.(index),
    [onToggleVisibility, index],
  );

  const handleDuplicateClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDuplicate(index);
    },
    [onDuplicate, index],
  );
  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(index);
    },
    [onDelete, index],
  );

  const body = (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
        selected
          ? "bg-accent ring-2 ring-primary/20"
          : "hover:bg-muted/50"
      } ${isDragging ? "z-50 shadow-xl" : ""}`}
      onClick={handleSelect}
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
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-sm font-medium truncate">{page.title}</div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <p className="font-medium">{page.title}</p>
            <p className="text-xs opacity-70">{pageTypeLabels[page.type]}</p>
          </TooltipContent>
        </Tooltip>
        <div className="text-xs text-muted-foreground truncate">
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
              onClick={handleDuplicateClick}
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
              onClick={handleDeleteClick}
              disabled={totalPages <= 1}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Löschen</TooltipContent>
        </Tooltip>
        {onRename && onToggleVisibility && (
          <PageActionsMenu
            pageTitle={page.title}
            isHidden={isHidden}
            onRename={handleRename}
            onDuplicate={handleDuplicate}
            onToggleVisibility={handleToggleVisibility}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild onContextMenu={handleSelect}>
        {body}
      </ContextMenuTrigger>
      <ContextMenuContent>
        {onRename && (
          <ContextMenuItem onSelect={handleRename}>
            <Edit2 />
            Umbenennen
          </ContextMenuItem>
        )}
        <ContextMenuItem onSelect={handleDuplicate}>
          <Copy />
          Duplizieren
        </ContextMenuItem>
        {onToggleVisibility && (
          <ContextMenuItem onSelect={handleToggleVisibility}>
            {isHidden ? <Eye /> : <EyeOff />}
            {isHidden ? "Sichtbar machen" : "Ausblenden"}
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem
          onSelect={handleDelete}
          disabled={totalPages <= 1}
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <Trash2 />
          Löschen
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export const SortablePageItem = memo(SortablePageItemImpl);
