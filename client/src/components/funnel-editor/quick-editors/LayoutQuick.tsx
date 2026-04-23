import { memo } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { QuickEditorProps } from "./types";

export const SpacerQuick = memo(function SpacerQuick({ element, onUpdate }: QuickEditorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">Höhe: {element.spacerHeight || 32}px</Label>
      <Slider
        value={[element.spacerHeight || 32]}
        onValueChange={([v]) => onUpdate({ spacerHeight: v })}
        min={8}
        max={128}
        step={8}
      />
    </div>
  );
});

export const DividerQuick = memo(function DividerQuick({ element, onUpdate }: QuickEditorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">Stil</Label>
      <Select
        value={element.dividerStyle || "solid"}
        onValueChange={(v) =>
          onUpdate({ dividerStyle: v as "solid" | "dashed" | "dotted" | "gradient" })
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="solid">Durchgezogen</SelectItem>
          <SelectItem value="dashed">Gestrichelt</SelectItem>
          <SelectItem value="dotted">Gepunktet</SelectItem>
          <SelectItem value="gradient">Gradient</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
});
