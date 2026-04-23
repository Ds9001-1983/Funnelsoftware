import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PropertiesProps } from "./types";

export const ButtonProperties = memo(function ButtonProperties({ element, onUpdate, pages = [] }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Button-Text</Label>
        <Input
          value={element.content || ""}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder="Jetzt starten"
          className="text-sm h-8"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Variante</Label>
        <div className="flex gap-1">
          {(["primary", "secondary", "outline", "ghost"] as const).map((variant) => (
            <Button
              key={variant}
              variant={
                (element.buttonVariant || "primary") === variant ? "default" : "outline"
              }
              size="sm"
              className="flex-1 text-xs capitalize"
              onClick={() => onUpdate({ buttonVariant: variant })}
            >
              {variant === "primary"
                ? "Primär"
                : variant === "secondary"
                ? "Sekundär"
                : variant === "outline"
                ? "Rahmen"
                : "Ghost"}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Aktion</Label>
        <Select
          value={element.buttonAction || "next"}
          onValueChange={(v) => onUpdate({ buttonAction: v as "next" | "page" | "url" })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="next">Nächste Seite</SelectItem>
            <SelectItem value="page">Zu bestimmter Seite...</SelectItem>
            <SelectItem value="url">Externe URL</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {(element.buttonAction === "page") && pages.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs">Ziel-Seite</Label>
          <Select
            value={element.buttonNextPageId || ""}
            onValueChange={(v) => onUpdate({ buttonNextPageId: v })}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Seite wählen..." />
            </SelectTrigger>
            <SelectContent>
              {pages.map((page, idx) => (
                <SelectItem key={page.id} value={page.id}>
                  {idx + 1}. {page.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {(element.buttonAction === "url" || (!element.buttonAction && element.buttonUrl)) && (
        <>
          <div className="space-y-2">
            <Label className="text-xs">Link-URL</Label>
            <Input
              value={element.buttonUrl || ""}
              onChange={(e) => onUpdate({ buttonUrl: e.target.value })}
              placeholder="https://..."
              className="text-sm h-8"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">In neuem Tab öffnen</Label>
            <Switch
              checked={element.buttonTarget === "_blank"}
              onCheckedChange={(checked) =>
                onUpdate({ buttonTarget: checked ? "_blank" : "_self" })
              }
            />
          </div>
        </>
      )}
    </div>
  );
});
