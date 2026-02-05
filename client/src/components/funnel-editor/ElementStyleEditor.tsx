import { useState } from "react";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { PageElement } from "@shared/schema";

interface ElementStyleEditorProps {
  element: PageElement;
  onUpdate: (updates: Partial<PageElement>) => void;
}

// Parse numeric value from style string (e.g., "16px" -> 16)
const parsePixelValue = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Editor für erweiterte Element-Styling-Optionen.
 * Ermöglicht die Anpassung von Farben, Abständen, Größen und mehr.
 */
export function ElementStyleEditor({ element, onUpdate }: ElementStyleEditorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const styles = element.styles || {};

  const updateStyles = (updates: Partial<NonNullable<PageElement["styles"]>>) => {
    onUpdate({
      styles: { ...styles, ...updates },
    });
  };

  return (
    <div className="space-y-4 border-t pt-3 mt-3">
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-md hover:bg-muted/50 transition-colors">
          <span className="text-sm font-medium">Design-Optionen</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          {/* Colors */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground">Farben</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Textfarbe</Label>
                <div className="flex gap-1">
                  <Input
                    type="color"
                    value={styles.color || "#000000"}
                    onChange={(e) => updateStyles({ color: e.target.value })}
                    className="w-10 h-8 p-1 cursor-pointer"
                  />
                  <Input
                    value={styles.color || ""}
                    onChange={(e) => updateStyles({ color: e.target.value })}
                    placeholder="Standard"
                    className="flex-1 h-8 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Hintergrund</Label>
                <div className="flex gap-1">
                  <Input
                    type="color"
                    value={styles.backgroundColor || "#ffffff"}
                    onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
                    className="w-10 h-8 p-1 cursor-pointer"
                  />
                  <Input
                    value={styles.backgroundColor || ""}
                    onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
                    placeholder="Keine"
                    className="flex-1 h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Typography (only for text elements) */}
          {(element.type === "heading" || element.type === "text" || element.type === "button") && (
            <div className="space-y-3">
              <Label className="text-xs font-medium text-muted-foreground">Typografie</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Schriftgröße</Label>
                  <Select
                    value={styles.fontSize || (element.type === "heading" ? "24px" : "16px")}
                    onValueChange={(v) => updateStyles({ fontSize: v })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12px">12px - Klein</SelectItem>
                      <SelectItem value="14px">14px - Normal</SelectItem>
                      <SelectItem value="16px">16px - Standard</SelectItem>
                      <SelectItem value="18px">18px - Mittel</SelectItem>
                      <SelectItem value="20px">20px - Groß</SelectItem>
                      <SelectItem value="24px">24px - Überschrift</SelectItem>
                      <SelectItem value="32px">32px - Titel</SelectItem>
                      <SelectItem value="48px">48px - Hero</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Schriftstärke</Label>
                  <Select
                    value={styles.fontWeight || "normal"}
                    onValueChange={(v) => updateStyles({ fontWeight: v })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="500">Medium</SelectItem>
                      <SelectItem value="600">Halbfett</SelectItem>
                      <SelectItem value="bold">Fett</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Text Alignment */}
              <div className="space-y-1">
                <Label className="text-xs">Ausrichtung</Label>
                <div className="flex gap-1">
                  <Button
                    variant={styles.textAlign === "left" || !styles.textAlign ? "default" : "outline"}
                    size="sm"
                    className="flex-1 h-8"
                    onClick={() => updateStyles({ textAlign: "left" })}
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={styles.textAlign === "center" ? "default" : "outline"}
                    size="sm"
                    className="flex-1 h-8"
                    onClick={() => updateStyles({ textAlign: "center" })}
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={styles.textAlign === "right" ? "default" : "outline"}
                    size="sm"
                    className="flex-1 h-8"
                    onClick={() => updateStyles({ textAlign: "right" })}
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Spacing */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground">Außenabstand</Label>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Abstand: {parsePixelValue(styles.margin, 0)}px</Label>
              <Slider
                value={[parsePixelValue(styles.margin, 0)]}
                onValueChange={([v]) => updateStyles({ margin: `${v}px` })}
                min={0}
                max={64}
                step={4}
                className="w-32"
              />
            </div>
          </div>

          {/* Padding (for containers/buttons) */}
          {(element.type === "button" || element.type === "input" || element.type === "textarea") && (
            <div className="space-y-3">
              <Label className="text-xs font-medium text-muted-foreground">Innenabstand</Label>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Padding: {parsePixelValue(styles.padding, 8)}px</Label>
                <Slider
                  value={[parsePixelValue(styles.padding, 8)]}
                  onValueChange={([v]) => updateStyles({ padding: `${v}px` })}
                  min={0}
                  max={32}
                  step={2}
                  className="w-32"
                />
              </div>
            </div>
          )}

          {/* Border */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground">Rahmen</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Rundung: {parsePixelValue(styles.borderRadius, 0)}px</Label>
                <Slider
                  value={[parsePixelValue(styles.borderRadius, 0)]}
                  onValueChange={([v]) => updateStyles({ borderRadius: `${v}px` })}
                  min={0}
                  max={24}
                  step={2}
                  className="w-32"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Rahmen</Label>
                <Select
                  value={styles.border || "none"}
                  onValueChange={(v) => updateStyles({ border: v === "none" ? undefined : v })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keiner</SelectItem>
                    <SelectItem value="1px solid #e5e7eb">Dünn - Grau</SelectItem>
                    <SelectItem value="2px solid #e5e7eb">Normal - Grau</SelectItem>
                    <SelectItem value="1px solid #000000">Dünn - Schwarz</SelectItem>
                    <SelectItem value="2px solid #000000">Normal - Schwarz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Width */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground">Breite</Label>
            <Select
              value={styles.maxWidth || "100%"}
              onValueChange={(v) => updateStyles({ maxWidth: v })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100%">Volle Breite</SelectItem>
                <SelectItem value="75%">75%</SelectItem>
                <SelectItem value="50%">50%</SelectItem>
                <SelectItem value="400px">400px</SelectItem>
                <SelectItem value="300px">300px</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Shadow */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground">Schatten</Label>
            <Select
              value={styles.boxShadow || "none"}
              onValueChange={(v) => updateStyles({ boxShadow: v === "none" ? undefined : v })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keiner</SelectItem>
                <SelectItem value="0 1px 2px rgba(0,0,0,0.05)">Sehr leicht</SelectItem>
                <SelectItem value="0 2px 4px rgba(0,0,0,0.1)">Leicht</SelectItem>
                <SelectItem value="0 4px 6px rgba(0,0,0,0.1)">Normal</SelectItem>
                <SelectItem value="0 10px 15px rgba(0,0,0,0.1)">Stark</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => onUpdate({ styles: undefined })}
          >
            Design zurücksetzen
          </Button>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
