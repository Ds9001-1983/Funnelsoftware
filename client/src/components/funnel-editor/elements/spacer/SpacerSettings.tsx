import type { ElementSettingsProps } from "../../registry/element-registry";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export function SpacerSettings({ element, onUpdate }: ElementSettingsProps) {
  const height = element.spacerHeight ?? 32;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Höhe: {height}px</Label>
        <Slider
          value={[height]}
          onValueChange={([value]) => onUpdate({ spacerHeight: value })}
          min={8}
          max={128}
          step={8}
        />
      </div>
    </div>
  );
}
