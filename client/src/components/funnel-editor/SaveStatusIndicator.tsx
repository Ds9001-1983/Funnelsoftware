import { memo, useEffect, useState } from "react";
import { Check, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SaveStatus = "saved" | "dirty" | "saving" | "error";

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  lastSavedAt: Date | null;
  onRetry: () => void;
}

function formatRelative(date: Date | null): string {
  if (!date) return "";
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 5) return "gerade eben";
  if (diff < 60) return `vor ${diff} s`;
  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return `vor ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `vor ${hours} h`;
}

/**
 * Kompakter Status-Chip neben dem Funnel-Namen im Header.
 * Ersetzt den bisherigen, stumm-gelben Punkt durch explizites Feedback
 * für alle vier Save-Zustände.
 */
export const SaveStatusIndicator = memo(function SaveStatusIndicator({
  status,
  lastSavedAt,
  onRetry,
}: SaveStatusIndicatorProps) {
  // Minutengenauer Re-Render für die "vor X s"-Anzeige, nur wenn saved.
  const [, force] = useState(0);
  useEffect(() => {
    if (status !== "saved") return;
    const timer = setInterval(() => force((n) => n + 1), 15_000);
    return () => clearInterval(timer);
  }, [status]);

  if (status === "saving") {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0" role="status" aria-live="polite">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="hidden sm:inline">Speichert…</span>
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="flex items-center gap-1 text-xs text-destructive shrink-0" role="alert">
        <AlertTriangle className="h-3 w-3" />
        <span className="hidden sm:inline">Fehler</span>
        <Button
          size="sm"
          variant="ghost"
          className="h-5 px-1.5 text-xs text-destructive hover:text-destructive"
          onClick={onRetry}
        >
          Wiederholen
        </Button>
      </span>
    );
  }

  if (status === "dirty") {
    return (
      <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-500 shrink-0" aria-live="polite">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
        <span className="hidden sm:inline">Ungespeichert</span>
      </span>
    );
  }

  // saved
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0" aria-live="polite">
      <Check className="h-3 w-3 text-green-600" />
      <span className="hidden sm:inline">
        Gespeichert{lastSavedAt ? ` · ${formatRelative(lastSavedAt)}` : ""}
      </span>
    </span>
  );
});
