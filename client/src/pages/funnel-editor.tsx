import { useState, useEffect, useRef, useCallback } from "react";
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
  DragStartEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
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
  ChevronDown,
  Star,
  Play,
  ListOrdered,
  PartyPopper,
  Sparkles,
  Copy,
  Clipboard,
  Type,
  Image,
  MessageSquare,
  CheckSquare,
  List,
  Clock,
  Award,
  Minus,
  Space,
  BarChart3,
  Heart,
  HelpCircle,
  Users,
  Zap,
  MousePointer2,
  Undo2,
  Redo2,
  Monitor,
  Tablet,
  Menu,
  X,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  ExternalLink,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
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

// Element palette categories
const elementCategories = [
  {
    name: "Inhalt",
    elements: [
      { type: "heading", label: "Überschrift", icon: Type, description: "Große Überschrift" },
      { type: "text", label: "Text", icon: AlignLeft, description: "Absatztext" },
      { type: "image", label: "Bild", icon: Image, description: "Bild einfügen" },
      { type: "video", label: "Video", icon: Video, description: "YouTube, Vimeo" },
      { type: "list", label: "Liste", icon: List, description: "Aufzählungsliste" },
      { type: "faq", label: "FAQ", icon: HelpCircle, description: "Fragen & Antworten" },
    ],
  },
  {
    name: "Formular",
    elements: [
      { type: "input", label: "Textfeld", icon: Type, description: "Einzeiliges Feld" },
      { type: "textarea", label: "Textbereich", icon: MessageSquare, description: "Mehrzeiliges Feld" },
      { type: "select", label: "Dropdown", icon: ListOrdered, description: "Auswahlfeld" },
      { type: "radio", label: "Auswahl", icon: CheckSquare, description: "Single Choice" },
      { type: "checkbox", label: "Checkbox", icon: CheckSquare, description: "Multi Choice" },
      { type: "date", label: "Datum", icon: Calendar, description: "Datumsauswahl" },
      { type: "fileUpload", label: "Datei", icon: Upload, description: "Datei-Upload" },
    ],
  },
  {
    name: "Social Proof",
    elements: [
      { type: "testimonial", label: "Bewertung", icon: Star, description: "Kundenbewertung" },
      { type: "slider", label: "Slider", icon: Layers, description: "Bild-Karussell" },
      { type: "socialProof", label: "Logos", icon: Award, description: "Partner-Logos" },
    ],
  },
  {
    name: "Design",
    elements: [
      { type: "divider", label: "Trennlinie", icon: Minus, description: "Horizontale Linie" },
      { type: "spacer", label: "Abstand", icon: Space, description: "Vertikaler Abstand" },
      { type: "timer", label: "Timer", icon: Clock, description: "Countdown Timer" },
      { type: "progressBar", label: "Fortschritt", icon: BarChart3, description: "Fortschrittsbalken" },
    ],
  },
];

