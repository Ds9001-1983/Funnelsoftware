import type { ElementSettingsProps } from "../../registry/element-registry";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function InputSettings({ element, onUpdate }: ElementSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Label</Label>
        <Input
          value={element.label || ""}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="z.B. Name, E-Mail..."
        />
      </div>

      <div className="space-y-2">
        <Label>Platzhalter</Label>
        <Input
          value={element.placeholder || ""}
          onChange={(e) => onUpdate({ placeholder: e.target.value })}
          placeholder="Eingabe..."
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Pflichtfeld</Label>
        <Switch
          checked={element.required || false}
          onCheckedChange={(checked) => onUpdate({ required: checked })}
        />
      </div>
    </div>
  );
}
