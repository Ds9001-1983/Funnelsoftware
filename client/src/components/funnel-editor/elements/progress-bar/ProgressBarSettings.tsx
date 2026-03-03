import type { ElementSettingsProps } from "../../registry/element-registry";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function ProgressBarSettings({ element, onUpdate }: ElementSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="progress-label">Beschriftung</Label>
        <Input
          id="progress-label"
          value={element.content ?? ""}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder="Fortschritt"
        />
      </div>
    </div>
  );
}
