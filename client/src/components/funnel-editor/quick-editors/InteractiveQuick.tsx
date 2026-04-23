import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { QuickEditorProps } from "./types";

export const TimerQuick = memo(function TimerQuick({ element, onUpdate }: QuickEditorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">Enddatum</Label>
      <Input
        type="datetime-local"
        value={
          element.timerEndDate
            ? new Date(element.timerEndDate).toISOString().slice(0, 16)
            : ""
        }
        onChange={(e) => onUpdate({ timerEndDate: new Date(e.target.value).toISOString() })}
      />
      <Select
        value={element.timerStyle || "countdown"}
        onValueChange={(v) => onUpdate({ timerStyle: v as "countdown" | "stopwatch" })}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="countdown">Countdown</SelectItem>
          <SelectItem value="stopwatch">Stoppuhr</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Tage anzeigen</Label>
        <Switch
          checked={element.timerShowDays !== false}
          onCheckedChange={(checked) => onUpdate({ timerShowDays: checked })}
        />
      </div>
    </div>
  );
});

export const ProgressBarQuick = memo(function ProgressBarQuick({ element, onUpdate }: QuickEditorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">Fortschritt: {element.progressValue || 60}%</Label>
      <Slider
        value={[element.progressValue || 60]}
        onValueChange={([v]) => onUpdate({ progressValue: v })}
        min={0}
        max={100}
        step={5}
      />
      <div className="flex items-center justify-between">
        <Label className="text-xs">Prozent anzeigen</Label>
        <Switch
          checked={element.progressShowLabel !== false}
          onCheckedChange={(checked) => onUpdate({ progressShowLabel: checked })}
        />
      </div>
    </div>
  );
});

export const IconQuick = memo(function IconQuick({ element, onUpdate }: QuickEditorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">Icon-Name</Label>
      <Select
        value={element.iconName || "star"}
        onValueChange={(v) => onUpdate({ iconName: v })}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="star">Stern</SelectItem>
          <SelectItem value="heart">Herz</SelectItem>
          <SelectItem value="check">Häkchen</SelectItem>
          <SelectItem value="award">Auszeichnung</SelectItem>
          <SelectItem value="shield">Schild</SelectItem>
          <SelectItem value="trophy">Pokal</SelectItem>
          <SelectItem value="rocket">Rakete</SelectItem>
          <SelectItem value="lightning">Blitz</SelectItem>
        </SelectContent>
      </Select>
      <Label className="text-xs">Größe</Label>
      <Select
        value={element.iconSize || "md"}
        onValueChange={(v) => onUpdate({ iconSize: v as "sm" | "md" | "lg" | "xl" })}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sm">Klein</SelectItem>
          <SelectItem value="md">Mittel</SelectItem>
          <SelectItem value="lg">Groß</SelectItem>
          <SelectItem value="xl">Sehr groß</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
});
