import { memo } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { QuickEditorProps } from "./types";

export const FileUploadQuick = memo(function FileUploadQuick({ element, onUpdate }: QuickEditorProps) {
  return (
    <div className="space-y-3">
      <Input
        placeholder="z.B. Lebenslauf hochladen"
        value={element.label || ""}
        onChange={(e) => onUpdate({ label: e.target.value })}
      />
      <Select
        value={element.acceptedFileTypes?.join(",") || "all"}
        onValueChange={(v) =>
          onUpdate({
            acceptedFileTypes: v === "all" ? undefined : v.split(","),
          })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Dateitypen" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Dateien</SelectItem>
          <SelectItem value=".pdf">Nur PDF</SelectItem>
          <SelectItem value=".jpg,.jpeg,.png,.gif">Nur Bilder</SelectItem>
          <SelectItem value=".pdf,.doc,.docx">Dokumente</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
});

export const ChoiceQuick = memo(function ChoiceQuick({ element, onUpdate }: QuickEditorProps) {
  if (!element.options) return null;
  return (
    <div className="space-y-2">
      {element.options.map((opt, optIdx) => (
        <div key={optIdx} className="flex gap-2">
          <Input
            value={opt}
            onChange={(e) => {
              const newOptions = [...element.options!];
              newOptions[optIdx] = e.target.value;
              onUpdate({ options: newOptions });
            }}
          />
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0"
            onClick={() => {
              const newOptions = element.options!.filter((_, i) => i !== optIdx);
              onUpdate({ options: newOptions });
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        size="sm"
        variant="ghost"
        className="w-full"
        onClick={() => {
          onUpdate({
            options: [...(element.options || []), `Option ${(element.options?.length || 0) + 1}`],
          });
        }}
      >
        <Plus className="h-4 w-4 mr-1" />
        Option
      </Button>
    </div>
  );
});

export const DateQuick = memo(function DateQuick({ element, onUpdate }: QuickEditorProps) {
  return (
    <div className="space-y-2">
      <Input
        placeholder="z.B. Geburtsdatum"
        value={element.label || ""}
        onChange={(e) => onUpdate({ label: e.target.value })}
      />
      <div className="flex items-center justify-between">
        <Label className="text-xs">Uhrzeit einbeziehen</Label>
        <Switch
          checked={element.includeTime || false}
          onCheckedChange={(checked) => onUpdate({ includeTime: checked })}
        />
      </div>
    </div>
  );
});

/**
 * Kleiner "Pflichtfeld"-Schalter, der in der Element-Card neben dem Badge
 * erscheint. Wird als separate Komponente gehalten, damit jede Änderung nur
 * die betroffene Zeile re-rendert.
 */
export const RequiredToggle = memo(function RequiredToggle({ element, onUpdate }: QuickEditorProps) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span>Pflicht</span>
      <Switch
        checked={element.required || false}
        onCheckedChange={(checked) => onUpdate({ required: checked })}
      />
    </div>
  );
});

export const FORM_ELEMENT_TYPES = new Set<string>([
  "input",
  "textarea",
  "fileUpload",
  "date",
  "select",
  "radio",
  "checkbox",
]);
