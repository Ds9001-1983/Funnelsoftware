import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { QuickEditorProps } from "./types";

export const TextQuick = memo(function TextQuick({ element, onUpdate }: QuickEditorProps) {
  if (element.type === "heading") {
    return (
      <div className="space-y-2">
        <Input
          placeholder="Überschrift"
          value={element.content || ""}
          onChange={(e) => onUpdate({ content: e.target.value })}
        />
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Text eingeben..."
        value={element.content || ""}
        onChange={(e) => onUpdate({ content: e.target.value })}
        rows={3}
      />
    </div>
  );
});

export const InputQuick = memo(function InputQuick({ element, onUpdate }: QuickEditorProps) {
  return (
    <Input
      placeholder="Placeholder-Text"
      value={element.placeholder || ""}
      onChange={(e) => onUpdate({ placeholder: e.target.value })}
    />
  );
});
