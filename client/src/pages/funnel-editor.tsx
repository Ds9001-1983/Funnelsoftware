import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  Save,
  Eye,
  Settings,
  Plus,
  Trash2,
  GripVertical,
  Smartphone,
  Globe,
  Layers,
  Upload,
  FileUp,
  Info,
  Video,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Star,
  Play,
  ListOrdered,
  PartyPopper,
  Sparkles,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Funnel, FunnelPage, PageElement, PageAnimation } from "@shared/schema";
import confetti from "canvas-confetti";

type PageType = FunnelPage["type"];

const pageTypeLabels: Record<PageType, string> = {
  welcome: "Willkommen",
  question: "Frage",
  multiChoice: "Mehrfachauswahl",
  contact: "Kontakt",
  calendar: "Kalender",
  thankyou: "Danke",
};

const pageTypeIcons: Record<PageType, string> = {
  welcome: "W",
  question: "?",
  multiChoice: "C",
  contact: "@",
  calendar: "K",
  thankyou: "T",
};

function PhonePreview({
  page,
  primaryColor,
}: {
  page: FunnelPage | null;
  primaryColor: string;
}) {
  if (!page) {
    return (
      <div className="phone-frame max-w-[320px] mx-auto">
        <div className="phone-screen aspect-[9/16] flex items-center justify-center bg-muted">
          <div className="text-center text-muted-foreground p-6">
            <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Wähle eine Seite aus, um die Vorschau zu sehen</p>
          </div>
        </div>
      </div>
    );
  }

  const isWelcome = page.type === "welcome";
  const isThankyou = page.type === "thankyou";
  const bgColor = page.backgroundColor || (isWelcome || isThankyou ? primaryColor : "#ffffff");
  const textColor = isWelcome || isThankyou ? "#ffffff" : "#1a1a1a";

  return (
    <div className="phone-frame max-w-[320px] mx-auto">
      <div
        className="phone-screen aspect-[9/16] flex flex-col"
        style={{ backgroundColor: bgColor }}
      >
        <div className="flex-1 flex flex-col justify-center p-6 text-center">
          <h2
            className="text-xl font-bold mb-2"
            style={{ color: textColor }}
          >
            {page.title}
          </h2>
          {page.subtitle && (
            <p
              className="text-sm opacity-80 mb-6"
              style={{ color: textColor }}
            >
              {page.subtitle}
            </p>
          )}

          {page.type === "contact" && (
            <div className="space-y-3 mt-4">
              {page.elements.map((el) => (
                <div key={el.id}>
                  {el.type === "input" && (
                    <input
                      type="text"
                      placeholder={el.placeholder}
                      className="w-full px-4 py-3 rounded-md border border-gray-200 text-sm"
                      readOnly
                    />
                  )}
                  {el.type === "textarea" && (
                    <textarea
                      placeholder={el.placeholder}
                      className="w-full px-4 py-3 rounded-md border border-gray-200 text-sm resize-none"
                      rows={3}
                      readOnly
                    />
                  )}
                  {el.type === "select" && (
                    <div className="w-full px-4 py-3 rounded-md border border-gray-200 text-sm bg-white flex items-center justify-between">
                      <span className="text-gray-400">{el.placeholder || "Option wählen..."}</span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                  {el.type === "date" && (
                    <div className="w-full px-4 py-3 rounded-md border border-gray-200 text-sm bg-white flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-400">{el.placeholder || "Datum wählen..."}</span>
                    </div>
                  )}
                  {el.type === "fileUpload" && (
                    <div className="w-full px-4 py-4 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 text-center">
                      <FileUp className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">
                        {el.label || "Datei hochladen"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {el.acceptedFileTypes?.length 
                          ? el.acceptedFileTypes.join(", ")
                          : "PDF, Bilder, Dokumente"}
                      </p>
                    </div>
                  )}
                  {el.type === "video" && (
                    <div className="w-full aspect-video rounded-md bg-gray-900 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <Play className="h-6 w-6 text-white ml-1" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {page.elements.some((el) => el.type === "video") && page.type !== "contact" && (
            <div className="mt-4 space-y-3">
              {page.elements.filter((el) => el.type === "video").map((el) => (
                <div key={el.id} className="w-full aspect-video rounded-md bg-gray-900 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Play className="h-6 w-6 text-white ml-1" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {page.elements.some((el) => el.type === "testimonial") && (
            <div className="mt-4 space-y-3">
              {page.elements.filter((el) => el.type === "testimonial").map((el) => (
                <div key={el.id} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    {el.slides?.[0]?.text || "Testimonial-Text hier..."}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                    <div>
                      <p className="text-sm font-medium">{el.slides?.[0]?.author || "Kunde"}</p>
                      <p className="text-xs text-gray-500">{el.slides?.[0]?.role || "Rolle"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {page.elements.some((el) => el.type === "slider") && (
            <div className="mt-4">
              {page.elements.filter((el) => el.type === "slider").map((el) => (
                <div key={el.id} className="relative">
                  <div className="aspect-[4/3] bg-gray-200 rounded-lg overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Layers className="h-8 w-8" />
                    </div>
                  </div>
                  <div className="absolute left-2 top-1/2 -translate-y-1/2">
                    <div className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center shadow">
                      <ChevronLeft className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <div className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center shadow">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex justify-center gap-1 mt-2">
                    {(el.slides || [{ id: "1" }, { id: "2" }, { id: "3" }]).map((_, idx) => (
                      <div key={idx} className={`w-2 h-2 rounded-full ${idx === 0 ? "bg-gray-800" : "bg-gray-300"}`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {(page.type === "multiChoice" || page.type === "question") &&
            page.elements.some((el) => el.options) && (
              <div className="space-y-2 mt-4">
                {page.elements
                  .filter((el) => el.options)
                  .flatMap((el) =>
                    el.options?.map((option, idx) => (
                      <div
                        key={`${el.id}-${idx}`}
                        className="w-full px-4 py-3 rounded-md border-2 border-gray-200 text-sm text-left bg-white hover:border-primary/50 transition-colors cursor-pointer"
                      >
                        {option}
                      </div>
                    ))
                  )}
              </div>
            )}
        </div>

        {page.buttonText && (
          <div className="p-6 pt-0">
            <button
              className="w-full py-3 rounded-md font-medium text-sm transition-colors"
              style={{
                backgroundColor:
                  isWelcome || isThankyou ? "#ffffff" : primaryColor,
                color: isWelcome || isThankyou ? primaryColor : "#ffffff",
              }}
            >
              {page.buttonText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SortablePageItem({
  page,
  index,
  selected,
  onSelect,
  onDelete,
  totalPages,
}: {
  page: FunnelPage;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  totalPages: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 rounded-md cursor-pointer transition-colors ${
        selected ? "bg-accent" : "hover:bg-muted/50"
      } ${isDragging ? "z-50 shadow-lg" : ""}`}
      onClick={onSelect}
      data-testid={`page-item-${index}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none p-1 -ml-1"
        data-testid={`drag-handle-${index}`}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div
        className="h-8 w-8 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
        style={{ backgroundColor: page.backgroundColor || "#e5e5e5" }}
      >
        <span style={{ color: page.backgroundColor ? "#fff" : "#666" }}>
          {pageTypeIcons[page.type]}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{page.title}</div>
        <div className="text-xs text-muted-foreground">
          {pageTypeLabels[page.type]}
        </div>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        disabled={totalPages <= 1}
        data-testid={`delete-page-${index}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function SortableElementItem({
  element,
  children,
}: {
  element: PageElement;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? "z-50 shadow-lg" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none bg-muted/50 rounded-l-md hover:bg-muted transition-colors"
        data-testid={`element-drag-handle-${element.id}`}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="ml-8">
        {children}
      </div>
    </div>
  );
}

function AddPageDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (type: PageType) => void;
}) {
  const pageTypes: { type: PageType; label: string; description: string }[] = [
    { type: "welcome", label: "Willkommen", description: "Begrüßungsseite mit Hero-Bereich" },
    { type: "question", label: "Frage", description: "Einfache Textfrage" },
    { type: "multiChoice", label: "Mehrfachauswahl", description: "Multiple-Choice Frage" },
    { type: "contact", label: "Kontakt", description: "Formular für Kontaktdaten" },
    { type: "calendar", label: "Kalender", description: "Terminbuchung" },
    { type: "thankyou", label: "Danke", description: "Abschluss und Bestätigung" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neue Seite hinzufügen</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          {pageTypes.map((pt) => (
            <Card
              key={pt.type}
              className="cursor-pointer hover-elevate"
              onClick={() => {
                onAdd(pt.type);
                onOpenChange(false);
              }}
              data-testid={`add-page-${pt.type}`}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center font-bold text-muted-foreground">
                  {pageTypeIcons[pt.type]}
                </div>
                <div>
                  <div className="font-medium">{pt.label}</div>
                  <div className="text-sm text-muted-foreground">{pt.description}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PageEditor({
  page,
  primaryColor,
  onUpdate,
}: {
  page: FunnelPage;
  primaryColor: string;
  onUpdate: (updates: Partial<FunnelPage>) => void;
}) {
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
        type === "select" ? "Auswahl" : undefined,
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
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Titel</Label>
          <Input
            id="title"
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
        {(page.type === "welcome" || page.type === "thankyou") && (
          <div className="space-y-2">
            <Label htmlFor="bgColor">Hintergrundfarbe</Label>
            <div className="flex gap-2">
              <Input
                id="bgColor"
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
          <div className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-md">
            <div className="flex items-center gap-2">
              <PartyPopper className="h-4 w-4 text-primary" />
              <div>
                <Label className="text-sm">Konfetti-Animation</Label>
                <p className="text-xs text-muted-foreground">Zeigt Konfetti wenn Besucher diese Seite erreichen</p>
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
      </div>

      {page.type === "welcome" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Label>Medien & Bewertungen</Label>
            <div className="flex gap-1 flex-wrap">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addElement("video")}
                    data-testid="button-add-video-welcome"
                  >
                    <Video className="h-3 w-3 mr-1" />
                    Video
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Video einbetten (YouTube, Vimeo)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addElement("testimonial")}
                    data-testid="button-add-testimonial"
                  >
                    <Star className="h-3 w-3 mr-1" />
                    Bewertung
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Kundenbewertung hinzufügen</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addElement("slider")}
                    data-testid="button-add-slider"
                  >
                    <Layers className="h-3 w-3 mr-1" />
                    Slider
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bild-Slider hinzufügen</TooltipContent>
              </Tooltip>
            </div>
          </div>
          
          {page.elements.length > 0 && (
            <div className="space-y-3">
              {page.elements.map((el) => (
                <Card key={el.id}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary">
                        {el.type === "video" ? "Video" :
                         el.type === "testimonial" ? "Bewertung" :
                         el.type === "slider" ? "Slider" : el.type}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeElement(el.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {el.type === "video" && (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Video-URL</Label>
                          <Input
                            placeholder="https://youtube.com/watch?v=..."
                            value={el.videoUrl || ""}
                            onChange={(e) =>
                              updateElement(el.id, { videoUrl: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    )}
                    {el.type === "testimonial" && el.slides && (
                      <div className="space-y-2">
                        <Input
                          placeholder="Testimonial-Text"
                          value={el.slides[0]?.text || ""}
                          onChange={(e) =>
                            updateElement(el.id, { 
                              slides: [{ ...el.slides![0], text: e.target.value }] 
                            })
                          }
                        />
                        <div className="flex gap-2">
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
                            placeholder="Rolle"
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {(page.type === "contact" || page.type === "question" || page.type === "multiChoice") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Label>Elemente</Label>
            <div className="flex gap-1 flex-wrap">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addElement("input")}
                    data-testid="button-add-input"
                  >
                    + Textfeld
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Einfaches Eingabefeld hinzufügen</TooltipContent>
              </Tooltip>
              {page.type === "contact" && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addElement("textarea")}
                        data-testid="button-add-textarea"
                      >
                        + Textbereich
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Mehrzeiliges Textfeld hinzufügen</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addElement("select")}
                        data-testid="button-add-select"
                      >
                        <ListOrdered className="h-3 w-3 mr-1" />
                        Dropdown
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Dropdown-Auswahl hinzufügen</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addElement("date")}
                        data-testid="button-add-date"
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        Datum
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Datumsauswahl hinzufügen (z.B. für Geburtsdatum)</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addElement("fileUpload")}
                        data-testid="button-add-file-upload"
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Datei
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Datei-Upload für Kunden hinzufügen (PDF, Bilder, etc.)</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addElement("video")}
                        data-testid="button-add-video"
                      >
                        <Video className="h-3 w-3 mr-1" />
                        Video
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Video einbetten (YouTube, Vimeo)</TooltipContent>
                  </Tooltip>
                </>
              )}
              {(page.type === "multiChoice" || page.type === "question") && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addElement("radio")}
                >
                  + Auswahl
                </Button>
              )}
            </div>
          </div>

          <DndContext
            sensors={elementSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleElementDragEnd}
          >
            <SortableContext
              items={page.elements.map((el) => el.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {page.elements.map((el) => (
                  <SortableElementItem key={el.id} element={el}>
                    <Card>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="secondary">
                            {el.type === "input" ? "Textfeld" : 
                             el.type === "textarea" ? "Textbereich" : 
                             el.type === "fileUpload" ? "Datei-Upload" :
                             el.type === "video" ? "Video" :
                             el.type === "date" ? "Datum" :
                             el.type === "select" ? "Dropdown" :
                             el.type === "testimonial" ? "Bewertung" :
                             el.type === "slider" ? "Slider" : "Auswahl"}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {(el.type === "input" || el.type === "textarea" || el.type === "fileUpload" || el.type === "date" || el.type === "select") && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
                                <span>Pflicht</span>
                                <Switch
                                  checked={el.required || false}
                                  onCheckedChange={(checked) =>
                                    updateElement(el.id, { required: checked })
                                  }
                                />
                              </div>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive"
                              onClick={() => removeElement(el.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                  {(el.type === "input" || el.type === "textarea") && (
                    <Input
                      placeholder="Placeholder-Text"
                      value={el.placeholder || ""}
                      onChange={(e) =>
                        updateElement(el.id, { placeholder: e.target.value })
                      }
                    />
                  )}
                  {el.type === "fileUpload" && (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Beschriftung</Label>
                        <Input
                          placeholder="z.B. Lebenslauf hochladen"
                          value={el.label || ""}
                          onChange={(e) =>
                            updateElement(el.id, { label: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Erlaubte Dateitypen</Label>
                        <Select
                          value={el.acceptedFileTypes?.join(",") || "all"}
                          onValueChange={(v) =>
                            updateElement(el.id, { 
                              acceptedFileTypes: v === "all" ? undefined : v.split(",") 
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Alle Dateien</SelectItem>
                            <SelectItem value=".pdf">Nur PDF</SelectItem>
                            <SelectItem value=".jpg,.jpeg,.png,.gif">Nur Bilder</SelectItem>
                            <SelectItem value=".pdf,.doc,.docx">Dokumente (PDF, Word)</SelectItem>
                            <SelectItem value=".pdf,.jpg,.jpeg,.png">PDF & Bilder</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Max. Dateigröße (MB)</Label>
                        <Select
                          value={String(el.maxFileSize || 10)}
                          onValueChange={(v) =>
                            updateElement(el.id, { maxFileSize: parseInt(v) })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 MB</SelectItem>
                            <SelectItem value="10">10 MB</SelectItem>
                            <SelectItem value="25">25 MB</SelectItem>
                            <SelectItem value="50">50 MB</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  {(el.type === "radio" || el.type === "select") && el.options && (
                    <div className="space-y-2">
                      <Label className="text-xs">{el.type === "select" ? "Dropdown-Optionen" : "Auswahloptionen"}</Label>
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
                            <Trash2 className="h-4 w-4" />
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
                        + Option hinzufügen
                      </Button>
                    </div>
                  )}
                  {el.type === "video" && (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Video-Plattform</Label>
                        <Select
                          value={el.videoType || "youtube"}
                          onValueChange={(v) =>
                            updateElement(el.id, { videoType: v as "youtube" | "vimeo" | "upload" })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="youtube">YouTube</SelectItem>
                            <SelectItem value="vimeo">Vimeo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Video-URL</Label>
                        <Input
                          placeholder="https://youtube.com/watch?v=..."
                          value={el.videoUrl || ""}
                          onChange={(e) =>
                            updateElement(el.id, { videoUrl: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  )}
                  {el.type === "date" && (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Beschriftung</Label>
                        <Input
                          placeholder="z.B. Geburtsdatum"
                          value={el.label || ""}
                          onChange={(e) =>
                            updateElement(el.id, { label: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs">Uhrzeit einbeziehen</Label>
                        <Switch
                          checked={el.includeTime || false}
                          onCheckedChange={(checked) =>
                            updateElement(el.id, { includeTime: checked })
                          }
                        />
                      </div>
                    </div>
                  )}
                      </CardContent>
                    </Card>
                  </SortableElementItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}

export default function FunnelEditor() {
  const [, params] = useRoute("/funnels/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [showAddPage, setShowAddPage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [localFunnel, setLocalFunnel] = useState<Funnel | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useDocumentTitle(localFunnel ? `${localFunnel.name} bearbeiten` : "Funnel Editor");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: funnel, isLoading } = useQuery<Funnel>({
    queryKey: ["/api/funnels", params?.id],
    enabled: !!params?.id,
  });

  useEffect(() => {
    if (funnel && !localFunnel) {
      setLocalFunnel(funnel);
    }
  }, [funnel]);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Funnel>) => {
      const response = await apiRequest("PATCH", `/api/funnels/${params?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/funnels"] });
      setHasChanges(false);
      toast({
        title: "Gespeichert",
        description: "Deine Änderungen wurden gespeichert.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Änderungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/funnels/${params?.id}`, {
        status: "published",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/funnels"] });
      if (localFunnel) {
        setLocalFunnel({ ...localFunnel, status: "published" });
      }
      toast({
        title: "Veröffentlicht",
        description: "Dein Funnel ist jetzt live!",
      });
    },
  });

  const updateLocalFunnel = (updates: Partial<Funnel>) => {
    if (localFunnel) {
      setLocalFunnel({ ...localFunnel, ...updates });
      setHasChanges(true);
    }
  };

  const updatePage = (index: number, updates: Partial<FunnelPage>) => {
    if (localFunnel) {
      const newPages = [...localFunnel.pages];
      newPages[index] = { ...newPages[index], ...updates };
      updateLocalFunnel({ pages: newPages });
    }
  };

  const addPage = (type: PageType) => {
    if (localFunnel) {
      const newPage: FunnelPage = {
        id: `page-${Date.now()}`,
        type,
        title: pageTypeLabels[type],
        elements: type === "contact" ? [
          { id: "el-1", type: "input", placeholder: "Dein Name", required: true },
          { id: "el-2", type: "input", placeholder: "Deine E-Mail", required: true },
        ] : type === "multiChoice" || type === "question" ? [
          { id: "el-1", type: "radio", options: ["Option 1", "Option 2", "Option 3"] },
        ] : [],
        buttonText: type === "thankyou" ? undefined : "Weiter",
        backgroundColor: type === "welcome" || type === "thankyou" ? localFunnel.theme.primaryColor : undefined,
      };
      updateLocalFunnel({ pages: [...localFunnel.pages, newPage] });
      setSelectedPageIndex(localFunnel.pages.length);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && localFunnel) {
      const oldIndex = localFunnel.pages.findIndex((p) => p.id === active.id);
      const newIndex = localFunnel.pages.findIndex((p) => p.id === over.id);

      const newPages = arrayMove(localFunnel.pages, oldIndex, newIndex);
      updateLocalFunnel({ pages: newPages });

      // Update selected page index to follow the moved page
      if (selectedPageIndex === oldIndex) {
        setSelectedPageIndex(newIndex);
      } else if (oldIndex < selectedPageIndex && newIndex >= selectedPageIndex) {
        setSelectedPageIndex(selectedPageIndex - 1);
      } else if (oldIndex > selectedPageIndex && newIndex <= selectedPageIndex) {
        setSelectedPageIndex(selectedPageIndex + 1);
      }
    }
  };

  const deletePage = (index: number) => {
    if (localFunnel && localFunnel.pages.length > 1) {
      const newPages = localFunnel.pages.filter((_, i) => i !== index);
      updateLocalFunnel({ pages: newPages });
      if (selectedPageIndex >= newPages.length) {
        setSelectedPageIndex(newPages.length - 1);
      }
    }
  };

  const handleSave = () => {
    if (localFunnel) {
      saveMutation.mutate({
        name: localFunnel.name,
        description: localFunnel.description,
        pages: localFunnel.pages,
        theme: localFunnel.theme,
        status: localFunnel.status,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex">
        <div className="w-72 border-r border-border p-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="h-[600px] w-[320px] rounded-[2.5rem]" />
        </div>
        <div className="w-80 border-l border-border p-4 space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (!localFunnel) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold mb-2">Funnel nicht gefunden</h2>
          <Button onClick={() => navigate("/funnels")}>Zurück zu Funnels</Button>
        </div>
      </div>
    );
  }

  const selectedPage = localFunnel.pages[selectedPageIndex];

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate("/funnels")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{localFunnel.name}</span>
              <Badge variant={localFunnel.status === "published" ? "default" : "secondary"}>
                {localFunnel.status === "published" ? "Live" : "Entwurf"}
              </Badge>
              {hasChanges && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  Ungespeichert
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
            data-testid="button-settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleSave}
            disabled={!hasChanges || saveMutation.isPending}
            data-testid="button-save"
          >
            <Save className="h-4 w-4" />
            Speichern
          </Button>
          {localFunnel.status !== "published" && (
            <Button
              className="gap-2"
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
              data-testid="button-publish"
            >
              <Globe className="h-4 w-4" />
              Veröffentlichen
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Page list with drag & drop */}
        <div className="w-72 border-r border-border bg-card overflow-y-auto funnel-scrollbar">
          <div className="p-4 border-b border-border">
            <Button
              className="w-full gap-2"
              variant="outline"
              onClick={() => setShowAddPage(true)}
              data-testid="button-add-page"
            >
              <Plus className="h-4 w-4" />
              Seite hinzufügen
            </Button>
          </div>
          <div className="p-2 space-y-1">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localFunnel.pages.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                {localFunnel.pages.map((page, index) => (
                  <SortablePageItem
                    key={page.id}
                    page={page}
                    index={index}
                    selected={index === selectedPageIndex}
                    onSelect={() => setSelectedPageIndex(index)}
                    onDelete={() => deletePage(index)}
                    totalPages={localFunnel.pages.length}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Center - Preview */}
        <div className="flex-1 bg-muted/30 overflow-y-auto flex items-center justify-center p-8">
          <PhonePreview
            page={selectedPage}
            primaryColor={localFunnel.theme.primaryColor}
          />
        </div>

        {/* Right sidebar - Page editor */}
        <div className="w-80 border-l border-border bg-card overflow-y-auto funnel-scrollbar">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">Seite bearbeiten</h3>
            <p className="text-sm text-muted-foreground">
              {pageTypeLabels[selectedPage?.type || "welcome"]}
            </p>
          </div>
          <div className="p-4">
            {selectedPage && (
              <PageEditor
                page={selectedPage}
                primaryColor={localFunnel.theme.primaryColor}
                onUpdate={(updates) => updatePage(selectedPageIndex, updates)}
              />
            )}
          </div>
        </div>
      </div>

      <AddPageDialog
        open={showAddPage}
        onOpenChange={setShowAddPage}
        onAdd={addPage}
      />

      {/* Settings Sheet */}
      <Sheet open={showSettings} onOpenChange={setShowSettings}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Funnel-Einstellungen</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="funnelName">Name</Label>
              <Input
                id="funnelName"
                value={localFunnel.name}
                onChange={(e) => updateLocalFunnel({ name: e.target.value })}
                data-testid="input-funnel-settings-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="funnelDesc">Beschreibung</Label>
              <Textarea
                id="funnelDesc"
                value={localFunnel.description || ""}
                onChange={(e) => updateLocalFunnel({ description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Primärfarbe</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={localFunnel.theme.primaryColor}
                  onChange={(e) =>
                    updateLocalFunnel({
                      theme: { ...localFunnel.theme, primaryColor: e.target.value },
                    })
                  }
                  className="w-14 h-9 p-1 cursor-pointer"
                />
                <Input
                  value={localFunnel.theme.primaryColor}
                  onChange={(e) =>
                    updateLocalFunnel({
                      theme: { ...localFunnel.theme, primaryColor: e.target.value },
                    })
                  }
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Schriftart</Label>
              <Select
                value={localFunnel.theme.fontFamily}
                onValueChange={(v) =>
                  updateLocalFunnel({
                    theme: { ...localFunnel.theme, fontFamily: v },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter (Modern)</SelectItem>
                  <SelectItem value="Roboto">Roboto (Clean)</SelectItem>
                  <SelectItem value="Open Sans">Open Sans (Freundlich)</SelectItem>
                  <SelectItem value="Lato">Lato (Professionell)</SelectItem>
                  <SelectItem value="Montserrat">Montserrat (Elegant)</SelectItem>
                  <SelectItem value="Poppins">Poppins (Rund)</SelectItem>
                  <SelectItem value="Playfair Display">Playfair Display (Klassisch)</SelectItem>
                  <SelectItem value="Source Sans Pro">Source Sans Pro (Technisch)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Hintergrundfarbe</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={localFunnel.theme.backgroundColor}
                  onChange={(e) =>
                    updateLocalFunnel({
                      theme: { ...localFunnel.theme, backgroundColor: e.target.value },
                    })
                  }
                  className="w-14 h-9 p-1 cursor-pointer"
                />
                <Input
                  value={localFunnel.theme.backgroundColor}
                  onChange={(e) =>
                    updateLocalFunnel({
                      theme: { ...localFunnel.theme, backgroundColor: e.target.value },
                    })
                  }
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Textfarbe</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={localFunnel.theme.textColor}
                  onChange={(e) =>
                    updateLocalFunnel({
                      theme: { ...localFunnel.theme, textColor: e.target.value },
                    })
                  }
                  className="w-14 h-9 p-1 cursor-pointer"
                />
                <Input
                  value={localFunnel.theme.textColor}
                  onChange={(e) =>
                    updateLocalFunnel({
                      theme: { ...localFunnel.theme, textColor: e.target.value },
                    })
                  }
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={localFunnel.status}
                onValueChange={(v) => updateLocalFunnel({ status: v as Funnel["status"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Entwurf</SelectItem>
                  <SelectItem value="published">Veröffentlicht</SelectItem>
                  <SelectItem value="archived">Archiviert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
