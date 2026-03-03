import type { ElementSettingsProps } from "../../registry/element-registry";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ImageSettings({ element, onUpdate }: ElementSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="image-url">Bild-URL</Label>
        <Input
          id="image-url"
          value={element.imageUrl ?? ""}
          onChange={(e) => onUpdate({ imageUrl: e.target.value })}
          placeholder="https://..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="image-alt">Bildbeschreibung (Alt-Text)</Label>
        <Input
          id="image-alt"
          value={element.imageAlt ?? ""}
          onChange={(e) => onUpdate({ imageAlt: e.target.value })}
          placeholder="Bildbeschreibung"
        />
      </div>
    </div>
  );
}
