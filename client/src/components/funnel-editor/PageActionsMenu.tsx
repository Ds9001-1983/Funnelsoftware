import { Edit2, Copy, Eye, EyeOff, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PageActionsMenuProps {
  pageTitle: string;
  isHidden?: boolean;
  onRename: () => void;
  onDuplicate: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
}

export function PageActionsMenu({
  pageTitle,
  isHidden = false,
  onRename,
  onDuplicate,
  onToggleVisibility,
  onDelete,
}: PageActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onRename}>
          <Edit2 className="mr-2 h-4 w-4" />
          Umbenennen
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate}>
          <Copy className="mr-2 h-4 w-4" />
          Duplizieren
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onToggleVisibility}>
          {isHidden ? (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Einblenden
            </>
          ) : (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              Ausblenden
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Löschen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
