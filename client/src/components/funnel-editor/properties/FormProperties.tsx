import { memo } from "react";
import { ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PropertiesProps } from "./types";

export const InputFieldProperties = memo(function InputFieldProperties({ element, onUpdate }: PropertiesProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs">Platzhalter</Label>
        <Input
          value={element.placeholder || ""}
          onChange={(e) => onUpdate({ placeholder: e.target.value })}
          className="text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Label</Label>
        <Input
          value={element.label || ""}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="text-sm"
        />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Pflichtfeld</Label>
        <Switch
          checked={element.required || false}
          onCheckedChange={(checked) => onUpdate({ required: checked })}
        />
      </div>
    </div>
  );
});

export const SelectProperties = memo(function SelectProperties({ element, onUpdate, pages = [] }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Label</Label>
        <Input
          value={element.label || ""}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="Dropdown Label"
          className="text-sm h-8"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Optionen (eine pro Zeile)</Label>
        <Textarea
          value={(element.options || []).join("\n")}
          onChange={(e) => {
            const newOptions = e.target.value.split("\n").filter(Boolean);
            const cleaned = element.optionRouting
              ? Object.fromEntries(Object.entries(element.optionRouting).filter(([k]) => newOptions.includes(k)))
              : undefined;
            onUpdate({ options: newOptions, optionRouting: cleaned });
          }}
          placeholder="Option 1&#10;Option 2&#10;Option 3"
          rows={4}
          className="text-sm"
        />
      </div>
      {(element.options || []).length > 0 && pages.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs">Seitenweiterleitung pro Option</Label>
          {(element.options || []).map((option) => (
            <div key={option} className="flex items-center gap-1.5">
              <span className="text-xs truncate flex-1 text-muted-foreground">{option}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <Select
                value={element.optionRouting?.[option] || "__next__"}
                onValueChange={(v) => {
                  const routing = { ...(element.optionRouting || {}) };
                  if (v === "__next__") {
                    delete routing[option];
                  } else {
                    routing[option] = v;
                  }
                  onUpdate({ optionRouting: Object.keys(routing).length > 0 ? routing : undefined });
                }}
              >
                <SelectTrigger className="h-7 text-xs w-[140px] shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__next__">Nächste Seite</SelectItem>
                  {pages.map((page, pIdx) => (
                    <SelectItem key={page.id} value={page.id}>
                      {pIdx + 1}. {page.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <Label className="text-xs">Pflichtfeld</Label>
        <Switch
          checked={element.required || false}
          onCheckedChange={(checked) => onUpdate({ required: checked })}
        />
      </div>
    </div>
  );
});

export const RadioProperties = memo(function RadioProperties({ element, onUpdate, pages = [] }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Frage / Label</Label>
        <Input
          value={element.label || ""}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="Wähle eine Option"
          className="text-sm h-8"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Optionen (eine pro Zeile)</Label>
        <Textarea
          value={(element.options || []).join("\n")}
          onChange={(e) => {
            const newOptions = e.target.value.split("\n").filter(Boolean);
            const cleaned = element.optionRouting
              ? Object.fromEntries(Object.entries(element.optionRouting).filter(([k]) => newOptions.includes(k)))
              : undefined;
            onUpdate({ options: newOptions, optionRouting: cleaned });
          }}
          placeholder="Option A&#10;Option B&#10;Option C"
          rows={4}
          className="text-sm"
        />
      </div>
      {(element.options || []).length > 0 && pages.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs">Seitenweiterleitung pro Option</Label>
          {(element.options || []).map((option) => (
            <div key={option} className="flex items-center gap-1.5">
              <span className="text-xs truncate flex-1 text-muted-foreground">{option}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <Select
                value={element.optionRouting?.[option] || "__next__"}
                onValueChange={(v) => {
                  const routing = { ...(element.optionRouting || {}) };
                  if (v === "__next__") {
                    delete routing[option];
                  } else {
                    routing[option] = v;
                  }
                  onUpdate({ optionRouting: Object.keys(routing).length > 0 ? routing : undefined });
                }}
              >
                <SelectTrigger className="h-7 text-xs w-[140px] shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__next__">Nächste Seite</SelectItem>
                  {pages.map((page, pIdx) => (
                    <SelectItem key={page.id} value={page.id}>
                      {pIdx + 1}. {page.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <Label className="text-xs">Pflichtfeld</Label>
        <Switch
          checked={element.required || false}
          onCheckedChange={(checked) => onUpdate({ required: checked })}
        />
      </div>
    </div>
  );
});

export const CheckboxProperties = memo(function CheckboxProperties({ element, onUpdate }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Label</Label>
        <Input
          value={element.label || ""}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="Ich akzeptiere die AGB"
          className="text-sm h-8"
        />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Pflichtfeld</Label>
        <Switch
          checked={element.required || false}
          onCheckedChange={(checked) => onUpdate({ required: checked })}
        />
      </div>
    </div>
  );
});

export const FileUploadProperties = memo(function FileUploadProperties({ element, onUpdate }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Label</Label>
        <Input
          value={element.label || ""}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="z.B. Lebenslauf hochladen"
          className="text-sm h-8"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Erlaubte Dateitypen</Label>
        <Select
          value={element.acceptedFileTypes?.join(",") || "all"}
          onValueChange={(v) =>
            onUpdate({
              acceptedFileTypes: v === "all" ? undefined : v.split(","),
            })
          }
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Dateien</SelectItem>
            <SelectItem value=".pdf">Nur PDF</SelectItem>
            <SelectItem value=".jpg,.jpeg,.png,.gif">Nur Bilder</SelectItem>
            <SelectItem value=".pdf,.doc,.docx">Dokumente</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Max. Dateigröße (MB)</Label>
        <Slider
          value={[element.maxFileSize || 10]}
          onValueChange={([v]) => onUpdate({ maxFileSize: v })}
          min={1}
          max={50}
          step={1}
        />
        <div className="text-xs text-muted-foreground text-center">
          {element.maxFileSize || 10} MB
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Pflichtfeld</Label>
        <Switch
          checked={element.required || false}
          onCheckedChange={(checked) => onUpdate({ required: checked })}
        />
      </div>
    </div>
  );
});

export const DateProperties = memo(function DateProperties({ element, onUpdate }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Label</Label>
        <Input
          value={element.label || ""}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="z.B. Geburtsdatum"
          className="text-sm h-8"
        />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Uhrzeit einbeziehen</Label>
        <Switch
          checked={element.includeTime || false}
          onCheckedChange={(checked) => onUpdate({ includeTime: checked })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Pflichtfeld</Label>
        <Switch
          checked={element.required || false}
          onCheckedChange={(checked) => onUpdate({ required: checked })}
        />
      </div>
    </div>
  );
});
