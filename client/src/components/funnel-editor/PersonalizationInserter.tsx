import { useState } from "react";
import { Variable } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { personalizationVariables } from "./constants";

interface PersonalizationInserterProps {
  onInsert: (variable: string) => void;
}

/**
 * Dialog zum Einfügen von Personalisierungsvariablen in Texte.
 * Variablen werden zur Laufzeit durch tatsächliche Werte ersetzt.
 */
export function PersonalizationInserter({ onInsert }: PersonalizationInserterProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setOpen(true)}
          >
            <Variable className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Variable einfügen</TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Personalisierung einfügen</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 mt-4">
          {personalizationVariables.map((v) => (
            <div
              key={v.key}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => {
                onInsert(v.key);
                setOpen(false);
              }}
            >
              <div>
                <div className="font-medium text-sm">{v.label}</div>
                <div className="text-xs text-muted-foreground">{v.description}</div>
              </div>
              <code className="text-xs bg-muted px-2 py-1 rounded">{v.key}</code>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
