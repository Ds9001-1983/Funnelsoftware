import React, { useState, useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { registry, type ElementDefinition } from "./registry/element-registry";
import { useEditorStore } from "./store/editor-store";
import * as Icons from "lucide-react";

/**
 * Linke Seitenleiste: Element-Palette mit Kategorien und Drag-Karten.
 */
export function ElementPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const addElement = useEditorStore((s) => s.addElement);

  const categories = useMemo(() => registry.getCategories(), []);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        elements: cat.elements.filter(
          (el) =>
            el.label.toLowerCase().includes(q) ||
            el.type.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.elements.length > 0);
  }, [categories, searchQuery]);

  const toggleCategory = (key: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold mb-3">Elemente</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Element suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredCategories.map((category) => {
          const isCollapsed = collapsedCategories.has(category.key);
          return (
            <div key={category.key}>
              <button
                className="flex items-center gap-1.5 w-full text-left mb-2 group"
                onClick={() => toggleCategory(category.key)}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {category.name}
                </span>
                <span className="text-xs text-muted-foreground/60 ml-auto">
                  {category.elements.length}
                </span>
              </button>
              {!isCollapsed && (
                <div className="grid grid-cols-2 gap-1.5">
                  {category.elements.map((el) => (
                    <DraggableCard
                      key={el.type}
                      definition={el}
                      onClickAdd={() => addElement(el.type)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Eine draggbare Element-Karte in der Palette.
 */
function DraggableCard({
  definition,
  onClickAdd,
}: {
  definition: ElementDefinition;
  onClickAdd: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${definition.type}`,
    data: { type: definition.type, isNew: true },
  });

  // Get icon component from lucide-react
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[definition.icon];

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border border-border bg-background cursor-grab transition-all
        hover:border-primary/40 hover:shadow-sm hover:bg-primary/5
        active:scale-95 active:cursor-grabbing
        ${isDragging ? "opacity-40 scale-95" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onClickAdd();
      }}
    >
      <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center">
        {IconComponent ? (
          <IconComponent className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <span className="text-xs text-muted-foreground">?</span>
        )}
      </div>
      <span className="text-[11px] text-center leading-tight text-muted-foreground font-medium">
        {definition.label}
      </span>
    </div>
  );
}
