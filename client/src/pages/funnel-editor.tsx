import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { loadFont, getFontFamilies } from "@/lib/font-loader";
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
  FlaskConical,
  Scissors,
  Maximize2,
  Search,
  // New icons for OpenFunnels-style elements
  Music,
  Code,
  BarChart2,
  ShoppingBag,
  Timer,
  Link,
  Columns,
  LayoutGrid,
  PanelLeft,
  PanelRight,

  Pencil,
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
import { useBeforeUnload } from "@/hooks/use-before-unload";
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
  DraggableElement,
  FunnelProgress,
  FormFieldWithValidation,
  validateAllFields,
  ABTestEditor,
  FloatingToolbar,
  PhonePreview,
  ElementPropertiesPanel,
} from "@/components/funnel-editor";
import { ErrorBoundary } from "@/components/funnel-editor/ErrorBoundary";

import { HistoryIndicator } from "@/components/funnel-editor/HistoryIndicator";
import { SaveStatusIndicator } from "@/components/funnel-editor/SaveStatusIndicator";
import { CommandPalette } from "@/components/funnel-editor/CommandPalette";
import { ShortcutOverlay } from "@/components/funnel-editor/ShortcutOverlay";
import { ThemePresetPicker } from "@/components/funnel-editor/ThemePresetPicker";
import { PublishDialog } from "@/components/funnel-editor/PublishDialog";

const PageEditor = lazy(() => import("@/components/funnel-editor/PageEditor").then(m => ({ default: m.PageEditor })));
const LogicFlowView = lazy(() =>
  import("@/components/funnel-editor/LogicFlowView").then((m) => ({ default: m.LogicFlowView })),
);

type PageType = FunnelPage["type"];

