import type { ElementSettingsProps } from "../../registry/element-registry";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function TextSettings({ element, onUpdate }: ElementSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="text-content">Inhalt</Label>
        <Textarea
          id="text-content"
          rows={4}
          value={element.content ?? ""}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder="Text eingeben..."
        />
      </div>
    </div>
  );
}
