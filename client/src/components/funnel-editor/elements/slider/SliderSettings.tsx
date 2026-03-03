import type { ElementSettingsProps } from "../../registry/element-registry";
import { Label } from "@/components/ui/label";

export function SliderSettings({ element, onUpdate }: ElementSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Bilder-Slider</Label>
        <p className="text-sm text-muted-foreground">
          Konfigurieren Sie den Bilder-Slider mit Ihren eigenen Bildern.
        </p>
      </div>
    </div>
  );
}
