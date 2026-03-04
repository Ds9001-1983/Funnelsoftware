import { Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HistoryIndicatorProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  historyLength: number;
  maxHistory?: number;
}

export function HistoryIndicator({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  historyLength,
  maxHistory = 50,
}: HistoryIndicatorProps) {
  const progress = Math.min((historyLength / maxHistory) * 100, 100);

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span>Rückgängig (Ctrl+Z)</span>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onRedo}
            disabled={!canRedo}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span>Wiederholen (Ctrl+Y)</span>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative w-12 h-1.5 bg-muted rounded-full overflow-hidden cursor-default">
            <div
              className="absolute left-0 top-0 h-full bg-primary/40 rounded-full transition-all duration-300"
              style={{ width: progress + "%" }}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <span>{historyLength} / {maxHistory} Schritte</span>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export default HistoryIndicator;
