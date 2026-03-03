import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
} from "@dnd-kit/sortable";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Funnel } from "@shared/schema";
import { useEditorStore } from "./store/editor-store";
import { EditorToolbar } from "./EditorToolbar";
import { EditorCanvas } from "./EditorCanvas";
import { LeftSidebar } from "./LeftSidebar";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useEditorAutoSave } from "./hooks/useEditorAutoSave";
import { registry } from "./registry/element-registry";
import * as Icons from "lucide-react";

// Initialize all element registrations
import "./registry/register-all";

/**
 * Hauptkomponente des Editor V2.
 * 2-Panel-Layout: LeftSidebar (Seiten/Elemente/Settings) | Canvas
 */
export default function EditorShell() {
  const [, params] = useRoute("/funnels/:id");
  const [, navigate] = useLocation();
  const funnelId = params?.id ? parseInt(params.id) : null;

  // Fetch funnel data
  const { data: funnel, isLoading, error } = useQuery<Funnel>({
    queryKey: ["/api/funnels", funnelId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/funnels/${funnelId}`);
      return res.json();
    },
    enabled: !!funnelId,
  });

  // Store state
  const initFunnel = useEditorStore((s) => s.initFunnel);
  const pages = useEditorStore((s) => s.pages);
  const theme = useEditorStore((s) => s.theme);
  const funnelName = useEditorStore((s) => s.funnelName);
  const status = useEditorStore((s) => s.status);
  const leftPanelOpen = useEditorStore((s) => s.leftPanelOpen);
  const addElement = useEditorStore((s) => s.addElement);
  const moveElement = useEditorStore((s) => s.moveElement);
  const setIsDragging = useEditorStore((s) => s.setIsDragging);
  const selectElement = useEditorStore((s) => s.selectElement);

  // Initialize store when funnel data loads
  useEffect(() => {
    if (funnel) {
      initFunnel({
        id: funnel.id,
        uuid: funnel.uuid,
        name: funnel.name,
        pages: funnel.pages,
        theme: funnel.theme,
        status: funnel.status,
      });
    }
  }, [funnel, initFunnel]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!funnelId) return;
      await apiRequest("PATCH", `/api/funnels/${funnelId}`, {
        name: funnelName,
        pages,
        theme,
        status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/funnels"] });
    },
  });

  const handleSave = useCallback(async () => {
    await saveMutation.mutateAsync();
  }, [saveMutation]);

  // Auto-save
  const { triggerSave } = useEditorAutoSave(handleSave);

  // Keyboard shortcuts
  useKeyboardShortcuts(triggerSave);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // DnD state for overlay
  const [activeDragData, setActiveDragData] = useState<{
    isNew: boolean;
    type?: string;
    elementId?: string;
  } | null>(null);

  // DnD handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setIsDragging(true);
    const data = event.active.data.current;
    if (data?.isNew) {
      setActiveDragData({ isNew: true, type: data.type });
    } else if (data?.type === "canvas-element") {
      setActiveDragData({ isNew: false, elementId: event.active.id as string });
    }
  }, [setIsDragging]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setIsDragging(false);
    setActiveDragData(null);
    const { active, over } = event;

    if (!over) return;

    const activeData = active.data.current;

    // New element from palette → add to canvas
    if (activeData?.isNew && activeData?.type) {
      const overData = over.data.current;
      let position: number | undefined;

      // If dropped on a specific element, insert after it
      if (overData?.type === "canvas-element") {
        const page = useEditorStore.getState().getCurrentPage();
        if (page) {
          const idx = page.elements.findIndex((el) => el.id === over.id);
          if (idx !== -1) position = idx + 1;
        }
      }

      addElement(activeData.type, position);
      return;
    }

    // Reorder existing element
    if (activeData?.type === "canvas-element" && active.id !== over.id) {
      const page = useEditorStore.getState().getCurrentPage();
      if (page) {
        const oldIndex = page.elements.findIndex((el) => el.id === active.id);
        const newIndex = page.elements.findIndex((el) => el.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          moveElement(active.id as string, newIndex);
        }
      }
    }
  }, [addElement, moveElement, setIsDragging]);

  const handleDragCancel = useCallback(() => {
    setIsDragging(false);
    setActiveDragData(null);
  }, [setIsDragging]);

  // Preview
  const handlePreview = useCallback(() => {
    const uuid = useEditorStore.getState().funnelUuid;
    if (uuid) {
      window.open(`/f/${uuid}`, "_blank");
    }
  }, []);

  // Publish
  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!funnelId) return;
      await apiRequest("PATCH", `/api/funnels/${funnelId}`, {
        name: funnelName,
        pages,
        theme,
        status: "published",
      });
    },
    onSuccess: () => {
      useEditorStore.setState({ status: "published" });
      queryClient.invalidateQueries({ queryKey: ["/api/funnels"] });
    },
  });

  const handlePublish = useCallback(() => {
    publishMutation.mutate();
  }, [publishMutation]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Editor wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error || !funnel) {
    return (
      <div className="h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <p className="text-sm text-destructive mb-2">Funnel konnte nicht geladen werden.</p>
          <button
            className="text-sm text-primary underline"
            onClick={() => navigate("/")}
          >
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="h-screen flex flex-col bg-background overflow-hidden">
          {/* Toolbar */}
          <EditorToolbar
            onSave={triggerSave}
            onPreview={handlePreview}
            onPublish={handlePublish}
          />

          {/* Main content area */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Left: Sidebar with tabs (Seiten/Elemente/Settings) */}
            <div
              className={`shrink-0 transition-all duration-300 ${
                leftPanelOpen ? "w-[320px]" : "w-0"
              } overflow-hidden`}
            >
              <div className="w-[320px] h-full">
                <LeftSidebar />
              </div>
            </div>

            {/* Center: Canvas */}
            <EditorCanvas />
          </div>
        </div>

        {/* Drag overlay - visual feedback while dragging */}
        <DragOverlay>
          {activeDragData && (
            <DragOverlayContent data={activeDragData} />
          )}
        </DragOverlay>
      </DndContext>
    </TooltipProvider>
  );
}

function DragOverlayContent({ data }: { data: { isNew: boolean; type?: string; elementId?: string } }) {
  if (data.isNew && data.type) {
    const definition = registry.get(data.type);
    const IconComponent = definition?.icon
      ? (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[definition.icon]
      : null;
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-primary/30 shadow-lg opacity-90">
        {IconComponent && <IconComponent className="h-4 w-4 text-primary" />}
        <span className="text-sm font-medium">{definition?.label || data.type}</span>
      </div>
    );
  }

  if (!data.isNew && data.elementId) {
    const page = useEditorStore.getState().getCurrentPage();
    const element = page?.elements.find((el) => el.id === data.elementId);
    if (element) {
      const definition = registry.get(element.type);
      const RenderComponent = definition?.renderComponent;
      if (RenderComponent) {
        return (
          <div className="opacity-70 shadow-lg rounded-lg p-2 bg-card border max-w-[300px]">
            <RenderComponent element={element} textColor="#1a1a1a" primaryColor="#7C3AED" />
          </div>
        );
      }
    }
  }

  return null;
}
