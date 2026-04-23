import { memo } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { QuickEditorProps } from "./types";

export const TestimonialQuick = memo(function TestimonialQuick({ element, onUpdate }: QuickEditorProps) {
  if (!element.slides) return null;
  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Testimonial-Text"
        value={element.slides[0]?.text || ""}
        onChange={(e) =>
          onUpdate({ slides: [{ ...element.slides![0], text: e.target.value }] })
        }
        rows={2}
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Name"
          value={element.slides[0]?.author || ""}
          onChange={(e) =>
            onUpdate({ slides: [{ ...element.slides![0], author: e.target.value }] })
          }
        />
        <Input
          placeholder="Position"
          value={element.slides[0]?.role || ""}
          onChange={(e) =>
            onUpdate({ slides: [{ ...element.slides![0], role: e.target.value }] })
          }
        />
      </div>
    </div>
  );
});

export const SliderQuick = memo(function SliderQuick({ element, onUpdate }: QuickEditorProps) {
  if (!element.slides) return null;
  return (
    <div className="space-y-2">
      {element.slides.map((slide, idx) => (
        <div key={slide.id} className="space-y-1 p-2 bg-muted/50 rounded">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Slide {idx + 1}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => {
                const newSlides = element.slides!.filter((_, i) => i !== idx);
                onUpdate({ slides: newSlides });
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <Input
            placeholder="Titel"
            value={slide.title || ""}
            onChange={(e) => {
              const newSlides = [...element.slides!];
              newSlides[idx] = { ...slide, title: e.target.value };
              onUpdate({ slides: newSlides });
            }}
          />
          <Input
            placeholder="Bild-URL"
            value={slide.image || ""}
            onChange={(e) => {
              const newSlides = [...element.slides!];
              newSlides[idx] = { ...slide, image: e.target.value };
              onUpdate({ slides: newSlides });
            }}
          />
          <Textarea
            placeholder="Beschreibung (optional)"
            value={slide.text || ""}
            onChange={(e) => {
              const newSlides = [...element.slides!];
              newSlides[idx] = { ...slide, text: e.target.value };
              onUpdate({ slides: newSlides });
            }}
            rows={2}
          />
        </div>
      ))}
      <Button
        size="sm"
        variant="ghost"
        className="w-full"
        onClick={() => {
          onUpdate({
            slides: [
              ...(element.slides || []),
              {
                id: `slide-${Date.now()}`,
                title: `Slide ${(element.slides?.length || 0) + 1}`,
                image: "",
                text: "",
              },
            ],
          });
        }}
      >
        <Plus className="h-4 w-4 mr-1" />
        Slide hinzufügen
      </Button>
    </div>
  );
});

export const FaqQuick = memo(function FaqQuick({ element, onUpdate }: QuickEditorProps) {
  if (!element.faqItems) return null;
  return (
    <div className="space-y-2">
      {element.faqItems.map((item, idx) => (
        <div key={item.id} className="space-y-1 p-2 bg-muted/50 rounded">
          <Input
            placeholder="Frage"
            value={item.question}
            onChange={(e) => {
              const newItems = [...element.faqItems!];
              newItems[idx] = { ...item, question: e.target.value };
              onUpdate({ faqItems: newItems });
            }}
          />
          <Textarea
            placeholder="Antwort"
            value={item.answer}
            onChange={(e) => {
              const newItems = [...element.faqItems!];
              newItems[idx] = { ...item, answer: e.target.value };
              onUpdate({ faqItems: newItems });
            }}
            rows={2}
          />
        </div>
      ))}
      <Button
        size="sm"
        variant="ghost"
        className="w-full"
        onClick={() => {
          onUpdate({
            faqItems: [
              ...(element.faqItems || []),
              {
                id: `faq-${Date.now()}`,
                question: "Neue Frage",
                answer: "Antwort...",
              },
            ],
          });
        }}
      >
        <Plus className="h-4 w-4 mr-1" />
        FAQ hinzufügen
      </Button>
    </div>
  );
});

export const ListQuick = memo(function ListQuick({ element, onUpdate }: QuickEditorProps) {
  if (!element.listItems) return null;
  return (
    <div className="space-y-2">
      <Select
        value={element.listStyle || "check"}
        onValueChange={(v) =>
          onUpdate({ listStyle: v as "bullet" | "number" | "check" | "icon" })
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="check">Häkchen</SelectItem>
          <SelectItem value="bullet">Punkte</SelectItem>
          <SelectItem value="number">Nummern</SelectItem>
        </SelectContent>
      </Select>
      {element.listItems.map((item, idx) => (
        <div key={item.id} className="flex gap-2">
          <Input
            value={item.text}
            onChange={(e) => {
              const newItems = [...element.listItems!];
              newItems[idx] = { ...item, text: e.target.value };
              onUpdate({ listItems: newItems });
            }}
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              const newItems = element.listItems!.filter((_, i) => i !== idx);
              onUpdate({ listItems: newItems });
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        size="sm"
        variant="ghost"
        className="w-full"
        onClick={() => {
          onUpdate({
            listItems: [...(element.listItems || []), { id: `li-${Date.now()}`, text: "Neuer Punkt" }],
          });
        }}
      >
        <Plus className="h-4 w-4 mr-1" />
        Punkt hinzufügen
      </Button>
    </div>
  );
});

export const SocialProofQuick = memo(function SocialProofQuick({ element, onUpdate }: QuickEditorProps) {
  return (
    <div className="space-y-2">
      <Select
        value={element.socialProofType || "logos"}
        onValueChange={(v) =>
          onUpdate({ socialProofType: v as "badges" | "logos" | "stats" | "reviews" })
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="logos">Logos</SelectItem>
          <SelectItem value="badges">Badges</SelectItem>
          <SelectItem value="stats">Statistiken</SelectItem>
          <SelectItem value="reviews">Bewertungen</SelectItem>
        </SelectContent>
      </Select>
      {(element.socialProofItems || []).map((item, idx) => (
        <div key={item.id} className="space-y-1 p-2 bg-muted/50 rounded">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Element {idx + 1}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => {
                const newItems = element.socialProofItems!.filter((_, i) => i !== idx);
                onUpdate({ socialProofItems: newItems });
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <Input
            placeholder="Bild-URL (Logo)"
            value={item.image || ""}
            onChange={(e) => {
              const newItems = [...element.socialProofItems!];
              newItems[idx] = { ...item, image: e.target.value };
              onUpdate({ socialProofItems: newItems });
            }}
          />
          {(element.socialProofType === "stats" || element.socialProofType === "reviews") && (
            <>
              <Input
                placeholder="Wert (z.B. 500+)"
                value={item.value || ""}
                onChange={(e) => {
                  const newItems = [...element.socialProofItems!];
                  newItems[idx] = { ...item, value: e.target.value };
                  onUpdate({ socialProofItems: newItems });
                }}
              />
              <Input
                placeholder="Beschreibung"
                value={item.text || ""}
                onChange={(e) => {
                  const newItems = [...element.socialProofItems!];
                  newItems[idx] = { ...item, text: e.target.value };
                  onUpdate({ socialProofItems: newItems });
                }}
              />
            </>
          )}
        </div>
      ))}
      <Button
        size="sm"
        variant="ghost"
        className="w-full"
        onClick={() => {
          onUpdate({
            socialProofItems: [
              ...(element.socialProofItems || []),
              {
                id: `sp-${Date.now()}`,
                image: "",
                text: "",
                value: "",
              },
            ],
          });
        }}
      >
        <Plus className="h-4 w-4 mr-1" />
        Element hinzufügen
      </Button>
    </div>
  );
});
