import type { ElementSettingsProps } from "../../registry/element-registry";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function VideoSettings({ element, onUpdate }: ElementSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="video-type">Video-Typ</Label>
        <Select
          value={element.videoType ?? "youtube"}
          onValueChange={(value) => onUpdate({ videoType: value as "youtube" | "vimeo" | "upload" })}
        >
          <SelectTrigger id="video-type">
            <SelectValue placeholder="Typ wählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="vimeo">Vimeo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="video-url">Video-URL</Label>
        <Input
          id="video-url"
          value={element.videoUrl ?? ""}
          onChange={(e) => onUpdate({ videoUrl: e.target.value })}
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="video-autoplay">Autoplay</Label>
        <Switch
          id="video-autoplay"
          checked={element.videoAutoplay ?? false}
          onCheckedChange={(checked) => onUpdate({ videoAutoplay: checked })}
        />
      </div>
    </div>
  );
}
