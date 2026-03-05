import { useCallback } from "react";
import { elementCategories } from "./constants";
import type { PageElement } from "@shared/schema";

interface ElementPaletteProps {
  onAddElement: (type: PageElement["type"]) => void;
}

interface DraggablePaletteItemProps {
  type: PageElement["type"];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  onClick: () => void;
}

/**
 * Einzelnes Element in der Palette, das per HTML5 Drag & Drop oder Klick hinzugefügt werden kann.
 */
function DraggablePaletteItem({ type, label, icon: Icon, description, onClick }: DraggablePaletteItemProps) {
  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData("elementType", type);
    e.dataTransfer.effectAllowed = "copy";
  }, [type]);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center p-3 rounded-lg cursor-grab
        bg-muted/30 hover:bg-primary/10 border border-transparent hover:border-primary/30
        transition-all duration-200 group
      `}
      title={description}
    >
      <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-2 bg-muted group-hover:bg-primary/20 transition-colors">
        <Icon className="h-5 w-5 transition-colors text-muted-foreground group-hover:text-primary" />
      </div>
      <span className="text-xs font-medium text-center truncate w-full transition-colors group-hover:text-primary">
        {label}
      </span>
    </div>
  );
}

/**
 * Palette mit allen verfügbaren Elementen im Grid-Layout.
 * Alle Elemente sind auf einen Blick sichtbar - keine versteckten Kategorien.
 * Elemente können durch Klick oder Drag & Drop zur Seite hinzugefügt werden.
 */
export function ElementPalette({ onAddElement }: ElementPaletteProps) {
  const allElements = elementCategories.flatMap(category =>
    category.elements.map(element => ({
      ...element,
      category: category.name,
    }))
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Klicken oder ziehen zum Hinzufügen
      </p>
      <div className="grid grid-cols-3 gap-2">
        {allElements.map((element) => (
          <DraggablePaletteItem
            key={element.type}
            type={element.type}
            label={element.label}
            icon={element.icon}
            description={element.description}
            onClick={() => onAddElement(element.type)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Kompakte Version der Element-Palette für die Sidebar.
 */
export function ElementPaletteCompact({ onAddElement }: ElementPaletteProps) {
  const quickElements = [
    ...elementCategories.find(c => c.name === "Inhalt")?.elements.slice(0, 4) || [],
    ...elementCategories.find(c => c.name === "Formular")?.elements.slice(0, 4) || [],
  ];

  return (
    <div className="grid grid-cols-4 gap-1">
      {quickElements.map((element) => (
        <DraggablePaletteItem
          key={element.type}
          type={element.type}
          label={element.label}
          icon={element.icon}
          description={element.description}
          onClick={() => onAddElement(element.type)}
        />
      ))}
    </div>
  );
}
