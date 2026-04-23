import { memo } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PropertiesProps } from "./types";

export const TestimonialProperties = memo(function TestimonialProperties({ element, onUpdate }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <Label className="text-xs font-medium">Bewertungen</Label>
      {(element.slides || []).map((slide, idx) => (
        <div key={slide.id} className="p-3 border rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">#{idx + 1}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-destructive"
              onClick={() => {
                const slides = [...(element.slides || [])];
                slides.splice(idx, 1);
                onUpdate({ slides });
              }}
            >×</Button>
          </div>
          <Input
            value={slide.text || ""}
            onChange={(e) => {
              const slides = [...(element.slides || [])];
              slides[idx] = { ...slides[idx], text: e.target.value };
              onUpdate({ slides });
            }}
            placeholder="Bewertungstext..."
            className="text-sm h-8"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={slide.author || ""}
              onChange={(e) => {
                const slides = [...(element.slides || [])];
                slides[idx] = { ...slides[idx], author: e.target.value };
                onUpdate({ slides });
              }}
              placeholder="Name"
              className="text-sm h-8"
            />
            <Input
              value={slide.role || ""}
              onChange={(e) => {
                const slides = [...(element.slides || [])];
                slides[idx] = { ...slides[idx], role: e.target.value };
                onUpdate({ slides });
              }}
              placeholder="Position"
              className="text-sm h-8"
            />
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => {
          const slides = [...(element.slides || [])];
          slides.push({ id: `slide-${Date.now()}`, text: "", author: "", role: "", rating: 5 });
          onUpdate({ slides });
        }}
      >+ Bewertung hinzufügen</Button>
    </div>
  );
});

export const FaqProperties = memo(function FaqProperties({ element, onUpdate }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <Label className="text-xs font-medium">FAQ-Einträge</Label>
      {(element.faqItems || []).map((item, idx) => (
        <div key={item.id} className="p-3 border rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">#{idx + 1}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-destructive"
              onClick={() => {
                const items = [...(element.faqItems || [])];
                items.splice(idx, 1);
                onUpdate({ faqItems: items });
              }}
            >×</Button>
          </div>
          <Input
            value={item.question}
            onChange={(e) => {
              const items = [...(element.faqItems || [])];
              items[idx] = { ...items[idx], question: e.target.value };
              onUpdate({ faqItems: items });
            }}
            placeholder="Frage"
            className="text-sm h-8"
          />
          <Textarea
            value={item.answer}
            onChange={(e) => {
              const items = [...(element.faqItems || [])];
              items[idx] = { ...items[idx], answer: e.target.value };
              onUpdate({ faqItems: items });
            }}
            placeholder="Antwort"
            rows={2}
            className="text-sm"
          />
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => {
          const items = [...(element.faqItems || [])];
          items.push({ id: `faq-${Date.now()}`, question: "", answer: "" });
          onUpdate({ faqItems: items });
        }}
      >+ Frage hinzufügen</Button>
    </div>
  );
});

export const ListProperties = memo(function ListProperties({ element, onUpdate, pages = [] }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Listen-Stil</Label>
        <div className="flex gap-1">
          {(["bullet", "number", "check", "icon"] as const).map((style) => (
            <Button
              key={style}
              variant={(element.listStyle || "bullet") === style ? "default" : "outline"}
              size="sm"
              className="flex-1 text-xs"
              onClick={() => onUpdate({ listStyle: style })}
            >
              {style === "bullet" ? "•" : style === "number" ? "1." : style === "check" ? "✓" : "★"}
            </Button>
          ))}
        </div>
      </div>
      <Label className="text-xs font-medium">Einträge</Label>
      {(element.listItems || []).map((item, idx) => (
        <div key={item.id} className="space-y-1">
          <div className="flex gap-2">
            <Input
              value={item.text}
              onChange={(e) => {
                const items = [...(element.listItems || [])];
                items[idx] = { ...items[idx], text: e.target.value };
                onUpdate({ listItems: items });
              }}
              placeholder={`Eintrag ${idx + 1}`}
              className="text-sm h-8 flex-1"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive shrink-0"
              onClick={() => {
                const items = [...(element.listItems || [])];
                items.splice(idx, 1);
                onUpdate({ listItems: items });
              }}
            >×</Button>
          </div>
          {pages.length > 0 && (
            <div className="flex items-center gap-1.5 pl-1">
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <Select
                value={item.targetPageId || "__none__"}
                onValueChange={(v) => {
                  const items = [...(element.listItems || [])];
                  items[idx] = { ...items[idx], targetPageId: v === "__none__" ? undefined : v };
                  onUpdate({ listItems: items });
                }}
              >
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue placeholder="Keine Weiterleitung" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Keine Weiterleitung</SelectItem>
                  {pages.map((page, pIdx) => (
                    <SelectItem key={page.id} value={page.id}>
                      {pIdx + 1}. {page.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => {
          const items = [...(element.listItems || [])];
          items.push({ id: `li-${Date.now()}`, text: "" });
          onUpdate({ listItems: items });
        }}
      >+ Eintrag hinzufügen</Button>
    </div>
  );
});

export const SocialProofProperties = memo(function SocialProofProperties({ element, onUpdate }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Typ</Label>
        <Select
          value={element.socialProofType || "badges"}
          onValueChange={(v) => onUpdate({ socialProofType: v as "badges" | "logos" | "stats" | "reviews" })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="badges">Badges</SelectItem>
            <SelectItem value="logos">Logos</SelectItem>
            <SelectItem value="stats">Statistiken</SelectItem>
            <SelectItem value="reviews">Bewertungen</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Label className="text-xs font-medium">Einträge</Label>
      {(element.socialProofItems || []).map((item, idx) => (
        <div key={item.id} className="p-3 border rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">#{idx + 1}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-destructive"
              onClick={() => {
                const items = [...(element.socialProofItems || [])];
                items.splice(idx, 1);
                onUpdate({ socialProofItems: items });
              }}
            >×</Button>
          </div>
          <Input
            value={item.text || ""}
            onChange={(e) => {
              const items = [...(element.socialProofItems || [])];
              items[idx] = { ...items[idx], text: e.target.value };
              onUpdate({ socialProofItems: items });
            }}
            placeholder="Text"
            className="text-sm h-8"
          />
          <Input
            value={item.value || ""}
            onChange={(e) => {
              const items = [...(element.socialProofItems || [])];
              items[idx] = { ...items[idx], value: e.target.value };
              onUpdate({ socialProofItems: items });
            }}
            placeholder="Wert (z.B. 500+)"
            className="text-sm h-8"
          />
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => {
          const items = [...(element.socialProofItems || [])];
          items.push({ id: `sp-${Date.now()}`, text: "", value: "" });
          onUpdate({ socialProofItems: items });
        }}
      >+ Eintrag hinzufügen</Button>
    </div>
  );
});
