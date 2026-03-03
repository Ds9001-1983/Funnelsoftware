import { useState, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Plus,
  X,
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
import { Slider } from "@/components/ui/slider";
import type { FunnelPage, PageElement, PageAnimation, Section } from "@shared/schema";

import { SortableElementItem } from "./SortableElementItem";
import { ElementPalette } from "./ElementPalette";
import { ConditionalLogicEditor } from "./ConditionalLogicEditor";
import { PersonalizationInserter } from "./PersonalizationInserter";
import { SectionTemplatesPicker } from "./SectionTemplatesPicker";
import { SectionEditor } from "./SectionEditor";
import { ElementStyleEditor } from "./ElementStyleEditor";
import { FormValidationEditor } from "./FormValidationEditor";

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
 * Ermöglicht das Bearbeiten von Inhalt, Logik und Design einer Seite.
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

  const addElement = (type: PageElement["type"]) => {
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
        type === "fileUpload" ? "Datei hochladen" :
        type === "video" ? "Video" :
        type === "date" ? "Datum" :
        type === "heading" ? "Überschrift" :
        type === "text" ? "Dein Text hier..." :
        type === "select" ? "Auswahl" : undefined,
      content:
        type === "heading" ? "Deine Überschrift" :
        type === "text" ? "Füge hier deinen Text ein. Beschreibe dein Angebot oder gib wichtige Informationen." : undefined,
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
    };
    onUpdate({ elements: [...page.elements, newElement] });
  };

  const updateElement = (id: string, updates: Partial<PageElement>) => {
    onUpdate({
      elements: page.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    });
  };

  const removeElement = (id: string) => {
    onUpdate({ elements: page.elements.filter((el) => el.id !== id) });
  };

  const duplicateElement = (element: PageElement) => {
    const newElement = { ...element, id: `el-${Date.now()}` };
    const index = page.elements.findIndex(el => el.id === element.id);
    const newElements = [...page.elements];
    newElements.splice(index + 1, 0, newElement);
    onUpdate({ elements: newElements });
  };

  const pasteElement = () => {
    if (copiedElement) {
      const newElement = { ...copiedElement, id: `el-${Date.now()}` };
      onUpdate({ elements: [...page.elements, newElement] });
    }
  };

  const reorderElements = (activeId: string, overId: string) => {
    const oldIndex = page.elements.findIndex((el) => el.id === activeId);
    const newIndex = page.elements.findIndex((el) => el.id === overId);
    if (oldIndex !== -1 && newIndex !== -1) {
      onUpdate({ elements: arrayMove(page.elements, oldIndex, newIndex) });
    }
  };

  const elementSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleElementDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderElements(active.id as string, over.id as string);
    }
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
              >
                <SortableContext
                  items={page.elements.map((el) => el.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {page.elements.map((el) => (
                      <SortableElementItem
                        key={el.id}
                        element={el}
                        onDelete={() => removeElement(el.id)}
                        onDuplicate={() => duplicateElement(el)}
                      >
                        <Card>
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <Badge variant="secondary" className="capitalize">
                                {el.type === "input" ? "Textfeld" :
                                 el.type === "textarea" ? "Textbereich" :
                                 el.type === "fileUpload" ? "Datei-Upload" :
                                 el.type === "video" ? "Video" :
                                 el.type === "date" ? "Datum" :
                                 el.type === "select" ? "Dropdown" :
                                 el.type === "testimonial" ? "Bewertung" :
                                 el.type === "slider" ? "Slider" :
                                 el.type === "heading" ? "Überschrift" :
                                 el.type === "text" ? "Text" :
                                 el.type === "faq" ? "FAQ" :
                                 el.type === "list" ? "Liste" :
                                 el.type === "timer" ? "Timer" :
                                 el.type === "divider" ? "Trennlinie" :
                                 el.type === "spacer" ? "Abstand" :
                                 el.type === "image" ? "Bild" :
                                 el.type === "socialProof" ? "Social Proof" :
                                 el.type === "progressBar" ? "Fortschritt" :
                                 el.type === "icon" ? "Icon" : "Auswahl"}
                              </Badge>
                              {(el.type === "input" || el.type === "textarea" || el.type === "fileUpload" || el.type === "date" || el.type === "select") && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <span>Pflicht</span>
                                  <Switch
                                    checked={el.required || false}
                                    onCheckedChange={(checked) =>
                                      updateElement(el.id, { required: checked })
                                    }
                                  />
                                </div>
                              )}
                            </div>

                            {/* Element-specific editors */}
                            {(el.type === "heading" || el.type === "text") && (
                              <div className="space-y-2">
                                {el.type === "heading" ? (
                                  <Input
                                    placeholder="Überschrift"
                                    value={el.content || ""}
                                    onChange={(e) => updateElement(el.id, { content: e.target.value })}
                                  />
                                ) : (
                                  <Textarea
                                    placeholder="Text eingeben..."
                                    value={el.content || ""}
                                    onChange={(e) => updateElement(el.id, { content: e.target.value })}
                                    rows={3}
                                  />
                                )}
                              </div>
                            )}

                            {(el.type === "input" || el.type === "textarea") && (
                              <Input
                                placeholder="Placeholder-Text"
                                value={el.placeholder || ""}
                                onChange={(e) => updateElement(el.id, { placeholder: e.target.value })}
                              />
                            )}

                            {el.type === "fileUpload" && (
                              <div className="space-y-3">
                                <Input
                                  placeholder="z.B. Lebenslauf hochladen"
                                  value={el.label || ""}
                                  onChange={(e) => updateElement(el.id, { label: e.target.value })}
                                />
                                <Select
                                  value={el.acceptedFileTypes?.join(",") || "all"}
                                  onValueChange={(v) =>
                                    updateElement(el.id, {
                                      acceptedFileTypes: v === "all" ? undefined : v.split(",")
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Dateitypen" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">Alle Dateien</SelectItem>
                                    <SelectItem value=".pdf">Nur PDF</SelectItem>
                                    <SelectItem value=".jpg,.jpeg,.png,.gif">Nur Bilder</SelectItem>
                                    <SelectItem value=".pdf,.doc,.docx">Dokumente</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {(el.type === "radio" || el.type === "select") && el.options && (
                              <div className="space-y-2">
                                {el.options.map((opt, optIdx) => (
                                  <div key={optIdx} className="flex gap-2">
                                    <Input
                                      value={opt}
                                      onChange={(e) => {
                                        const newOptions = [...el.options!];
                                        newOptions[optIdx] = e.target.value;
                                        updateElement(el.id, { options: newOptions });
                                      }}
                                    />
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="shrink-0"
                                      onClick={() => {
                                        const newOptions = el.options!.filter((_, i) => i !== optIdx);
                                        updateElement(el.id, { options: newOptions });
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
                                    updateElement(el.id, {
                                      options: [...(el.options || []), `Option ${(el.options?.length || 0) + 1}`],
                                    });
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Option
                                </Button>
                              </div>
                            )}

                            {el.type === "video" && (
                              <div className="space-y-2">
                                <Select
                                  value={el.videoType || "youtube"}
                                  onValueChange={(v) => updateElement(el.id, { videoType: v as "youtube" | "vimeo" | "upload" })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="youtube">YouTube</SelectItem>
                                    <SelectItem value="vimeo">Vimeo</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  placeholder="Video-URL"
                                  value={el.videoUrl || ""}
                                  onChange={(e) => updateElement(el.id, { videoUrl: e.target.value })}
                                />
                              </div>
                            )}

                            {el.type === "testimonial" && el.slides && (
                              <div className="space-y-2">
                                <Textarea
                                  placeholder="Testimonial-Text"
                                  value={el.slides[0]?.text || ""}
                                  onChange={(e) =>
                                    updateElement(el.id, {
                                      slides: [{ ...el.slides![0], text: e.target.value }]
                                    })
                                  }
                                  rows={2}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    placeholder="Name"
                                    value={el.slides[0]?.author || ""}
                                    onChange={(e) =>
                                      updateElement(el.id, {
                                        slides: [{ ...el.slides![0], author: e.target.value }]
                                      })
                                    }
                                  />
                                  <Input
                                    placeholder="Position"
                                    value={el.slides[0]?.role || ""}
                                    onChange={(e) =>
                                      updateElement(el.id, {
                                        slides: [{ ...el.slides![0], role: e.target.value }]
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            )}

                            {el.type === "slider" && el.slides && (
                              <div className="space-y-2">
                                {el.slides.map((slide, idx) => (
                                  <div key={slide.id} className="space-y-1 p-2 bg-muted/50 rounded">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-medium">Slide {idx + 1}</span>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6"
                                        onClick={() => {
                                          const newSlides = el.slides!.filter((_, i) => i !== idx);
                                          updateElement(el.id, { slides: newSlides });
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <Input
                                      placeholder="Titel"
                                      value={slide.title || ""}
                                      onChange={(e) => {
                                        const newSlides = [...el.slides!];
                                        newSlides[idx] = { ...slide, title: e.target.value };
                                        updateElement(el.id, { slides: newSlides });
                                      }}
                                    />
                                    <Input
                                      placeholder="Bild-URL"
                                      value={slide.image || ""}
                                      onChange={(e) => {
                                        const newSlides = [...el.slides!];
                                        newSlides[idx] = { ...slide, image: e.target.value };
                                        updateElement(el.id, { slides: newSlides });
                                      }}
                                    />
                                    <Textarea
                                      placeholder="Beschreibung (optional)"
                                      value={slide.text || ""}
                                      onChange={(e) => {
                                        const newSlides = [...el.slides!];
                                        newSlides[idx] = { ...slide, text: e.target.value };
                                        updateElement(el.id, { slides: newSlides });
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
                                    updateElement(el.id, {
                                      slides: [...(el.slides || []), {
                                        id: `slide-${Date.now()}`,
                                        title: `Slide ${(el.slides?.length || 0) + 1}`,
                                        image: "",
                                        text: ""
                                      }],
                                    });
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Slide hinzufügen
                                </Button>
                              </div>
                            )}

                            {el.type === "faq" && el.faqItems && (
                              <div className="space-y-2">
                                {el.faqItems.map((item, idx) => (
                                  <div key={item.id} className="space-y-1 p-2 bg-muted/50 rounded">
                                    <Input
                                      placeholder="Frage"
                                      value={item.question}
                                      onChange={(e) => {
                                        const newItems = [...el.faqItems!];
                                        newItems[idx] = { ...item, question: e.target.value };
                                        updateElement(el.id, { faqItems: newItems });
                                      }}
                                    />
                                    <Textarea
                                      placeholder="Antwort"
                                      value={item.answer}
                                      onChange={(e) => {
                                        const newItems = [...el.faqItems!];
                                        newItems[idx] = { ...item, answer: e.target.value };
                                        updateElement(el.id, { faqItems: newItems });
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
                                    updateElement(el.id, {
                                      faqItems: [...(el.faqItems || []), {
                                        id: `faq-${Date.now()}`,
                                        question: "Neue Frage",
                                        answer: "Antwort..."
                                      }],
                                    });
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  FAQ hinzufügen
                                </Button>
                              </div>
                            )}

                            {el.type === "list" && el.listItems && (
                              <div className="space-y-2">
                                <Select
                                  value={el.listStyle || "check"}
                                  onValueChange={(v) => updateElement(el.id, { listStyle: v as "bullet" | "number" | "check" | "icon" })}
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
                                {el.listItems.map((item, idx) => (
                                  <div key={item.id} className="flex gap-2">
                                    <Input
                                      value={item.text}
                                      onChange={(e) => {
                                        const newItems = [...el.listItems!];
                                        newItems[idx] = { ...item, text: e.target.value };
                                        updateElement(el.id, { listItems: newItems });
                                      }}
                                    />
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => {
                                        const newItems = el.listItems!.filter((_, i) => i !== idx);
                                        updateElement(el.id, { listItems: newItems });
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
                                    updateElement(el.id, {
                                      listItems: [...(el.listItems || []), { id: `li-${Date.now()}`, text: "Neuer Punkt" }],
                                    });
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Punkt hinzufügen
                                </Button>
                              </div>
                            )}

                            {el.type === "spacer" && (
                              <div className="space-y-2">
                                <Label className="text-xs">Höhe: {el.spacerHeight || 32}px</Label>
                                <Slider
                                  value={[el.spacerHeight || 32]}
                                  onValueChange={([v]) => updateElement(el.id, { spacerHeight: v })}
                                  min={8}
                                  max={128}
                                  step={8}
                                />
                              </div>
                            )}

                            {el.type === "timer" && (
                              <div className="space-y-2">
                                <Label className="text-xs">Enddatum</Label>
                                <Input
                                  type="datetime-local"
                                  value={el.timerEndDate ? new Date(el.timerEndDate).toISOString().slice(0, 16) : ""}
                                  onChange={(e) => updateElement(el.id, { timerEndDate: new Date(e.target.value).toISOString() })}
                                />
                                <Select
                                  value={el.timerStyle || "countdown"}
                                  onValueChange={(v) => updateElement(el.id, { timerStyle: v as "countdown" | "stopwatch" })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="countdown">Countdown</SelectItem>
                                    <SelectItem value="stopwatch">Stoppuhr</SelectItem>
                                  </SelectContent>
                                </Select>
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">Tage anzeigen</Label>
                                  <Switch
                                    checked={el.timerShowDays !== false}
                                    onCheckedChange={(checked) => updateElement(el.id, { timerShowDays: checked })}
                                  />
                                </div>
                              </div>
                            )}

                            {el.type === "date" && (
                              <div className="space-y-2">
                                <Input
                                  placeholder="z.B. Geburtsdatum"
                                  value={el.label || ""}
                                  onChange={(e) => updateElement(el.id, { label: e.target.value })}
                                />
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">Uhrzeit einbeziehen</Label>
                                  <Switch
                                    checked={el.includeTime || false}
                                    onCheckedChange={(checked) => updateElement(el.id, { includeTime: checked })}
                                  />
                                </div>
                              </div>
                            )}

                            {el.type === "image" && (
                              <div className="space-y-2">
                                <Input
                                  placeholder="Bild-URL"
                                  value={el.imageUrl || ""}
                                  onChange={(e) => updateElement(el.id, { imageUrl: e.target.value })}
                                />
                                <Input
                                  placeholder="Alt-Text"
                                  value={el.imageAlt || ""}
                                  onChange={(e) => updateElement(el.id, { imageAlt: e.target.value })}
                                />
                              </div>
                            )}

                            {el.type === "socialProof" && (
                              <div className="space-y-2">
                                <Select
                                  value={el.socialProofType || "logos"}
                                  onValueChange={(v) => updateElement(el.id, { socialProofType: v as "badges" | "logos" | "stats" | "reviews" })}
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
                                {(el.socialProofItems || []).map((item, idx) => (
                                  <div key={item.id} className="space-y-1 p-2 bg-muted/50 rounded">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-medium">Element {idx + 1}</span>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6"
                                        onClick={() => {
                                          const newItems = el.socialProofItems!.filter((_, i) => i !== idx);
                                          updateElement(el.id, { socialProofItems: newItems });
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <Input
                                      placeholder="Bild-URL (Logo)"
                                      value={item.image || ""}
                                      onChange={(e) => {
                                        const newItems = [...el.socialProofItems!];
                                        newItems[idx] = { ...item, image: e.target.value };
                                        updateElement(el.id, { socialProofItems: newItems });
                                      }}
                                    />
                                    {(el.socialProofType === "stats" || el.socialProofType === "reviews") && (
                                      <>
                                        <Input
                                          placeholder="Wert (z.B. 500+)"
                                          value={item.value || ""}
                                          onChange={(e) => {
                                            const newItems = [...el.socialProofItems!];
                                            newItems[idx] = { ...item, value: e.target.value };
                                            updateElement(el.id, { socialProofItems: newItems });
                                          }}
                                        />
                                        <Input
                                          placeholder="Beschreibung"
                                          value={item.text || ""}
                                          onChange={(e) => {
                                            const newItems = [...el.socialProofItems!];
                                            newItems[idx] = { ...item, text: e.target.value };
                                            updateElement(el.id, { socialProofItems: newItems });
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
                                    updateElement(el.id, {
                                      socialProofItems: [...(el.socialProofItems || []), {
                                        id: `sp-${Date.now()}`,
                                        image: "",
                                        text: "",
                                        value: ""
                                      }],
                                    });
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Element hinzufügen
                                </Button>
                              </div>
                            )}

                            {el.type === "divider" && (
                              <div className="space-y-2">
                                <Label className="text-xs">Stil</Label>
                                <Select
                                  value={el.dividerStyle || "solid"}
                                  onValueChange={(v) => updateElement(el.id, { dividerStyle: v as "solid" | "dashed" | "dotted" | "gradient" })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="solid">Durchgezogen</SelectItem>
                                    <SelectItem value="dashed">Gestrichelt</SelectItem>
                                    <SelectItem value="dotted">Gepunktet</SelectItem>
                                    <SelectItem value="gradient">Gradient</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {el.type === "progressBar" && (
                              <div className="space-y-2">
                                <Label className="text-xs">Fortschritt: {el.progressValue || 60}%</Label>
                                <Slider
                                  value={[el.progressValue || 60]}
                                  onValueChange={([v]) => updateElement(el.id, { progressValue: v })}
                                  min={0}
                                  max={100}
                                  step={5}
                                />
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">Prozent anzeigen</Label>
                                  <Switch
                                    checked={el.progressShowLabel !== false}
                                    onCheckedChange={(checked) => updateElement(el.id, { progressShowLabel: checked })}
                                  />
                                </div>
                              </div>
                            )}

                            {el.type === "icon" && (
                              <div className="space-y-2">
                                <Label className="text-xs">Icon-Name</Label>
                                <Select
                                  value={el.iconName || "star"}
                                  onValueChange={(v) => updateElement(el.id, { iconName: v })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="star">Stern</SelectItem>
                                    <SelectItem value="heart">Herz</SelectItem>
                                    <SelectItem value="check">Häkchen</SelectItem>
                                    <SelectItem value="award">Auszeichnung</SelectItem>
                                    <SelectItem value="shield">Schild</SelectItem>
                                    <SelectItem value="trophy">Pokal</SelectItem>
                                    <SelectItem value="rocket">Rakete</SelectItem>
                                    <SelectItem value="lightning">Blitz</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Label className="text-xs">Größe</Label>
                                <Select
                                  value={el.iconSize || "md"}
                                  onValueChange={(v) => updateElement(el.id, { iconSize: v as "sm" | "md" | "lg" | "xl" })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="sm">Klein</SelectItem>
                                    <SelectItem value="md">Mittel</SelectItem>
                                    <SelectItem value="lg">Groß</SelectItem>
                                    <SelectItem value="xl">Sehr groß</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {/* Style Editor for all elements */}
                            <ElementStyleEditor
                              element={el}
                              onUpdate={(updates) => updateElement(el.id, updates)}
                            />

                            {/* Validation Editor for form elements */}
                            <FormValidationEditor
                              element={el}
                              onUpdate={(updates) => updateElement(el.id, updates)}
                            />
                          </CardContent>
                        </Card>
                      </SortableElementItem>
                    ))}
                  </div>
                </SortableContext>
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
