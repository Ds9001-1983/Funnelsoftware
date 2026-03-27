import { useCallback, useState } from "react";
import { Layers, Zap, LayoutGrid } from "lucide-react";
import { elementCategories } from "./constants";
import { sectionTemplates, sectionTemplateCategories } from "@/lib/section-templates";
import type { PageElement } from "@shared/schema";

interface ElementPaletteProps {
  onAddElement: (type: PageElement["type"]) => void;
  onAddSection?: (elements: Partial<PageElement>[]) => void;
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
export function ElementPalette({ onAddElement, onAddSection }: ElementPaletteProps) {
  const [activeTab, setActiveTab] = useState<"elements" | "sections">("elements");
  const [activeSectionCategory, setActiveSectionCategory] = useState<string>("content");

  return (
    <div className="space-y-3">
      {/* Tab Switcher */}
      <div className="flex gap-1 bg-muted rounded-lg p-0.5">
        <button
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
            activeTab === "elements" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("elements")}
        >
          <LayoutGrid className="h-3 w-3" />
          Elemente
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
            activeTab === "sections" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("sections")}
        >
          <Layers className="h-3 w-3" />
          Sektionen
        </button>
      </div>

      {activeTab === "elements" ? (
        <>
          <p className="text-xs text-muted-foreground">
            Klicken oder ziehen zum Hinzufügen
          </p>
          {elementCategories.map((category) => (
            <div key={category.name}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">{category.name}</p>
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {category.elements.map((element) => (
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
          ))}
        </>
      ) : (
        <>
          {/* Section Category Tabs */}
          <div className="flex gap-1 flex-wrap">
            {sectionTemplateCategories.map((cat) => (
              <button
                key={cat.id}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  activeSectionCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                onClick={() => setActiveSectionCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Section Templates */}
          <div className="space-y-2">
            {sectionTemplates
              .filter((t) => t.category === activeSectionCategory)
              .map((template) => (
                <button
                  key={template.id}
                  className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all"
                  onClick={() => onAddSection?.(template.elements)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium">{template.name}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{template.description}</p>
                  <div className="mt-2 flex gap-1">
                    {template.elements.map((el, i) => (
                      <span key={i} className="text-[9px] bg-muted px-1.5 py-0.5 rounded">
                        {el.type}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
          </div>
        </>
      )}
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
