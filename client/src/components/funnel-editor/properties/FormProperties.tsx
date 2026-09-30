import { Button } from "@/components/ui/button";
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
      <div className="space-y-2">
        <Label className="text-xs">Lead-Feld (Zuordnung)</Label>
        <Select
          value={element.mapToLeadField || "auto"}
          onValueChange={(v) =>
            onUpdate({
              mapToLeadField:
                v === "auto" ? undefined : (v as "name" | "email" | "phone" | "company" | "message"),
            })
          }
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Automatisch (anhand Label)</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="email">E-Mail</SelectItem>
            <SelectItem value="phone">Telefon</SelectItem>
            <SelectItem value="company">Firma</SelectItem>
            <SelectItem value="message">Nachricht</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Bestimmt eindeutig, welchem Lead-Feld dieser Wert zugeordnet wird (statt Raten per Label).
        </p>
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

export const SelectProperties = memo(function SelectProperties({ element, onUpdate, pages = [], routingManaged }: PropertiesProps) {
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
      <ChoiceOptions element={element} onUpdate={onUpdate} pages={pages} routingManaged={routingManaged} />
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

export const RadioProperties = memo(function RadioProperties({ element, onUpdate, pages = [], routingManaged }: PropertiesProps) {
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
      <ChoiceOptions element={element} onUpdate={onUpdate} pages={pages} routingManaged={routingManaged} />
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

function ChoiceOptions({ element, onUpdate, pages = [], routingManaged }: PropertiesProps) {
  const choices = element.choices;
  return <div className="space-y-3">
    {choices ? <>
      <Label className="text-xs">Auswahloptionen</Label>
      <p className="text-xs text-muted-foreground">Texte ändern und Optionen verschieben, ohne die Regelzuordnung zu verlieren.</p>
      {choices.map((choice, index) => <div key={choice.id} className="flex gap-1 items-center">
        <Input aria-label={`Auswahloption ${index + 1}`} maxLength={500} value={choice.label} onChange={event => { const next = choices.map(item => item.id === choice.id ? { ...item, label: event.target.value } : item); onUpdate({ choices: next, options: next.map(item => item.label) }); }} />
        <Button size="sm" variant="ghost" aria-label={`Option ${index + 1} nach oben`} disabled={index === 0} onClick={() => { const next = [...choices]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; onUpdate({ choices: next, options: next.map(item => item.label) }); }}>↑</Button>
        <Button size="sm" variant="ghost" aria-label={`Option ${index + 1} löschen`} disabled={choices.length === 1} onClick={() => { const next = choices.filter(item => item.id !== choice.id); onUpdate({ choices: next, options: next.map(item => item.label) }); }}>×</Button>
      </div>)}
      <Button size="sm" variant="outline" disabled={choices.length >= 100} onClick={() => { const next = [...choices, { id: crypto.randomUUID(), label: `Option ${choices.length + 1}` }]; onUpdate({ choices: next, options: next.map(item => item.label) }); }}>Option hinzufügen</Button>
    </> : <div className="space-y-2">
      <Label className="text-xs">Optionen (eine pro Zeile)</Label>
      <Textarea value={(element.options || []).join("\n")} onChange={event => {
        const options = event.target.value.split("\n").filter(Boolean);
        onUpdate({ options, optionRouting: element.optionRouting ? Object.fromEntries(Object.entries(element.optionRouting).filter(([key]) => options.includes(key))) : undefined });
      }} rows={4} className="text-sm" />
      {routingManaged && <p className="text-xs text-muted-foreground">Dieses bestehende Feld verwendet Antworttexte. Prüfe die Besucherregeln nach dem Umbenennen einer Option.</p>}
    </div>}
    {routingManaged || choices ? <p className="text-xs text-muted-foreground">Seitenziele im Funnel-Flow unter „Besucherregeln“ einstellen.</p> : (element.options || []).length > 0 && pages.length > 0 && <div className="space-y-2">
      <Label className="text-xs">Seitenweiterleitung pro Option</Label>
      {(element.options || []).map((option, index) => <div key={index} className="flex items-center gap-1.5">
        <span className="text-xs truncate flex-1 text-muted-foreground">{option}</span><ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
        <Select value={element.optionRouting?.[option] || "__next__"} onValueChange={value => { const routing = { ...element.optionRouting }; if (value === "__next__") delete routing[option]; else routing[option] = value; onUpdate({ optionRouting: routing }); }}>
          <SelectTrigger className="h-7 text-xs w-[140px] shrink-0"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="__next__">Nächste Seite</SelectItem>{pages.map((page, index) => <SelectItem key={page.id} value={page.id}>{index + 1}. {page.title}</SelectItem>)}</SelectContent>
        </Select>
      </div>)}
    </div>}
  </div>;
}
