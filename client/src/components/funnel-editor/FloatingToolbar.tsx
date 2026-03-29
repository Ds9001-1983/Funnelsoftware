import { useState, useEffect } from "react";
import {
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingToolbarProps {
  elementId: string;
  elementType: string;
  position: { top: number; right: number };
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

/**
 * Floating Toolbar außerhalb der Preview.
 * Wird rechts neben dem ausgewählten Element angezeigt.
 */
export function FloatingToolbar({
  elementId,
  elementType,
  position,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  canMoveUp = true,
  canMoveDown = true,
}: FloatingToolbarProps) {
  return (
    <div
      className="fixed z-[100] flex flex-col gap-1 bg-white rounded-lg shadow-xl border p-1.5 animate-in slide-in-from-left-2"
      style={{
        top: position.top,
        right: position.right,
      }}
    >
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={onMoveUp}
        disabled={!canMoveUp}
        title="Nach oben"
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={onMoveDown}
        disabled={!canMoveDown}
        title="Nach unten"
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
      <div className="h-px bg-border my-0.5" />
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={onDuplicate}
        title="Duplizieren"
      >
        <Copy className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={onDelete}
        title="Löschen"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

/**
 * Hook zur Berechnung der Toolbar-Position basierend auf dem ausgewählten Element.
 */
export function useToolbarPosition(
  selectedElementId: string | null,
  containerRef: React.RefObject<HTMLElement>
) {
  const [position, setPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (!selectedElementId || !containerRef.current) {
      return;
    }

    const updatePosition = () => {
      const element = document.querySelector(`[data-element-id="${selectedElementId}"]`);
      const container = containerRef.current;

      if (element && container) {
        const elementRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        setPosition({
          top: elementRect.top - containerRect.top + container.scrollTop,
          right: window.innerWidth - containerRect.right + 16,
        });
      }
    };

    updatePosition();

    // Position bei Scroll neu berechnen
    const container = containerRef.current;
    container.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updatePosition, { passive: true });

    return () => {
      container.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [selectedElementId, containerRef]);

  return position;
}
