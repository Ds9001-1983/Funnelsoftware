import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { PropertiesProps } from "./types";

export const SpacerProperties = memo(function SpacerProperties({ element, onUpdate }: PropertiesProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs">Höhe (px)</Label>
        <Slider
          value={[element.spacerHeight || 24]}
          onValueChange={([v]) => onUpdate({ spacerHeight: v })}
          min={8}
          max={120}
          step={8}
        />
        <div className="text-xs text-muted-foreground text-center">
          {element.spacerHeight || 24}px
        </div>
      </div>
    </div>
  );
});

export const DividerProperties = memo(function DividerProperties({ element, onUpdate }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Farbe</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={element.styles?.color || "#e5e7eb"}
            onChange={(e) =>
              onUpdate({ styles: { ...element.styles, color: e.target.value } })
            }
            className="w-12 h-8 p-1 cursor-pointer"
          />
          <Input
            value={element.styles?.color || "#e5e7eb"}
            onChange={(e) =>
              onUpdate({ styles: { ...element.styles, color: e.target.value } })
            }
            className="flex-1 h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
});
