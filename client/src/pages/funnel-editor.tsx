import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  ChevronUp,
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
  GitBranch,
  Variable,
  LayoutTemplate,
  Cloud,
  CloudOff,
  Scissors,
  Maximize2,
  Search,
  // New icons for OpenFunnels-style elements
  Music,
  MapPin,
  Code,
  BarChart2,
  ShoppingBag,
  Timer,
  Link,
  Columns,
  LayoutGrid,
  PanelLeft,
  PanelRight,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useHistory, useAutoSave } from "@/hooks/use-history";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Funnel, FunnelPage, PageElement, PageAnimation, Section, Column } from "@shared/schema";
import confetti from "canvas-confetti";

// Available personalization variables
const personalizationVariables = [
  { key: "{{name}}", label: "Name", description: "Name des Besuchers" },
  { key: "{{email}}", label: "E-Mail", description: "E-Mail-Adresse" },
  { key: "{{phone}}", label: "Telefon", description: "Telefonnummer" },
  { key: "{{company}}", label: "Firma", description: "Firmenname" },
  { key: "{{date}}", label: "Datum", description: "Aktuelles Datum" },
  { key: "{{answer_1}}", label: "Antwort 1", description: "Erste Antwort" },
  { key: "{{answer_2}}", label: "Antwort 2", description: "Zweite Antwort" },
];

// Section templates for quick insertion
const sectionTemplates = [
  {
    id: "hero",
    name: "Hero-Sektion",
    description: "Aufmerksamkeitsstarker Einstieg",
    elements: [
      { id: "hero-h", type: "heading" as const, content: "Willkommen bei uns!" },
      { id: "hero-t", type: "text" as const, content: "Entdecke, wie wir dir helfen können." },
    ],
  },
  {
    id: "features",
    name: "Vorteile-Liste",
    description: "3 Vorteile mit Häkchen",
    elements: [
      { id: "feat-l", type: "list" as const, listStyle: "check" as const, listItems: [
        { id: "f1", text: "Schnell und einfach" },
        { id: "f2", text: "100% kostenlos testen" },
        { id: "f3", text: "Keine Kreditkarte nötig" },
      ]},
    ],
  },
  {
    id: "testimonial",
    name: "Kundenstimme",
    description: "Testimonial mit Bewertung",
    elements: [
      { id: "test-t", type: "testimonial" as const, slides: [
        { id: "t1", text: "Absolut begeistert! Hat meine Erwartungen übertroffen.", author: "Maria Schmidt", role: "Geschäftsführerin", rating: 5 },
      ]},
    ],
  },
  {
    id: "cta",
    name: "Call-to-Action",
    description: "Überschrift mit Button",
    elements: [
      { id: "cta-h", type: "heading" as const, content: "Bereit loszulegen?" },
      { id: "cta-t", type: "text" as const, content: "Starte jetzt und erlebe den Unterschied." },
    ],
  },
  {
    id: "contact-form",
    name: "Kontaktformular",
    description: "Name, E-Mail, Nachricht",
    elements: [
      { id: "cf-1", type: "input" as const, placeholder: "Dein Name", required: true },
      { id: "cf-2", type: "input" as const, placeholder: "Deine E-Mail", required: true },
      { id: "cf-3", type: "textarea" as const, placeholder: "Deine Nachricht...", required: false },
    ],
  },
  {
    id: "faq",
    name: "FAQ-Sektion",
    description: "Häufige Fragen",
    elements: [
      { id: "faq-1", type: "faq" as const, faqItems: [
        { id: "fq1", question: "Wie funktioniert das?", answer: "Ganz einfach! Melde dich an und los geht's." },
        { id: "fq2", question: "Ist es wirklich kostenlos?", answer: "Ja, du kannst alles kostenlos testen." },
        { id: "fq3", question: "Wie erreiche ich den Support?", answer: "Per E-Mail oder Chat - wir sind für dich da!" },
      ]},
    ],
  },
  {
    id: "urgency",
    name: "Dringlichkeit",
    description: "Timer mit Text",
    elements: [
      { id: "urg-h", type: "heading" as const, content: "Nur noch für kurze Zeit!" },
      { id: "urg-t", type: "timer" as const, timerEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), timerStyle: "countdown" as const, timerShowDays: true },
    ],
  },
];

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

