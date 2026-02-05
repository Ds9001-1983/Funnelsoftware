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

// Import extracted funnel-editor components
import {
  personalizationVariables,
  sectionTemplates,
  pageTypeLabels,
  pageTypeIcons,
  elementCategories,
  layoutTemplates,
  SortablePageItem,
  SortableElementItem,
  AddPageDialog,
  ElementPalette,
  ConditionalLogicEditor,
  PersonalizationInserter,
  SectionTemplatesPicker,
  LayoutSelector,
  SectionEditor,
  PageEditor,
  DraggableElement,
  FunnelProgress,
  FormFieldWithValidation,
  validateAllFields,
  ABTestEditor,
} from "@/components/funnel-editor";

type PageType = FunnelPage["type"];

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
  // State for form field values (for validation preview)
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocalTitle(page?.title || "");
    setLocalSubtitle(page?.subtitle || "");
  }, [page?.title, page?.subtitle]);

  // Update form value for a specific element
  const updateFormValue = (elementId: string, value: string) => {
    setFormValues(prev => ({ ...prev, [elementId]: value }));
  };

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
  // Verbessertes visuelles Feedback für Hover und Auswahl
  const ElementWrapper = ({ elementId, elementType, children }: { elementId: string; elementType: string; children: React.ReactNode }) => {
    const isSelected = selectedElementId === elementId;
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        className={`element-wrapper relative group cursor-pointer transition-all duration-200 rounded-lg p-1 ${
          isSelected
            ? "ring-2 ring-primary ring-offset-2 bg-primary/5"
            : isHovered
            ? "ring-2 ring-primary/40 ring-offset-1 bg-primary/5"
            : "hover:ring-2 hover:ring-primary/30 hover:ring-offset-1"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onSelectElement?.(elementId);
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {children}

        {/* Element type label at top-left - shown on hover or when selected */}
        {(isSelected || isHovered) && (
          <div className="absolute -top-3 left-2 z-10 transition-opacity duration-200">
            <span className={`px-2 py-0.5 text-xs font-medium rounded shadow-sm transition-all ${
              isSelected
                ? "bg-primary text-primary-foreground"
                : "bg-white text-gray-700 border border-gray-200"
            }`}>
              {elementTypeLabels[elementType] || elementType}
            </span>
          </div>
        )}

        {/* Quick action buttons on hover (right side) */}
        {isHovered && !isSelected && (
          <div className="absolute -right-2 top-0 flex flex-col gap-0.5 opacity-80 hover:opacity-100 transition-opacity">
            <button
              className="w-6 h-6 flex items-center justify-center rounded bg-white shadow border border-gray-200 hover:bg-primary/10 transition-colors"
              title="Auswählen"
              onClick={(e) => {
                e.stopPropagation();
                onSelectElement?.(elementId);
              }}
            >
              <MousePointer2 className="h-3 w-3 text-gray-500" />
            </button>
          </div>
        )}

        {/* Floating action menu on the right when selected */}
        {isSelected && (
          <div className="floating-action-menu">
            <button
              title="Element hinzufügen"
              onClick={(e) => {
                e.stopPropagation();
                onShowElementPicker?.();
              }}
            >
              <Plus className="h-4 w-4 text-gray-600" />
            </button>
            <button
              title="Nach oben"
              onClick={(e) => {
                e.stopPropagation();
                onMoveElementUp?.();
              }}
            >
              <ChevronUp className="h-4 w-4 text-gray-600" />
            </button>
            <button
              title="Nach unten"
              onClick={(e) => {
                e.stopPropagation();
                onMoveElementDown?.();
              }}
            >
              <ChevronDown className="h-4 w-4 text-gray-600" />
            </button>
            <button
              title="Duplizieren"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateElement?.();
              }}
            >
              <Copy className="h-4 w-4 text-gray-600" />
            </button>
            <button
              className="danger"
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

        {/* Resize handles when selected (visual only for now) */}
        {isSelected && (
          <>
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-primary rounded-full cursor-nw-resize" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full cursor-ne-resize" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary rounded-full cursor-sw-resize" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary rounded-full cursor-se-resize" />
          </>
        )}
      </div>
    );
  };

  if (!page) {
    return (
      <div className="preview-container w-full min-h-[400px] flex items-center justify-center bg-muted/30">
        <div className="text-center text-muted-foreground p-6">
          <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Wähle eine Seite aus</p>
          <p className="text-sm mt-1">Klicke links auf eine Seite zum Bearbeiten</p>
        </div>
      </div>
    );
  }

  const isWelcome = page.type === "welcome";
  const isThankyou = page.type === "thankyou";
  const bgColor = page.backgroundColor || (isWelcome || isThankyou ? primaryColor : "#ffffff");
  const textColor = isWelcome || isThankyou ? "#ffffff" : "#1a1a1a";

  return (
    <div className="preview-container w-full rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <div
        className="min-h-[500px] flex flex-col overflow-hidden"
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
                    <FormFieldWithValidation
                      element={el}
                      value={formValues[el.id] || ""}
                      onChange={(value) => updateFormValue(el.id, value)}
                      className="shadow-sm"
                    />
                  )}
                  {el.type === "textarea" && (
                    <FormFieldWithValidation
                      element={el}
                      value={formValues[el.id] || ""}
                      onChange={(value) => updateFormValue(el.id, value)}
                      className="shadow-sm"
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


export default function FunnelEditor() {
  const [, params] = useRoute("/funnels/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [showAddPage, setShowAddPage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [previewMode, setPreviewMode] = useState<"phone" | "tablet" | "desktop">("phone");
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  // Mobile detection and responsive sidebar states
  const [isMobile, setIsMobile] = useState(false);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-hide sidebars on mobile
      if (mobile) {
        setShowLeftSidebar(false);
        setShowRightSidebar(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Perspective-style editor states
  const [leftSidebarTab, setLeftSidebarTab] = useState<"pages" | "design">("pages");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Global clipboard for copy/paste functionality
  const [clipboard, setClipboard] = useState<{
    type: "element" | "section" | "page";
    data: PageElement | Section | FunnelPage;
  } | null>(null);

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
        abTests: localFunnel.abTests,
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

  // A/B Test handlers
  const createABTest = useCallback((test: import("@shared/schema").ABTest) => {
    if (!localFunnel) return;
    const currentTests = localFunnel.abTests || [];
    updateLocalFunnel({ abTests: [...currentTests, test] });
    toast({
      title: "A/B Test erstellt",
      description: `Der Test "${test.name}" wurde erstellt.`,
    });
  }, [localFunnel, updateLocalFunnel, toast]);

  const updateABTest = useCallback((testId: string, updates: Partial<import("@shared/schema").ABTest>) => {
    if (!localFunnel) return;
    const currentTests = localFunnel.abTests || [];
    const updatedTests = currentTests.map(t =>
      t.id === testId ? { ...t, ...updates } : t
    );
    updateLocalFunnel({ abTests: updatedTests });
  }, [localFunnel, updateLocalFunnel]);

  const deleteABTest = useCallback((testId: string) => {
    if (!localFunnel) return;
    const currentTests = localFunnel.abTests || [];
    updateLocalFunnel({ abTests: currentTests.filter(t => t.id !== testId) });
    toast({
      title: "A/B Test gelöscht",
      description: "Der Test wurde entfernt.",
    });
  }, [localFunnel, updateLocalFunnel, toast]);

  const startABTest = useCallback((testId: string) => {
    updateABTest(testId, {
      status: "running",
      startedAt: new Date().toISOString(),
    });
    toast({
      title: "A/B Test gestartet",
      description: "Der Test läuft jetzt und sammelt Daten.",
    });
  }, [updateABTest, toast]);

  const pauseABTest = useCallback((testId: string) => {
    updateABTest(testId, { status: "paused" });
    toast({
      title: "A/B Test pausiert",
      description: "Der Test wurde pausiert.",
    });
  }, [updateABTest, toast]);

  const completeABTest = useCallback((testId: string, winnerId: string) => {
    updateABTest(testId, {
      status: "completed",
      winnerId,
      completedAt: new Date().toISOString(),
    });
    toast({
      title: "A/B Test abgeschlossen",
      description: "Der Gewinner wurde festgelegt.",
    });
  }, [updateABTest, toast]);

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

  // Copy/Paste functions for elements, sections, and pages
  const copySelectedElement = useCallback(() => {
    if (!localFunnel || !selectedElementId) return;
    const page = localFunnel.pages[selectedPageIndex];
    const element = page.elements.find(el => el.id === selectedElementId);
    if (element) {
      setClipboard({ type: "element", data: element });
      toast({
        title: "Element kopiert",
        description: "Das Element wurde in die Zwischenablage kopiert.",
      });
    }
  }, [localFunnel, selectedPageIndex, selectedElementId, toast]);

  const copyCurrentPage = useCallback(() => {
    if (!localFunnel) return;
    const page = localFunnel.pages[selectedPageIndex];
    setClipboard({ type: "page", data: page });
    toast({
      title: "Seite kopiert",
      description: `"${page.title}" wurde in die Zwischenablage kopiert.`,
    });
  }, [localFunnel, selectedPageIndex, toast]);

  const pasteFromClipboard = useCallback(() => {
    if (!localFunnel || !clipboard) return;

    if (clipboard.type === "element") {
      const element = clipboard.data as PageElement;
      const newElement = { ...element, id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
      const page = localFunnel.pages[selectedPageIndex];
      updatePage(selectedPageIndex, { elements: [...page.elements, newElement] });
      setSelectedElementId(newElement.id);
      toast({
        title: "Element eingefügt",
        description: "Das Element wurde eingefügt.",
      });
    } else if (clipboard.type === "page") {
      const pageToCopy = clipboard.data as FunnelPage;
      const newPage: FunnelPage = {
        ...pageToCopy,
        id: `page-${Date.now()}`,
        title: `${pageToCopy.title} (Kopie)`,
        elements: pageToCopy.elements.map(el => ({
          ...el,
          id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        })),
      };
      const newPages = [...localFunnel.pages];
      newPages.splice(selectedPageIndex + 1, 0, newPage);
      setLocalFunnel({ ...localFunnel, pages: newPages });
      setHasChanges(true);
      setSelectedPageIndex(selectedPageIndex + 1);
      toast({
        title: "Seite eingefügt",
        description: `"${newPage.title}" wurde eingefügt.`,
      });
    }
  }, [localFunnel, clipboard, selectedPageIndex, updatePage, setLocalFunnel, toast]);

  // Keyboard shortcuts for copy/paste and undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (modKey && e.key === "c") {
        e.preventDefault();
        if (selectedElementId) {
          copySelectedElement();
        } else {
          copyCurrentPage();
        }
      } else if (modKey && e.key === "v") {
        e.preventDefault();
        pasteFromClipboard();
      } else if (modKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (modKey && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedElementId) {
          e.preventDefault();
          deleteSelectedElement();
        }
      } else if (modKey && e.key === "d") {
        e.preventDefault();
        if (selectedElementId) {
          duplicateSelectedElement();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElementId, copySelectedElement, copyCurrentPage, pasteFromClipboard, undo, redo, deleteSelectedElement, duplicateSelectedElement]);

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
        abTests: localFunnel.abTests,
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
    <div className={`h-screen flex flex-col bg-background ${isMobile ? "pb-16" : ""}`}>
      {/* Header */}
      <div className="h-14 border-b border-border bg-card flex items-center justify-between px-2 md:px-4 shrink-0">
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
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile sidebar backdrop */}
        {isMobile && (showLeftSidebar || showRightSidebar) && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => {
              setShowLeftSidebar(false);
              setShowRightSidebar(false);
            }}
          />
        )}

        {/* Left sidebar - Seiten/Design tabs */}
        <div className={`
          ${isMobile ? "fixed left-0 top-14 bottom-0 z-50" : "relative"}
          ${showLeftSidebar ? "w-72" : "w-0"}
          border-r border-border bg-card overflow-hidden transition-all duration-300
        `}>
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
          className={`absolute top-1/2 -translate-y-1/2 z-[60] rounded-r-md rounded-l-none bg-card border border-l-0 shadow-md
            ${isMobile ? "h-10 w-8" : "h-6 w-6"}
          `}
          onClick={() => setShowLeftSidebar(!showLeftSidebar)}
          style={{ left: showLeftSidebar && !isMobile ? "286px" : showLeftSidebar && isMobile ? "288px" : "0" }}
        >
          {showLeftSidebar ? <ChevronLeft className={isMobile ? "h-5 w-5" : "h-3 w-3"} /> : <ChevronRight className={isMobile ? "h-5 w-5" : "h-3 w-3"} />}
        </Button>

        {/* Center - Preview */}
        <div
          className="flex-1 bg-muted/30 overflow-y-auto flex items-center justify-center p-2 md:p-8"
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
          className={`absolute top-1/2 -translate-y-1/2 z-[60] rounded-l-md rounded-r-none bg-card border border-r-0 shadow-md
            ${isMobile ? "h-10 w-8" : "h-6 w-6"}
          `}
          onClick={() => setShowRightSidebar(!showRightSidebar)}
          style={{ right: showRightSidebar && !isMobile ? "318px" : showRightSidebar && isMobile ? "320px" : "0" }}
        >
          {showRightSidebar ? <ChevronRight className={isMobile ? "h-5 w-5" : "h-3 w-3"} /> : <ChevronLeft className={isMobile ? "h-5 w-5" : "h-3 w-3"} />}
        </Button>

        {/* Right sidebar - Page editor */}
        <div className={`
          ${isMobile ? "fixed right-0 top-14 bottom-0 z-50" : "relative"}
          ${showRightSidebar ? "w-80" : "w-0"}
          border-l border-border bg-card overflow-hidden transition-all duration-300
        `}>
          <div className="w-80 h-full flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Seite bearbeiten</h3>
              <p className="text-sm text-muted-foreground">
                {pageTypeLabels[selectedPage?.type || "welcome"]}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto funnel-scrollbar p-4">
              {selectedPage && (
                <>
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

                  {/* A/B Testing Section */}
                  <div className="mt-6 pt-6 border-t">
                    <ABTestEditor
                      page={selectedPage}
                      abTests={localFunnel.abTests || []}
                      onCreateTest={createABTest}
                      onUpdateTest={updateABTest}
                      onDeleteTest={deleteABTest}
                      onStartTest={startABTest}
                      onPauseTest={pauseABTest}
                      onCompleteTest={completeABTest}
                    />
                  </div>
                </>
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

      {/* Mobile Bottom Navigation Bar */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden safe-area-inset-bottom">
          <div className="flex items-center justify-around py-2 px-4">
            <button
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                showLeftSidebar && leftSidebarTab === "pages" ? "text-primary bg-primary/10" : "text-muted-foreground"
              }`}
              onClick={() => {
                setLeftSidebarTab("pages");
                setShowLeftSidebar(!showLeftSidebar || leftSidebarTab !== "pages");
                setShowRightSidebar(false);
              }}
            >
              <Layers className="h-5 w-5" />
              <span className="text-xs">Seiten</span>
            </button>
            <button
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                showLeftSidebar && leftSidebarTab === "design" ? "text-primary bg-primary/10" : "text-muted-foreground"
              }`}
              onClick={() => {
                setLeftSidebarTab("design");
                setShowLeftSidebar(!showLeftSidebar || leftSidebarTab !== "design");
                setShowRightSidebar(false);
              }}
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs">Elemente</span>
            </button>
            <button
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                showRightSidebar ? "text-primary bg-primary/10" : "text-muted-foreground"
              }`}
              onClick={() => {
                setShowRightSidebar(!showRightSidebar);
                setShowLeftSidebar(false);
              }}
            >
              <Settings className="h-5 w-5" />
              <span className="text-xs">Bearbeiten</span>
            </button>
            <button
              className="flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground"
              onClick={() => window.open(`/preview/${params?.id}`, '_blank')}
            >
              <Eye className="h-5 w-5" />
              <span className="text-xs">Vorschau</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
