import { useState, useRef } from "react";
import {
  Plus,
  Undo2,
  Redo2,
  GitBranch,
  PartyPopper,
  Clipboard,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FunnelPage, PageElement, PageAnimation, Section } from "@shared/schema";

import { ConditionalLogicEditor } from "./ConditionalLogicEditor";
import { PersonalizationInserter } from "./PersonalizationInserter";
import { SectionTemplatesPicker } from "./SectionTemplatesPicker";
import { SectionEditor } from "./SectionEditor";

interface PageEditorProps {
  page: FunnelPage;
  allPages: FunnelPage[];
  primaryColor: string;
  onUpdate: (updates: Partial<FunnelPage>) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Seiten-Editor für Seiten-Einstellungen (Titel, Logik, Design).
 * Element-Bearbeitung findet direkt im EditorCanvas statt.
 */
export function PageEditor({
  page,
  allPages,
  primaryColor,
  onUpdate,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: PageEditorProps) {
  const [activeTab, setActiveTab] = useState("content");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Section management handlers
  const addSection = (layout: string, columnWidths: number[]) => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      name: "",
      layout: layout as Section["layout"],
      columns: columnWidths.map((width, idx) => ({
        id: `col-${Date.now()}-${idx}`,
        width,
        elements: [],
      })),
      styles: {
        padding: "16px",
      },
    };
    const currentSections = page.sections || [];
    onUpdate({ sections: [...currentSections, newSection] });
    setSelectedSectionId(newSection.id);
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    const currentSections = page.sections || [];
    const updatedSections = currentSections.map((s) =>
      s.id === sectionId ? { ...s, ...updates } : s
    );
    onUpdate({ sections: updatedSections });
  };

  const deleteSection = (sectionId: string) => {
    const currentSections = page.sections || [];
    onUpdate({ sections: currentSections.filter((s) => s.id !== sectionId) });
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
    }
  };

  const insertVariable = (variable: string) => {
    if (titleInputRef.current) {
      const start = titleInputRef.current.selectionStart || 0;
      const end = titleInputRef.current.selectionEnd || 0;
      const text = page.title || "";
      const newText = text.slice(0, start) + variable + text.slice(end);
      onUpdate({ title: newText });
    } else {
      onUpdate({ title: (page.title || "") + " " + variable });
    }
  };

  const addSectionElements = (elements: PageElement[]) => {
    onUpdate({ elements: [...page.elements, ...elements] });
  };

  return (
    <div className="space-y-4">
      {/* Quick Actions Bar */}
      <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={onUndo}
                disabled={!canUndo}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Rückgängig (Ctrl+Z)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={onRedo}
                disabled={!canRedo}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Wiederholen (Ctrl+Y)</TooltipContent>
          </Tooltip>
        </div>
        <PersonalizationInserter onInsert={insertVariable} />
      </div>

      {/* Tabs for Content / Logic / Settings */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="content">Inhalt</TabsTrigger>
          <TabsTrigger value="logic">Logik</TabsTrigger>
          <TabsTrigger value="settings">Design</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4 mt-4">
          {/* Page Settings */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                ref={titleInputRef}
                value={page.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                data-testid="input-page-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Untertitel</Label>
              <Textarea
                id="subtitle"
                value={page.subtitle || ""}
                onChange={(e) => onUpdate({ subtitle: e.target.value })}
                rows={2}
                data-testid="input-page-subtitle"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buttonText">Button-Text</Label>
              <Input
                id="buttonText"
                value={page.buttonText || ""}
                onChange={(e) => onUpdate({ buttonText: e.target.value })}
                data-testid="input-page-button"
              />
            </div>
          </div>

          {/* Elements info */}
          {page.elements.length > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                {page.elements.length} Element{page.elements.length !== 1 ? "e" : ""} auf dieser Seite.
                Elemente direkt im Canvas bearbeiten, verschieben und hinzufügen.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Logic Tab - Conditional Routing */}
        <TabsContent value="logic" className="space-y-4 mt-4">
          <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <GitBranch className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Conditional Logic</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Leite Besucher basierend auf ihren Antworten zu verschiedenen Seiten.
            </p>
            <ConditionalLogicEditor
              page={page}
              allPages={allPages}
              onUpdate={onUpdate}
            />
          </div>

          {/* Default next page */}
          <div className="space-y-2">
            <Label>Standard-Weiterleitung</Label>
            <Select
              value={page.nextPageId || "auto"}
              onValueChange={(value) => onUpdate({ nextPageId: value === "auto" ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Automatisch (nächste Seite)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automatisch (nächste Seite)</SelectItem>
                {allPages.map((p, idx) => (
                  <SelectItem key={p.id} value={p.id}>
                    {idx + 1}. {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Wohin sollen Besucher geleitet werden, wenn keine Bedingung zutrifft?
            </p>
          </div>
        </TabsContent>

        {/* Settings Tab - Design Options */}
        <TabsContent value="settings" className="space-y-4 mt-4">
          {(page.type === "welcome" || page.type === "thankyou") && (
            <div className="space-y-2">
              <Label>Hintergrundfarbe</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={page.backgroundColor || primaryColor}
                  onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                  className="w-14 h-9 p-1 cursor-pointer"
                />
                <Input
                  value={page.backgroundColor || primaryColor}
                  onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          )}

          {page.type === "thankyou" && (
            <div className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <PartyPopper className="h-4 w-4 text-primary" />
                <div>
                  <Label className="text-sm">Konfetti-Animation</Label>
                  <p className="text-xs text-muted-foreground">Zeigt Konfetti bei Seitenaufruf</p>
                </div>
              </div>
              <Switch
                checked={page.showConfetti || false}
                onCheckedChange={(checked) => onUpdate({ showConfetti: checked })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Seitenanimation</Label>
            <Select
              value={page.animation || "fade"}
              onValueChange={(v) => onUpdate({ animation: v as PageAnimation })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fade">Einblenden</SelectItem>
                <SelectItem value="slide">Schieben</SelectItem>
                <SelectItem value="scale">Skalieren</SelectItem>
                <SelectItem value="none">Keine Animation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Section/Column Editor */}
          <div className="pt-4 border-t">
            <Label className="mb-3 block">Sektionen & Spalten</Label>
            <SectionEditor
              sections={page.sections || []}
              onAddSection={addSection}
              onUpdateSection={updateSection}
              onDeleteSection={deleteSection}
              onSelectSection={setSelectedSectionId}
              selectedSectionId={selectedSectionId}
            />
          </div>

          {/* Section Templates */}
          <div className="pt-4 border-t">
            <Label className="mb-3 block">Schnell-Vorlagen</Label>
            <SectionTemplatesPicker onInsert={addSectionElements} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
