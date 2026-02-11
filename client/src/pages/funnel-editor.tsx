import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
  type CollisionDetection,
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
  InlineElementPicker,
  FloatingToolbar,
  PhonePreview,
  ElementPropertiesPanel,
} from "@/components/funnel-editor";
import { EditorCanvas } from "@/components/funnel-editor/EditorCanvas";
import { createNewElement } from "@/components/funnel-editor/createElement";

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
  const [leftSidebarTab, setLeftSidebarTab] = useState<"pages" | "elements" | "page">("pages");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Drag state for unified DnD
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

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

  // Add element to current page (appends at end)
  const addElementToPage = useCallback((type: PageElement["type"]) => {
    if (!localFunnel) return;
    const page = localFunnel.pages[selectedPageIndex];
    const newElement = createNewElement(type);
    updatePage(selectedPageIndex, { elements: [...page.elements, newElement] });
    setSelectedElementId(newElement.id);
  }, [localFunnel, selectedPageIndex, updatePage]);

  // Add element at specific index (for DnD drop into canvas)
  const addElementAtIndex = useCallback((type: PageElement["type"], index: number) => {
    if (!localFunnel) return;
    const page = localFunnel.pages[selectedPageIndex];
    const newElement = createNewElement(type);
    const newElements = [...page.elements];
    newElements.splice(index, 0, newElement);
    updatePage(selectedPageIndex, { elements: newElements });
    setSelectedElementId(newElement.id);
    setLeftSidebarTab("elements");
  }, [localFunnel, selectedPageIndex, updatePage]);

  // Delete element by ID (for EditorCanvas)
  const deleteElementById = useCallback((elementId: string) => {
    if (!localFunnel) return;
    const page = localFunnel.pages[selectedPageIndex];
    updatePage(selectedPageIndex, {
      elements: page.elements.filter((el) => el.id !== elementId),
    });
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  }, [localFunnel, selectedPageIndex, updatePage, selectedElementId]);

  // Duplicate element by ID (for EditorCanvas)
  const duplicateElementById = useCallback((elementId: string) => {
    if (!localFunnel) return;
    const page = localFunnel.pages[selectedPageIndex];
    const element = page.elements.find((el) => el.id === elementId);
    if (!element) return;
    const newElement = { ...element, id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` };
    const index = page.elements.findIndex((el) => el.id === elementId);
    const newElements = [...page.elements];
    newElements.splice(index + 1, 0, newElement);
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

  // Custom collision detection: palette items prefer canvas drop zones
  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    const activeData = args.active.data.current;

    if (activeData?.isNew) {
      // For new elements from palette, prefer drop zones using pointerWithin
      const pointerCollisions = pointerWithin(args);
      if (pointerCollisions.length > 0) return pointerCollisions;
      return closestCenter(args);
    }

    // For everything else (page reorder, element reorder), use closestCenter
    return closestCenter(args);
  }, []);

  // Unified drag start handler
  const handleUnifiedDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  // Unified drag end handler: handles 3 drag types
  const handleUnifiedDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over || !localFunnel) return;

    const activeData = active.data.current;
    const overId = String(over.id);

    // Case 1: Page reorder (SortablePageItem with sortableType "page")
    if (activeData?.sortableType === "page") {
      if (active.id !== over.id) {
        const oldIndex = localFunnel.pages.findIndex((p) => p.id === active.id);
        const newIndex = localFunnel.pages.findIndex((p) => p.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
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
      }
      return;
    }

    // Case 2: New element from palette dropped onto canvas
    if (activeData?.isNew) {
      const elementType = activeData.type as PageElement["type"];
      if (overId === "canvas-drop-empty") {
        addElementAtIndex(elementType, 0);
      } else if (overId.startsWith("canvas-drop-")) {
        const dropIndex = parseInt(overId.replace("canvas-drop-", ""), 10);
        if (!isNaN(dropIndex)) {
          addElementAtIndex(elementType, dropIndex);
        }
      } else {
        // Dropped on a canvas element directly → insert after it
        const page = localFunnel.pages[selectedPageIndex];
        const targetIndex = page.elements.findIndex((el) => el.id === overId);
        if (targetIndex !== -1) {
          addElementAtIndex(elementType, targetIndex + 1);
        }
      }
      return;
    }

    // Case 3: Canvas element reorder (useSortable with sortableType "canvas-element")
    if (activeData?.sortableType === "canvas-element") {
      const page = localFunnel.pages[selectedPageIndex];
      const oldIndex = page.elements.findIndex((el) => el.id === active.id);
      let newIndex: number;

      if (overId.startsWith("canvas-drop-")) {
        newIndex = parseInt(overId.replace("canvas-drop-", ""), 10);
        if (newIndex > oldIndex) newIndex--;
      } else {
        newIndex = page.elements.findIndex((el) => el.id === over.id);
      }

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        updatePage(selectedPageIndex, {
          elements: arrayMove(page.elements, oldIndex, newIndex),
        });
      }
      return;
    }
  }, [localFunnel, selectedPageIndex, addElementAtIndex, updatePage, updateLocalFunnel]);

  // Get info for active drag element (for DragOverlay)
  const activeDragInfo = useMemo(() => {
    if (!activeDragId) return null;
    if (activeDragId.startsWith("new-element-")) {
      const type = activeDragId.replace("new-element-", "");
      for (const cat of elementCategories) {
        const found = cat.elements.find(el => el.type === type);
        if (found) return { type: "palette" as const, label: found.label, icon: found.icon };
      }
    }
    // Canvas element being dragged
    if (localFunnel) {
      const page = localFunnel.pages[selectedPageIndex];
      const element = page?.elements.find(el => el.id === activeDragId);
      if (element) return { type: "canvas-element" as const, elementType: element.type };
    }
    return null;
  }, [activeDragId, localFunnel, selectedPageIndex]);

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
                onClick={() => window.open(`/f/${localFunnel.uuid}`, '_blank')}
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

      {/* Main content - single unified DndContext for all drag operations */}
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleUnifiedDragStart}
        onDragEnd={handleUnifiedDragEnd}
      >
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile sidebar backdrop */}
        {isMobile && showLeftSidebar && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setShowLeftSidebar(false)}
          />
        )}

        {/* Left sidebar - Seiten/Design tabs */}
        <div className={`
          ${isMobile ? "fixed left-0 top-14 bottom-0 z-50" : "relative"}
          ${showLeftSidebar ? "w-80" : "w-0"}
          border-r border-border bg-card overflow-hidden transition-all duration-300
        `}>
          <div className="w-80 h-full flex flex-col">
            {/* Tabs header */}
            <div className="border-b border-border">
              <div className="flex">
                <button
                  className={`flex-1 py-2.5 px-2 text-xs font-medium transition-colors border-b-2 ${
                    leftSidebarTab === "pages"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setLeftSidebarTab("pages")}
                >
                  <Layers className="h-4 w-4 mx-auto mb-0.5" />
                  Seiten
                </button>
                <button
                  className={`flex-1 py-2.5 px-2 text-xs font-medium transition-colors border-b-2 ${
                    leftSidebarTab === "elements"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setLeftSidebarTab("elements")}
                >
                  <Plus className="h-4 w-4 mx-auto mb-0.5" />
                  Elemente
                </button>
                <button
                  className={`flex-1 py-2.5 px-2 text-xs font-medium transition-colors border-b-2 ${
                    leftSidebarTab === "page"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setLeftSidebarTab("page")}
                >
                  <Settings className="h-4 w-4 mx-auto mb-0.5" />
                  Seite
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
                </div>
              </>
            ) : leftSidebarTab === "elements" ? (
              <div className="flex-1 overflow-y-auto funnel-scrollbar">
                {selectedElement ? (
                  <div className="h-full flex flex-col">
                    {/* Zurück-Button */}
                    <div className="p-3 border-b border-border shrink-0">
                      <button
                        onClick={() => setSelectedElementId(null)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Zur Palette
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <ElementPropertiesPanel
                        element={selectedElement}
                        onUpdate={updateSelectedElement}
                        onClose={() => setSelectedElementId(null)}
                      />
                    </div>
                  </div>
                ) : (
                  /* Element palette when no element selected */
                  <div className="p-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Klicke oder ziehe ein Element in den Canvas:
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
            ) : (
              /* Page settings tab */
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
          style={{ left: showLeftSidebar && !isMobile ? "318px" : showLeftSidebar && isMobile ? "320px" : "0" }}
        >
          {showLeftSidebar ? <ChevronLeft className={isMobile ? "h-5 w-5" : "h-3 w-3"} /> : <ChevronRight className={isMobile ? "h-5 w-5" : "h-3 w-3"} />}
        </Button>

        {/* Center - Interactive Editor Canvas */}
        <div className="flex-1 bg-muted/30 overflow-y-auto flex items-start justify-center p-2 md:p-8">
          <div
            style={{
              maxWidth: previewMode === "phone" ? "420px" : previewMode === "tablet" ? "768px" : "1024px",
              width: "100%"
            }}
          >
            <EditorCanvas
              page={selectedPage}
              pageIndex={selectedPageIndex}
              totalPages={localFunnel.pages.length}
              primaryColor={localFunnel.theme.primaryColor}
              selectedElementId={selectedElementId}
              onSelectElement={(elementId) => {
                setSelectedElementId(elementId);
                if (elementId) {
                  setLeftSidebarTab("elements");
                  setShowLeftSidebar(true);
                }
              }}
              onUpdatePage={(updates) => updatePage(selectedPageIndex, updates)}
              onAddElementAtIndex={addElementAtIndex}
              onDeleteElement={deleteElementById}
              onDuplicateElement={duplicateElementById}
              isDragActive={!!activeDragId}
            />
          </div>
        </div>

        {/* Right sidebar removed — all content now in left sidebar */}
      </div>

      {/* DragOverlay for visual feedback during drag */}
      <DragOverlay dropAnimation={null}>
        {activeDragInfo?.type === "palette" && (
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-xl border-2 border-primary/50 pointer-events-none">
            <activeDragInfo.icon className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{activeDragInfo.label}</span>
          </div>
        )}
        {activeDragInfo?.type === "canvas-element" && (
          <div className="px-4 py-2 bg-white rounded-lg shadow-xl border-2 border-primary/50 pointer-events-none opacity-80">
            <span className="text-sm font-medium text-primary">
              Element verschieben
            </span>
          </div>
        )}
      </DragOverlay>
      </DndContext>

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
              }}
            >
              <Layers className="h-5 w-5" />
              <span className="text-xs">Seiten</span>
            </button>
            <button
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                showLeftSidebar && leftSidebarTab === "elements" ? "text-primary bg-primary/10" : "text-muted-foreground"
              }`}
              onClick={() => {
                setLeftSidebarTab("elements");
                setShowLeftSidebar(!showLeftSidebar || leftSidebarTab !== "elements");
              }}
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs">Elemente</span>
            </button>
            <button
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                showLeftSidebar && leftSidebarTab === "page" ? "text-primary bg-primary/10" : "text-muted-foreground"
              }`}
              onClick={() => {
                setLeftSidebarTab("page");
                setShowLeftSidebar(!showLeftSidebar || leftSidebarTab !== "page");
              }}
            >
              <Settings className="h-5 w-5" />
              <span className="text-xs">Seite</span>
            </button>
            <button
              className="flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground"
              onClick={() => window.open(`/f/${localFunnel.uuid}`, '_blank')}
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
