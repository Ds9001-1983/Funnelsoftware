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
} from "lucide-react";
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
import type { Funnel, FunnelPage, PageElement } from "@shared/schema";

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
      placeholder: type === "input" ? "Dein Text hier..." : undefined,
      options: type === "radio" ? ["Option 1", "Option 2", "Option 3"] : undefined,
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
      </div>

      {(page.type === "contact" || page.type === "question" || page.type === "multiChoice") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Elemente</Label>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => addElement("input")}
              >
                + Textfeld
              </Button>
              {page.type === "contact" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addElement("textarea")}
                >
                  + Textbereich
                </Button>
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

          <div className="space-y-3">
            {page.elements.map((el) => (
              <Card key={el.id}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {el.type === "input" ? "Textfeld" : el.type === "textarea" ? "Textbereich" : "Auswahl"}
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
                  {(el.type === "input" || el.type === "textarea") && (
                    <Input
                      placeholder="Placeholder-Text"
                      value={el.placeholder || ""}
                      onChange={(e) =>
                        updateElement(el.id, { placeholder: e.target.value })
                      }
                    />
                  )}
                  {el.type === "radio" && el.options && (
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
                </CardContent>
              </Card>
            ))}
          </div>
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
