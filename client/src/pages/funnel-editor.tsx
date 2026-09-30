import { VisitorRulesPanel } from "@/components/funnel-editor/VisitorRulesPanel";
import { needsRoutingDocument } from "@shared/funnel-routing";
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
  AlertTriangle,
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
import { useFunnelEditor, buildSavePayload } from "@/hooks/use-funnel-editor";
import { canEditFunnelDocument, documentVersionSchema } from "@shared/funnel-document";
import { LayoutEditor } from "@/components/funnel-editor/LayoutEditor";
import { copyElements, copyPages } from "@shared/funnel-copy";
import { addLayoutSection, enablePageLayout, layoutBlockReason, moveLayoutElement, moveLayoutElementBy, reconcilePageLayout, removedFieldReference } from "@shared/funnel-layout-edit";
import { layoutErrors, pageWithVariant } from "@shared/funnel-layout";
import { FunnelRenderer } from "@/components/funnel-viewer/FunnelRenderer";
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
import { defaultQuizConfig } from "@/components/funnel-editor/QuizElement";

import { HistoryIndicator } from "@/components/funnel-editor/HistoryIndicator";
import { SaveStatusIndicator } from "@/components/funnel-editor/SaveStatusIndicator";
import { EditorToolbar } from "@/components/funnel-editor/EditorToolbar";
import { CustomDomainPanel } from "@/components/funnel-editor/CustomDomainPanel";
import { CommandPalette } from "@/components/funnel-editor/CommandPalette";
import { ShortcutOverlay } from "@/components/funnel-editor/ShortcutOverlay";
import { DesignPanel } from "@/components/funnel-editor/DesignPanel";
import { RevisionDialog } from "@/components/funnel-editor/RevisionDialog";
import { EditorRecoveryBar } from "@/components/funnel-editor/EditorRecoveryBar";
import { PublishDialog } from "@/components/funnel-editor/PublishDialog";

const LogicFlowView = lazy(() =>
  import("@/components/funnel-editor/LogicFlowView").then((m) => ({ default: m.LogicFlowView })),
);

// A/B-Tests sind live: Varianten-Statistiken kommen aus den analytics_events
// (GET /api/funnels/:id/ab-stats, siehe server/ab-stats.ts), "Gewinner
// festlegen" übernimmt die Varianten-Inhalte in die Seite (completeABTest).
const AB_TESTS_ENABLED = true;

type PageType = FunnelPage["type"];

