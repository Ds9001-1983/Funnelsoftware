import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutSelector } from "./LayoutSelector";
import type { Section } from "@shared/schema";

interface SectionEditorProps {
  sections: Section[];
  onAddSection: (layout: string, columns: number[]) => void;
  onUpdateSection: (sectionId: string, updates: Partial<Section>) => void;
  onDeleteSection: (sectionId: string) => void;
  onSelectSection: (sectionId: string | null) => void;
  selectedSectionId: string | null;
}

/**
 * Editor für Sektionen und Spalten einer Seite.
 * Ermöglicht das Hinzufügen, Bearbeiten und Löschen von Sektionen.
 */
export function SectionEditor({
  sections,
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  onSelectSection,
  selectedSectionId,
}: SectionEditorProps) {
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);

  return (
    <div className="space-y-4">
      {/* Section List */}
      <div className="space-y-2">
        {sections.map((section, index) => (
          <div
            key={section.id}
            onClick={() => onSelectSection(section.id)}
            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
              selectedSectionId === section.id
                ? "border-primary bg-primary/5"
                : "border-muted hover:border-muted-foreground/30"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {section.name || `Section ${index + 1}`}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSection(section.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {/* Column preview */}
            <div className="flex gap-1 h-4">
              {section.columns.map((col) => (
                <div
                  key={col.id}
                  className="bg-muted-foreground/20 rounded-sm flex items-center justify-center"
                  style={{ width: `${col.width}%` }}
                >
                  <span className="text-[8px] text-muted-foreground">
                    {col.elements.length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Section Button */}
      {showLayoutPicker ? (
        <div className="p-3 border rounded-lg space-y-3">
          <LayoutSelector
            onSelect={(layoutId, columns) => {
              onAddSection(layoutId, columns);
              setShowLayoutPicker(false);
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setShowLayoutPicker(false)}
          >
            Abbrechen
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => setShowLayoutPicker(true)}
        >
          <Plus className="h-4 w-4" />
          Neue Sektion hinzufügen
        </Button>
      )}

      {/* Selected Section Editor */}
      {selectedSectionId && (
        <div className="p-3 border rounded-lg space-y-3">
          <Label className="text-xs font-medium">Sektion bearbeiten</Label>
          {sections
            .filter((s) => s.id === selectedSectionId)
            .map((section) => (
              <div key={section.id} className="space-y-3">
                <Input
                  value={section.name || ""}
                  onChange={(e) =>
                    onUpdateSection(section.id, { name: e.target.value })
                  }
                  placeholder="Sektion Name"
                  className="h-8 text-sm"
                />
                <div className="space-y-2">
                  <Label className="text-xs">Hintergrundfarbe</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={section.styles?.backgroundColor || "#ffffff"}
                      onChange={(e) =>
                        onUpdateSection(section.id, {
                          styles: {
                            ...section.styles,
                            backgroundColor: e.target.value,
                          },
                        })
                      }
                      className="w-10 h-8 p-1 cursor-pointer"
                    />
                    <Input
                      value={section.styles?.backgroundColor || "#ffffff"}
                      onChange={(e) =>
                        onUpdateSection(section.id, {
                          styles: {
                            ...section.styles,
                            backgroundColor: e.target.value,
                          },
                        })
                      }
                      className="flex-1 h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Innenabstand</Label>
                  <Select
                    value={section.styles?.padding || "16px"}
                    onValueChange={(v) =>
                      onUpdateSection(section.id, {
                        styles: { ...section.styles, padding: v },
                      })
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8px">Klein (8px)</SelectItem>
                      <SelectItem value="16px">Normal (16px)</SelectItem>
                      <SelectItem value="24px">Mittel (24px)</SelectItem>
                      <SelectItem value="32px">Groß (32px)</SelectItem>
                      <SelectItem value="48px">Sehr groß (48px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