// Draggable element from palette
function DraggableElement({ type, label, icon: Icon, description }: {
  type: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `new-element-${type}`,
    data: { type, isNew: true },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 p-2 rounded-md cursor-grab active:cursor-grabbing transition-all hover:bg-accent ${
        isDragging ? "opacity-50 scale-95" : ""
      }`}
    >
      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{label}</div>
        <div className="text-xs text-muted-foreground truncate">{description}</div>
      </div>
    </div>
  );
}

// Progress indicator for funnel
function FunnelProgress({ currentPage, totalPages, primaryColor }: {
  currentPage: number;
  totalPages: number;
  primaryColor: string;
}) {
  const progress = ((currentPage + 1) / totalPages) * 100;

  return (
    <div className="w-full px-4 py-2">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>Schritt {currentPage + 1} von {totalPages}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            backgroundColor: primaryColor
          }}
        />
      </div>
    </div>
  );
}

// Enhanced Phone Preview with inline editing
function PhonePreview({
  page,
  pageIndex,
  totalPages,
  primaryColor,
  onUpdatePage,
  isEditing,
  setIsEditing,
}: {
  page: FunnelPage | null;
  pageIndex: number;
  totalPages: number;
  primaryColor: string;
  onUpdatePage?: (updates: Partial<FunnelPage>) => void;
  isEditing?: boolean;
  setIsEditing?: (editing: boolean) => void;
}) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [localTitle, setLocalTitle] = useState(page?.title || "");
  const [localSubtitle, setLocalSubtitle] = useState(page?.subtitle || "");

  useEffect(() => {
    setLocalTitle(page?.title || "");
    setLocalSubtitle(page?.subtitle || "");
  }, [page?.title, page?.subtitle]);

  const handleTitleSave = () => {
    if (onUpdatePage && localTitle !== page?.title) {
      onUpdatePage({ title: localTitle });
    }
    setEditingField(null);
  };

  const handleSubtitleSave = () => {
    if (onUpdatePage && localSubtitle !== page?.subtitle) {
      onUpdatePage({ subtitle: localSubtitle });
    }
    setEditingField(null);
  };

  if (!page) {
    return (
      <div className="phone-frame max-w-[320px] mx-auto">
        <div className="phone-screen aspect-[9/16] flex items-center justify-center bg-muted">
          <div className="text-center text-muted-foreground p-6">
            <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Wähle eine Seite aus</p>
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
        className="phone-screen aspect-[9/16] flex flex-col overflow-hidden"
        style={{ backgroundColor: bgColor }}
      >
        {/* Progress bar */}
        {!isWelcome && !isThankyou && totalPages > 1 && (
          <FunnelProgress
            currentPage={pageIndex}
            totalPages={totalPages}
            primaryColor={primaryColor}
          />
        )}

        <div className="flex-1 flex flex-col justify-center p-6 text-center overflow-y-auto">
          {/* Editable Title */}
          {editingField === "title" ? (
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
              autoFocus
              className="text-xl font-bold mb-2 bg-transparent border-b-2 border-white/50 outline-none text-center w-full"
              style={{ color: textColor }}
            />
          ) : (
            <h2
              className="text-xl font-bold mb-2 cursor-pointer hover:opacity-80 transition-opacity"
              style={{ color: textColor }}
              onClick={() => onUpdatePage && setEditingField("title")}
              title="Klicken zum Bearbeiten"
            >
              {page.title}
            </h2>
          )}

          {/* Editable Subtitle */}
          {page.subtitle !== undefined && (
            editingField === "subtitle" ? (
              <textarea
                value={localSubtitle}
                onChange={(e) => setLocalSubtitle(e.target.value)}
                onBlur={handleSubtitleSave}
                autoFocus
                className="text-sm opacity-80 mb-6 bg-transparent border-b border-white/30 outline-none text-center w-full resize-none"
                style={{ color: textColor }}
                rows={2}
              />
            ) : (
              <p
                className="text-sm opacity-80 mb-6 cursor-pointer hover:opacity-60 transition-opacity"
                style={{ color: textColor }}
                onClick={() => onUpdatePage && setEditingField("subtitle")}
                title="Klicken zum Bearbeiten"
              >
                {page.subtitle || "Untertitel hinzufügen..."}
              </p>
            )
          )}

          {/* Render elements */}
          {page.type === "contact" && (
            <div className="space-y-3 mt-4">
              {page.elements.map((el) => (
                <div key={el.id}>
                  {el.type === "input" && (
                    <input
                      type="text"
                      placeholder={el.placeholder}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm bg-white shadow-sm focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
                      readOnly
                    />
                  )}
                  {el.type === "textarea" && (
                    <textarea
                      placeholder={el.placeholder}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm resize-none bg-white shadow-sm"
                      rows={3}
                      readOnly
                    />
                  )}
                  {el.type === "select" && (
                    <div className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm bg-white flex items-center justify-between shadow-sm">
                      <span className="text-gray-400">{el.placeholder || "Option wählen..."}</span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                  {el.type === "date" && (
                    <div className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm bg-white flex items-center gap-2 shadow-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-400">{el.placeholder || "Datum wählen..."}</span>
                    </div>
                  )}
                  {el.type === "fileUpload" && (
                    <div className="w-full px-4 py-5 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-center">
                      <FileUp className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">{el.label || "Datei hochladen"}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {el.acceptedFileTypes?.length
                          ? el.acceptedFileTypes.join(", ")
                          : "PDF, Bilder, Dokumente"}
                      </p>
                    </div>
                  )}
                  {el.type === "video" && (
                    <div className="w-full aspect-video rounded-lg bg-gray-900 flex items-center justify-center shadow-md">
                      <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <Play className="h-7 w-7 text-white ml-1" />
                      </div>
                    </div>
                  )}
                  {el.type === "list" && el.listItems && (
                    <div className="text-left space-y-2">
                      {el.listItems.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm" style={{ color: textColor }}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {el.type === "faq" && el.faqItems && (
                    <div className="space-y-2 text-left">
                      {el.faqItems.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="font-medium text-sm flex items-center justify-between">
                            {item.question}
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {el.type === "divider" && (
                    <hr className="my-4 border-gray-200" />
                  )}
                  {el.type === "spacer" && (
                    <div style={{ height: el.spacerHeight || 24 }} />
                  )}
                  {el.type === "timer" && (
                    <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
                      <div className="flex justify-center gap-3">
                        {["00", "12", "45", "30"].map((val, idx) => (
                          <div key={idx}>
                            <div className="text-2xl font-bold" style={{ color: textColor }}>{val}</div>
                            <div className="text-xs opacity-60" style={{ color: textColor }}>
                              {["Tage", "Std", "Min", "Sek"][idx]}
                            </div>
                          </div>
                        ))}
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
                <div key={el.id} className="w-full aspect-video rounded-lg bg-gray-900 flex items-center justify-center shadow-md">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Play className="h-7 w-7 text-white ml-1" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {page.elements.some((el) => el.type === "testimonial") && (
            <div className="mt-4 space-y-3">
              {page.elements.filter((el) => el.type === "testimonial").map((el) => (
                <div key={el.id} className="bg-white rounded-xl p-4 shadow-md">
                  <div className="flex gap-0.5 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 mb-3 text-left">
                    "{el.slides?.[0]?.text || "Großartiger Service!"}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
                    <div className="text-left">
                      <p className="text-sm font-semibold">{el.slides?.[0]?.author || "Kunde"}</p>
                      <p className="text-xs text-gray-500">{el.slides?.[0]?.role || "Position"}</p>
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
                  <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden shadow-md">
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Image className="h-10 w-10" />
                    </div>
                  </div>
                  <button className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="flex justify-center gap-1.5 mt-3">
                    {(el.slides || [{ id: "1" }, { id: "2" }, { id: "3" }]).map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === 0 ? "bg-gray-800" : "bg-gray-300"
                        }`}
                      />
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
                        className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 text-sm text-left bg-white hover:border-primary/50 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                      >
                        {option}
                      </div>
                    ))
                  )}
              </div>
            )}

          {/* Social Proof Badges */}
          {page.elements.some((el) => el.type === "socialProof") && (
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-16 bg-white/20 rounded" />
              ))}
            </div>
          )}
        </div>

        {page.buttonText && (
          <div className="p-6 pt-0">
            <button
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] shadow-lg"
              style={{
                backgroundColor: isWelcome || isThankyou ? "#ffffff" : primaryColor,
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
  onDuplicate,
  totalPages,
}: {
  page: FunnelPage;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
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
      className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
        selected
          ? "bg-accent ring-2 ring-primary/20"
          : "hover:bg-muted/50"
      } ${isDragging ? "z-50 shadow-xl" : ""}`}
      onClick={onSelect}
      data-testid={`page-item-${index}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none p-1 -ml-1 opacity-50 group-hover:opacity-100 transition-opacity"
        data-testid={`drag-handle-${index}`}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div
        className="h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 shadow-sm"
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
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Duplizieren</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={totalPages <= 1}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Löschen</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

function SortableElementItem({
  element,
  onDelete,
  onDuplicate,
  children,
}: {
  element: PageElement;
  onDelete: () => void;
  onDuplicate: () => void;
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
      className={`group relative ${isDragging ? "z-50 shadow-xl" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none bg-muted/50 rounded-l-lg hover:bg-muted transition-colors opacity-50 group-hover:opacity-100"
        data-testid={`element-drag-handle-${element.id}`}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="ml-8">
        {children}
      </div>
      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={onDuplicate}
        >
          <Copy className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
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
  const pageTypes: { type: PageType; label: string; description: string; icon: string }[] = [
    { type: "welcome", label: "Willkommen", description: "Begrüßungsseite mit Hero", icon: "W" },
    { type: "question", label: "Frage", description: "Einfache Textfrage", icon: "?" },
    { type: "multiChoice", label: "Mehrfachauswahl", description: "Multiple-Choice", icon: "C" },
    { type: "contact", label: "Kontakt", description: "Kontaktformular", icon: "@" },
    { type: "calendar", label: "Kalender", description: "Terminbuchung", icon: "K" },
    { type: "thankyou", label: "Danke", description: "Abschlussseite", icon: "T" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Neue Seite hinzufügen</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 mt-4">
          {pageTypes.map((pt) => (
            <Card
              key={pt.type}
              className="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all hover:shadow-md"
              onClick={() => {
                onAdd(pt.type);
                onOpenChange(false);
              }}
              data-testid={`add-page-${pt.type}`}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-bold text-lg text-primary">
                  {pt.icon}
                </div>
                <div>
                  <div className="font-medium">{pt.label}</div>
                  <div className="text-xs text-muted-foreground">{pt.description}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Element Palette Component
function ElementPalette({ onAddElement }: { onAddElement: (type: string) => void }) {
  const [openCategories, setOpenCategories] = useState<string[]>(["Inhalt", "Formular"]);

  const toggleCategory = (name: string) => {
    setOpenCategories(prev =>
      prev.includes(name)
        ? prev.filter(c => c !== name)
        : [...prev, name]
    );
  };

  return (
    <div className="space-y-2">
      {elementCategories.map((category) => (
        <Collapsible
          key={category.name}
          open={openCategories.includes(category.name)}
          onOpenChange={() => toggleCategory(category.name)}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-md hover:bg-muted/50 transition-colors">
            <span className="text-sm font-medium">{category.name}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${
              openCategories.includes(category.name) ? "rotate-180" : ""
            }`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1">
            {category.elements.map((element) => (
              <div
                key={element.type}
                onClick={() => onAddElement(element.type)}
                className="flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all hover:bg-accent"
              >
                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                  <element.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{element.label}</div>
                  <div className="text-xs text-muted-foreground truncate">{element.description}</div>
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
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
  const [copiedElement, setCopiedElement] = useState<PageElement | null>(null);

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

  const copyElement = (element: PageElement) => {
    setCopiedElement(element);
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
    <div className="space-y-6">
      {/* Quick Actions Bar */}
      <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8" disabled>
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Rückgängig</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8" disabled>
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Wiederholen</TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-1">
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

      {/* Page Settings */}
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
                             el.type === "image" ? "Bild" : "Auswahl"}
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
  const [previewMode, setPreviewMode] = useState<"phone" | "tablet" | "desktop">("phone");
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);

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
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
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
        showConfetti: type === "thankyou" ? true : undefined,
      };
      updateLocalFunnel({ pages: [...localFunnel.pages, newPage] });
      setSelectedPageIndex(localFunnel.pages.length);
    }
  };

  const duplicatePage = (index: number) => {
    if (localFunnel) {
      const pageToDuplicate = localFunnel.pages[index];
      const newPage: FunnelPage = {
        ...pageToDuplicate,
        id: `page-${Date.now()}`,
        title: `${pageToDuplicate.title} (Kopie)`,
        elements: pageToDuplicate.elements.map(el => ({
          ...el,
          id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        })),
      };
      const newPages = [...localFunnel.pages];
      newPages.splice(index + 1, 0, newPage);
      updateLocalFunnel({ pages: newPages });
      setSelectedPageIndex(index + 1);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && localFunnel) {
      const oldIndex = localFunnel.pages.findIndex((p) => p.id === active.id);
      const newIndex = localFunnel.pages.findIndex((p) => p.id === over.id);

      const newPages = arrayMove(localFunnel.pages, oldIndex, newIndex);
      updateLocalFunnel({ pages: newPages });

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (hasChanges) handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasChanges, localFunnel]);

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
    <div className="h-screen flex flex-col bg-background">
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

        {/* Center - Preview Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant={previewMode === "phone" ? "secondary" : "ghost"}
                  className="h-7 w-7"
                  onClick={() => setPreviewMode("phone")}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Handy</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant={previewMode === "tablet" ? "secondary" : "ghost"}
                  className="h-7 w-7"
                  onClick={() => setPreviewMode("tablet")}
                >
                  <Tablet className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Tablet</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant={previewMode === "desktop" ? "secondary" : "ghost"}
                  className="h-7 w-7"
                  onClick={() => setPreviewMode("desktop")}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Desktop</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(true)}
                data-testid="button-settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Einstellungen</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(`/preview/${params?.id}`, '_blank')}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Vorschau öffnen</TooltipContent>
          </Tooltip>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleSave}
            disabled={!hasChanges || saveMutation.isPending}
            data-testid="button-save"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Speichern</span>
          </Button>
          {localFunnel.status !== "published" && (
            <Button
              className="gap-2"
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
              data-testid="button-publish"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Veröffentlichen</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Page list */}
        <div className={`${showLeftSidebar ? "w-72" : "w-0"} border-r border-border bg-card overflow-hidden transition-all duration-300`}>
          <div className="w-72 h-full flex flex-col">
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
            <div className="flex-1 overflow-y-auto funnel-scrollbar p-2">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={localFunnel.pages.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {localFunnel.pages.map((page, index) => (
                      <SortablePageItem
                        key={page.id}
                        page={page}
                        index={index}
                        selected={index === selectedPageIndex}
                        onSelect={() => setSelectedPageIndex(index)}
                        onDelete={() => deletePage(index)}
                        onDuplicate={() => duplicatePage(index)}
                        totalPages={localFunnel.pages.length}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </div>

        {/* Toggle Left Sidebar */}
        <Button
          size="icon"
          variant="ghost"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-6 w-6 rounded-r-md rounded-l-none bg-card border border-l-0"
          onClick={() => setShowLeftSidebar(!showLeftSidebar)}
          style={{ left: showLeftSidebar ? "286px" : "0" }}
        >
          {showLeftSidebar ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </Button>

        {/* Center - Preview */}
        <div className="flex-1 bg-muted/30 overflow-y-auto flex items-center justify-center p-8">
          <div style={{
            maxWidth: previewMode === "phone" ? "320px" : previewMode === "tablet" ? "768px" : "1024px",
            width: "100%"
          }}>
            <PhonePreview
              page={selectedPage}
              pageIndex={selectedPageIndex}
              totalPages={localFunnel.pages.length}
              primaryColor={localFunnel.theme.primaryColor}
              onUpdatePage={(updates) => updatePage(selectedPageIndex, updates)}
            />
          </div>
        </div>

        {/* Toggle Right Sidebar */}
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-6 w-6 rounded-l-md rounded-r-none bg-card border border-r-0"
          onClick={() => setShowRightSidebar(!showRightSidebar)}
          style={{ right: showRightSidebar ? "318px" : "0" }}
        >
          {showRightSidebar ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>

        {/* Right sidebar - Page editor */}
        <div className={`${showRightSidebar ? "w-80" : "w-0"} border-l border-border bg-card overflow-hidden transition-all duration-300`}>
          <div className="w-80 h-full flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Seite bearbeiten</h3>
              <p className="text-sm text-muted-foreground">
                {pageTypeLabels[selectedPage?.type || "welcome"]}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto funnel-scrollbar p-4">
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
      </div>

      <AddPageDialog
        open={showAddPage}
        onOpenChange={setShowAddPage}
        onAdd={addPage}
      />

      {/* Settings Sheet */}
      <Sheet open={showSettings} onOpenChange={setShowSettings}>
        <SheetContent className="overflow-y-auto">
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

            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium">Design-System</h4>

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
