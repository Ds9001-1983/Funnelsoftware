import React, { useMemo, useCallback } from "react";
import {
  ChevronLeft,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PageElement, FunnelPage, PageAnimation } from "@shared/schema";
import { useEditorStore } from "./store/editor-store";
import { registry } from "./registry/element-registry";
import { SettingsTabs } from "./settings-controls/SettingsTabs";
import { ColorPicker } from "./settings-controls/ColorPicker";
import { SpacingControl } from "./settings-controls/SpacingControl";
import { TypographyControl } from "./settings-controls/TypographyControl";
import * as Icons from "lucide-react";
import { ConditionalLogicEditor } from "./ConditionalLogicEditor";
import { SectionTemplatesPicker } from "./SectionTemplatesPicker";

/**
 * Rechte Seitenleiste: Zeigt entweder Element-Settings oder Seiten-Settings.
 */
export function SettingsPanel() {
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const selectedElement = useEditorStore((s) => s.getSelectedElement());
  const currentPage = useEditorStore((s) => s.getCurrentPage());

  if (!currentPage) return null;

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {selectedElement ? (
        <ElementSettings element={selectedElement} />
      ) : (
        <PageSettings page={currentPage} />
      )}
    </div>
  );
}

// --- Element Settings ---

function ElementSettings({ element }: { element: PageElement }) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const deleteElement = useEditorStore((s) => s.deleteElement);
  const duplicateElement = useEditorStore((s) => s.duplicateElement);
  const moveElement = useEditorStore((s) => s.moveElement);
  const selectElement = useEditorStore((s) => s.selectElement);
  const currentPage = useEditorStore((s) => s.getCurrentPage());

  const definition = useMemo(() => registry.get(element.type), [element.type]);
  const SettingsComponent = definition?.settingsComponent;

  const handleUpdate = useCallback(
    (updates: Partial<PageElement>) => {
      updateElement(element.id, updates);
    },
    [element.id, updateElement]
  );

  const handleStyleUpdate = useCallback(
    (styleUpdates: Record<string, string>) => {
      updateElement(element.id, {
        styles: { ...element.styles, ...styleUpdates },
      });
    },
    [element.id, element.styles, updateElement]
  );

  const elementIndex = currentPage?.elements.findIndex((el) => el.id === element.id) ?? -1;
  const canMoveUp = elementIndex > 0;
  const canMoveDown = currentPage ? elementIndex < currentPage.elements.length - 1 : false;

  // Get icon
  const IconComponent = definition?.icon
    ? (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[definition.icon]
    : null;

  // Check if element is a text type (has typography controls)
  const hasTypography = ["heading", "text", "button"].includes(element.type);

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
              {IconComponent && <IconComponent className="h-3.5 w-3.5 text-primary" />}
            </div>
            <span className="text-sm font-medium">{definition?.label || element.type}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => selectElement(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick actions */}
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 flex-1 text-xs"
            onClick={() => canMoveUp && moveElement(element.id, elementIndex - 1)}
            disabled={!canMoveUp}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 flex-1 text-xs"
            onClick={() => canMoveDown && moveElement(element.id, elementIndex + 1)}
            disabled={!canMoveDown}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => duplicateElement(element.id)}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs text-destructive hover:text-destructive"
            onClick={() => deleteElement(element.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Tabs: Inhalt / Style / Erweitert */}
      <div className="flex-1 overflow-y-auto p-4">
        <SettingsTabs
          inhaltContent={
            SettingsComponent ? (
              <SettingsComponent element={element} onUpdate={handleUpdate} />
            ) : (
              <p className="text-xs text-muted-foreground">
                Keine Einstellungen verfügbar.
              </p>
            )
          }
          styleContent={
            <div className="space-y-4">
              {/* Typography (only for text-like elements) */}
              {hasTypography && (
                <TypographyControl
                  fontSize={element.styles?.fontSize}
                  fontWeight={element.styles?.fontWeight}
                  fontStyle={element.styles?.fontStyle}
                  textAlign={element.styles?.textAlign}
                  onUpdate={handleStyleUpdate}
                />
              )}

              {/* Text color */}
              {hasTypography && (
                <ColorPicker
                  label="Textfarbe"
                  value={element.styles?.color || "#1a1a1a"}
                  onChange={(v) => handleStyleUpdate({ color: v })}
                />
              )}

              {/* Background color */}
              <ColorPicker
                label="Hintergrundfarbe"
                value={element.styles?.backgroundColor || ""}
                onChange={(v) => handleStyleUpdate({ backgroundColor: v })}
              />

              {/* Padding */}
              <SpacingControl
                label="Innenabstand"
                value={element.styles?.padding || "0px"}
                onChange={(v) => handleStyleUpdate({ padding: v })}
              />

              {/* Margin */}
              <SpacingControl
                label="Außenabstand"
                value={element.styles?.margin || "0px"}
                onChange={(v) => handleStyleUpdate({ margin: v })}
              />

              {/* Border radius */}
              <SpacingControl
                label="Eckenradius"
                value={element.styles?.borderRadius || "0px"}
                onChange={(v) => handleStyleUpdate({ borderRadius: v })}
                max={32}
                step={2}
              />
            </div>
          }
        />
      </div>
    </>
  );
}

