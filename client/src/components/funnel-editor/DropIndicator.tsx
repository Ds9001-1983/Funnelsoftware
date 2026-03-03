import { useDroppable } from "@dnd-kit/core";

interface DropIndicatorProps {
  id: string;
  isActive?: boolean;
}

/**
 * Visueller Drop-Indikator für Drag & Drop.
 * Zeigt eine blaue Linie an, wenn ein Element darüber gezogen wird.
 */
export function DropIndicator({ id, isActive = false }: DropIndicatorProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `drop-indicator-${id}`,
  });

  const showIndicator = isActive || isOver;

  return (
    <div
      ref={setNodeRef}
      className={`transition-all duration-200 ${
        showIndicator
          ? "h-1 bg-primary rounded-full my-2 opacity-100"
          : "h-0 my-0 opacity-0"
      }`}
    />
  );
}

interface DragPreviewProps {
  children: React.ReactNode;
}

/**
 * Visueller Vorschau-Rahmen für das gezogene Element.
 * Zeigt einen Schatten und Rahmen um das Element während des Ziehens.
 */
export function DragPreview({ children }: DragPreviewProps) {
  return (
    <div className="bg-white rounded-lg shadow-2xl ring-2 ring-primary ring-offset-2 opacity-90 transform scale-[1.02]">
      {children}
    </div>
  );
}
