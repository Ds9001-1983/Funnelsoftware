import { memo } from "react";
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

export const CalendarProperties = memo(function CalendarProperties({ element, onUpdate }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Anbieter</Label>
        <Select
          value={element.calendarProvider || "calendly"}
          onValueChange={(v) =>
            onUpdate({ calendarProvider: v as "calendly" | "cal" | "custom" })
          }
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="calendly">Calendly</SelectItem>
            <SelectItem value="cal">Cal.com</SelectItem>
            <SelectItem value="custom">Eigene URL</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Kalender-URL</Label>
        <Input
          value={element.calendarUrl || ""}
          onChange={(e) => onUpdate({ calendarUrl: e.target.value })}
          placeholder="https://calendly.com/username"
          className="text-sm h-8"
        />
      </div>
      <div className="p-3 bg-muted rounded-md">
        <p className="text-xs text-muted-foreground">
          Füge deine Kalender-Embed-URL ein, um Termine direkt im Funnel buchbar zu
          machen.
        </p>
      </div>
    </div>
  );
});

export const ChartProperties = memo(function ChartProperties({ element, onUpdate }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Diagramm-Typ</Label>
        <div className="grid grid-cols-2 gap-1">
          {(["bar", "line", "pie", "doughnut"] as const).map((type) => (
            <Button
              key={type}
              variant={(element.chartType || "bar") === type ? "default" : "outline"}
              size="sm"
              className="text-xs capitalize"
              onClick={() => onUpdate({ chartType: type })}
            >
              {type === "bar"
                ? "Balken"
                : type === "line"
                ? "Linie"
                : type === "pie"
                ? "Kreis"
                : "Donut"}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Titel</Label>
        <Input
          value={element.content || ""}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder="Diagramm-Titel"
          className="text-sm h-8"
        />
      </div>
      <div className="p-3 bg-muted rounded-md">
        <p className="text-xs text-muted-foreground">
          Daten können über die API oder ein verbundenes Spreadsheet eingespielt
          werden.
        </p>
      </div>
    </div>
  );
});

export const CodeProperties = memo(function CodeProperties({ element, onUpdate }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Programmiersprache</Label>
        <Select
          value={element.codeLanguage || "javascript"}
          onValueChange={(v) => onUpdate({ codeLanguage: v })}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="javascript">JavaScript</SelectItem>
            <SelectItem value="typescript">TypeScript</SelectItem>
            <SelectItem value="python">Python</SelectItem>
            <SelectItem value="html">HTML</SelectItem>
            <SelectItem value="css">CSS</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="bash">Bash</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Code</Label>
        <Textarea
          value={element.codeContent || ""}
          onChange={(e) => onUpdate({ codeContent: e.target.value })}
          placeholder="// Dein Code hier..."
          rows={8}
          className="text-sm font-mono"
        />
      </div>
    </div>
  );
});

export const EmbedProperties = memo(function EmbedProperties({ element, onUpdate }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Embed-URL</Label>
        <Input
          value={element.embedUrl || ""}
          onChange={(e) => onUpdate({ embedUrl: e.target.value })}
          placeholder="https://..."
          className="text-sm h-8"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Oder HTML-Code</Label>
        <Textarea
          value={element.embedCode || ""}
          onChange={(e) => onUpdate({ embedCode: e.target.value })}
          placeholder='<iframe src="..."></iframe>'
          rows={4}
          className="text-sm font-mono"
        />
      </div>
      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
        <p className="text-xs text-yellow-600">
          Achte darauf, nur vertrauenswürdige Embed-Codes zu verwenden.
        </p>
      </div>
    </div>
  );
});