export default function FunnelEditor() {
  const [, params] = useRoute("/funnels/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: editorCapabilities, isLoading: capabilitiesLoading } = useQuery({
    queryKey: ["/api/funnels/editor-capabilities"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/funnels/editor-capabilities", { credentials: "include" });
        const data = response.ok ? await response.json() : null;
        return { layoutEditing: data?.layoutEditing === true, routingEditing: data?.routingEditing === true };
      } catch { return { layoutEditing: false, routingEditing: false }; }
    },
    staleTime: Infinity,
  });
  const layoutEditing = editorCapabilities?.layoutEditing === true;
  const routingEditing = editorCapabilities?.routingEditing === true;

  // Daten-/Persistenz-Layer extrahiert in einen Hook (Stufe 3.1). Die alten
  // Namen bleiben via Destructuring identisch, damit der restliche Editor-Code
  // unverändert weiterläuft.
  const {
    funnel,
    isLoading,
    localFunnel,
    setLocalFunnel,
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength,
    hasChanges,
    setHasChanges,
    autoSaveEnabled,
    setAutoSaveEnabled,
    lastAutoSave,
    lastSavedAt,
    saveMutation,
    saveStatus,
    saveCurrent, saveBeforeLeave, restoreRevision, pendingWrites, conflict, recovery, discardRecovery, recoveryUnavailable,
    updateLocalFunnel,
    updatePage: persistPage,
  } = useFunnelEditor(params?.id, layoutEditing, routingEditing);

  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [convertingLayout, setConvertingLayout] = useState(false);
  const updatePage = useCallback((index: number, updates: Partial<FunnelPage>, columnId?: string) => {
    const page = localFunnel?.pages[index];
    if (!page || !localFunnel) return false;
    const next = reconcilePageLayout(page, updates, columnId ?? activeColumnId ?? undefined);
    if (needsRoutingDocument(localFunnel.pages)) {
      next.elements = next.elements.map(element => !page.elements.some(old => old.id === element.id) && ["select", "radio"].includes(element.type) && !element.choices
        ? { ...element, choices: (element.options ?? []).map(label => ({ id: crypto.randomUUID(), label })) } : element);
      const referenceError = removedFieldReference(localFunnel, page, next);
      const removedChoice = page.elements.some(element => element.choices?.some(choice => !next.elements.find(next => next.id === element.id)?.choices?.some(next => next.id === choice.id) && localFunnel.pages.some(source => source.routing?.rules.some(rule => rule.conditions.some(condition => condition.kind === "choice" && condition.fieldId === element.id && condition.value === choice.id)))));
      if (referenceError || removedChoice) { toast({ title: "Änderung nicht möglich", description: referenceError || "Diese Option wird noch in einer Besucherregel verwendet. Passe zuerst die Regel an.", variant: "destructive" }); return false; }
    }
    if (page.layout || next.layout) {
      const structural = JSON.stringify(page.layout) !== JSON.stringify(next.layout)
        || JSON.stringify(page.elements.map(element => element.id)) !== JSON.stringify(next.elements.map(element => element.id));
      const error = (structural && layoutBlockReason(localFunnel, page)) || removedFieldReference(localFunnel, page, next) || layoutErrors(next)[0];
      if (error) { toast({ title: "Änderung nicht möglich", description: error, variant: "destructive" }); return false; }
    }
    persistPage(index, next);
    return true;
  }, [localFunnel, activeColumnId, persistPage, toast]);
  const [showAddPage, setShowAddPage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editorTab, setEditorTab] = useState<"overview" | "design">("overview");
  const [previewMode, setPreviewMode] = useState<"phone" | "tablet" | "desktop">("phone");

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
  const [showRevisions, setShowRevisions] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showABTests, setShowABTests] = useState(false);

  // Live-Statistiken der A/B-Tests (aggregiert aus analytics_events) —
  // nur laden, wenn das Sheet offen ist.
  const { data: abStats } = useQuery<import("@/components/funnel-editor/ABTestEditor").ABTestStats>({
    queryKey: ["/api/funnels", params?.id, "ab-stats"],
    queryFn: async () => {
      const res = await fetch(`/api/funnels/${params?.id}/ab-stats`, { credentials: "include" });
      if (!res.ok) throw new Error("A/B-Statistiken konnten nicht geladen werden");
      return res.json();
    },
    enabled: AB_TESTS_ENABLED && showABTests && !!params?.id,
    refetchInterval: showABTests ? 30_000 : false,
  });
  const [showLogicFlow, setShowLogicFlow] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);

  // Perspective-style editor states
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    const saved = localStorage.getItem("editor-left-panel-width");
    const parsed = saved ? parseInt(saved) : 280;
    // Alte gespeicherte Werte unter 220 auf neues Minimum anheben,
    // sonst bleiben Element-/Seitennamen weiter zu kurz abgeschnitten.
    return Math.max(parsed, 220);
  });
  const isResizingRef = useRef(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Global clipboard for copy/paste functionality
  const [clipboard, setClipboard] = useState<{
    type: "element" | "section" | "page";
    data: PageElement | Section | FunnelPage;
  } | null>(null);

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

  const publishMutation = useMutation({
    mutationFn: (slug: string) => saveCurrent({ status: "published", slug }, true),
    onSuccess: () => {
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
    // Fehler dürfen nicht stumm bleiben — sonst glaubt der Nutzer, der Funnel
    // sei live, obwohl z.B. der Slug vergeben oder die Session abgelaufen ist.
    onError: (error) => {
      toast({
        title: "Veröffentlichen fehlgeschlagen",
        description: error instanceof Error ? error.message : "Bitte versuche es erneut.",
        variant: "destructive",
      });
    },
  });

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
    if (!localFunnel) return;
    const currentTests = localFunnel.abTests || [];
    const test = currentTests.find((t) => t.id === testId);
    if (!test) return;

    const winner = test.variants.find((v) => v.id === winnerId);
    // Variante 0 ist die Kontrolle — gewinnt sie, bleibt die Seite unverändert.
    const isControl = test.variants[0]?.id === winnerId;

    // Gewinner-Overrides in die Seite übernehmen — exakt die Semantik von
    // applyVariantOverrides im Public-Renderer (public-funnel.tsx).
    const newPages = !winner || isControl
      ? localFunnel.pages
      : localFunnel.pages.map((page) =>
          page.id === test.pageId
            ? pageWithVariant(page, winner)
            : page,
        );

    const updatedTests = currentTests.map((t) =>
      t.id === testId
        ? { ...t, status: "completed" as const, winnerId, completedAt: new Date().toISOString() }
        : t,
    );

    // EIN Update für Seiten + Teststatus: atomarer Undo-Schritt, und der
    // Traffic-Split endet automatisch (Public-API liefert nur running-Tests).
    updateLocalFunnel({ pages: newPages, abTests: updatedTests });
    toast({
      title: "A/B Test abgeschlossen",
      description: isControl
        ? "Die Kontrolle hat gewonnen — die Seite bleibt unverändert."
        : "Gewinner angewendet — die Varianten-Inhalte wurden in die Seite übernommen. Speichern nicht vergessen.",
    });
  }, [localFunnel, updateLocalFunnel, toast]);

  const enableSections = async () => {
    if (!localFunnel || !layoutEditing || convertingLayout) return;
    const page = localFunnel.pages[selectedPageIndex];
    if (!page) return;
    const reason = layoutBlockReason(localFunnel, page);
    if (reason) { toast({ title: "Umstellung nicht möglich", description: reason, variant: "destructive" }); return; }
    setConvertingLayout(true);
    try {
      await saveCurrent();
      setLocalFunnel(current => {
        if (!current) return current;
        const currentPage = current.pages.find(candidate => candidate.id === page.id);
        if (!currentPage || layoutBlockReason(current, currentPage)) return current;
        return { ...current, pages: current.pages.map(candidate => candidate.id === page.id ? enablePageLayout(candidate) : candidate) };
      });
      setHasChanges(true);
    } catch { /* Save failure is shown by the shared persistence hook. */ }
    finally { setConvertingLayout(false); }
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
    if (updatePage(selectedPageIndex, { elements: newElements })) setSelectedElementId(null);
  }, [localFunnel, selectedPageIndex, selectedElementId, updatePage]);

  const duplicateSelectedElement = useCallback(() => {
    if (!localFunnel || !selectedElementId) return;
    const page = localFunnel.pages[selectedPageIndex];
    const elementIndex = page.elements.findIndex(el => el.id === selectedElementId);
    if (elementIndex === -1) return;
    const element = page.elements[elementIndex];
    // Zufallssuffix wie an den anderen Duplizier-/Paste-Stellen — sonst kollidieren
    // mehrere Duplikate innerhalb derselben Millisekunde auf dieselbe ID.
    const [newElement] = copyElements([element]).elements;
    const newElements = [...page.elements];
    newElements.splice(elementIndex + 1, 0, newElement);
    let nextPage = reconcilePageLayout(page, { elements: newElements });
    const column = page.layout?.sections.flatMap(section => section.columns).find(column => column.elementIds.includes(element.id));
    if (column) nextPage = moveLayoutElement(nextPage, newElement.id, column.id, column.elementIds.indexOf(element.id) + 1);
    if (!updatePage(selectedPageIndex, nextPage)) return;
    setSelectedElementId(newElement.id);
  }, [localFunnel, selectedPageIndex, selectedElementId, updatePage]);

  // Copy/Paste functions for elements, sections, and pages
  const copySelectedElement = useCallback(() => {
    if (!localFunnel || !selectedElementId) return;
    const page = localFunnel.pages[selectedPageIndex];
    const element = page.elements.find(el => el.id === selectedElementId);
    if (element) {
      setClipboard({ type: "element", data: structuredClone(element) });
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
    setClipboard({ type: "element", data: structuredClone(element) });
    const newElements = page.elements.filter((el) => el.id !== selectedElementId);
    if (!updatePage(selectedPageIndex, { elements: newElements })) return;
    setSelectedElementId(null);
    toast({
      title: "Element ausgeschnitten",
      description: "Das Element wurde ausgeschnitten.",
    });
  }, [localFunnel, selectedPageIndex, selectedElementId, updatePage, toast]);

  const copyCurrentPage = useCallback(() => {
    if (!localFunnel) return;
    const page = localFunnel.pages[selectedPageIndex];
    setClipboard({ type: "page", data: structuredClone(page) });
    toast({
      title: "Seite kopiert",
      description: `"${page.title}" wurde in die Zwischenablage kopiert.`,
    });
  }, [localFunnel, selectedPageIndex, toast]);

  const pasteFromClipboard = useCallback(() => {
    if (!localFunnel || !clipboard) return;

    if (clipboard.type === "element") {
      const element = clipboard.data as PageElement;
      const [newElement] = copyElements([element]).elements;
      const page = localFunnel.pages[selectedPageIndex];
      if (!updatePage(selectedPageIndex, { elements: [...page.elements, newElement] })) return;
      setSelectedElementId(newElement.id);
      toast({
        title: "Element eingefügt",
        description: "Das Element wurde eingefügt.",
      });
    } else if (clipboard.type === "page") {
      const pageToCopy = clipboard.data as FunnelPage;
      const [newPage] = copyPages([pageToCopy]);
      newPage.title = `${pageToCopy.title} (Kopie)`;
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
      if (localFunnel && !canEditFunnelDocument(localFunnel, layoutEditing, routingEditing)) return;
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
        // Undo/Redo behandelt AUSSCHLIESSLICH der zweite Shortcut-Handler
        // (weiter unten) — beide Handler laufen bei jedem keydown, eine
        // doppelte Behandlung führte pro Ctrl+Z ZWEI Undo-Schritte aus.
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
  }, [localFunnel, layoutEditing, routingEditing, selectedElementId, copySelectedElement, copyCurrentPage, pasteFromClipboard, deleteSelectedElement, duplicateSelectedElement]);

  const moveElementUp = useCallback(() => {
    if (!localFunnel || !selectedElementId) return;
    const page = localFunnel.pages[selectedPageIndex];
    if (page.layout) { updatePage(selectedPageIndex, moveLayoutElementBy(page, selectedElementId, -1)); return; }
    const elementIndex = page.elements.findIndex(el => el.id === selectedElementId);
    if (elementIndex <= 0) return;
    const newElements = [...page.elements];
    [newElements[elementIndex - 1], newElements[elementIndex]] = [newElements[elementIndex], newElements[elementIndex - 1]];
    updatePage(selectedPageIndex, { elements: newElements });
  }, [localFunnel, selectedPageIndex, selectedElementId, updatePage]);

  const moveElementDown = useCallback(() => {
    if (!localFunnel || !selectedElementId) return;
    const page = localFunnel.pages[selectedPageIndex];
    if (page.layout) { updatePage(selectedPageIndex, moveLayoutElementBy(page, selectedElementId, 1)); return; }
    const elementIndex = page.elements.findIndex(el => el.id === selectedElementId);
    if (elementIndex === -1 || elementIndex >= page.elements.length - 1) return;
    const newElements = [...page.elements];
    [newElements[elementIndex], newElements[elementIndex + 1]] = [newElements[elementIndex + 1], newElements[elementIndex]];
    updatePage(selectedPageIndex, { elements: newElements });
  }, [localFunnel, selectedPageIndex, selectedElementId, updatePage]);

  // Add element to current page from Design tab - Extended with OpenFunnels block types
  const addElementToPage = useCallback((type: PageElement["type"], columnId?: string) => {
    if (!localFunnel) return;
    // Nach Undo (Seite gelöscht) kann selectedPageIndex out-of-range sein
    const page = localFunnel.pages[selectedPageIndex];
    if (!page) return;
    const newElement: PageElement = {
      id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
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
      // Quiz — Deep-Clone zwingend, sonst teilen sich mehrere Quiz-Elemente
      // dasselbe Config-Objekt (Aliasing über structuredClone verhindert).
      quizConfig: type === "quiz" ? structuredClone(defaultQuizConfig) : undefined,
      // Button (new)
      buttonUrl: type === "button" ? "" : undefined,
      buttonTarget: type === "button" ? "_self" : undefined,
      buttonVariant: type === "button" ? "primary" : undefined,
      buttonAction: type === "button" ? "next" : undefined,
    };
    const newElements = [...page.elements, newElement];
    if (!updatePage(selectedPageIndex, { elements: newElements }, columnId)) return;
    setSelectedElementId(newElement.id);
  }, [localFunnel, selectedPageIndex, updatePage]);

  // Clear element selection when page changes
  useEffect(() => {
    setSelectedElementId(null);
    setActiveColumnId(null);
  }, [selectedPageIndex]);

  const addPage = useCallback((type: PageType) => {
    if (localFunnel) {
      // Eindeutige Element-IDs: formValues ist funnel-weit nach element.id
      // gekeyt — feste IDs ("el-1") kollidieren über Seiten hinweg und
      // überschreiben sich gegenseitig die Antworten.
      const newElementId = () =>
        `el-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const newPage: FunnelPage = {
        id: `page-${Date.now()}`,
        type,
        title: pageTypeLabels[type],
        elements: type === "contact" ? [
          { id: newElementId(), type: "input", placeholder: "Dein Name", required: true, mapToLeadField: "name" },
          { id: newElementId(), type: "input", placeholder: "Deine E-Mail", required: true, mapToLeadField: "email" },
        ] : type === "multiChoice" || type === "question" ? [
          { id: newElementId(), type: "radio", options: ["Option 1", "Option 2", "Option 3"] },
        ] : [],
        buttonText: type === "thankyou" ? undefined : "Weiter",
        backgroundColor: type === "welcome" || type === "thankyou" ? localFunnel.theme.primaryColor : undefined,
        showConfetti: type === "thankyou" ? true : undefined,
      };
      if (needsRoutingDocument(localFunnel.pages)) newPage.elements = newPage.elements.map(element => ["select", "radio"].includes(element.type) ? { ...element, choices: (element.options ?? []).map(label => ({ id: crypto.randomUUID(), label })) } : element);
      updateLocalFunnel({ pages: [...localFunnel.pages, newPage] });
      setSelectedPageIndex(localFunnel.pages.length);
    }
  }, [localFunnel, updateLocalFunnel]);

  const duplicatePage = useCallback((index: number) => {
    if (localFunnel) {
      const pageToDuplicate = localFunnel.pages[index];
      const [newPage] = copyPages([pageToDuplicate]);
      newPage.title = `${pageToDuplicate.title} (Kopie)`;
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
    if (!localFunnel || localFunnel.pages.length <= 1) return;
    // Neue Seitenzahl EINMAL beim Aufruf festhalten (nicht im async State-Updater
    // aus der Closure lesen → kein stale localFunnel bei gebatchten Deletes).
    const newLength = localFunnel.pages.length - 1;
    setLocalFunnel((prev) => {
      if (!prev || prev.pages.length <= 1) return prev;
      return { ...prev, pages: prev.pages.filter((_, i) => i !== index) };
    });
    setSelectedElementId(null);
    setSelectedPageIndex((prevIdx) => {
      // Liegt die gelöschte Seite vor der aktuellen, rückt der Index nach vorn;
      // anschließend auf den gültigen Bereich [0, newLength-1] klammern.
      const shifted = index < prevIdx ? prevIdx - 1 : prevIdx;
      return Math.min(Math.max(0, shifted), newLength - 1);
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
      const newWidth = Math.min(Math.max(startWidth + (e.clientX - startX), 220), 400);
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
    if (localFunnel) saveMutation.mutate(buildSavePayload(localFunnel));
  }, [localFunnel, saveMutation]);

  const handleBackToFunnels = useCallback(async () => {
    try {
      if (hasChanges || pendingWrites) await saveBeforeLeave();
      navigate("/funnels");
    } catch { /* Stay in the editor with the local draft intact. */ }
  }, [hasChanges, pendingWrites, saveBeforeLeave, navigate]);

  const openDraftPreview = useCallback(async () => {
    const preview = window.open("about:blank", "_blank");
    try { await saveCurrent(); if (preview) preview.location.href = `/preview/${params?.id}`; }
    catch { preview?.close(); }
  }, [params?.id, saveCurrent]);

  // Undo/Redo überall mit Dirty-Flag — Toolbar und CommandPalette riefen
  // bisher das rohe undo()/redo() auf: Der zurückgesetzte Stand galt als
  // gespeichert und ging beim Schließen verloren.
  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    undo();
    setHasChanges(true);
  }, [canUndo, undo, setHasChanges]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    redo();
    setHasChanges(true);
  }, [canRedo, redo, setHasChanges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (localFunnel && !canEditFunnelDocument(localFunnel, layoutEditing, routingEditing)) return;
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
        handleUndo();
        return;
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (modKey && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
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
  }, [localFunnel, layoutEditing, routingEditing, hasChanges, handleUndo, handleRedo, handleSave, moveElementUp, moveElementDown, selectedElementId]);

  // Der Builder ist für kleine Viewports nicht bedienbar — statt einer kaputten
  // Oberfläche einen klaren Hinweis zeigen (Desktop-Editor bleibt unverändert).
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <div className="max-w-sm">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Monitor className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold mb-2">Bitte am Desktop bearbeiten</h1>
          <p className="text-muted-foreground mb-8">
            Der Funnel-Editor ist für größere Bildschirme optimiert. Bitte öffne
            Trichterwerk auf einem Tablet oder Desktop, um deinen Funnel zu
            bearbeiten.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate("/funnels")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Zurück zu meinen Funnels
            </Button>
            {params?.id && (
              <Button
                variant="outline"
                onClick={() => navigate(`/preview/${params.id}`)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Vorschau ansehen
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || capabilitiesLoading) {
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

  if (!canEditFunnelDocument(localFunnel, layoutEditing, routingEditing)) {
    return (
      <ErrorBoundary>
        <div className="p-4 border-b space-y-2">
          <Button variant="outline" onClick={() => navigate("/funnels")}>Zurück zu Funnels</Button>
          <p>Dieser Funnel verwendet neue Layout-Funktionen. Die Bearbeitung ist in dieser Editorversion noch nicht verfügbar.</p>
          <p className="text-sm text-muted-foreground">Du kannst den gespeicherten Entwurf hier durchspielen.</p>
        </div>
        {documentVersionSchema.safeParse(localFunnel.documentVersion ?? 1).success && (
          <FunnelRenderer funnel={localFunnel} mode="preview" />
        )}
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
    <div className={`h-screen flex flex-col bg-background ${isMobile ? "pb-16" : ""}`}>
      {/* Header — extrahiert in EditorToolbar (Stufe 3.1) */}
      <EditorToolbar
        localFunnel={localFunnel}
        selectedPage={selectedPage}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        hasChanges={hasChanges}
        isSavePending={pendingWrites > 0}
        isPublishPending={publishMutation.isPending}
        previewMode={previewMode}
        setPreviewMode={setPreviewMode}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        historyLength={historyLength}
        autoSaveEnabled={autoSaveEnabled}
        setAutoSaveEnabled={setAutoSaveEnabled}
        lastAutoSave={lastAutoSave}
        isMobile={isMobile}
        showLeftSidebar={showLeftSidebar}
        setShowLeftSidebar={setShowLeftSidebar}
        onBack={handleBackToFunnels}
        onSave={handleSave}
        onOpenLogicFlow={() => setShowLogicFlow(true)}
        onOpenABTests={AB_TESTS_ENABLED ? () => setShowABTests(true) : undefined}
        onOpenSettings={() => setShowSettings(true)}
        onOpenPublish={() => setShowPublishDialog(true)}
        onOpenRevisions={() => setShowRevisions(true)}
        onOpenPreview={openDraftPreview}
      />
      <EditorRecoveryBar funnel={localFunnel} recovery={recovery} conflict={conflict} unavailable={recoveryUnavailable} onDiscard={discardRecovery} />
      {localFunnel.status === "published" && <p className="text-xs text-muted-foreground px-4 py-1 border-b">Du bearbeitest den Entwurf. Inhaltsänderungen werden erst mit „Veröffentlichen“ live.</p>}
      <RevisionDialog open={showRevisions} onOpenChange={setShowRevisions} funnelId={localFunnel.id} onRestore={restoreRevision} />

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
                    if (page.layout) {
                      updatePage(selectedPageIndex, addLayoutSection(page, "Vorlage", [elements as PageElement[]]));
                      return;
                    }
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
              <DesignPanel funnel={localFunnel} pageIndex={selectedPageIndex} advancedEnabled={layoutEditing} onChange={updateLocalFunnel} />
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
            {AB_TESTS_ENABLED && (localFunnel.abTests || []).some(
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
            {layoutEditing && selectedPage && !selectedPage.layout && (
              <div className="mb-3 rounded-lg border bg-card p-3 space-y-2">
                <Button variant="outline" size="sm" onClick={enableSections} disabled={convertingLayout || !!layoutBlockReason(localFunnel, selectedPage)}>
                  {convertingLayout ? "Stand wird gesichert …" : "Abschnitte für diese Seite aktivieren"}
                </Button>
                <p className="text-xs text-muted-foreground">{layoutBlockReason(localFunnel, selectedPage) || "Die vorhandenen Inhalte bleiben erhalten. Der bisherige Stand wird vorher als Version gesichert."}</p>
              </div>
            )}
            {selectedPage?.layout ? <LayoutEditor
              page={selectedPage} theme={localFunnel.theme}
              onChange={page => updatePage(selectedPageIndex, page)}
              selectedElementId={selectedElementId}
              onSelectElement={id => {
                setSelectedElementId(id); setShowRightPanel(!!id);
                const column = selectedPage.layout?.sections.flatMap(section => section.columns).find(column => column.elementIds.includes(id ?? ""));
                if (column) setActiveColumnId(column.id);
              }}
              activeColumnId={activeColumnId} onChooseColumn={setActiveColumnId}
              onAddElement={addElementToPage}
              blockedReason={layoutBlockReason(localFunnel, selectedPage)}
              elementActions={{ onDelete: deleteSelectedElement, onDuplicate: duplicateSelectedElement,
                onCopy: copySelectedElement, onCut: cutSelectedElement, onPaste: pasteFromClipboard,
                canPaste: clipboard?.type === "element", onMoveUp: moveElementUp, onMoveDown: moveElementDown }}
            /> : <PhonePreview
              page={selectedPage}
              pageIndex={selectedPageIndex}
              totalPages={localFunnel.pages.length}
              primaryColor={localFunnel.theme.primaryColor}
              theme={localFunnel.theme}
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
            />}
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
                routingManaged={!!selectedPage?.routing}
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
        onPreview={openDraftPreview}
        onUndo={handleUndo}
        canUndo={canUndo}
        onRedo={handleRedo}
        canRedo={canRedo}
        onOpenSettings={() => setShowSettings(true)}
        onOpenABTests={AB_TESTS_ENABLED ? () => setShowABTests(true) : undefined}
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
          <div className="flex-1 min-h-0 flex">
            <div className="flex-1 min-w-0"><Suspense
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
                  }
                }}
              />
            </Suspense></div>
            {routingEditing && selectedPage && <aside className="w-[420px] shrink-0 border-l overflow-y-auto">
              <label className="block p-4 pb-0 text-xs">Regelseite
                <select aria-label="Regelseite" className="w-full border rounded bg-background p-2 mt-1" value={selectedPage.id} onChange={event => setSelectedPageIndex(localFunnel.pages.findIndex(page => page.id === event.target.value))}>{localFunnel.pages.map(page => <option key={page.id} value={page.id}>{page.title}</option>)}</select>
              </label>
              <VisitorRulesPanel key={selectedPage.id} funnel={localFunnel} page={selectedPage} onUpdate={updates => updatePage(selectedPageIndex, updates)} />
            </aside>}
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
                stats={abStats}
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

            <Button variant="outline" onClick={() => { setShowSettings(false); setEditorTab("design"); setShowLeftSidebar(true); }}>Design bearbeiten</Button>

            <div className="space-y-2">
              <Label>Veröffentlichung</Label>
              <p className="text-sm">{localFunnel.status === "published" ? "Der Funnel ist live. Speichern aktualisiert deinen Entwurf." : "Dieser Funnel ist noch nicht veröffentlicht."}</p>
              {localFunnel.status === "published" && <Button variant="outline" disabled={pendingWrites > 0} onClick={() => {
                if (window.confirm("Funnel offline nehmen? Der gespeicherte Inhalt bleibt erhalten.")) void saveCurrent({ status: "draft" }).catch(() => undefined);
              }}>Funnel offline nehmen</Button>}
            </div>

            {/* Rechtliches — Pflicht für veröffentlichte Funnels */}
            <div className="pt-4 border-t">
              <h3 className="font-medium text-sm mb-3">Rechtliches</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Impressum-URL</Label>
                  <Input
                    value={localFunnel.impressumUrl || ""}
                    onChange={(e) => updateLocalFunnel({ impressumUrl: e.target.value || null })}
                    placeholder="https://deine-website.de/impressum"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Datenschutzerklärung-URL</Label>
                  <Input
                    value={localFunnel.datenschutzUrl || ""}
                    onChange={(e) => updateLocalFunnel({ datenschutzUrl: e.target.value || null })}
                    placeholder="https://deine-website.de/datenschutz"
                    className="text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Wird im Footer deines veröffentlichten Funnels verlinkt. Du erhebst
                  über den Funnel personenbezogene Daten — Impressum und
                  Datenschutzerklärung sind Pflicht (§ 5 DDG, Art. 13 DSGVO).
                </p>
              </div>
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

                {/* Meta Tracking: Browser-Pixel + Server-Side CAPI */}
                <div className="space-y-3 pt-2 border-t">
                  <div className="space-y-2">
                    <Label className="text-sm">Meta Tracking (Pixel + Conversions API)</Label>
                    <Label className="text-xs">Meta Pixel ID</Label>
                    <Input
                      value={localFunnel.metaPixelId || ""}
                      onChange={(e) =>
                        updateLocalFunnel({ metaPixelId: e.target.value || null })
                      }
                      placeholder="1234567890123456"
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Lädt das Browser-Pixel auf dem veröffentlichten Funnel (PageView pro Schritt + Lead) — ausschließlich nachdem der Besucher Marketing-Cookies akzeptiert hat (DSGVO).
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Server-Side Tracking (Meta CAPI)</Label>
                      <p className="text-xs text-muted-foreground">
                        Sendet Lead-Events zusätzlich server-seitig — überlebt iOS-ATT und Adblocker. Deduplizierung mit dem Browser-Pixel läuft automatisch über die Lead-ID.
                      </p>
                    </div>
                    <Switch
                      checked={!!localFunnel.capiEnabled}
                      onCheckedChange={(checked) => updateLocalFunnel({ capiEnabled: checked })}
                      aria-label="Server-Side Tracking aktivieren"
                    />
                  </div>
                  {localFunnel.capiEnabled && localFunnel.capiLastError && (
                    <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>
                        Letztes Tracking-Event ist fehlgeschlagen: {localFunnel.capiLastError}. Bitte Pixel-ID und Token prüfen.
                      </span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-xs">CAPI Access Token</Label>
                    <Input
                      type="password"
                      value={localFunnel.metaCapiToken || ""}
                      onChange={(e) =>
                        updateLocalFunnel({ metaCapiToken: e.target.value || null })
                      }
                      placeholder="EAA... (System User Access Token)"
                      className="text-sm font-mono"
                      disabled={!localFunnel.capiEnabled}
                    />
                    <p className="text-xs text-muted-foreground">
                      Secret — wird in der DB gespeichert und nur server-seitig verwendet. Events feuern ausschließlich, wenn der Besucher Marketing-Cookies akzeptiert hat (DSGVO).
                    </p>
                  </div>
                </div>

                {/* Eigene Domain (Stufe 4.2) */}
                <CustomDomainPanel funnelId={localFunnel.id} />
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
              onClick={openDraftPreview}
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
        />
      )}
    </div>
  </ErrorBoundary>
  );
}
