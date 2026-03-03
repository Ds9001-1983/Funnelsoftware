import { Bold, Italic, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TypographyControlProps {
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  onUpdate: (updates: Record<string, string>) => void;
}

const FONT_SIZES = [
  { value: "xs", label: "XS" },
  { value: "sm", label: "S" },
  { value: "base", label: "M" },
  { value: "lg", label: "L" },
  { value: "xl", label: "XL" },
  { value: "2xl", label: "2XL" },
  { value: "3xl", label: "3XL" },
  { value: "4xl", label: "4XL" },
];

export function TypographyControl({
  fontSize,
  fontWeight,
  fontStyle,
  textAlign,
  onUpdate,
}: TypographyControlProps) {
  return (
    <div className="space-y-3">
      <Label className="text-xs">Typografie</Label>

      {/* Font size */}
      <Select
        value={fontSize || "base"}
        onValueChange={(v) => onUpdate({ fontSize: v })}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Schriftgröße" />
        </SelectTrigger>
        <SelectContent>
          {FONT_SIZES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Bold + Italic */}
      <div className="flex gap-1">
        <Button
          variant={fontWeight === "bold" ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() =>
            onUpdate({ fontWeight: fontWeight === "bold" ? "normal" : "bold" })
          }
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant={fontStyle === "italic" ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() =>
            onUpdate({ fontStyle: fontStyle === "italic" ? "normal" : "italic" })
          }
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>

        <div className="w-px bg-border mx-1" />

        {/* Text alignment */}
        <Button
          variant={textAlign === "left" ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onUpdate({ textAlign: "left" })}
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant={(!textAlign || textAlign === "center") ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onUpdate({ textAlign: "center" })}
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant={textAlign === "right" ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onUpdate({ textAlign: "right" })}
        >
          <AlignRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