// Element palette categories - Extended with OpenFunnels block types
const elementCategories: {
  name: string;
  elements: { type: PageElement["type"]; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[];
}[] = [
  {
    name: "Inhalt",
    elements: [
      { type: "heading", label: "Überschrift", icon: Type, description: "Große Überschrift" },
      { type: "text", label: "Text", icon: AlignLeft, description: "Absatztext" },
      { type: "image", label: "Bild", icon: Image, description: "Bild einfügen" },
      { type: "video", label: "Video", icon: Video, description: "YouTube, Vimeo" },
      { type: "audio", label: "Audio", icon: Music, description: "Audio/Podcast" },
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
      { type: "calendar", label: "Kalender", icon: Calendar, description: "Terminbuchung" },
    ],
  },
  {
    name: "Social Proof",
    elements: [
      { type: "testimonial", label: "Bewertung", icon: Star, description: "Kundenbewertung" },
      { type: "slider", label: "Slider", icon: Layers, description: "Bild-Karussell" },
      { type: "socialProof", label: "Logos", icon: Award, description: "Partner-Logos" },
      { type: "team", label: "Team", icon: Users, description: "Team-Mitglieder" },
    ],
  },
  {
    name: "Interaktiv",
    elements: [
      { type: "button", label: "Button", icon: MousePointer2, description: "Klickbarer Button" },
      { type: "timer", label: "Timer", icon: Clock, description: "Countdown Timer" },
      { type: "countdown", label: "Countdown", icon: Timer, description: "Ablauf-Counter" },
      { type: "progressBar", label: "Fortschritt", icon: BarChart3, description: "Fortschrittsbalken" },
    ],
  },
  {
    name: "E-Commerce",
    elements: [
      { type: "product", label: "Produkt", icon: ShoppingBag, description: "Produkt-Karte" },
    ],
  },
  {
    name: "Erweitert",
    elements: [
      { type: "map", label: "Karte", icon: MapPin, description: "Google Maps" },
      { type: "chart", label: "Diagramm", icon: BarChart2, description: "Daten-Visualisierung" },
      { type: "code", label: "Code", icon: Code, description: "Code-Snippet" },
      { type: "embed", label: "Einbetten", icon: Link, description: "Externe Inhalte" },
    ],
  },
  {
    name: "Layout",
    elements: [
      { type: "divider", label: "Trennlinie", icon: Minus, description: "Horizontale Linie" },
      { type: "spacer", label: "Abstand", icon: Space, description: "Vertikaler Abstand" },
    ],
  },
];

// Layout templates for section creation (OpenFunnels style)
const layoutTemplates = [
  { id: "single", name: "1 Spalte", icon: LayoutGrid, columns: [100], description: "Volle Breite" },
  { id: "two-equal", name: "2 Spalten", icon: Columns, columns: [50, 50], description: "Gleiche Breite" },
  { id: "two-left", name: "2 Spalten Links", icon: PanelLeft, columns: [66, 34], description: "Links größer" },
  { id: "two-right", name: "2 Spalten Rechts", icon: PanelRight, columns: [34, 66], description: "Rechts größer" },
  { id: "three-equal", name: "3 Spalten", icon: LayoutGrid, columns: [33, 34, 33], description: "Drei gleich" },
  { id: "four-equal", name: "4 Spalten", icon: LayoutGrid, columns: [25, 25, 25, 25], description: "Vier gleich" },
];

// Clickable/Draggable element from palette
function DraggableElement({ type, label, icon: Icon, description, onClick }: {
  type: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `new-element-${type}`,
    data: { type, isNew: true },
  });

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger click if not dragging and onClick handler exists
    if (onClick && !isDragging) {
      e.stopPropagation();
      onClick();
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      className={`group flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all hover:bg-accent ${
        isDragging ? "opacity-50 scale-95 cursor-grabbing" : ""
      }`}
    >
      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{label}</div>
        <div className="text-xs text-muted-foreground truncate">{description}</div>
      </div>
      {onClick && (
        <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
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

// Enhanced Phone Preview with inline editing and element selection
function PhonePreview({
  page,
  pageIndex,
  totalPages,
  primaryColor,
  onUpdatePage,
  isEditing,
  setIsEditing,
  selectedElementId,
  onSelectElement,
  onAddElement,
  onDeleteElement,
  onDuplicateElement,
  onMoveElementUp,
  onMoveElementDown,
  onShowElementPicker,
}: {
  page: FunnelPage | null;
  pageIndex: number;
  totalPages: number;
  primaryColor: string;
  onUpdatePage?: (updates: Partial<FunnelPage>) => void;
  isEditing?: boolean;
  setIsEditing?: (editing: boolean) => void;
  selectedElementId?: string | null;
  onSelectElement?: (elementId: string | null) => void;
  onAddElement?: (type: PageElement["type"]) => void;
  onDeleteElement?: () => void;
  onDuplicateElement?: () => void;
  onMoveElementUp?: () => void;
  onMoveElementDown?: () => void;
  onShowElementPicker?: () => void;
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

  // Element type labels for display - Extended with OpenFunnels types
  const elementTypeLabels: Record<string, string> = {
    // Basic
    heading: "Überschrift",
    text: "Text",
    image: "Bild",
    button: "Button",
    // Media
    video: "Video",
    audio: "Audio",
    embed: "Einbetten",
    // Form
    input: "Eingabefeld",
    textarea: "Textbereich",
    select: "Dropdown",
    radio: "Auswahl",
    checkbox: "Checkbox",
    date: "Datum",
    fileUpload: "Datei-Upload",
    calendar: "Kalender",
    // Interactive
    list: "Liste",
    faq: "FAQ",
    timer: "Timer",
    countdown: "Countdown",
    progressBar: "Fortschritt",
    // Social Proof
    testimonial: "Bewertung",
    slider: "Slider",
    socialProof: "Social Proof",
    team: "Team",
    // Advanced
    map: "Karte",
    chart: "Diagramm",
    code: "Code",
    // E-Commerce
    product: "Produkt",
    // Layout
    divider: "Trennlinie",
    spacer: "Abstand",
    icon: "Icon",
  };

  // Element wrapper for selection handling with floating action menu
  const ElementWrapper = ({ elementId, elementType, children }: { elementId: string; elementType: string; children: React.ReactNode }) => {
    const isSelected = selectedElementId === elementId;
    return (
      <div
        className={`relative group cursor-pointer transition-all rounded-lg ${
          isSelected
            ? "ring-2 ring-primary ring-offset-2"
            : "hover:ring-2 hover:ring-primary/30 hover:ring-offset-1"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onSelectElement?.(elementId);
        }}
      >
        {children}
        {/* Element type label at top-left when selected */}
        {isSelected && (
          <div className="absolute -top-3 left-2 z-10">
            <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded">
              {elementTypeLabels[elementType] || elementType}
            </span>
          </div>
        )}
        {/* Floating action menu on the right when selected */}
        {isSelected && (
          <div className="absolute -right-12 top-1/2 -translate-y-1/2 flex flex-col gap-1 bg-white rounded-lg shadow-lg border p-1 z-10">
            <button
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
              title="Element hinzufügen"
              onClick={(e) => {
                e.stopPropagation();
                onShowElementPicker?.();
              }}
            >
              <Plus className="h-4 w-4 text-gray-600" />
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
              title="Nach oben"
              onClick={(e) => {
                e.stopPropagation();
                onMoveElementUp?.();
              }}
            >
              <ChevronUp className="h-4 w-4 text-gray-600" />
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
              title="Nach unten"
              onClick={(e) => {
                e.stopPropagation();
                onMoveElementDown?.();
              }}
            >
              <ChevronDown className="h-4 w-4 text-gray-600" />
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
              title="Duplizieren"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateElement?.();
              }}
            >
              <Copy className="h-4 w-4 text-gray-600" />
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-50 transition-colors"
              title="Löschen"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteElement?.();
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          </div>
        )}
      </div>
    );
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
                <ElementWrapper key={el.id} elementId={el.id} elementType={el.type}>
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
                  {el.type === "radio" && el.options && (
                    <div className="space-y-2">
                      {el.label && <p className="text-sm font-medium text-left" style={{ color: textColor }}>{el.label}</p>}
                      {el.options.map((option, idx) => (
                        <div key={idx} className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm shadow-sm">
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                          <span>{option}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {el.type === "checkbox" && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-gray-200 text-sm shadow-sm">
                      <div className="w-4 h-4 rounded border-2 border-gray-300" />
                      <span>{el.label || "Checkbox"}</span>
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
                  {el.type === "heading" && (
                    <h3
                      className="font-bold"
                      style={{
                        color: el.styles?.color || textColor,
                        fontSize: el.styles?.fontSize || "1.25rem",
                        fontWeight: el.styles?.fontWeight || "bold",
                        fontStyle: el.styles?.fontStyle || "normal",
                        textAlign: (el.styles?.textAlign as "left" | "center" | "right") || "center",
                      }}
                    >
                      {el.content || "Überschrift"}
                    </h3>
                  )}
                  {el.type === "text" && (
                    <p
                      className="text-sm"
                      style={{
                        color: el.styles?.color || textColor,
                        fontSize: el.styles?.fontSize || "0.875rem",
                        fontWeight: el.styles?.fontWeight || "normal",
                        fontStyle: el.styles?.fontStyle || "normal",
                        textAlign: (el.styles?.textAlign as "left" | "center" | "right") || "center",
                      }}
                    >
                      {el.content || "Text hier..."}
                    </p>
                  )}
                  {el.type === "image" && (
                    <div className="w-full">
                      {el.imageUrl ? (
                        <img
                          src={el.imageUrl}
                          alt={el.imageAlt || "Bild"}
                          className="w-full rounded-lg shadow-md object-cover"
                          style={{ maxHeight: "200px" }}
                        />
                      ) : (
                        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                          <Image className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  )}
                  {el.type === "icon" && (
                    <div
                      className="flex justify-center"
                      style={{ color: el.styles?.color || textColor }}
                    >
                      <div className={`${el.iconSize === "xl" ? "h-16 w-16" : el.iconSize === "lg" ? "h-12 w-12" : el.iconSize === "md" ? "h-8 w-8" : "h-6 w-6"}`}>
                        <Star className="w-full h-full" />
                      </div>
                    </div>
                  )}
                </ElementWrapper>
              ))}
            </div>
          )}

          {/* Render heading, text, image elements for all page types */}
          {page.elements.some((el) => ["heading", "text", "image", "icon", "progressBar"].includes(el.type)) && page.type !== "contact" && (
            <div className="mt-4 space-y-3">
              {page.elements.filter((el) => ["heading", "text", "image", "icon", "progressBar"].includes(el.type)).map((el) => (
                <ElementWrapper key={el.id} elementId={el.id} elementType={el.type}>
                  {el.type === "heading" && (
                    <h3
                      className="font-bold"
                      style={{
                        color: el.styles?.color || textColor,
                        fontSize: el.styles?.fontSize || "1.25rem",
                        fontWeight: el.styles?.fontWeight || "bold",
                        fontStyle: el.styles?.fontStyle || "normal",
                        textAlign: (el.styles?.textAlign as "left" | "center" | "right") || "center",
                      }}
                    >
                      {el.content || "Überschrift"}
                    </h3>
                  )}
                  {el.type === "text" && (
                    <p
                      className="text-sm"
                      style={{
                        color: el.styles?.color || textColor,
                        fontSize: el.styles?.fontSize || "0.875rem",
                        fontWeight: el.styles?.fontWeight || "normal",
                        fontStyle: el.styles?.fontStyle || "normal",
                        textAlign: (el.styles?.textAlign as "left" | "center" | "right") || "center",
                      }}
                    >
                      {el.content || "Text hier..."}
                    </p>
                  )}
                  {el.type === "image" && (
                    <div className="w-full">
                      {el.imageUrl ? (
                        <img
                          src={el.imageUrl}
                          alt={el.imageAlt || "Bild"}
                          className="w-full rounded-lg shadow-md object-cover"
                          style={{ maxHeight: "200px" }}
                        />
                      ) : (
                        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                          <Image className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  )}
                  {el.type === "icon" && (
                    <div
                      className="flex justify-center"
                      style={{ color: el.styles?.color || textColor }}
                    >
                      <div className={`${el.iconSize === "xl" ? "h-16 w-16" : el.iconSize === "lg" ? "h-12 w-12" : el.iconSize === "md" ? "h-8 w-8" : "h-6 w-6"}`}>
                        <Star className="w-full h-full" />
                      </div>
                    </div>
                  )}
                  {el.type === "progressBar" && (
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: "60%", backgroundColor: primaryColor }}
                      />
                    </div>
                  )}
                </ElementWrapper>
              ))}
            </div>
          )}

          {page.elements.some((el) => el.type === "video") && page.type !== "contact" && (
            <div className="mt-4 space-y-3">
              {page.elements.filter((el) => el.type === "video").map((el) => (
                <ElementWrapper key={el.id} elementId={el.id} elementType={el.type}>
                  <div className="w-full aspect-video rounded-lg bg-gray-900 flex items-center justify-center shadow-md">
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <Play className="h-7 w-7 text-white ml-1" />
                    </div>
                  </div>
                </ElementWrapper>
              ))}
            </div>
          )}

          {page.elements.some((el) => el.type === "testimonial") && (
            <div className="mt-4 space-y-3">
              {page.elements.filter((el) => el.type === "testimonial").map((el) => (
                <ElementWrapper key={el.id} elementId={el.id} elementType={el.type}>
                  <div className="bg-white rounded-xl p-4 shadow-md">
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
                </ElementWrapper>
              ))}
            </div>
          )}

          {page.elements.some((el) => el.type === "slider") && (
            <div className="mt-4">
              {page.elements.filter((el) => el.type === "slider").map((el) => (
                <ElementWrapper key={el.id} elementId={el.id} elementType={el.type}>
                  <div className="relative">
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
                </ElementWrapper>
              ))}
            </div>
          )}

          {(page.type === "multiChoice" || page.type === "question") &&
            page.elements.some((el) => el.options) && (
              <div className="space-y-2 mt-4">
                {page.elements
                  .filter((el) => el.options)
                  .map((el) => (
                    <ElementWrapper key={el.id} elementId={el.id} elementType={el.type}>
                      <div className="space-y-2">
                        {el.options?.map((option, idx) => (
                          <div
                            key={`${el.id}-${idx}`}
                            className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 text-sm text-left bg-white hover:border-primary/50 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    </ElementWrapper>
                  ))}
              </div>
            )}

          {/* Social Proof Badges */}
          {page.elements.some((el) => el.type === "socialProof") && (
            <div className="mt-4">
              {page.elements.filter((el) => el.type === "socialProof").map((el) => (
                <ElementWrapper key={el.id} elementId={el.id} elementType={el.type}>
                  <div className="flex flex-wrap justify-center gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 w-16 bg-white/20 rounded" />
                    ))}
                  </div>
                </ElementWrapper>
              ))}
            </div>
          )}

          {/* New OpenFunnels Elements */}

          {/* Audio Element */}
          {page.elements.some((el) => el.type === "audio") && (
            <div className="mt-4 space-y-3">
              {page.elements.filter((el) => el.type === "audio").map((el) => (
                <ElementWrapper key={el.id} elementId={el.id} elementType={el.type}>
                  <div className="bg-gray-100 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                      <Play className="h-5 w-5 text-white ml-0.5" />
                    </div>
                    <div className="flex-1">
                      <div className="h-1 bg-gray-300 rounded-full">
                        <div className="h-1 bg-primary rounded-full w-1/3" />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>0:00</span>
                        <span>3:24</span>
                      </div>
                    </div>
                  </div>
                </ElementWrapper>
              ))}
            </div>
          )}

          {/* Button Element */}
          {page.elements.some((el) => el.type === "button") && (
            <div className="mt-4 space-y-3">
              {page.elements.filter((el) => el.type === "button").map((el) => (
                <ElementWrapper key={el.id} elementId={el.id} elementType={el.type}>
                  <button
                    className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all ${
                      el.buttonVariant === "outline"
                        ? "border-2 border-primary text-primary bg-transparent"
                        : el.buttonVariant === "secondary"
                        ? "bg-gray-200 text-gray-800"
                        : el.buttonVariant === "ghost"
                        ? "bg-transparent text-primary hover:bg-primary/10"
                        : "bg-primary text-white"
                    }`}
                    style={el.buttonVariant === "primary" ? { backgroundColor: primaryColor } : undefined}
                  >
                    {el.content || "Button"}
                  </button>
                </ElementWrapper>
              ))}
            </div>
          )}

          {/* Calendar/Booking Element */}
          {page.elements.some((el) => el.type === "calendar") && (
            <div className="mt-4 space-y-3">
              {page.elements.filter((el) => el.type === "calendar").map((el) => (
                <ElementWrapper key={el.id} elementId={el.id} elementType={el.type}>
                  <div className="bg-white rounded-xl p-4 shadow-md border">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <span className="font-medium">Termin buchen</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs mb-3">
                      {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
                        <div key={d} className="text-gray-500 py-1">{d}</div>
                      ))}
                      {Array.from({ length: 28 }, (_, i) => (
                        <div key={i} className={`py-1 rounded ${i === 14 ? "bg-primary text-white" : "hover:bg-gray-100"}`}>
                          {i + 1}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      {el.calendarProvider === "calendly" ? "Powered by Calendly" : "Terminauswahl"}
                    </p>
                  </div>
                </ElementWrapper>
              ))}
            </div>
          )}

          {/* Countdown Element */}
          {page.elements.some((el) => el.type === "countdown") && (
            <div className="mt-4 space-y-3">
              {page.elements.filter((el) => el.type === "countdown").map((el) => (
                <ElementWrapper key={el.id} elementId={el.id} elementType={el.type}>
                  <div className={`p-4 rounded-xl ${el.countdownStyle === "flip" ? "bg-gray-900" : "bg-white border"}`}>
                    <div className="flex justify-center gap-2">
                      {[
                        { value: "07", label: "Tage" },
                        { value: "12", label: "Std" },
                        { value: "45", label: "Min" },
                        { value: "30", label: "Sek" },
                      ].map((item, idx) => (
                        <div key={idx} className="text-center">
                          <div className={`text-2xl font-bold px-3 py-2 rounded ${
                            el.countdownStyle === "flip"
                              ? "bg-gray-800 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}>
                            {item.value}
                          </div>
                          {el.countdownShowLabels !== false && (
                            <div className={`text-xs mt-1 ${el.countdownStyle === "flip" ? "text-gray-400" : "text-gray-500"}`}>
                              {item.label}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </ElementWrapper>
              ))}
            </div>
          )}

          {/* Map Element */}
          {page.elements.some((el) => el.type === "map") && (
            <div className="mt-4 space-y-3">
              {page.elements.filter((el) => el.type === "map").map((el) => (
                <ElementWrapper key={el.id} elementId={el.id} elementType={el.type}>
                  <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                        <p className="text-sm text-gray-600">{el.mapAddress || "Karte"}</p>
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-white rounded px-2 py-1 text-xs shadow">
                      Google Maps
                    </div>
                  </div>
                </ElementWrapper>
              ))}
            </div>
          )}

          {/* Chart Element */}
          {page.elements.some((el) => el.type === "chart") && (
            <div className="mt-4 space-y-3">
              {page.elements.filter((el) => el.type === "chart").map((el) => (
                <ElementWrapper key={el.id} elementId={el.id} elementType={el.type}>
                  <div className="bg-white rounded-xl p-4 shadow-md border">
                    <div className="flex items-end justify-around h-32 gap-2">
                      {(el.chartData?.datasets[0]?.data || [10, 20, 30, 40]).map((value, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full rounded-t"
                            style={{
                              height: `${(value / 50) * 100}%`,
                              backgroundColor: primaryColor,
                              minHeight: "8px"
                            }}
                          />
                          <span className="text-xs text-gray-500 mt-1">
                            {el.chartData?.labels[idx] || `${idx + 1}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </ElementWrapper>
              ))}
            </div>
          )}

          {/* Code Element */}
          {page.elements.some((el) => el.type === "code") && (
            <div className="mt-4 space-y-3">
              {page.elements.filter((el) => el.type === "code").map((el) => (
                <ElementWrapper key={el.id} elementId={el.id} elementType={el.type}>
                  <div className="bg-gray-900 rounded-xl p-4 overflow-hidden">
                    <div className="flex gap-1.5 mb-3">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <pre className="text-xs text-green-400 font-mono overflow-x-auto">
                      <code>{el.codeContent || "// Code hier..."}</code>
                    </pre>
                  </div>
                </ElementWrapper>
              ))}
            </div>
          )}

          {/* Embed Element */}
          {page.elements.some((el) => el.type === "embed") && (
            <div className="mt-4 space-y-3">
              {page.elements.filter((el) => el.type === "embed").map((el) => (
                <ElementWrapper key={el.id} elementId={el.id} elementType={el.type}>
                  <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <Code className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Eingebetteter Inhalt</p>
                      <p className="text-xs text-gray-400 mt-1">{el.embedUrl || "URL hinzufügen"}</p>
                    </div>
                  </div>
                </ElementWrapper>
              ))}
            </div>
          )}

          {/* Product Element */}
          {page.elements.some((el) => el.type === "product") && (
            <div className="mt-4 space-y-3">
              {page.elements.filter((el) => el.type === "product").map((el) => (
                <ElementWrapper key={el.id} elementId={el.id} elementType={el.type}>
                  <div className="bg-white rounded-xl shadow-md overflow-hidden border">
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      {el.productImage ? (
                        <img src={el.productImage} alt={el.productName} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="h-12 w-12 text-gray-300" />
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold">{el.productName || "Produkt"}</h4>
                      <p className="text-sm text-gray-600 mt-1">{el.productDescription || "Beschreibung..."}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-bold" style={{ color: primaryColor }}>
                          {el.productPrice || "€99"}
                        </span>
                        <button
                          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {el.productButtonText || "Kaufen"}
                        </button>
                      </div>
                    </div>
                  </div>
                </ElementWrapper>
              ))}
            </div>
          )}

          {/* Team Element */}
          {page.elements.some((el) => el.type === "team") && (
            <div className="mt-4 space-y-3">
              {page.elements.filter((el) => el.type === "team").map((el) => (
                <ElementWrapper key={el.id} elementId={el.id} elementType={el.type}>
                  <div className="grid grid-cols-2 gap-3">
                    {(el.teamMembers || []).slice(0, 4).map((member) => (
                      <div key={member.id} className="bg-white rounded-xl p-3 shadow-md border text-center">
                        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center mb-2">
                          {member.image ? (
                            <img src={member.image} alt={member.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <Users className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <h5 className="font-medium text-sm">{member.name}</h5>
                        <p className="text-xs text-gray-500">{member.role}</p>
                      </div>
                    ))}
                  </div>
                </ElementWrapper>
              ))}
            </div>
          )}

          {/* Sections with Columns */}
          {page.sections && page.sections.length > 0 && (
            <div className="mt-4 space-y-4">
              {page.sections.map((section) => (
                <div
                  key={section.id}
                  className="rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: section.styles?.backgroundColor || "transparent",
                    padding: section.styles?.padding || "16px",
                    minHeight: section.styles?.minHeight,
                  }}
                >
                  {section.name && (
                    <div className="text-xs text-gray-500 mb-2 font-medium">
                      {section.name}
                    </div>
                  )}
                  <div className="flex gap-2">
                    {section.columns.map((column) => (
                      <div
                        key={column.id}
                        className="min-h-[60px] rounded-lg border-2 border-dashed border-gray-200 hover:border-primary/30 transition-colors p-2"
                        style={{
                          width: `${column.width}%`,
                          backgroundColor: column.styles?.backgroundColor || "transparent",
                          padding: column.styles?.padding || "8px",
                        }}
                      >
                        {column.elements.length > 0 ? (
                          <div className="space-y-2">
                            {column.elements.map((el) => (
                              <ElementWrapper key={el.id} elementId={el.id} elementType={el.type}>
                                {/* Simplified element rendering for column view */}
                                <div className="text-xs text-gray-600 bg-gray-50 rounded p-2 text-center">
                                  {elementTypeLabels[el.type] || el.type}
                                </div>
                              </ElementWrapper>
                            ))}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-xs text-gray-400">
                            <Plus className="h-3 w-3 mr-1" />
                            Element
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Block Button */}
          {onShowElementPicker && (
            <div className="mt-6 flex flex-col items-center">
              <button
                className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 flex items-center justify-center transition-all group"
                title="Block hinzufügen"
                onClick={(e) => {
                  e.stopPropagation();
                  onShowElementPicker();
                }}
              >
                <Plus className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
              </button>
              <span className="text-xs text-gray-400 mt-2">Block hinzufügen</span>
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
      className={`group flex items-center gap-3 py-2.5 px-3 rounded-lg cursor-pointer transition-all ${
        selected
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted/50 text-foreground"
      } ${isDragging ? "z-50 shadow-xl" : ""}`}
      onClick={onSelect}
      data-testid={`page-item-${index}`}
      {...attributes}
      {...listeners}
    >
      {/* Page number */}
      <span className={`text-sm font-medium w-5 shrink-0 ${selected ? "text-primary" : "text-muted-foreground"}`}>
        {index + 1}
      </span>
      {/* Page title */}
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">{page.title}</div>
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
function ElementPalette({ onAddElement }: { onAddElement: (type: PageElement["type"]) => void }) {
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

// Conditional Logic Editor Component
function ConditionalLogicEditor({
  page,
  allPages,
  onUpdate,
}: {
  page: FunnelPage;
  allPages: FunnelPage[];
  onUpdate: (updates: Partial<FunnelPage>) => void;
}) {
  const hasOptions = page.elements.some(el => el.options && el.options.length > 0);
  const optionElements = page.elements.filter(el => el.options && el.options.length > 0);

  if (!hasOptions) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg text-center">
        <GitBranch className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Füge Auswahloptionen hinzu, um Conditional Logic zu verwenden
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <GitBranch className="h-4 w-4" />
        <span>Leite Besucher basierend auf ihrer Antwort weiter</span>
      </div>

      {optionElements.map((element) => (
        <div key={element.id} className="space-y-2">
          <Label className="text-xs font-medium">Wenn Antwort ist:</Label>
          {element.options?.map((option, optIdx) => (
            <div key={optIdx} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
              <span className="text-sm flex-1 truncate">{option}</span>
              <Select
                value={page.conditionalRouting?.[`${element.id}-${optIdx}`] || "next"}
                onValueChange={(value) => {
                  onUpdate({
                    conditionalRouting: {
                      ...page.conditionalRouting,
                      [`${element.id}-${optIdx}`]: value,
                    },
                  });
                }}
              >
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="next">Nächste Seite</SelectItem>
                  {allPages.map((p, idx) => (
                    <SelectItem key={p.id} value={p.id}>
                      {idx + 1}. {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Personalization Variables Inserter
function PersonalizationInserter({
  onInsert,
}: {
  onInsert: (variable: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setOpen(true)}
          >
            <Variable className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Variable einfügen</TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Personalisierung einfügen</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 mt-4">
          {personalizationVariables.map((v) => (
            <div
              key={v.key}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => {
                onInsert(v.key);
                setOpen(false);
              }}
            >
              <div>
                <div className="font-medium text-sm">{v.label}</div>
                <div className="text-xs text-muted-foreground">{v.description}</div>
              </div>
              <code className="text-xs bg-muted px-2 py-1 rounded">{v.key}</code>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Section Templates Picker
function SectionTemplatesPicker({
  onInsert,
}: {
  onInsert: (elements: PageElement[]) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() => setOpen(true)}
      >
        <LayoutTemplate className="h-4 w-4" />
        Section-Vorlage einfügen
      </Button>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Section-Vorlage wählen</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 mt-4 max-h-[60vh] overflow-y-auto">
          {sectionTemplates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
              onClick={() => {
                const elementsWithNewIds = template.elements.map(el => ({
                  ...el,
                  id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                }));
                onInsert(elementsWithNewIds as PageElement[]);
                setOpen(false);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <LayoutTemplate className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-muted-foreground">{template.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {template.elements.length} Element{template.elements.length > 1 ? "e" : ""}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Layout Selector for creating sections with columns
function LayoutSelector({
  onSelect,
  selectedLayout,
}: {
  onSelect: (layoutId: string, columns: number[]) => void;
  selectedLayout?: string;
}) {
  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium">Spalten-Layout wählen</Label>
      <div className="grid grid-cols-3 gap-2">
        {layoutTemplates.map((layout) => {
          const Icon = layout.icon;
          return (
            <button
              key={layout.id}
              onClick={() => onSelect(layout.id, layout.columns)}
              className={`p-3 rounded-lg border-2 transition-all hover:border-primary/50 ${
                selectedLayout === layout.id
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:bg-muted/50"
              }`}
            >
              <div className="flex justify-center mb-2">
                {/* Visual representation of columns */}
                <div className="flex gap-0.5 h-6 w-full max-w-[60px]">
                  {layout.columns.map((width, idx) => (
                    <div
                      key={idx}
                      className={`rounded-sm ${
                        selectedLayout === layout.id ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                      style={{ width: `${width}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="text-xs font-medium text-center">{layout.name}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Section Editor Component for managing sections and columns
function SectionEditor({
  sections,
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  onSelectSection,
  selectedSectionId,
}: {
  sections: Section[];
  onAddSection: (layout: string, columns: number[]) => void;
  onUpdateSection: (sectionId: string, updates: Partial<Section>) => void;
  onDeleteSection: (sectionId: string) => void;
  onSelectSection: (sectionId: string | null) => void;
  selectedSectionId: string | null;
}) {
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);

  return (
    <div className="space-y-4">
      {/* Section List */}
      <div className="space-y-2">
        {sections.map((section, index) => (
          <div
            key={section.id}
            onClick={() => onSelectSection(section.id)}
            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
              selectedSectionId === section.id
                ? "border-primary bg-primary/5"
                : "border-muted hover:border-muted-foreground/30"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {section.name || `Section ${index + 1}`}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSection(section.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {/* Column preview */}
            <div className="flex gap-1 h-4">
              {section.columns.map((col) => (
                <div
                  key={col.id}
                  className="bg-muted-foreground/20 rounded-sm flex items-center justify-center"
                  style={{ width: `${col.width}%` }}
                >
                  <span className="text-[8px] text-muted-foreground">
                    {col.elements.length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Section Button */}
      {showLayoutPicker ? (
        <div className="p-3 border rounded-lg space-y-3">
          <LayoutSelector
            onSelect={(layoutId, columns) => {
              onAddSection(layoutId, columns);
              setShowLayoutPicker(false);
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setShowLayoutPicker(false)}
          >
            Abbrechen
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => setShowLayoutPicker(true)}
        >
          <Plus className="h-4 w-4" />
          Neue Sektion hinzufügen
        </Button>
      )}

      {/* Selected Section Editor */}
      {selectedSectionId && (
        <div className="p-3 border rounded-lg space-y-3">
          <Label className="text-xs font-medium">Sektion bearbeiten</Label>
          {sections
            .filter((s) => s.id === selectedSectionId)
            .map((section) => (
              <div key={section.id} className="space-y-3">
                <Input
                  value={section.name || ""}
                  onChange={(e) =>
                    onUpdateSection(section.id, { name: e.target.value })
                  }
                  placeholder="Sektion Name"
                  className="h-8 text-sm"
                />
                <div className="space-y-2">
                  <Label className="text-xs">Hintergrundfarbe</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={section.styles?.backgroundColor || "#ffffff"}
                      onChange={(e) =>
                        onUpdateSection(section.id, {
                          styles: {
                            ...section.styles,
                            backgroundColor: e.target.value,
                          },
                        })
                      }
                      className="w-10 h-8 p-1 cursor-pointer"
                    />
                    <Input
                      value={section.styles?.backgroundColor || "#ffffff"}
                      onChange={(e) =>
                        onUpdateSection(section.id, {
                          styles: {
                            ...section.styles,
                            backgroundColor: e.target.value,
                          },
                        })
                      }
                      className="flex-1 h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Innenabstand</Label>
                  <Select
                    value={section.styles?.padding || "16px"}
                    onValueChange={(v) =>
                      onUpdateSection(section.id, {
                        styles: { ...section.styles, padding: v },
                      })
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8px">Klein (8px)</SelectItem>
                      <SelectItem value="16px">Normal (16px)</SelectItem>
                      <SelectItem value="24px">Mittel (24px)</SelectItem>
                      <SelectItem value="32px">Groß (32px)</SelectItem>
                      <SelectItem value="48px">Sehr groß (48px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function PageEditor({
  page,
  allPages,
  primaryColor,
  onUpdate,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: {
  page: FunnelPage;
  allPages: FunnelPage[];
  primaryColor: string;
  onUpdate: (updates: Partial<FunnelPage>) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}) {
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

export default function FunnelEditor() {
  const [, params] = useRoute("/funnels/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [showAddPage, setShowAddPage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [previewMode, setPreviewMode] = useState<"phone" | "tablet" | "desktop">("phone");
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  // Perspective-style editor states
  const [leftSidebarTab, setLeftSidebarTab] = useState<"pages" | "design">("pages");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // History state for undo/redo
  const {
    state: localFunnel,
    set: setLocalFunnel,
    undo,
    redo,
    reset: resetHistory,
    canUndo,
    canRedo,
  } = useHistory<Funnel | null>(null);

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

  // Initialize funnel from query
  useEffect(() => {
    if (funnel && !localFunnel) {
      resetHistory(funnel);
    }
  }, [funnel]);

  // Auto-save functionality
  const performAutoSave = useCallback(() => {
    if (localFunnel && hasChanges && autoSaveEnabled) {
      saveMutation.mutate({
        name: localFunnel.name,
        description: localFunnel.description,
        pages: localFunnel.pages,
        theme: localFunnel.theme,
        status: localFunnel.status,
      });
      setLastAutoSave(new Date());
    }
  }, [localFunnel, hasChanges, autoSaveEnabled]);

  const { scheduleAutoSave } = useAutoSave(
    localFunnel,
    performAutoSave,
    30000, // 30 seconds
    autoSaveEnabled && hasChanges
  );

  // Schedule auto-save when changes occur
  useEffect(() => {
    if (hasChanges && autoSaveEnabled) {
      scheduleAutoSave();
    }
  }, [hasChanges, autoSaveEnabled, scheduleAutoSave]);

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

  const updateLocalFunnel = useCallback((updates: Partial<Funnel>) => {
    if (localFunnel) {
      setLocalFunnel({ ...localFunnel, ...updates });
      setHasChanges(true);
    }
  }, [localFunnel, setLocalFunnel]);

  const updatePage = (index: number, updates: Partial<FunnelPage>) => {
    if (localFunnel) {
      const newPages = [...localFunnel.pages];
      newPages[index] = { ...newPages[index], ...updates };
      updateLocalFunnel({ pages: newPages });
    }
  };

  // Get selected element from current page
  const selectedElement = useMemo(() => {
    if (!localFunnel || !selectedElementId) return null;
    const page = localFunnel.pages[selectedPageIndex];
    return page?.elements.find(el => el.id === selectedElementId) || null;
  }, [localFunnel, selectedPageIndex, selectedElementId]);

  // Element manipulation functions for the left sidebar
  const updateSelectedElement = useCallback((updates: Partial<PageElement>) => {
    if (!localFunnel || !selectedElementId) return;
    const page = localFunnel.pages[selectedPageIndex];
    const newElements = page.elements.map(el =>
      el.id === selectedElementId ? { ...el, ...updates } : el
    );
    updatePage(selectedPageIndex, { elements: newElements });
  }, [localFunnel, selectedPageIndex, selectedElementId, updatePage]);

  const deleteSelectedElement = useCallback(() => {
    if (!localFunnel || !selectedElementId) return;
    const page = localFunnel.pages[selectedPageIndex];
    const newElements = page.elements.filter(el => el.id !== selectedElementId);
    updatePage(selectedPageIndex, { elements: newElements });
    setSelectedElementId(null);
  }, [localFunnel, selectedPageIndex, selectedElementId, updatePage]);

  const duplicateSelectedElement = useCallback(() => {
    if (!localFunnel || !selectedElementId) return;
    const page = localFunnel.pages[selectedPageIndex];
    const elementIndex = page.elements.findIndex(el => el.id === selectedElementId);
    if (elementIndex === -1) return;
    const element = page.elements[elementIndex];
    const newElement = { ...element, id: `el-${Date.now()}` };
    const newElements = [...page.elements];
    newElements.splice(elementIndex + 1, 0, newElement);
    updatePage(selectedPageIndex, { elements: newElements });
    setSelectedElementId(newElement.id);
  }, [localFunnel, selectedPageIndex, selectedElementId, updatePage]);

  const moveElementUp = useCallback(() => {
    if (!localFunnel || !selectedElementId) return;
    const page = localFunnel.pages[selectedPageIndex];
    const elementIndex = page.elements.findIndex(el => el.id === selectedElementId);
    if (elementIndex <= 0) return;
    const newElements = [...page.elements];
    [newElements[elementIndex - 1], newElements[elementIndex]] = [newElements[elementIndex], newElements[elementIndex - 1]];
    updatePage(selectedPageIndex, { elements: newElements });
  }, [localFunnel, selectedPageIndex, selectedElementId, updatePage]);

  const moveElementDown = useCallback(() => {
    if (!localFunnel || !selectedElementId) return;
    const page = localFunnel.pages[selectedPageIndex];
    const elementIndex = page.elements.findIndex(el => el.id === selectedElementId);
    if (elementIndex === -1 || elementIndex >= page.elements.length - 1) return;
    const newElements = [...page.elements];
    [newElements[elementIndex], newElements[elementIndex + 1]] = [newElements[elementIndex + 1], newElements[elementIndex]];
    updatePage(selectedPageIndex, { elements: newElements });
  }, [localFunnel, selectedPageIndex, selectedElementId, updatePage]);

  // Add element to current page from Design tab - Extended with OpenFunnels block types
  const addElementToPage = useCallback((type: PageElement["type"]) => {
    if (!localFunnel) return;
    const page = localFunnel.pages[selectedPageIndex];
    const newElement: PageElement = {
      id: `el-${Date.now()}`,
      type,
      // Form placeholders
      placeholder:
        type === "input" ? "Dein Text hier..." :
        type === "textarea" ? "Deine Nachricht..." :
        type === "select" ? "Option wählen..." :
        type === "date" ? "Datum auswählen..." : undefined,
      options:
        type === "radio" ? ["Option 1", "Option 2", "Option 3"] :
        type === "select" ? ["Option 1", "Option 2", "Option 3"] : undefined,
      // Labels
      label:
        type === "fileUpload" ? "Datei hochladen" :
        type === "video" ? "Video" :
        type === "audio" ? "Audio" :
        type === "date" ? "Datum" :
        type === "heading" ? "Überschrift" :
        type === "text" ? "Dein Text hier..." :
        type === "select" ? "Auswahl" :
        type === "button" ? "Klicken" :
        type === "calendar" ? "Termin buchen" : undefined,
      // Content
      content:
        type === "heading" ? "Deine Überschrift" :
        type === "text" ? "Füge hier deinen Text ein. Beschreibe dein Angebot oder gib wichtige Informationen." :
        type === "button" ? "Jetzt starten" : undefined,
      // File upload
      acceptedFileTypes: type === "fileUpload" ? [".pdf", ".jpg", ".jpeg", ".png"] : undefined,
      maxFileSize: type === "fileUpload" ? 10 : undefined,
      maxFiles: type === "fileUpload" ? 1 : undefined,
      // Video
      videoUrl: type === "video" ? "" : undefined,
      videoType: type === "video" ? "youtube" : undefined,
      videoAutoplay: type === "video" ? false : undefined,
      // Audio (new)
      audioUrl: type === "audio" ? "" : undefined,
      audioAutoplay: type === "audio" ? false : undefined,
      audioLoop: type === "audio" ? false : undefined,
      // Date
      includeTime: type === "date" ? false : undefined,
      // Calendar/Booking (new)
      calendarProvider: type === "calendar" ? "calendly" : undefined,
      calendarUrl: type === "calendar" ? "" : undefined,
      // Slides (testimonial/slider)
      slides: type === "testimonial" ? [
        { id: "t1", text: "Großartiger Service! Sehr empfehlenswert.", author: "Max Mustermann", role: "Geschäftsführer", rating: 5 }
      ] : type === "slider" ? [
        { id: "s1", title: "Slide 1", text: "" },
        { id: "s2", title: "Slide 2", text: "" },
        { id: "s3", title: "Slide 3", text: "" }
      ] : undefined,
      // FAQ
      faqItems: type === "faq" ? [
        { id: "faq1", question: "Wie funktioniert das?", answer: "So funktioniert es..." },
        { id: "faq2", question: "Was kostet das?", answer: "Die Preise sind..." },
      ] : undefined,
      // List
      listItems: type === "list" ? [
        { id: "li1", text: "Vorteil Nummer 1" },
        { id: "li2", text: "Vorteil Nummer 2" },
        { id: "li3", text: "Vorteil Nummer 3" },
      ] : undefined,
      listStyle: type === "list" ? "check" : undefined,
      // Layout
      spacerHeight: type === "spacer" ? 32 : undefined,
      dividerStyle: type === "divider" ? "solid" : undefined,
      // Timer/Countdown
      timerEndDate: (type === "timer" || type === "countdown") ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      timerStyle: type === "timer" ? "countdown" : undefined,
      timerShowDays: (type === "timer" || type === "countdown") ? true : undefined,
      countdownDate: type === "countdown" ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      countdownStyle: type === "countdown" ? "flip" : undefined,
      countdownShowLabels: type === "countdown" ? true : undefined,
      // Map (new)
      mapAddress: type === "map" ? "Berlin, Germany" : undefined,
      mapZoom: type === "map" ? 14 : undefined,
      mapStyle: type === "map" ? "roadmap" : undefined,
      // Chart (new)
      chartType: type === "chart" ? "bar" : undefined,
      chartData: type === "chart" ? {
        labels: ["Jan", "Feb", "Mär", "Apr"],
        datasets: [{ label: "Daten", data: [10, 20, 30, 40], color: "#7C3AED" }]
      } : undefined,
      // Code/Embed (new)
      codeContent: type === "code" ? "// Dein Code hier\nconsole.log('Hello!');" : undefined,
      codeLanguage: type === "code" ? "javascript" : undefined,
      embedCode: type === "embed" ? "" : undefined,
      embedUrl: type === "embed" ? "" : undefined,
      // Product (new)
      productName: type === "product" ? "Premium Produkt" : undefined,
      productPrice: type === "product" ? "99,00 €" : undefined,
      productDescription: type === "product" ? "Beschreibung deines Produkts..." : undefined,
      productButtonText: type === "product" ? "Jetzt kaufen" : undefined,
      // Team (new)
      teamMembers: type === "team" ? [
        { id: "tm1", name: "Max Mustermann", role: "CEO", image: "", bio: "Gründer und Visionär" },
        { id: "tm2", name: "Erika Musterfrau", role: "CTO", image: "", bio: "Technische Leitung" },
      ] : undefined,
      // Button (new)
      buttonUrl: type === "button" ? "" : undefined,
      buttonTarget: type === "button" ? "_self" : undefined,
      buttonVariant: type === "button" ? "primary" : undefined,
    };
    const newElements = [...page.elements, newElement];
    updatePage(selectedPageIndex, { elements: newElements });
    setSelectedElementId(newElement.id);
  }, [localFunnel, selectedPageIndex, updatePage]);

  // Clear element selection when page changes
  useEffect(() => {
    setSelectedElementId(null);
  }, [selectedPageIndex]);

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
      // Save: Ctrl+S
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (hasChanges) handleSave();
      }
      // Undo: Ctrl+Z
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undo();
          setHasChanges(true);
        }
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) {
          redo();
          setHasChanges(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasChanges, localFunnel, canUndo, canRedo, undo, redo]);

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
          {/* Undo/Redo buttons in header */}
          <div className="flex items-center gap-0.5 mr-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => { undo(); setHasChanges(true); }}
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
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => { redo(); setHasChanges(true); }}
                  disabled={!canRedo}
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Wiederholen (Ctrl+Y)</TooltipContent>
            </Tooltip>
          </div>

          <div className="h-6 w-px bg-border mx-1" />

          {/* Auto-save indicator */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
              >
                {autoSaveEnabled ? (
                  <Cloud className="h-4 w-4 text-green-500" />
                ) : (
                  <CloudOff className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {autoSaveEnabled
                ? `Auto-Save aktiv${lastAutoSave ? ` (zuletzt: ${lastAutoSave.toLocaleTimeString()})` : ""}`
                : "Auto-Save deaktiviert - klicken zum aktivieren"
              }
            </TooltipContent>
          </Tooltip>

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
        {/* Left sidebar - Seiten/Design tabs */}
        <div className={`${showLeftSidebar ? "w-72" : "w-0"} border-r border-border bg-card overflow-hidden transition-all duration-300`}>
          <div className="w-72 h-full flex flex-col">
            {/* Tabs header */}
            <div className="border-b border-border">
              <div className="flex">
                <button
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors border-b-2 ${
                    leftSidebarTab === "pages"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setLeftSidebarTab("pages")}
                >
                  <Layers className="h-4 w-4 inline-block mr-2" />
                  Seiten
                </button>
                <button
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors border-b-2 ${
                    leftSidebarTab === "design"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setLeftSidebarTab("design")}
                >
                  <Settings className="h-4 w-4 inline-block mr-2" />
                  Design
                </button>
              </div>
            </div>

            {/* Tab content */}
            {leftSidebarTab === "pages" ? (
              <>
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
              </>
            ) : (
              <div className="flex-1 overflow-y-auto funnel-scrollbar">
                {selectedElement ? (
                  /* Element Properties Panel - Perspective Style */
                  <div className="p-4 space-y-6">
                    {/* Element type header */}
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">
                        {selectedElement.type === "heading" && "Überschrift"}
                        {selectedElement.type === "text" && "Text"}
                        {selectedElement.type === "image" && "Bild"}
                        {selectedElement.type === "video" && "Video"}
                        {selectedElement.type === "input" && "Eingabefeld"}
                        {selectedElement.type === "textarea" && "Textbereich"}
                        {selectedElement.type === "select" && "Dropdown"}
                        {selectedElement.type === "radio" && "Auswahl"}
                        {selectedElement.type === "checkbox" && "Checkbox"}
                        {selectedElement.type === "list" && "Liste"}
                        {selectedElement.type === "testimonial" && "Bewertung"}
                        {selectedElement.type === "faq" && "FAQ"}
                        {selectedElement.type === "divider" && "Trennlinie"}
                        {selectedElement.type === "spacer" && "Abstand"}
                        {selectedElement.type === "timer" && "Timer"}
                        {selectedElement.type === "slider" && "Slider"}
                        {selectedElement.type === "button" && "Button"}
                        {selectedElement.type === "audio" && "Audio"}
                        {selectedElement.type === "calendar" && "Kalender"}
                        {selectedElement.type === "countdown" && "Countdown"}
                        {selectedElement.type === "map" && "Karte"}
                        {selectedElement.type === "chart" && "Diagramm"}
                        {selectedElement.type === "code" && "Code"}
                        {selectedElement.type === "embed" && "Embed"}
                        {selectedElement.type === "product" && "Produkt"}
                        {selectedElement.type === "team" && "Team"}
                        {selectedElement.type === "quiz" && "Quiz"}
                        {selectedElement.type === "icon" && "Icon"}
                        {selectedElement.type === "progressBar" && "Fortschritt"}
                        {selectedElement.type === "socialProof" && "Social Proof"}
                        {!["heading", "text", "image", "video", "input", "textarea", "select", "radio", "checkbox", "list", "testimonial", "faq", "divider", "spacer", "timer", "slider", "button", "audio", "calendar", "countdown", "map", "chart", "code", "embed", "product", "team", "quiz", "icon", "progressBar", "socialProof"].includes(selectedElement.type) && selectedElement.type}
                      </h4>
                      <button
                        className="p-1 rounded hover:bg-muted"
                        onClick={() => setSelectedElementId(null)}
                      >
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>

                    {/* Element-specific properties */}
                    {(selectedElement.type === "heading" || selectedElement.type === "text") && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Inhalt</Label>
                          <Textarea
                            value={selectedElement.content || ""}
                            onChange={(e) => updateSelectedElement({ content: e.target.value })}
                            rows={3}
                            className="text-sm"
                          />
                        </div>

                        {selectedElement.type === "heading" && (
                          <div className="space-y-2">
                            <Label className="text-xs">Schriftgröße</Label>
                            <Select
                              value={selectedElement.styles?.fontSize || "2xl"}
                              onValueChange={(v) => updateSelectedElement({
                                styles: { ...selectedElement.styles, fontSize: v }
                              })}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="xl">Klein (XL)</SelectItem>
                                <SelectItem value="2xl">Normal (2XL)</SelectItem>
                                <SelectItem value="3xl">Groß (3XL)</SelectItem>
                                <SelectItem value="4xl">Sehr groß (4XL)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label className="text-xs">Textausrichtung</Label>
                          <div className="flex gap-1">
                            <Button
                              variant={selectedElement.styles?.textAlign === "left" ? "default" : "outline"}
                              size="sm"
                              className="flex-1"
                              onClick={() => updateSelectedElement({
                                styles: { ...selectedElement.styles, textAlign: "left" }
                              })}
                            >
                              <AlignLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={(!selectedElement.styles?.textAlign || selectedElement.styles?.textAlign === "center") ? "default" : "outline"}
                              size="sm"
                              className="flex-1"
                              onClick={() => updateSelectedElement({
                                styles: { ...selectedElement.styles, textAlign: "center" }
                              })}
                            >
                              <AlignCenter className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={selectedElement.styles?.textAlign === "right" ? "default" : "outline"}
                              size="sm"
                              className="flex-1"
                              onClick={() => updateSelectedElement({
                                styles: { ...selectedElement.styles, textAlign: "right" }
                              })}
                            >
                              <AlignRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Textfarbe</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={selectedElement.styles?.color || "#1a1a1a"}
                              onChange={(e) => updateSelectedElement({
                                styles: { ...selectedElement.styles, color: e.target.value }
                              })}
                              className="w-12 h-9 p-1 cursor-pointer"
                            />
                            <Input
                              value={selectedElement.styles?.color || "#1a1a1a"}
                              onChange={(e) => updateSelectedElement({
                                styles: { ...selectedElement.styles, color: e.target.value }
                              })}
                              className="flex-1 h-9 text-sm"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant={selectedElement.styles?.fontWeight === "bold" ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateSelectedElement({
                              styles: {
                                ...selectedElement.styles,
                                fontWeight: selectedElement.styles?.fontWeight === "bold" ? "normal" : "bold"
                              }
                            })}
                          >
                            <Bold className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={selectedElement.styles?.fontStyle === "italic" ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateSelectedElement({
                              styles: {
                                ...selectedElement.styles,
                                fontStyle: selectedElement.styles?.fontStyle === "italic" ? "normal" : "italic"
                              }
                            })}
                          >
                            <Italic className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {selectedElement.type === "image" && (
                      <div className="space-y-4">
                        {/* Size options like Perspective */}
                        <div className="space-y-2">
                          <div className="flex gap-1">
                            {["S", "M", "L", "XL"].map((size) => (
                              <Button
                                key={size}
                                variant={(selectedElement.styles?.imageSize || "L") === size ? "default" : "outline"}
                                size="sm"
                                className="flex-1 text-xs font-medium"
                                onClick={() => updateSelectedElement({
                                  styles: { ...selectedElement.styles, imageSize: size }
                                })}
                              >
                                {size}
                              </Button>
                            ))}
                            <Button variant="outline" size="sm" className="px-2">
                              <Settings className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" className="flex-1 text-xs">
                            <Scissors className="h-3.5 w-3.5 mr-1" />
                            Zuschneiden
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 text-xs">
                            <Maximize2 className="h-3.5 w-3.5 mr-1" />
                            Vollbild
                          </Button>
                          <Button variant="outline" size="sm" className="px-2">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Hintergrund section */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Hintergrund</Label>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1 justify-start gap-2 h-9">
                              <ChevronUp className="h-3.5 w-3.5" />
                              <div className="flex-1 h-1 bg-muted rounded" />
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 justify-start gap-2 h-9">
                              <ChevronDown className="h-3.5 w-3.5" />
                              <div className="flex-1 h-1 bg-muted rounded" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              value={selectedElement.styles?.backgroundColor || "#ffffff"}
                              onChange={(e) => updateSelectedElement({
                                styles: { ...selectedElement.styles, backgroundColor: e.target.value }
                              })}
                              className="w-10 h-8 p-1 cursor-pointer"
                            />
                            <span className="text-xs text-muted-foreground">Hintergrundfarbe</span>
                          </div>
                        </div>

                        {/* Alle Medien section */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Alle Medien</Label>
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              placeholder="Suche"
                              className="pl-8 h-8 text-sm"
                            />
                          </div>
                        </div>

                        {/* Upload dropzone */}
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                          <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            Bild ablegen oder klicken zum Durchsuchen
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            (Max. 10MB; .png .jpg .webp .gif)
                          </p>
                        </div>

                        {/* Image URL input */}
                        <div className="space-y-2">
                          <Label className="text-xs">Bild-URL</Label>
                          <Input
                            value={selectedElement.imageUrl || ""}
                            onChange={(e) => updateSelectedElement({ imageUrl: e.target.value })}
                            placeholder="https://..."
                            className="text-sm h-8"
                          />
                        </div>

                        {/* Alt text */}
                        <div className="space-y-2">
                          <Label className="text-xs">Alt-Text (SEO)</Label>
                          <Input
                            value={selectedElement.imageAlt || ""}
                            onChange={(e) => updateSelectedElement({ imageAlt: e.target.value })}
                            placeholder="Bildbeschreibung"
                            className="text-sm h-8"
                          />
                        </div>
                      </div>
                    )}

                    {selectedElement.type === "video" && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Video-URL</Label>
                          <Input
                            value={selectedElement.videoUrl || ""}
                            onChange={(e) => updateSelectedElement({ videoUrl: e.target.value })}
                            placeholder="YouTube oder Vimeo URL"
                            className="text-sm"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Autoplay</Label>
                          <Switch
                            checked={selectedElement.videoAutoplay || false}
                            onCheckedChange={(checked) => updateSelectedElement({ videoAutoplay: checked })}
                          />
                        </div>
                      </div>
                    )}

                    {(selectedElement.type === "input" || selectedElement.type === "textarea") && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Platzhalter</Label>
                          <Input
                            value={selectedElement.placeholder || ""}
                            onChange={(e) => updateSelectedElement({ placeholder: e.target.value })}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Label</Label>
                          <Input
                            value={selectedElement.label || ""}
                            onChange={(e) => updateSelectedElement({ label: e.target.value })}
                            className="text-sm"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Pflichtfeld</Label>
                          <Switch
                            checked={selectedElement.required || false}
                            onCheckedChange={(checked) => updateSelectedElement({ required: checked })}
                          />
                        </div>
                      </div>
                    )}

                    {selectedElement.type === "spacer" && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Höhe (px)</Label>
                          <Slider
                            value={[selectedElement.spacerHeight || 24]}
                            onValueChange={([v]) => updateSelectedElement({ spacerHeight: v })}
                            min={8}
                            max={120}
                            step={8}
                          />
                          <div className="text-xs text-muted-foreground text-center">
                            {selectedElement.spacerHeight || 24}px
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Button Editor */}
                    {selectedElement.type === "button" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Button-Text</Label>
                          <Input
                            value={selectedElement.content || ""}
                            onChange={(e) => updateSelectedElement({ content: e.target.value })}
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
                                variant={(selectedElement.buttonVariant || "primary") === variant ? "default" : "outline"}
                                size="sm"
                                className="flex-1 text-xs capitalize"
                                onClick={() => updateSelectedElement({ buttonVariant: variant })}
                              >
                                {variant === "primary" ? "Primär" : variant === "secondary" ? "Sekundär" : variant === "outline" ? "Rahmen" : "Ghost"}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Link-URL</Label>
                          <Input
                            value={selectedElement.buttonUrl || ""}
                            onChange={(e) => updateSelectedElement({ buttonUrl: e.target.value })}
                            placeholder="https://..."
                            className="text-sm h-8"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">In neuem Tab öffnen</Label>
                          <Switch
                            checked={selectedElement.buttonTarget === "_blank"}
                            onCheckedChange={(checked) => updateSelectedElement({ buttonTarget: checked ? "_blank" : "_self" })}
                          />
                        </div>
                      </div>
                    )}

                    {/* Audio Editor */}
                    {selectedElement.type === "audio" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Audio-URL</Label>
                          <Input
                            value={selectedElement.audioUrl || ""}
                            onChange={(e) => updateSelectedElement({ audioUrl: e.target.value })}
                            placeholder="https://example.com/audio.mp3"
                            className="text-sm h-8"
                          />
                        </div>
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                          <Music className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            Audio-Datei ablegen oder klicken
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            (Max. 50MB; .mp3 .wav .ogg)
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Autoplay</Label>
                          <Switch
                            checked={selectedElement.audioAutoplay || false}
                            onCheckedChange={(checked) => updateSelectedElement({ audioAutoplay: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Wiederholen</Label>
                          <Switch
                            checked={selectedElement.audioLoop || false}
                            onCheckedChange={(checked) => updateSelectedElement({ audioLoop: checked })}
                          />
                        </div>
                      </div>
                    )}

                    {/* Calendar/Booking Editor */}
                    {selectedElement.type === "calendar" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Anbieter</Label>
                          <Select
                            value={selectedElement.calendarProvider || "calendly"}
                            onValueChange={(v) => updateSelectedElement({ calendarProvider: v as "calendly" | "cal" | "custom" })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="calendly">Calendly</SelectItem>
                              <SelectItem value="cal">Cal.com</SelectItem>
                              <SelectItem value="custom">Eigene URL</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Kalender-URL</Label>
                          <Input
                            value={selectedElement.calendarUrl || ""}
                            onChange={(e) => updateSelectedElement({ calendarUrl: e.target.value })}
                            placeholder="https://calendly.com/username"
                            className="text-sm h-8"
                          />
                        </div>
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-xs text-muted-foreground">
                            💡 Füge deine Kalender-Embed-URL ein, um Termine direkt im Funnel buchbar zu machen.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Countdown Editor */}
                    {selectedElement.type === "countdown" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Zieldatum</Label>
                          <Input
                            type="datetime-local"
                            value={selectedElement.countdownDate || ""}
                            onChange={(e) => updateSelectedElement({ countdownDate: e.target.value })}
                            className="text-sm h-8"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Stil</Label>
                          <div className="flex gap-1">
                            {(["flip", "simple", "circular"] as const).map((style) => (
                              <Button
                                key={style}
                                variant={(selectedElement.countdownStyle || "flip") === style ? "default" : "outline"}
                                size="sm"
                                className="flex-1 text-xs capitalize"
                                onClick={() => updateSelectedElement({ countdownStyle: style })}
                              >
                                {style === "flip" ? "Flip" : style === "simple" ? "Einfach" : "Kreise"}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Labels anzeigen</Label>
                          <Switch
                            checked={selectedElement.countdownShowLabels !== false}
                            onCheckedChange={(checked) => updateSelectedElement({ countdownShowLabels: checked })}
                          />
                        </div>
                      </div>
                    )}

                    {/* Map Editor */}
                    {selectedElement.type === "map" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Adresse</Label>
                          <Textarea
                            value={selectedElement.mapAddress || ""}
                            onChange={(e) => updateSelectedElement({ mapAddress: e.target.value })}
                            placeholder="Musterstraße 1, 12345 Berlin"
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Zoom-Stufe</Label>
                          <Slider
                            value={[selectedElement.mapZoom || 15]}
                            onValueChange={([v]) => updateSelectedElement({ mapZoom: v })}
                            min={1}
                            max={20}
                            step={1}
                          />
                          <div className="text-xs text-muted-foreground text-center">
                            Zoom: {selectedElement.mapZoom || 15}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Karten-Stil</Label>
                          <Select
                            value={selectedElement.mapStyle || "roadmap"}
                            onValueChange={(v) => updateSelectedElement({ mapStyle: v as "roadmap" | "satellite" | "terrain" })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="roadmap">Straßenkarte</SelectItem>
                              <SelectItem value="satellite">Satellit</SelectItem>
                              <SelectItem value="terrain">Gelände</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Chart Editor */}
                    {selectedElement.type === "chart" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Diagramm-Typ</Label>
                          <div className="grid grid-cols-2 gap-1">
                            {(["bar", "line", "pie", "doughnut"] as const).map((type) => (
                              <Button
                                key={type}
                                variant={(selectedElement.chartType || "bar") === type ? "default" : "outline"}
                                size="sm"
                                className="text-xs capitalize"
                                onClick={() => updateSelectedElement({ chartType: type })}
                              >
                                {type === "bar" ? "Balken" : type === "line" ? "Linie" : type === "pie" ? "Kreis" : "Donut"}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Titel</Label>
                          <Input
                            value={selectedElement.content || ""}
                            onChange={(e) => updateSelectedElement({ content: e.target.value })}
                            placeholder="Diagramm-Titel"
                            className="text-sm h-8"
                          />
                        </div>
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-xs text-muted-foreground">
                            📊 Daten können über die API oder ein verbundenes Spreadsheet eingespielt werden.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Code Editor */}
                    {selectedElement.type === "code" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Programmiersprache</Label>
                          <Select
                            value={selectedElement.codeLanguage || "javascript"}
                            onValueChange={(v) => updateSelectedElement({ codeLanguage: v })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="javascript">JavaScript</SelectItem>
                              <SelectItem value="typescript">TypeScript</SelectItem>
                              <SelectItem value="python">Python</SelectItem>
                              <SelectItem value="html">HTML</SelectItem>
                              <SelectItem value="css">CSS</SelectItem>
                              <SelectItem value="json">JSON</SelectItem>
                              <SelectItem value="bash">Bash</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Code</Label>
                          <Textarea
                            value={selectedElement.codeContent || ""}
                            onChange={(e) => updateSelectedElement({ codeContent: e.target.value })}
                            placeholder="// Dein Code hier..."
                            rows={8}
                            className="text-sm font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {/* Embed Editor */}
                    {selectedElement.type === "embed" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Embed-URL</Label>
                          <Input
                            value={selectedElement.embedUrl || ""}
                            onChange={(e) => updateSelectedElement({ embedUrl: e.target.value })}
                            placeholder="https://..."
                            className="text-sm h-8"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Oder HTML-Code</Label>
                          <Textarea
                            value={selectedElement.embedCode || ""}
                            onChange={(e) => updateSelectedElement({ embedCode: e.target.value })}
                            placeholder='<iframe src="..."></iframe>'
                            rows={4}
                            className="text-sm font-mono"
                          />
                        </div>
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                          <p className="text-xs text-yellow-600">
                            ⚠️ Achte darauf, nur vertrauenswürdige Embed-Codes zu verwenden.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Product Editor */}
                    {selectedElement.type === "product" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Produktname</Label>
                          <Input
                            value={selectedElement.productName || ""}
                            onChange={(e) => updateSelectedElement({ productName: e.target.value })}
                            placeholder="Premium Coaching"
                            className="text-sm h-8"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Preis</Label>
                          <Input
                            value={selectedElement.productPrice || ""}
                            onChange={(e) => updateSelectedElement({ productPrice: e.target.value })}
                            placeholder="€ 997"
                            className="text-sm h-8"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Produktbild URL</Label>
                          <Input
                            value={selectedElement.productImage || ""}
                            onChange={(e) => updateSelectedElement({ productImage: e.target.value })}
                            placeholder="https://..."
                            className="text-sm h-8"
                          />
                        </div>
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                          <ShoppingBag className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            Produktbild hochladen
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Beschreibung</Label>
                          <Textarea
                            value={selectedElement.productDescription || ""}
                            onChange={(e) => updateSelectedElement({ productDescription: e.target.value })}
                            placeholder="Kurze Produktbeschreibung..."
                            rows={3}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Button-Text</Label>
                          <Input
                            value={selectedElement.productButtonText || ""}
                            onChange={(e) => updateSelectedElement({ productButtonText: e.target.value })}
                            placeholder="Jetzt kaufen"
                            className="text-sm h-8"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Button-URL</Label>
                          <Input
                            value={selectedElement.productButtonUrl || ""}
                            onChange={(e) => updateSelectedElement({ productButtonUrl: e.target.value })}
                            placeholder="https://checkout..."
                            className="text-sm h-8"
                          />
                        </div>
                      </div>
                    )}

                    {/* Team Editor */}
                    {selectedElement.type === "team" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium">Team-Mitglieder</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              const members = selectedElement.teamMembers || [];
                              updateSelectedElement({
                                teamMembers: [
                                  ...members,
                                  {
                                    id: `member-${Date.now()}`,
                                    name: "Neues Mitglied",
                                    role: "Position",
                                    image: "",
                                  },
                                ],
                              });
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Hinzufügen
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {(selectedElement.teamMembers || []).map((member, idx) => (
                            <div key={member.id} className="p-3 border rounded-lg space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium">Mitglied {idx + 1}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-destructive"
                                  onClick={() => {
                                    const members = [...(selectedElement.teamMembers || [])];
                                    members.splice(idx, 1);
                                    updateSelectedElement({ teamMembers: members });
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <Input
                                value={member.name}
                                onChange={(e) => {
                                  const members = [...(selectedElement.teamMembers || [])];
                                  members[idx] = { ...members[idx], name: e.target.value };
                                  updateSelectedElement({ teamMembers: members });
                                }}
                                placeholder="Name"
                                className="text-sm h-8"
                              />
                              <Input
                                value={member.role || ""}
                                onChange={(e) => {
                                  const members = [...(selectedElement.teamMembers || [])];
                                  members[idx] = { ...members[idx], role: e.target.value };
                                  updateSelectedElement({ teamMembers: members });
                                }}
                                placeholder="Position"
                                className="text-sm h-8"
                              />
                              <Input
                                value={member.image || ""}
                                onChange={(e) => {
                                  const members = [...(selectedElement.teamMembers || [])];
                                  members[idx] = { ...members[idx], image: e.target.value };
                                  updateSelectedElement({ teamMembers: members });
                                }}
                                placeholder="Bild-URL"
                                className="text-sm h-8"
                              />
                            </div>
                          ))}
                          {(!selectedElement.teamMembers || selectedElement.teamMembers.length === 0) && (
                            <div className="text-center py-4 text-sm text-muted-foreground">
                              Noch keine Mitglieder. Klicke auf "Hinzufügen".
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Quiz Editor - basic */}
                    {selectedElement.type === "quiz" && (
                      <div className="space-y-4">
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-xs text-muted-foreground">
                            🎯 Der Quiz-Editor wird separat in einem erweiterten Modal geöffnet.
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          Quiz bearbeiten
                        </Button>
                      </div>
                    )}

                    {/* Select/Dropdown Editor */}
                    {selectedElement.type === "select" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Label</Label>
                          <Input
                            value={selectedElement.label || ""}
                            onChange={(e) => updateSelectedElement({ label: e.target.value })}
                            placeholder="Dropdown Label"
                            className="text-sm h-8"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Optionen (eine pro Zeile)</Label>
                          <Textarea
                            value={(selectedElement.options || []).join("\n")}
                            onChange={(e) => updateSelectedElement({ options: e.target.value.split("\n").filter(Boolean) })}
                            placeholder="Option 1&#10;Option 2&#10;Option 3"
                            rows={4}
                            className="text-sm"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Pflichtfeld</Label>
                          <Switch
                            checked={selectedElement.required || false}
                            onCheckedChange={(checked) => updateSelectedElement({ required: checked })}
                          />
                        </div>
                      </div>
                    )}

                    {/* Radio Editor */}
                    {selectedElement.type === "radio" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Frage / Label</Label>
                          <Input
                            value={selectedElement.label || ""}
                            onChange={(e) => updateSelectedElement({ label: e.target.value })}
                            placeholder="Wähle eine Option"
                            className="text-sm h-8"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Optionen (eine pro Zeile)</Label>
                          <Textarea
                            value={(selectedElement.options || []).join("\n")}
                            onChange={(e) => updateSelectedElement({ options: e.target.value.split("\n").filter(Boolean) })}
                            placeholder="Option A&#10;Option B&#10;Option C"
                            rows={4}
                            className="text-sm"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Pflichtfeld</Label>
                          <Switch
                            checked={selectedElement.required || false}
                            onCheckedChange={(checked) => updateSelectedElement({ required: checked })}
                          />
                        </div>
                      </div>
                    )}

                    {/* Checkbox Editor */}
                    {selectedElement.type === "checkbox" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Label</Label>
                          <Input
                            value={selectedElement.label || ""}
                            onChange={(e) => updateSelectedElement({ label: e.target.value })}
                            placeholder="Ich akzeptiere die AGB"
                            className="text-sm h-8"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Pflichtfeld</Label>
                          <Switch
                            checked={selectedElement.required || false}
                            onCheckedChange={(checked) => updateSelectedElement({ required: checked })}
                          />
                        </div>
                      </div>
                    )}

                    {/* Divider Editor */}
                    {selectedElement.type === "divider" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Farbe</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={selectedElement.styles?.color || "#e5e7eb"}
                              onChange={(e) => updateSelectedElement({
                                styles: { ...selectedElement.styles, color: e.target.value }
                              })}
                              className="w-12 h-8 p-1 cursor-pointer"
                            />
                            <Input
                              value={selectedElement.styles?.color || "#e5e7eb"}
                              onChange={(e) => updateSelectedElement({
                                styles: { ...selectedElement.styles, color: e.target.value }
                              })}
                              className="flex-1 h-8 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Element palette when no element selected */
                  <div className="p-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Klicke auf ein Element um es hinzuzufügen:
                    </p>
                    {elementCategories.map((category) => (
                      <div key={category.name}>
                        <h5 className="text-xs font-medium text-muted-foreground mb-2">{category.name}</h5>
                        <div className="space-y-1">
                          {category.elements.map((el) => (
                            <DraggableElement
                              key={el.type}
                              type={el.type}
                              label={el.label}
                              icon={el.icon}
                              description={el.description}
                              onClick={() => addElementToPage(el.type as PageElement["type"])}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
        <div
          className="flex-1 bg-muted/30 overflow-y-auto flex items-center justify-center p-8"
          onClick={() => {
            // Deselect element when clicking outside
            if (selectedElementId) {
              setSelectedElementId(null);
            }
          }}
        >
          <div
            style={{
              maxWidth: previewMode === "phone" ? "320px" : previewMode === "tablet" ? "768px" : "1024px",
              width: "100%"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <PhonePreview
              page={selectedPage}
              pageIndex={selectedPageIndex}
              totalPages={localFunnel.pages.length}
              primaryColor={localFunnel.theme.primaryColor}
              onUpdatePage={(updates) => updatePage(selectedPageIndex, updates)}
              selectedElementId={selectedElementId}
              onSelectElement={(elementId) => {
                setSelectedElementId(elementId);
                if (elementId) {
                  setLeftSidebarTab("design");
                }
              }}
              onAddElement={addElementToPage}
              onDeleteElement={deleteSelectedElement}
              onDuplicateElement={duplicateSelectedElement}
              onMoveElementUp={moveElementUp}
              onMoveElementDown={moveElementDown}
              onShowElementPicker={() => {
                setSelectedElementId(null);
                setLeftSidebarTab("design");
              }}
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
                  allPages={localFunnel.pages}
                  primaryColor={localFunnel.theme.primaryColor}
                  onUpdate={(updates) => updatePage(selectedPageIndex, updates)}
                  onUndo={undo}
                  onRedo={redo}
                  canUndo={canUndo}
                  canRedo={canRedo}
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
