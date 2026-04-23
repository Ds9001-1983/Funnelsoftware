import { memo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { QuickEditorProps } from "./types";

export const VideoQuick = memo(function VideoQuick({ element, onUpdate }: QuickEditorProps) {
  return (
    <div className="space-y-2">
      <Select
        value={element.videoType || "youtube"}
        onValueChange={(v) => onUpdate({ videoType: v as "youtube" | "vimeo" | "upload" })}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="youtube">YouTube</SelectItem>
          <SelectItem value="vimeo">Vimeo</SelectItem>
        </SelectContent>
      </Select>
      <Input
        placeholder="Video-URL"
        value={element.videoUrl || ""}
        onChange={(e) => onUpdate({ videoUrl: e.target.value })}
      />
    </div>
  );
});

export const ImageQuick = memo(function ImageQuick({ element, onUpdate }: QuickEditorProps) {
  return (
    <div className="space-y-2">
      <Input
        placeholder="Bild-URL"
        value={element.imageUrl || ""}
        onChange={(e) => onUpdate({ imageUrl: e.target.value })}
      />
      <Input
        placeholder="Alt-Text"
        value={element.imageAlt || ""}
        onChange={(e) => onUpdate({ imageAlt: e.target.value })}
      />
    </div>
  );
});
