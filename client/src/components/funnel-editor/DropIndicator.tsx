import React from "react";
import { useDroppable } from "@dnd-kit/core";

interface DropIndicatorProps {
  id: string;
  isActive?: boolean;
}

/**
 * Einfüge-Indikator zwischen Elementen auf dem Canvas.
 * Zeigt eine blaue Linie wenn ein Element darüber gezogen wird.
 */
export const DropIndicator = React.memo(function DropIndicator({ id, isActive }: DropIndicatorProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${id}`,
    data: { type: "drop-indicator", position: id },
  });

  const showLine = isOver || isActive;

  return (
    <div
      ref={setNodeRef}
      className="relative py-1 transition-all duration-150"
      style={{ minHeight: showLine ? 8 : 4 }}
    >
      <div
        className={`absolute inset-x-2 top-1/2 -translate-y-1/2 transition-all duration-150 ${
          showLine
            ? "h-0.5 bg-primary shadow-[0_0_8px_rgba(124,58,237,0.4)] opacity-100"
            : "h-0 opacity-0"
        }`}
      />
    </div>
  );
});
