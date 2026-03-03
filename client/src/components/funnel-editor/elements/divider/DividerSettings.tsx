import type { ElementSettingsProps } from "../../registry/element-registry";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DividerSettings({ element, onUpdate }: ElementSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Stil</Label>
        <Select
          value={element.dividerStyle ?? "solid"}
          onValueChange={(value) =>
            onUpdate({
              dividerStyle: value as "solid" | "dashed" | "dotted" | "gradient",
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solid">Durchgehend</SelectItem>
            <SelectItem value="dashed">Gestrichelt</SelectItem>
            <SelectItem value="dotted">Gepunktet</SelectItem>
            <SelectItem value="gradient">Gradient</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
