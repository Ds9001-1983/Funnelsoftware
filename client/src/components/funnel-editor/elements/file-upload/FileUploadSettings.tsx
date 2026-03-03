import type { ElementSettingsProps } from "../../registry/element-registry";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export function FileUploadSettings({ element, onUpdate }: ElementSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Label</Label>
        <Input
          value={element.label || ""}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="z.B. Datei hochladen..."
        />
      </div>

      <div className="space-y-2">
        <Label>Akzeptierte Dateitypen</Label>
        <Select
          value={element.acceptedFileTypes?.join(",") || "all"}
          onValueChange={(value) =>
            onUpdate({ acceptedFileTypes: value === "all" ? undefined : value.split(",") })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Dateityp wählen..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Dateien</SelectItem>
            <SelectItem value=".pdf">Nur PDF</SelectItem>
            <SelectItem value=".jpg,.jpeg,.png,.gif">Nur Bilder</SelectItem>
            <SelectItem value=".pdf,.doc,.docx">Dokumente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label>Pflichtfeld</Label>
        <Switch
          checked={element.required || false}
          onCheckedChange={(checked) => onUpdate({ required: checked })}
        />
      </div>
    </div>
  );
}
