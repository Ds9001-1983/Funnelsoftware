import type { ElementSettingsProps } from "../../registry/element-registry";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ButtonSettings({ element, onUpdate }: ElementSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="button-text">Button-Text</Label>
        <Input
          id="button-text"
          value={element.content ?? ""}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder="Klick mich"
        />
      </div>
    </div>
  );
}