// --- Page Settings ---

function PageSettings({ page }: { page: FunnelPage }) {
  const updatePage = useEditorStore((s) => s.updatePage);
  const theme = useEditorStore((s) => s.theme);

  const handleUpdate = useCallback(
    (updates: Partial<FunnelPage>) => {
      updatePage(page.id, updates);
    },
    [page.id, updatePage]
  );

  const isWelcomeOrThankYou = page.type === "welcome" || page.type === "thankyou";

  return (
    <>
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold">Seiten-Einstellungen</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <Label className="text-xs">Titel</Label>
          <Input
            value={page.title}
            onChange={(e) => handleUpdate({ title: e.target.value })}
            className="h-8 text-sm"
          />
        </div>

        {/* Subtitle */}
        <div className="space-y-2">
          <Label className="text-xs">Untertitel</Label>
          <Textarea
            value={page.subtitle || ""}
            onChange={(e) => handleUpdate({ subtitle: e.target.value })}
            rows={2}
            className="text-sm"
          />
        </div>

        {/* Button text */}
        {page.type !== "thankyou" && (
          <div className="space-y-2">
            <Label className="text-xs">Button-Text</Label>
            <Input
              value={page.buttonText || ""}
              onChange={(e) => handleUpdate({ buttonText: e.target.value })}
              className="h-8 text-sm"
              placeholder="Weiter"
            />
          </div>
        )}

        {/* Background color */}
        {isWelcomeOrThankYou && (
          <ColorPicker
            label="Hintergrundfarbe"
            value={page.backgroundColor || theme.primaryColor}
            onChange={(v) => handleUpdate({ backgroundColor: v })}
          />
        )}

        {/* Animation */}
        <div className="space-y-2">
          <Label className="text-xs">Animation</Label>
          <Select
            value={page.animation || "fade"}
            onValueChange={(v) => handleUpdate({ animation: v as PageAnimation })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fade">Einblenden</SelectItem>
              <SelectItem value="slide">Schieben</SelectItem>
              <SelectItem value="scale">Skalieren</SelectItem>
              <SelectItem value="none">Keine</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Confetti */}
        {page.type === "thankyou" && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-xs">Konfetti-Animation</Label>
              <p className="text-xs text-muted-foreground">Bei Seitenaufruf</p>
            </div>
            <Switch
              checked={page.showConfetti || false}
              onCheckedChange={(checked) => handleUpdate({ showConfetti: checked })}
            />
          </div>
        )}

        {/* Conditional Logic */}
        <div className="space-y-2">
          <Label className="text-xs">Conditional Logic</Label>
          <ConditionalLogicEditor pageId={page.id} />
        </div>

        {/* Section Templates */}
        <div className="space-y-2">
          <Label className="text-xs">Vorlagen</Label>
          <SectionTemplatesPicker />
        </div>
      </div>
    </>
  );
}
