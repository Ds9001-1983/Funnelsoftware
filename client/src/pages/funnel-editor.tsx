import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
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
  InlineElementPicker,
  FloatingToolbar,
  PhonePreview,
  ElementPropertiesPanel,
} from "@/components/funnel-editor";
import { ErrorBoundary } from "@/components/funnel-editor/ErrorBoundary";

import { HistoryIndicator } from "@/components/funnel-editor/HistoryIndicator";
import { ThemePresetPicker } from "@/components/funnel-editor/ThemePresetPicker";

const PageEditor = lazy(() => import("@/components/funnel-editor/PageEditor").then(m => ({ default: m.PageEditor })));

type PageType = FunnelPage["type"];

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

  // Perspective-style editor states
  const [showRightPanel, setShowRightPanel] = useState(false);
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
    5000, // 5 Sekunden nach letzter Änderung
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

  const renamePage = (index: number, newTitle: string) => {
    setLocalFunnel((prev) => {
      const updated = { ...prev };
      updated.pages = [...updated.pages];
      updated.pages[index] = { ...updated.pages[index], title: newTitle };
      return updated;
    });
  };

  const togglePageVisibility = (index: number) => {
    setLocalFunnel((prev) => {
      const updated = { ...prev };
      updated.pages = [...updated.pages];
      const page = updated.pages[index];
      updated.pages[index] = { ...page, hidden: !page.hidden };
      return updated;
    });
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
          {hasChanges && <div className="h-2 w-2 rounded-full bg-yellow-500 shrink-0" title="Ungespeicherte Änderungen" />}
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
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}>
                {autoSaveEnabled ? <Cloud className="h-4 w-4 text-green-500" /> : <CloudOff className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{autoSaveEnabled ? `Auto-Save aktiv${lastAutoSave ? ` (${lastAutoSave.toLocaleTimeString()})` : ""}` : "Auto-Save deaktiviert"}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSettings(true)} data-testid="button-settings">
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Einstellungen</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(`/f/${localFunnel?.uuid}`, '_blank')}>
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Vorschau</TooltipContent>
          </Tooltip>
          <div className="h-5 w-px bg-border mx-1 hidden sm:block" />
          <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={handleSave} disabled={!hasChanges || saveMutation.isPending} data-testid="button-save">
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Speichern</span>
          </Button>
          {localFunnel.status !== "published" && (
            <Button size="sm" className="gap-1.5 h-8" onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending} data-testid="button-publish">
              <Globe className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Veröffentlichen</span>
            </Button>
          )}
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

        {/* LEFT PANEL - Seiten + Element-Palette */}
        <div className={`
          ${isMobile ? "fixed left-0 top-12 bottom-0 z-50" : "relative"}
          ${showLeftSidebar ? "w-64" : "w-0"}
          border-r border-border bg-card overflow-hidden transition-all duration-200 shrink-0
        `}>
          <div className="w-64 h-full flex flex-col">
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
                        onSelect={() => setSelectedPageIndex(index)}
                        onDelete={() => deletePage(index)}
                        onDuplicate={() => duplicatePage(index)}
                        totalPages={localFunnel.pages.length}
                        onRename={() => {
                          const newTitle = prompt('Neuer Seitenname:', page.title);
                          if (newTitle && newTitle.trim()) renamePage(index, newTitle.trim());
                        }}
                        onToggleVisibility={() => togglePageVisibility(index)}
                        isHidden={page.hidden}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            {/* Element Palette */}
            <div className="border-t border-border flex-1 overflow-hidden flex flex-col">
              <div className="px-3 py-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Elemente</span>
              </div>
              <div className="flex-1 overflow-y-auto funnel-scrollbar px-2 pb-2">
                {elementCategories.map((category) => (
                  <div key={category.name} className="mb-3">
                    <h5 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">{category.name}</h5>
                    <div className="grid grid-cols-2 gap-1">
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
            </div>
          </div>
        </div>

        {/* Toggle Left Sidebar */}
        {!isMobile && (
          <button
            className="relative z-10 -ml-3 mt-4 h-6 w-6 flex items-center justify-center rounded-full bg-card border shadow-sm hover:bg-muted transition-colors"
            onClick={() => setShowLeftSidebar(!showLeftSidebar)}
          >
            {showLeftSidebar ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
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
              onMoveElementUp={moveElementUp}
              onMoveElementDown={moveElementDown}
              onShowElementPicker={() => setSelectedElementId(null)}
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
              onClick={() => window.open(`/f/${localFunnel?.uuid}`, '_blank')}
            >
              <Eye className="h-5 w-5" />
              <span className="text-xs">Vorschau</span>
            </button>
          </div>
        </div>
      )}
    </div>
  </ErrorBoundary>
  );
}
