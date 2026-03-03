import type { ElementSettingsProps } from "../../registry/element-registry";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export function TimerSettings({ element, onUpdate }: ElementSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="timer-end-date">Enddatum</Label>
        <Input
          id="timer-end-date"
          type="datetime-local"
          value={element.timerEndDate ?? ""}
          onChange={(e) => onUpdate({ timerEndDate: e.target.value })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="timer-show-days">Tage anzeigen</Label>
        <Switch
          id="timer-show-days"
          checked={element.timerShowDays !== false}
          onCheckedChange={(checked) => onUpdate({ timerShowDays: checked })}
        />
      </div>
    </div>
  );
}
