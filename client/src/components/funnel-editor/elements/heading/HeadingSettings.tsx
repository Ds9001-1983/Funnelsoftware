import type { ElementSettingsProps } from "../../registry/element-registry";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function HeadingSettings({ element, onUpdate }: ElementSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="heading-content">Inhalt</Label>
        <Textarea
          id="heading-content"
          value={element.content ?? ""}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder="Überschrift eingeben..."
        />
      </div>
    </div>
  );
}
