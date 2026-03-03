import { Label } from "@/components/ui/label";
import { layoutTemplates } from "./constants";

interface LayoutSelectorProps {
  onSelect: (layoutId: string, columns: number[]) => void;
  selectedLayout?: string;
}

/**
 * Auswahl für Spalten-Layouts bei der Erstellung von Sektionen.
 * Bietet verschiedene Layouts wie 1-Spalte, 2-Spalten (gleich/ungleich), etc.
 */
export function LayoutSelector({ onSelect, selectedLayout }: LayoutSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium">Spalten-Layout wählen</Label>
      <div className="grid grid-cols-3 gap-2">
        {layoutTemplates.map((layout) => {
          return (
            <button
              key={layout.id}
              onClick={() => onSelect(layout.id, layout.columns)}
              className={`p-3 rounded-lg border-2 transition-all hover:border-primary/50 ${
                selectedLayout === layout.id
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:bg-muted/50"
              }`}
            >
              <div className="flex justify-center mb-2">
                {/* Visual representation of columns */}
                <div className="flex gap-0.5 h-6 w-full max-w-[60px]">
                  {layout.columns.map((width, idx) => (
                    <div
                      key={idx}
                      className={`rounded-sm ${
                        selectedLayout === layout.id ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                      style={{ width: `${width}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="text-xs font-medium text-center">{layout.name}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
