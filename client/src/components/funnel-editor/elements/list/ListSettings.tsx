import type { ElementSettingsProps } from "../../registry/element-registry";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";

export function ListSettings({ element, onUpdate }: ElementSettingsProps) {
  const items = element.listItems ?? [];
  const style = element.listStyle ?? "check";

  const updateItemText = (index: number, text: string) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, text } : item,
    );
    onUpdate({ listItems: updated });
  };

  const addItem = () => {
    onUpdate({
      listItems: [
        ...items,
        { id: `li-${Date.now()}`, text: "Neuer Punkt" },
      ],
    });
  };

  const removeItem = (index: number) => {
    onUpdate({ listItems: items.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="list-style">Listenstil</Label>
        <Select
          value={style}
          onValueChange={(value) => onUpdate({ listStyle: value as "check" | "bullet" | "number" })}
        >
          <SelectTrigger id="list-style">
            <SelectValue placeholder="Stil wählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="check">Häkchen</SelectItem>
            <SelectItem value="bullet">Punkte</SelectItem>
            <SelectItem value="number">Nummern</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Listeneinträge</Label>
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2">
            <Input
              value={item.text}
              onChange={(e) => updateItemText(index, e.target.value)}
              placeholder="Text eingeben..."
            />
            {items.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => removeItem(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full" onClick={addItem}>
          <Plus className="w-4 h-4 mr-2" />
          Eintrag hinzufügen
        </Button>
      </div>
    </div>
  );
}
