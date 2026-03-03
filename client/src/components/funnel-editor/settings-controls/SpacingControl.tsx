import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface SpacingControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function SpacingControl({
  label,
  value,
  onChange,
  min = 0,
  max = 64,
  step = 4,
}: SpacingControlProps) {
  const numValue = parseInt(value || "0", 10) || 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs text-muted-foreground font-mono">{numValue}px</span>
      </div>
      <Slider
        value={[numValue]}
        onValueChange={([v]) => onChange(`${v}px`)}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}
