import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export const QuizProperties = memo(function QuizProperties(_: PropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-muted rounded-md">
        <p className="text-xs text-muted-foreground">
          Der Quiz-Editor wird separat in einem erweiterten Modal geöffnet.
        </p>
      </div>
      <Button variant="outline" size="sm" className="w-full">
        Quiz bearbeiten
      </Button>
    </div>
  );
});

export const CountdownProperties = memo(function CountdownProperties({ element, onUpdate }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Zieldatum</Label>
        <Input
          type="datetime-local"
          value={element.countdownDate || ""}
          onChange={(e) => onUpdate({ countdownDate: e.target.value })}
          className="text-sm h-8"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Stil</Label>
        <div className="flex gap-1">
          {(["flip", "simple", "circular"] as const).map((style) => (
            <Button
              key={style}
              variant={
                (element.countdownStyle || "flip") === style ? "default" : "outline"
              }
              size="sm"
              className="flex-1 text-xs capitalize"
              onClick={() => onUpdate({ countdownStyle: style })}
            >
              {style === "flip" ? "Flip" : style === "simple" ? "Einfach" : "Kreise"}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Labels anzeigen</Label>
        <Switch
          checked={element.countdownShowLabels !== false}
          onCheckedChange={(checked) => onUpdate({ countdownShowLabels: checked })}
        />
      </div>
    </div>
  );
});

export const IconProperties = memo(function IconProperties({ element, onUpdate }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Icon</Label>
        <Select
          value={element.iconName || "star"}
          onValueChange={(v) => onUpdate({ iconName: v })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["star", "heart", "check", "arrow-right", "mail", "phone", "home", "user", "settings", "shield", "zap", "award"].map((icon) => (
              <SelectItem key={icon} value={icon}>{icon}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Größe</Label>
        <div className="flex gap-1">
          {(["sm", "md", "lg", "xl"] as const).map((size) => (
            <Button
              key={size}
              variant={(element.iconSize || "md") === size ? "default" : "outline"}
              size="sm"
              className="flex-1 text-xs uppercase"
              onClick={() => onUpdate({ iconSize: size })}
            >
              {size}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
});

export const ProgressBarProperties = memo(function ProgressBarProperties({ element, onUpdate }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Fortschritt ({element.progressValue || 60}%)</Label>
        <Slider
          value={[element.progressValue || 60]}
          onValueChange={([v]) => onUpdate({ progressValue: v })}
          min={0}
          max={100}
          step={1}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Label anzeigen</Label>
        <Switch
          checked={element.progressShowLabel !== false}
          onCheckedChange={(checked) => onUpdate({ progressShowLabel: checked })}
        />
      </div>
    </div>
  );
});

export const TimerProperties = memo(function TimerProperties({ element, onUpdate }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">End-Datum</Label>
        <Input
          type="datetime-local"
          value={element.timerEndDate ? element.timerEndDate.slice(0, 16) : ""}
          onChange={(e) => onUpdate({ timerEndDate: new Date(e.target.value).toISOString() })}
          className="text-sm h-8"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Stil</Label>
        <Select
          value={element.timerStyle || "countdown"}
          onValueChange={(v) => onUpdate({ timerStyle: v as "countdown" | "stopwatch" })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="countdown">Countdown</SelectItem>
            <SelectItem value="stopwatch">Stoppuhr</SelectItem>
          </SelectContent>
        </Select>
      </div>
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

export const SliderElementProperties = memo(function SliderElementProperties({ element, onUpdate }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <Label className="text-xs font-medium">Slides</Label>
      {(element.slides || []).map((slide, idx) => (
        <div key={slide.id} className="p-3 border rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Slide {idx + 1}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-destructive"
              onClick={() => {
                const slides = [...(element.slides || [])];
                slides.splice(idx, 1);
                onUpdate({ slides });
              }}
            >×</Button>
          </div>
          <Input
            value={slide.image || ""}
            onChange={(e) => {
              const slides = [...(element.slides || [])];
              slides[idx] = { ...slides[idx], image: e.target.value };
              onUpdate({ slides });
            }}
            placeholder="Bild-URL"
            className="text-sm h-8"
          />
          <Input
            value={slide.title || ""}
            onChange={(e) => {
              const slides = [...(element.slides || [])];
              slides[idx] = { ...slides[idx], title: e.target.value };
              onUpdate({ slides });
            }}
            placeholder="Titel"
            className="text-sm h-8"
          />
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => {
          const slides = [...(element.slides || [])];
          slides.push({ id: `slide-${Date.now()}`, image: "", title: "" });
          onUpdate({ slides });
        }}
      >+ Slide hinzufügen</Button>
    </div>
  );
});
