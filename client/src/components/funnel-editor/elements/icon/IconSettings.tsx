import type { ElementSettingsProps } from "../../registry/element-registry";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function IconSettings({ element, onUpdate }: ElementSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="icon-size">Größe</Label>
        <Select
          value={element.iconSize ?? "md"}
          onValueChange={(value) => onUpdate({ iconSize: value as "sm" | "md" | "lg" | "xl" })}
        >
          <SelectTrigger id="icon-size">
            <SelectValue placeholder="Größe wählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Klein</SelectItem>
            <SelectItem value="md">Mittel</SelectItem>
            <SelectItem value="lg">Groß</SelectItem>
            <SelectItem value="xl">Sehr groß</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
