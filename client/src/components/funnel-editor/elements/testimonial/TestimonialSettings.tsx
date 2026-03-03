import type { ElementSettingsProps } from "../../registry/element-registry";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function TestimonialSettings({ element, onUpdate }: ElementSettingsProps) {
  const slide = element.slides?.[0];

  const updateSlideField = (field: string, value: string) => {
    onUpdate({
      slides: [{ ...element.slides?.[0], id: slide?.id ?? "slide-1", [field]: value }],
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="testimonial-text">Zitat</Label>
        <Textarea
          id="testimonial-text"
          value={slide?.text ?? ""}
          onChange={(e) => updateSlideField("text", e.target.value)}
          placeholder="Kundenzitat eingeben..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="testimonial-author">Autor</Label>
        <Input
          id="testimonial-author"
          value={slide?.author ?? ""}
          onChange={(e) => updateSlideField("author", e.target.value)}
          placeholder="Name des Autors"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="testimonial-role">Position / Rolle</Label>
        <Input
          id="testimonial-role"
          value={slide?.role ?? ""}
          onChange={(e) => updateSlideField("role", e.target.value)}
          placeholder="z.B. Geschäftsführer"
        />
      </div>
    </div>
  );
}
