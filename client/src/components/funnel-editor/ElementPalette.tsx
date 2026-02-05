import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { elementCategories } from "./constants";
import type { PageElement } from "@shared/schema";

interface ElementPaletteProps {
  onAddElement: (type: PageElement["type"]) => void;
}

/**
 * Palette mit allen verfügbaren Elementen, gruppiert nach Kategorien.
 * Elemente können durch Klick zur Seite hinzugefügt werden.
 */
export function ElementPalette({ onAddElement }: ElementPaletteProps) {
  const [openCategories, setOpenCategories] = useState<string[]>(["Inhalt", "Formular"]);

  const toggleCategory = (name: string) => {
    setOpenCategories(prev =>
      prev.includes(name)
        ? prev.filter(c => c !== name)
        : [...prev, name]
    );
  };

  return (
    <div className="space-y-2">
      {elementCategories.map((category) => (
        <Collapsible
          key={category.name}
          open={openCategories.includes(category.name)}
          onOpenChange={() => toggleCategory(category.name)}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-md hover:bg-muted/50 transition-colors">
            <span className="text-sm font-medium">{category.name}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${
              openCategories.includes(category.name) ? "rotate-180" : ""
            }`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1">
            {category.elements.map((element) => (
              <div
                key={element.type}
                onClick={() => onAddElement(element.type)}
                className="flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all hover:bg-accent"
              >
                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                  <element.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{element.label}</div>
                  <div className="text-xs text-muted-foreground truncate">{element.description}</div>
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