export default function FunnelEditor() {
  const [, params] = useRoute("/funnels/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [showAddPage, setShowAddPage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editorTab, setEditorTab] = useState<"overview" | "design">("overview");
  const [previewMode, setPreviewMode] = useState<"phone" | "tablet" | "desktop">("phone");
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  // Mobile detection and responsive sidebar states
  const [isMobile, setIsMobile] = useState(false);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-hide sidebars on mobile
      if (mobile) {
        setShowLeftSidebar(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Publish dialog
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showABTests, setShowABTests] = useState(false);
  const [showLogicFlow, setShowLogicFlow] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);

  // Perspective-style editor states
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    const saved = localStorage.getItem("editor-left-panel-width");
    return saved ? parseInt(saved) : 256;
  });
  const isResizingRef = useRef(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState("default");

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
    historyLength,
  } = useHistory<Funnel | null>(null);

  const [hasChanges, setHasChanges] = useState(false);

  useBeforeUnload(hasChanges, "Es gibt ungespeicherte Änderungen. Trotzdem schließen?");

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

  // Load selected font on funnel load
  useEffect(() => {
    if (localFunnel?.theme?.fontFamily) {
      loadFont(localFunnel.theme.fontFamily);
    }
  }, [localFunnel?.theme?.fontFamily]);

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
    5000, // 5 Sekunden nach letzter Änderung
    autoSaveEnabled && hasChanges
  );

  // Schedule auto-save when changes occur
  useEffect(() => {
    if (hasChanges && autoSaveEnabled) {
      scheduleAutoSave();
    }
  }, [hasChanges, autoSaveEnabled, scheduleAutoSave]);

  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Funnel>) => {
      const response = await apiRequest("PATCH", `/api/funnels/${params?.id}`, data);
      return response.json();
    },
    // Exponential backoff: 1s → 2s → 4s, max 3 Versuche.
    // CSRF-/Auth-Fehler werden nicht retried (bringt nichts, gleiche Antwort).
    retry: (failureCount, error) => {
      if (failureCount >= 3) return false;
      const status = (error as { status?: number } | null)?.status;
      if (status === 401 || status === 403 || status === 404) return false;
      return true;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/funnels", params?.id] });
      setHasChanges(false);
      setLastSavedAt(new Date());
    },
    onError: () => {
      toast({
        title: "Speichern fehlgeschlagen",
        description: "Nach mehreren Versuchen nicht gespeichert. Bitte Speichern-Button erneut drücken.",
        variant: "destructive",
      });
    },
  });

  const saveStatus: "saved" | "dirty" | "saving" | "error" = saveMutation.isPending
    ? "saving"
    : saveMutation.isError
      ? "error"
      : hasChanges
        ? "dirty"
        : "saved";

  const publishMutation = useMutation({
    mutationFn: async (slug: string) => {
      const response = await apiRequest("PATCH", `/api/funnels/${params?.id}`, {
        status: "published",
        slug,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/funnels"] });
      if (localFunnel) {
        setLocalFunnel({ ...localFunnel, status: "published", slug: data.slug });
      }
      setShowPublishDialog(false);
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

  const updateSlugMutation = useMutation({
    mutationFn: async (slug: string) => {
      const response = await apiRequest("PATCH", `/api/funnels/${params?.id}`, { slug });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/funnels"] });
      if (localFunnel) {
        setLocalFunnel({ ...localFunnel, slug: data.slug });
      }
      setShowPublishDialog(false);
      toast({ title: "Slug aktualisiert", description: "Die URL wurde geändert." });
    },
  });

  const updateLocalFunnel = useCallback((updates: Partial<Funnel>) => {
    setLocalFunnel((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
    setHasChanges(true);
  }, [setLocalFunnel]);

  const updatePage = useCallback((index: number, updates: Partial<FunnelPage>) => {
    setLocalFunnel((prev) => {
      if (!prev) return prev;
      const newPages = [...prev.pages];
      newPages[index] = { ...newPages[index], ...updates };
      return { ...prev, pages: newPages };
    });
    setHasChanges(true);
  }, [setLocalFunnel]);

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
    setSelectedElementId(null);
    updatePage(selectedPageIndex, { elements: newElements });
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

  const cutSelectedElement = useCallback(() => {
    if (!localFunnel || !selectedElementId) return;
    const page = localFunnel.pages[selectedPageIndex];
    const element = page.elements.find((el) => el.id === selectedElementId);
    if (!element) return;
    setClipboard({ type: "element", data: element });
    const newElements = page.elements.filter((el) => el.id !== selectedElementId);
    updatePage(selectedPageIndex, { elements: newElements });
    setSelectedElementId(null);
    toast({
      title: "Element ausgeschnitten",
      description: "Das Element wurde ausgeschnitten.",
    });
  }, [localFunnel, selectedPageIndex, selectedElementId, updatePage, toast]);

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
        type === "select" ? ["Option 1", "Option 2", "Option 3"] :
        type === "checkbox" ? ["Option 1", "Option 2"] : undefined,
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
      buttonAction: type === "button" ? "next" : undefined,
    };
    const newElements = [...page.elements, newElement];
    updatePage(selectedPageIndex, { elements: newElements });
    setSelectedElementId(newElement.id);
  }, [localFunnel, selectedPageIndex, updatePage]);

  // Clear element selection when page changes
  useEffect(() => {
    setSelectedElementId(null);
  }, [selectedPageIndex]);

  const addPage = useCallback((type: PageType) => {
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
  }, [localFunnel, updateLocalFunnel]);

  const duplicatePage = useCallback((index: number) => {
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
  }, [localFunnel, updateLocalFunnel]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
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
  }, [localFunnel, selectedPageIndex, updateLocalFunnel]);

  const deletePage = useCallback((index: number) => {
    setLocalFunnel((prev) => {
      if (!prev || prev.pages.length <= 1) return prev;
      const newPages = prev.pages.filter((_, i) => i !== index);
      return { ...prev, pages: newPages };
    });
    setSelectedElementId(null);
    setSelectedPageIndex((prevIdx) => {
      if (localFunnel && localFunnel.pages.length > 1) {
        const newLength = localFunnel.pages.length - 1;
        return prevIdx >= newLength ? newLength - 1 : prevIdx;
      }
      return prevIdx;
    });
    setHasChanges(true);
  }, [localFunnel, setLocalFunnel]);

  const renamePage = useCallback((index: number, newTitle: string) => {
    setLocalFunnel((prev) => {
      if (!prev) return prev;
      const pages = [...prev.pages];
      pages[index] = { ...pages[index], title: newTitle };
      return { ...prev, pages };
    });
    setHasChanges(true);
  }, []);

  const handleRenamePrompt = useCallback((index: number, currentTitle: string) => {
    const newTitle = prompt("Neuer Seitenname:", currentTitle);
    if (newTitle && newTitle.trim()) renamePage(index, newTitle.trim());
  }, [renamePage]);

  const togglePageVisibility = useCallback((index: number) => {
    setLocalFunnel((prev) => {
      if (!prev) return prev;
      const pages = [...prev.pages];
      pages[index] = { ...pages[index], hidden: !pages[index].hidden };
      return { ...prev, pages };
    });
    setHasChanges(true);
  }, []);

  // Defensive Bremse: Falls der Editor unmountet, während der User gerade
  // am linken Panel zieht (mouse down), bleiben sonst cursor/userSelect am
  // <body> gesetzt und blockieren den Rest der App.
  useEffect(() => {
    return () => {
      if (isResizingRef.current) {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        isResizingRef.current = false;
      }
    };
  }, []);

  // Resize-Handler für linke Sidebar
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    const startX = e.clientX;
    const startWidth = leftPanelWidth;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = Math.min(Math.max(startWidth + (e.clientX - startX), 180), 400);
      setLeftPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      localStorage.setItem("editor-left-panel-width", String(leftPanelWidth));
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [leftPanelWidth]);

  const handleSave = useCallback(() => {
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
  }, [localFunnel, saveMutation]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      const modKey = e.metaKey || e.ctrlKey;

      // Save: Ctrl+S (auch während Edit — Content soll nicht verloren gehen)
      if (modKey && e.key === "s") {
        e.preventDefault();
        if (hasChanges) handleSave();
        return;
      }

      // Die folgenden Shortcuts nur, wenn NICHT gerade in einem Input-Feld getippt wird.
      if (isEditing) return;

      // Undo: Ctrl+Z
      if (modKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undo();
          setHasChanges(true);
        }
        return;
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (modKey && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) {
          redo();
          setHasChanges(true);
        }
        return;
      }
      // Move selected element up/down: Ctrl+ArrowUp / ArrowDown
      if (modKey && e.key === "ArrowUp" && selectedElementId) {
        e.preventDefault();
        moveElementUp();
        return;
      }
      if (modKey && e.key === "ArrowDown" && selectedElementId) {
        e.preventDefault();
        moveElementDown();
        return;
      }
      // Shortcut-Hilfe: Shift+? (ohne Modifier)
      if (!modKey && e.shiftKey && e.key === "?") {
        e.preventDefault();
        setShowShortcutHelp(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasChanges, canUndo, canRedo, undo, redo, handleSave, moveElementUp, moveElementDown, selectedElementId]);

  if (isLoading) {
    return (
      <div className="h-screen flex">
        <div className="w-80 border-r border-border p-4 space-y-4">
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
    <ErrorBoundary>
    <div className={`h-screen flex flex-col bg-background ${isMobile ? "pb-16" : ""}`}>
      {/* Header - Clean & Minimal */}
      <div className="h-12 border-b border-border bg-card flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => navigate("/funnels")} data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {isMobile && (
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 md:hidden" onClick={() => setShowLeftSidebar(!showLeftSidebar)}>
              <Layers className="h-4 w-4" />
            </Button>
          )}
          <span className="font-medium text-sm truncate">{localFunnel.name}</span>
          <Badge variant={localFunnel.status === "published" ? "default" : "secondary"} className="shrink-0 text-[10px]">
            {localFunnel.status === "published" ? "Live" : "Entwurf"}
          </Badge>
          <SaveStatusIndicator status={saveStatus} lastSavedAt={lastSavedAt} onRetry={handleSave} />
        </div>

        {/* Center - Device Toggle */}
        <div className="flex items-center bg-muted rounded-lg p-0.5">
          <Button size="icon" variant={previewMode === "phone" ? "secondary" : "ghost"} className="h-7 w-7" onClick={() => setPreviewMode("phone")}>
            <Smartphone className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant={previewMode === "tablet" ? "secondary" : "ghost"} className="h-7 w-7" onClick={() => setPreviewMode("tablet")}>
            <Tablet className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant={previewMode === "desktop" ? "secondary" : "ghost"} className="h-7 w-7" onClick={() => setPreviewMode("desktop")}>
            <Monitor className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-1">
          <HistoryIndicator canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} historyLength={historyLength} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={autoSaveEnabled ? "Auto-Save deaktivieren" : "Auto-Save aktivieren"} onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}>
                {autoSaveEnabled ? <Cloud className="h-4 w-4 text-green-500" /> : <CloudOff className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{autoSaveEnabled ? `Auto-Save aktiv${lastAutoSave ? ` (${lastAutoSave.toLocaleTimeString()})` : ""}` : "Auto-Save deaktiviert"}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Flow-Ansicht öffnen"
                onClick={() => setShowLogicFlow(true)}
                data-testid="button-logic-flow"
              >
                <GitBranch className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Flow-Ansicht</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 relative"
                aria-label="A/B-Tests öffnen"
                onClick={() => setShowABTests(true)}
                data-testid="button-abtests"
              >
                <FlaskConical className="h-4 w-4" />
                {(localFunnel.abTests || []).some(
                  (t) => t.pageId === selectedPage?.id && t.status === "running",
                ) && (
                  <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-green-500" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>A/B-Tests</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Einstellungen" onClick={() => setShowSettings(true)} data-testid="button-settings">
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
                className="h-8 w-8"
                aria-label="Vorschau in neuem Tab öffnen"
                onClick={() => {
                  if (!localFunnel) return;
                  // Draft → auth-Preview-Route; Published → öffentliche Route
                  const url =
                    localFunnel.status === "published"
                      ? `/f/${localFunnel.slug || localFunnel.uuid}`
                      : `/preview/${localFunnel.id}`;
                  window.open(url, "_blank");
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {localFunnel?.status === "published" ? "Vorschau" : "Vorschau (Entwurf)"}
            </TooltipContent>
          </Tooltip>
          <div className="h-5 w-px bg-border mx-1 hidden sm:block" />
          <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={handleSave} disabled={!hasChanges || saveMutation.isPending} data-testid="button-save">
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Speichern</span>
          </Button>
          <Button size="sm" className="gap-1.5 h-8" onClick={() => setShowPublishDialog(true)} disabled={publishMutation.isPending} data-testid="button-publish">
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{localFunnel.status === "published" ? "URL verwalten" : "Veröffentlichen"}</span>
          </Button>
        </div>
      </div>

      {/* Main content - 3-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile sidebar backdrop */}
        {isMobile && showLeftSidebar && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setShowLeftSidebar(false)}
          />
        )}

        {/* LEFT PANEL - Seiten + Element-Palette (Resizable) */}
        <div
          className={`
            ${isMobile ? "fixed left-0 top-12 bottom-0 z-50" : "relative"}
            ${showLeftSidebar ? "" : "!w-0"}
            border-r border-border bg-card overflow-hidden shrink-0
          `}
          style={{ width: showLeftSidebar ? `${leftPanelWidth}px` : 0, transition: isResizingRef.current ? "none" : "width 200ms" }}
        >
          <div className="h-full flex flex-col" style={{ width: `${leftPanelWidth}px` }}>
            {/* Tab Switcher: Übersicht / Design */}
            <div className="flex border-b border-border shrink-0">
              <button
                className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${
                  editorTab === "overview"
                    ? "text-foreground border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setEditorTab("overview")}
              >
                Übersicht
              </button>
              <button
                className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${
                  editorTab === "design"
                    ? "text-foreground border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setEditorTab("design")}
              >
                Design
              </button>
            </div>

            {editorTab === "overview" ? (
            <>
            {/* Pages */}
            <div className="border-b border-border">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Seiten</span>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowAddPage(true)} data-testid="button-add-page">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="overflow-y-auto funnel-scrollbar p-1.5" style={{ maxHeight: "40%" }}>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={localFunnel.pages.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-0.5">
                    {localFunnel.pages.map((page, index) => (
                      <SortablePageItem
                        key={page.id}
                        page={page}
                        index={index}
                        selected={index === selectedPageIndex}
                        totalPages={localFunnel.pages.length}
                        isHidden={page.hidden}
                        onSelect={setSelectedPageIndex}
                        onDelete={deletePage}
                        onDuplicate={duplicatePage}
                        onRename={handleRenamePrompt}
                        onToggleVisibility={togglePageVisibility}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            {/* Element Palette with Sections */}
            <div className="border-t border-border flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto funnel-scrollbar px-2 pb-2 pt-2">
                <ElementPalette
                  onAddElement={(type) => addElementToPage(type)}
                  onAddSection={(elements) => {
                    if (!localFunnel) return;
                    const page = localFunnel.pages[selectedPageIndex];
                    if (!page) return;
                    const newElements = elements.map((el) => ({
                      ...el,
                      id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    })) as PageElement[];
                    updatePage(selectedPageIndex, {
                      elements: [...page.elements, ...newElements],
                    });
                  }}
                />
              </div>
            </div>
            </>
            ) : (
            /* Design Tab - Theme Picker + Styling */
            <div className="flex-1 overflow-y-auto funnel-scrollbar p-3 space-y-4">
              <ThemePresetPicker
                selectedThemeId={selectedThemeId}
                onSelectTheme={(themeId) => {
                  setSelectedThemeId(themeId);
                }}
              />

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Eigene Farben</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={localFunnel.theme.primaryColor}
                      onChange={(e) => updateLocalFunnel({ theme: { ...localFunnel.theme, primaryColor: e.target.value } })}
                      className="w-10 h-8 p-0.5 cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground flex-1">Primärfarbe</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={localFunnel.theme.backgroundColor}
                      onChange={(e) => updateLocalFunnel({ theme: { ...localFunnel.theme, backgroundColor: e.target.value } })}
                      className="w-10 h-8 p-0.5 cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground flex-1">Hintergrund</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={localFunnel.theme.textColor}
                      onChange={(e) => updateLocalFunnel({ theme: { ...localFunnel.theme, textColor: e.target.value } })}
                      className="w-10 h-8 p-0.5 cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground flex-1">Textfarbe</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Schriftart</h4>
                <Select
                  value={localFunnel.theme.fontFamily}
                  onValueChange={(v) => { loadFont(v); updateLocalFunnel({ theme: { ...localFunnel.theme, fontFamily: v } }); }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getFontFamilies().map((font) => (
                      <SelectItem key={font} value={font} style={{ fontFamily: font }}>{font}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            )}
          </div>
        </div>

        {/* Resize Handle + Toggle */}
        {!isMobile && showLeftSidebar && (
          <div
            className="w-1 hover:w-1.5 bg-transparent hover:bg-primary/20 cursor-col-resize transition-all shrink-0 relative group"
            onMouseDown={handleResizeStart}
            onDoubleClick={() => setShowLeftSidebar(false)}
            title="Ziehen zum Ändern der Breite, Doppelklick zum Schließen"
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
          </div>
        )}
        {!isMobile && !showLeftSidebar && (
          <button
            className="relative z-10 mt-4 ml-1 h-6 w-6 flex items-center justify-center rounded-full bg-card border shadow-sm hover:bg-muted transition-colors shrink-0"
            onClick={() => setShowLeftSidebar(true)}
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        )}

        {/* CENTER - Preview */}
        <div
          className="flex-1 bg-muted/30 overflow-y-auto flex items-start justify-center p-4 md:p-8"
          onClick={() => {
            if (selectedElementId) {
              setSelectedElementId(null);
              setShowRightPanel(false);
            }
          }}
        >
          <div
            style={{
              maxWidth: previewMode === "phone" ? "375px" : previewMode === "tablet" ? "768px" : "1024px",
              width: "100%"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {(localFunnel.abTests || []).some(
              (t) => t.pageId === selectedPage?.id && t.status === "running",
            ) && (
              <button
                onClick={() => setShowABTests(true)}
                className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/30 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-400 hover:bg-green-500/20 transition-colors"
              >
                <FlaskConical className="h-3 w-3" />
                A/B-Test läuft
              </button>
            )}
            <PhonePreview
              page={selectedPage}
              pageIndex={selectedPageIndex}
              totalPages={localFunnel.pages.length}
              primaryColor={localFunnel.theme.primaryColor}
              onUpdatePage={(updates) => updatePage(selectedPageIndex, updates)}
              selectedElementId={selectedElementId}
              onSelectElement={(elementId) => {
                setSelectedElementId(elementId);
                setShowRightPanel(!!elementId);
              }}
              onAddElement={addElementToPage}
              onDeleteElement={deleteSelectedElement}
              onDuplicateElement={duplicateSelectedElement}
              onCopyElement={copySelectedElement}
              onCutElement={cutSelectedElement}
              onPasteElement={pasteFromClipboard}
              canPasteElement={clipboard?.type === "element"}
              onMoveElementUp={moveElementUp}
              onMoveElementDown={moveElementDown}
              onUpdateElementContent={(elementId, content) => {
                if (!localFunnel) return;
                const page = localFunnel.pages[selectedPageIndex];
                const newElements = page.elements.map((el) =>
                  el.id === elementId ? { ...el, content } : el,
                );
                updatePage(selectedPageIndex, { elements: newElements });
              }}
              onShowElementPicker={() => setSelectedElementId(null)}
              onReorderElements={(oldIndex, newIndex) => {
                if (!localFunnel) return;
                const page = localFunnel.pages[selectedPageIndex];
                const newElements = [...page.elements];
                const [moved] = newElements.splice(oldIndex, 1);
                newElements.splice(newIndex, 0, moved);
                updatePage(selectedPageIndex, { elements: newElements });
              }}
            />
          </div>
        </div>

        {/* RIGHT PANEL - Element Properties */}
        <div className={`
          ${showRightPanel && selectedElement ? "w-80" : "w-0"}
          border-l border-border bg-card overflow-hidden transition-all duration-200 shrink-0
        `}>
          <div className="w-80 h-full overflow-y-auto funnel-scrollbar">
            {selectedElement && (
              <ElementPropertiesPanel
                element={selectedElement}
                onUpdate={updateSelectedElement}
                onClose={() => { setSelectedElementId(null); setShowRightPanel(false); }}
                pages={localFunnel?.pages?.map(p => ({ id: p.id, title: p.title })) || []}
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

      {/* Shortcut-Hilfe (?) */}
      <ShortcutOverlay open={showShortcutHelp} onOpenChange={setShowShortcutHelp} />

      {/* Command Palette (⌘K) */}
      <CommandPalette
        open={showCommandPalette}
        onOpenChange={setShowCommandPalette}
        pages={localFunnel.pages}
        onSave={handleSave}
        canSave={hasChanges && !saveMutation.isPending}
        onPublish={() => setShowPublishDialog(true)}
        onPreview={() =>
          window.open(
            localFunnel.status === "published"
              ? `/f/${localFunnel.slug || localFunnel.uuid}`
              : `/preview/${localFunnel.id}`,
            "_blank",
          )
        }
        onUndo={undo}
        canUndo={canUndo}
        onRedo={redo}
        canRedo={canRedo}
        onOpenSettings={() => setShowSettings(true)}
        onOpenABTests={() => setShowABTests(true)}
        onOpenLogicFlow={() => setShowLogicFlow(true)}
        onJumpToPage={(idx) => setSelectedPageIndex(idx)}
        onAddPage={addPage}
        onAddElement={addElementToPage}
      />

      {/* Logic Flow Dialog */}
      <Dialog open={showLogicFlow} onOpenChange={setShowLogicFlow}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[85vh] p-0 gap-0 flex flex-col">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Funnel-Flow
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  Lade Flow-Ansicht…
                </div>
              }
            >
              <LogicFlowView
                pages={localFunnel.pages}
                selectedPageId={selectedPage?.id}
                onSelectPage={(pageId) => {
                  const idx = localFunnel.pages.findIndex((p) => p.id === pageId);
                  if (idx >= 0) {
                    setSelectedPageIndex(idx);
                    setShowLogicFlow(false);
                  }
                }}
              />
            </Suspense>
          </div>
        </DialogContent>
      </Dialog>

      {/* A/B Tests Sheet */}
      <Sheet open={showABTests} onOpenChange={setShowABTests}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              A/B-Tests: {selectedPage?.title || "—"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {selectedPage ? (
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
            ) : (
              <p className="text-sm text-muted-foreground">Keine Seite ausgewählt.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

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

              <ThemePresetPicker
                selectedThemeId={selectedThemeId}
                onSelectTheme={setSelectedThemeId}
              />
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
                  onValueChange={(v) => {
                    loadFont(v);
                    updateLocalFunnel({
                      theme: { ...localFunnel.theme, fontFamily: v },
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getFontFamilies().map((font) => (
                      <SelectItem key={font} value={font} style={{ fontFamily: font }}>{font}</SelectItem>
                    ))}
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

            {/* Integrationen */}
            <div className="pt-4 border-t">
              <h3 className="font-medium text-sm mb-3">Integrationen</h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Webhook</Label>
                    <Switch
                      checked={localFunnel.webhookEnabled || false}
                      onCheckedChange={(checked) => updateLocalFunnel({ webhookEnabled: checked })}
                    />
                  </div>
                  {localFunnel.webhookEnabled && (
                    <>
                      <Input
                        value={localFunnel.webhookUrl || ""}
                        onChange={(e) => updateLocalFunnel({ webhookUrl: e.target.value })}
                        placeholder="https://hooks.zapier.com/..."
                        className="text-sm"
                      />
                      {localFunnel.webhookSecret && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Webhook Secret (HMAC-SHA256)</Label>
                          <div className="flex gap-1.5">
                            <Input
                              value={localFunnel.webhookSecret}
                              readOnly
                              className="text-xs font-mono bg-muted"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigator.clipboard.writeText(localFunnel.webhookSecret || "")}
                            >
                              Kopieren
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Sendet Lead-Daten als JSON an eine URL (Zapier, Make, etc.)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Google Tag Manager</Label>
                  <Input
                    value={localFunnel.gtmId || ""}
                    onChange={(e) => updateLocalFunnel({ gtmId: e.target.value || null })}
                    placeholder="GTM-XXXXXXX"
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Container-ID für Tracking (Google Ads, Meta Pixel, etc.)
                  </p>
                </div>
              </div>
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
                showLeftSidebar ? "text-primary bg-primary/10" : "text-muted-foreground"
              }`}
              onClick={() => setShowLeftSidebar(!showLeftSidebar)}
            >
              <Layers className="h-5 w-5" />
              <span className="text-xs">Seiten</span>
            </button>
            <button
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                showRightPanel && selectedElement ? "text-primary bg-primary/10" : "text-muted-foreground"
              }`}
              onClick={() => { if (selectedElement) setShowRightPanel(!showRightPanel); }}
            >
              <Settings className="h-5 w-5" />
              <span className="text-xs">Eigenschaften</span>
            </button>
            <button
              className="flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground"
              onClick={() => {
                if (!localFunnel) return;
                const url =
                  localFunnel.status === "published"
                    ? `/f/${localFunnel.slug || localFunnel.uuid}`
                    : `/preview/${localFunnel.id}`;
                window.open(url, "_blank");
              }}
            >
              <Eye className="h-5 w-5" />
              <span className="text-xs">Vorschau</span>
            </button>
          </div>
        </div>
      )}

      {/* Publish Dialog */}
      {localFunnel && (
        <PublishDialog
          open={showPublishDialog}
          onOpenChange={setShowPublishDialog}
          funnel={localFunnel}
          onPublish={async (slug) => { await publishMutation.mutateAsync(slug); }}
          onUpdateSlug={async (slug) => { await updateSlugMutation.mutateAsync(slug); }}
        />
      )}
    </div>
  </ErrorBoundary>
  );
}
