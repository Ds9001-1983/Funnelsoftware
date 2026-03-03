import type { ElementSettingsProps } from "../../registry/element-registry";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export function FaqSettings({ element, onUpdate }: ElementSettingsProps) {
  const items = element.faqItems ?? [];

  const updateItem = (index: number, field: "question" | "answer", value: string) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item,
    );
    onUpdate({ faqItems: updated });
  };

  const addItem = () => {
    onUpdate({
      faqItems: [
        ...items,
        { id: `faq-${Date.now()}`, question: "Neue Frage?", answer: "Antwort hier eingeben." },
      ],
    });
  };

  const removeItem = (index: number) => {
    onUpdate({ faqItems: items.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <Label>FAQ-Einträge</Label>
      {items.map((item, index) => (
        <div key={item.id} className="space-y-2 bg-muted/50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Frage {index + 1}
            </span>
            {items.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removeItem(index)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
          <Input
            value={item.question}
            onChange={(e) => updateItem(index, "question", e.target.value)}
            placeholder="Frage eingeben..."
          />
          <Textarea
            value={item.answer}
            onChange={(e) => updateItem(index, "answer", e.target.value)}
            placeholder="Antwort eingeben..."
            rows={2}
          />
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full" onClick={addItem}>
        <Plus className="w-4 h-4 mr-2" />
        FAQ hinzufügen
      </Button>
    </div>
  );
}
