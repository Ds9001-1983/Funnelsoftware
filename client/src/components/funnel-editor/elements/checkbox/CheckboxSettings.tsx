import { X, Plus } from "lucide-react";
import type { ElementSettingsProps } from "../../registry/element-registry";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function CheckboxSettings({ element, onUpdate }: ElementSettingsProps) {
  const options = element.options || [];

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    onUpdate({ options: newOptions });
  };

  const addOption = () => {
    onUpdate({ options: [...options, `Option ${options.length + 1}`] });
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    onUpdate({ options: newOptions });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Label</Label>
        <Input
          value={element.label || ""}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="z.B. Interessen, Optionen..."
        />
      </div>

      <div className="space-y-2">
        <Label>Optionen</Label>
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => removeOption(index)}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addOption}
          className="w-full mt-2"
        >
          <Plus className="h-4 w-4 mr-1" />
          Option hinzufügen
        </Button>
      </div>
    </div>
  );
}
