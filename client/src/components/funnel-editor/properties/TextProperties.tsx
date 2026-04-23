import { memo } from "react";
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PropertiesProps } from "./types";

export const TextProperties = memo(function TextProperties({ element, onUpdate }: PropertiesProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs">Inhalt</Label>
        <Textarea
          value={element.content || ""}
          onChange={(e) => onUpdate({ content: e.target.value })}
          rows={3}
          className="text-sm"
        />
      </div>

      {element.type === "heading" && (
        <div className="space-y-2">
          <Label className="text-xs">Schriftgröße</Label>
          <Select
            value={element.styles?.fontSize || "2xl"}
            onValueChange={(v) =>
              onUpdate({ styles: { ...element.styles, fontSize: v } })
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="xl">Klein (XL)</SelectItem>
              <SelectItem value="2xl">Normal (2XL)</SelectItem>
              <SelectItem value="3xl">Groß (3XL)</SelectItem>
              <SelectItem value="4xl">Sehr groß (4XL)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-xs">Textausrichtung</Label>
        <div className="flex gap-1">
          <Button
            variant={element.styles?.textAlign === "left" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() =>
              onUpdate({ styles: { ...element.styles, textAlign: "left" } })
            }
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={
              !element.styles?.textAlign || element.styles?.textAlign === "center"
                ? "default"
                : "outline"
            }
            size="sm"
            className="flex-1"
            onClick={() =>
              onUpdate({ styles: { ...element.styles, textAlign: "center" } })
            }
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant={element.styles?.textAlign === "right" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() =>
              onUpdate({ styles: { ...element.styles, textAlign: "right" } })
            }
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Textfarbe</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={element.styles?.color || "#1a1a1a"}
            onChange={(e) =>
              onUpdate({ styles: { ...element.styles, color: e.target.value } })
            }
            className="w-12 h-9 p-1 cursor-pointer"
          />
          <Input
            value={element.styles?.color || "#1a1a1a"}
            onChange={(e) =>
              onUpdate({ styles: { ...element.styles, color: e.target.value } })
            }
            className="flex-1 h-9 text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant={element.styles?.fontWeight === "bold" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            onUpdate({
              styles: {
                ...element.styles,
                fontWeight: element.styles?.fontWeight === "bold" ? "normal" : "bold",
              },
            })
          }
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={element.styles?.fontStyle === "italic" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            onUpdate({
              styles: {
                ...element.styles,
                fontStyle: element.styles?.fontStyle === "italic" ? "normal" : "italic",
              },
            })
          }
        >
          <Italic className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});
