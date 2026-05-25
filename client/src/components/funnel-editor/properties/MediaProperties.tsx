import { memo } from "react";
import { Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUploader } from "../ImageUploader";
import type { PropertiesProps } from "./types";

export const ImageProperties = memo(function ImageProperties({ element, onUpdate }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium">Bildgröße</Label>
        <div className="flex gap-1">
          {["S", "M", "L", "XL"].map((size) => (
            <Button
              key={size}
              variant={
                (element.styles?.imageSize || "L") === size ? "default" : "outline"
              }
              size="sm"
              className="flex-1 text-xs font-medium"
              onClick={() =>
                onUpdate({ styles: { ...element.styles, imageSize: size } })
              }
            >
              {size}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Hintergrundfarbe</Label>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={element.styles?.backgroundColor || "#ffffff"}
            onChange={(e) =>
              onUpdate({
                styles: { ...element.styles, backgroundColor: e.target.value },
              })
            }
            className="w-10 h-8 p-1 cursor-pointer"
          />
          <Input
            value={element.styles?.backgroundColor || "#ffffff"}
            onChange={(e) =>
              onUpdate({
                styles: { ...element.styles, backgroundColor: e.target.value },
              })
            }
            className="flex-1 h-8 text-sm font-mono"
          />
        </div>
      </div>

      <ImageUploader
        variant="dropzone"
        value={element.imageUrl || ""}
        onChange={(url) => onUpdate({ imageUrl: url })}
      />

      <div className="space-y-2">
        <Label className="text-xs">oder URL eingeben</Label>
        <Input
          value={element.imageUrl || ""}
          onChange={(e) => onUpdate({ imageUrl: e.target.value })}
          placeholder="https://..."
          className="text-sm h-8"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Alt-Text (SEO)</Label>
        <Input
          value={element.imageAlt || ""}
          onChange={(e) => onUpdate({ imageAlt: e.target.value })}
          placeholder="Bildbeschreibung"
          className="text-sm h-8"
        />
      </div>
    </div>
  );
});

export const VideoProperties = memo(function VideoProperties({ element, onUpdate }: PropertiesProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs">Video-URL</Label>
        <Input
          value={element.videoUrl || ""}
          onChange={(e) => onUpdate({ videoUrl: e.target.value })}
          placeholder="YouTube oder Vimeo URL"
          className="text-sm"
        />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Autoplay</Label>
        <Switch
          checked={element.videoAutoplay || false}
          onCheckedChange={(checked) => onUpdate({ videoAutoplay: checked })}
        />
      </div>
    </div>
  );
});

export const AudioProperties = memo(function AudioProperties({ element, onUpdate }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Audio-URL</Label>
        <Input
          value={element.audioUrl || ""}
          onChange={(e) => onUpdate({ audioUrl: e.target.value })}
          placeholder="https://example.com/audio.mp3"
          className="text-sm h-8"
        />
      </div>
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
        <Music className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Audio-Datei ablegen oder klicken
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          (Max. 50MB; .mp3 .wav .ogg)
        </p>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Autoplay</Label>
        <Switch
          checked={element.audioAutoplay || false}
          onCheckedChange={(checked) => onUpdate({ audioAutoplay: checked })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Wiederholen</Label>
        <Switch
          checked={element.audioLoop || false}
          onCheckedChange={(checked) => onUpdate({ audioLoop: checked })}
        />
      </div>
    </div>
  );
});
