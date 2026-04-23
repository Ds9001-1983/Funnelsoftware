import { useState, useRef, useCallback, memo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FunnelPage, PageElement, PageAnimation, Section } from "@shared/schema";

import { SortableElementItem } from "./SortableElementItem";
import { elementTypeLabels } from "./ElementWrapper";
import { ElementPalette } from "./ElementPalette";
import { ConditionalLogicEditor } from "./ConditionalLogicEditor";
import { PersonalizationInserter } from "./PersonalizationInserter";
import { SectionTemplatesPicker } from "./SectionTemplatesPicker";
import { SectionEditor } from "./SectionEditor";
import { ElementStyleEditor } from "./ElementStyleEditor";
import { FormValidationEditor } from "./FormValidationEditor";
import { ElementDragOverlay } from "./DragOverlay";
import {
  ElementQuickEditor,
  RequiredToggle,
  FORM_ELEMENT_TYPES,
} from "./quick-editors";

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
 * Haupteditor für eine einzelne Funnel-Seite.
 * Delegiert Element-spezifische Editoren an `./quick-editors/`, während
 * Seiten-weite Einstellungen (Titel, Logik, Design) hier gehalten werden.
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
  const [copiedElement, setCopiedElement] = useState<PageElement | null>(null);
  const [activeTab, setActiveTab] = useState("content");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const addSection = useCallback((layout: string, columnWidths: number[]) => {
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
  }, [page.sections, onUpdate]);

  const updateSection = useCallback((sectionId: string, updates: Partial<Section>) => {
    const currentSections = page.sections || [];
    const updatedSections = currentSections.map((s) =>
      s.id === sectionId ? { ...s, ...updates } : s
    );
    onUpdate({ sections: updatedSections });
  }, [page.sections, onUpdate]);

  const deleteSection = useCallback((sectionId: string) => {
    const currentSections = page.sections || [];
    onUpdate({ sections: currentSections.filter((s) => s.id !== sectionId) });
    setSelectedSectionId((prev) => (prev === sectionId ? null : prev));
  }, [page.sections, onUpdate]);

  const insertVariable = useCallback((variable: string) => {
    if (titleInputRef.current) {
      const start = titleInputRef.current.selectionStart || 0;
      const end = titleInputRef.current.selectionEnd || 0;
      const text = page.title || "";
      const newText = text.slice(0, start) + variable + text.slice(end);
      onUpdate({ title: newText });
    } else {
      onUpdate({ title: (page.title || "") + " " + variable });
    }
  }, [page.title, onUpdate]);

  const addSectionElements = useCallback((elements: PageElement[]) => {
    onUpdate({ elements: [...page.elements, ...elements] });
  }, [page.elements, onUpdate]);

  const addElement = useCallback((type: PageElement["type"]) => {
    const newElement: PageElement = {
      id: `el-${Date.now()}`,
      type,
      placeholder:
        type === "input" ? "Dein Text hier..." :
        type === "textarea" ? "Deine Nachricht..." :
        type === "select" ? "Option wählen..." :
        type === "date" ? "Datum auswählen..." : undefined,
      options:
        type === "radio" ? ["Option 1", "Option 2", "Option 3"] :
        type === "select" ? ["Option 1", "Option 2", "Option 3"] : undefined,
      label:
        type === "input" ? "Eingabefeld" :
        type === "textarea" ? "Nachricht" :
        type === "fileUpload" ? "Datei hochladen" :
        type === "video" ? "Video" :
        type === "date" ? "Datum" :
        type === "heading" ? "Überschrift" :
        type === "text" ? "Dein Text hier..." :
        type === "select" ? "Auswahl" :
        type === "checkbox" ? "Ich stimme zu" :
        type === "radio" ? "Auswahl treffen" : undefined,
      content:
        type === "heading" ? "Deine Überschrift" :
        type === "text" ? "Füge hier deinen Text ein. Beschreibe dein Angebot oder gib wichtige Informationen." :
        type === "button" ? "Button" : undefined,
      acceptedFileTypes: type === "fileUpload" ? [".pdf", ".jpg", ".jpeg", ".png"] : undefined,
      maxFileSize: type === "fileUpload" ? 10 : undefined,
      maxFiles: type === "fileUpload" ? 1 : undefined,
      videoUrl: type === "video" ? "" : undefined,
      videoType: type === "video" ? "youtube" : undefined,
      includeTime: type === "date" ? false : undefined,
      slides: type === "testimonial" ? [
        { id: "t1", text: "Großartiger Service! Sehr empfehlenswert.", author: "Max Mustermann", role: "Geschäftsführer", rating: 5 }
      ] : type === "slider" ? [
        { id: "s1", title: "Slide 1", text: "" },
        { id: "s2", title: "Slide 2", text: "" },
        { id: "s3", title: "Slide 3", text: "" }
      ] : undefined,
      faqItems: type === "faq" ? [
        { id: "faq1", question: "Wie funktioniert das?", answer: "So funktioniert es..." },
        { id: "faq2", question: "Was kostet das?", answer: "Die Preise sind..." },
      ] : undefined,
      listItems: type === "list" ? [
        { id: "li1", text: "Vorteil Nummer 1" },
        { id: "li2", text: "Vorteil Nummer 2" },
        { id: "li3", text: "Vorteil Nummer 3" },
      ] : undefined,
      listStyle: type === "list" ? "check" : undefined,
      spacerHeight: type === "spacer" ? 32 : undefined,
      dividerStyle: type === "divider" ? "solid" : undefined,
      dividerColor: type === "divider" ? "#e5e7eb" : undefined,
      timerEndDate: type === "timer" ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      timerStyle: type === "timer" ? "countdown" : undefined,
      timerShowDays: type === "timer" ? true : undefined,
      socialProofType: type === "socialProof" ? "logos" : undefined,
      socialProofItems: type === "socialProof" ? [
        { id: "sp1", image: "", text: "", value: "" },
        { id: "sp2", image: "", text: "", value: "" },
        { id: "sp3", image: "", text: "", value: "" },
      ] : undefined,
      progressValue: type === "progressBar" ? 60 : undefined,
      progressShowLabel: type === "progressBar" ? true : undefined,
      iconName: type === "icon" ? "star" : undefined,
      iconSize: type === "icon" ? "md" : undefined,
      teamMembers: type === "team" ? [
        { id: "tm1", name: "Anna Müller", role: "Geschäftsführerin", image: "" },
        { id: "tm2", name: "Tom Schmidt", role: "Entwickler", image: "" },
        { id: "tm3", name: "Lisa Weber", role: "Designerin", image: "" },
        { id: "tm4", name: "Max Fischer", role: "Marketing", image: "" },
      ] : undefined,
      countdownStyle: type === "countdown" ? "flip" : undefined,
      countdownShowLabels: type === "countdown" ? true : undefined,
    };
    onUpdate({ elements: [...page.elements, newElement] });
  }, [page.elements, onUpdate]);

  const updateElement = useCallback((id: string, updates: Partial<PageElement>) => {
    onUpdate({
      elements: page.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    });
  }, [page.elements, onUpdate]);

  const removeElement = useCallback((id: string) => {
    onUpdate({ elements: page.elements.filter((el) => el.id !== id) });
  }, [page.elements, onUpdate]);

  const duplicateElement = useCallback((element: PageElement) => {
    const newElement = { ...element, id: `el-${Date.now()}` };
    const index = page.elements.findIndex(el => el.id === element.id);
    const newElements = [...page.elements];
    newElements.splice(index + 1, 0, newElement);
    onUpdate({ elements: newElements });
  }, [page.elements, onUpdate]);

  const pasteElement = useCallback(() => {
    if (copiedElement) {
      const newElement = { ...copiedElement, id: `el-${Date.now()}` };
      onUpdate({ elements: [...page.elements, newElement] });
    }
  }, [copiedElement, page.elements, onUpdate]);

  const reorderElements = useCallback((activeId: string, overId: string) => {
    const oldIndex = page.elements.findIndex((el) => el.id === activeId);
    const newIndex = page.elements.findIndex((el) => el.id === overId);
    if (oldIndex !== -1 && newIndex !== -1) {
      onUpdate({ elements: arrayMove(page.elements, oldIndex, newIndex) });
    }
  }, [page.elements, onUpdate]);

  const elementSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const [activeElement, setActiveElement] = useState<PageElement | null>(null);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const el = page.elements.find((e) => e.id === event.active.id);
    setActiveElement(el || null);
  }, [page.elements]);

  const handleElementDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderElements(active.id as string, over.id as string);
    }
    setActiveElement(null);
  }, [reorderElements]);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ title: e.target.value }),
    [onUpdate],
  );
  const handleSubtitleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => onUpdate({ subtitle: e.target.value }),
    [onUpdate],
  );
  const handleButtonTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ buttonText: e.target.value }),
    [onUpdate],
  );
  const handleClearElementSelection = useCallback(
    () => setSelectedElementId(null),
    [],
  );

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
        <div className="flex items-center gap-1">
          <PersonalizationInserter onInsert={insertVariable} />
          {copiedElement && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={pasteElement}>
                  <Clipboard className="h-3.5 w-3.5 mr-1" />
                  Einfügen
                </Button>
              </TooltipTrigger>
              <TooltipContent>Element einfügen</TooltipContent>
            </Tooltip>
          )}
        </div>
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
                onChange={handleTitleChange}
                data-testid="input-page-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Untertitel</Label>
              <Textarea
                id="subtitle"
                value={page.subtitle || ""}
                onChange={handleSubtitleChange}
                rows={2}
                data-testid="input-page-subtitle"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buttonText">Button-Text</Label>
              <Input
                id="buttonText"
                value={page.buttonText || ""}
                onChange={handleButtonTextChange}
                data-testid="input-page-button"
              />
            </div>
          </div>

          {/* Element Palette */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Elemente hinzufügen</Label>
            </div>
            <ElementPalette onAddElement={addElement} />
          </div>

          {/* Current Elements */}
          {page.elements.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base">Aktuelle Elemente</Label>
              <DndContext
                sensors={elementSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleElementDragEnd}
                onDragStart={handleDragStart}
              >
                <SortableContext
                  items={page.elements.map((el) => el.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2" onClick={handleClearElementSelection}>
                    {page.elements.map((el) => (
                      <ElementListCard
                        key={el.id}
                        element={el}
                        selected={selectedElementId === el.id}
                        onSelect={setSelectedElementId}
                        onDelete={removeElement}
                        onDuplicate={duplicateElement}
                        onUpdateElement={updateElement}
                      />
                    ))}
                  </div>
                </SortableContext>
                <ElementDragOverlay activeElement={activeElement} />
              </DndContext>
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

// -------------------------------------------------------------------------
// ElementListCard – inline "Schnell-Edit"-Karte für ein Element in der Liste.
// Eigenständige Komponente, damit Tipper in einem Element-Eingabefeld nur die
// betroffene Karte re-rendert, nicht alle Geschwister.
// -------------------------------------------------------------------------

interface ElementListCardProps {
  element: PageElement;
  selected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (element: PageElement) => void;
  onUpdateElement: (id: string, updates: Partial<PageElement>) => void;
}

function ElementListCardImpl({
  element,
  selected,
  onSelect,
  onDelete,
  onDuplicate,
  onUpdateElement,
}: ElementListCardProps) {
  const handleDelete = useCallback(() => onDelete(element.id), [onDelete, element.id]);
  const handleDuplicate = useCallback(() => onDuplicate(element), [onDuplicate, element]);
  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(element.id);
    },
    [onSelect, element.id],
  );
  const handleStyleUpdate = useCallback(
    (updates: Partial<PageElement>) => onUpdateElement(element.id, updates),
    [onUpdateElement, element.id],
  );

  return (
    <SortableElementItem
      element={element}
      onDelete={handleDelete}
      onDuplicate={handleDuplicate}
    >
      <Card
        className={
          selected
            ? "ring-2 ring-primary cursor-pointer transition-shadow"
            : "cursor-pointer transition-shadow hover:shadow-md"
        }
        onClick={handleCardClick}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary" className="capitalize">
              {elementTypeLabels[element.type] || element.type}
            </Badge>
            {FORM_ELEMENT_TYPES.has(element.type) && (
              <RequiredToggle element={element} onUpdate={handleStyleUpdate} />
            )}
          </div>

          <ElementQuickEditor element={element} onUpdateElement={onUpdateElement} />

          <ElementStyleEditor element={element} onUpdate={handleStyleUpdate} />
          <FormValidationEditor element={element} onUpdate={handleStyleUpdate} />
        </CardContent>
      </Card>
    </SortableElementItem>
  );
}

const ElementListCard = memo(ElementListCardImpl);
