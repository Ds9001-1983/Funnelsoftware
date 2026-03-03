import React, { useMemo } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { useEditorStore } from "./store/editor-store";
import { DeviceFrame } from "./DevicePreview";
import { FunnelProgress } from "./FunnelProgress";
import { CanvasElement } from "./CanvasElement";

/**
 * Der zentrale Canvas-Bereich des Editors.
 * Zeigt die aktuelle Seite mit allen Elementen in einem Geräte-Rahmen.
 */
export function EditorCanvas() {
  const pages = useEditorStore((s) => s.pages);
  const currentPageId = useEditorStore((s) => s.currentPageId);
  const devicePreview = useEditorStore((s) => s.devicePreview);
  const theme = useEditorStore((s) => s.theme);
  const selectElement = useEditorStore((s) => s.selectElement);
  const isDragging = useEditorStore((s) => s.isDragging);

  const page = useMemo(
    () => pages.find((p) => p.id === currentPageId) || null,
    [pages, currentPageId]
  );
  const pageIndex = useMemo(
    () => pages.findIndex((p) => p.id === currentPageId),
    [pages, currentPageId]
  );

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: "canvas-drop-zone",
    data: { type: "canvas", accepts: "new-element" },
  });

  const elementIds = useMemo(
    () => page?.elements.map((el) => el.id) || [],
    [page?.elements]
  );

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only deselect if clicking on the canvas background, not on an element
    if (e.target === e.currentTarget) {
      selectElement(null);
    }
  };

  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30 p-8">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">Keine Seite ausgewählt</p>
          <p className="text-sm">Wähle eine Seite in der linken Seitenleiste aus.</p>
        </div>
      </div>
    );
  }

  const isWelcome = page.type === "welcome";
  const isThankyou = page.type === "thankyou";
  const bgColor = page.backgroundColor || (isWelcome || isThankyou ? theme.primaryColor : "#ffffff");
  const textColor = isWelcome || isThankyou ? "#ffffff" : theme.textColor;

  // Scale for device frame
  const scale = devicePreview === "mobile" ? 1 : devicePreview === "tablet" ? 0.6 : 0.5;

  return (
    <div
      className="flex-1 bg-muted/30 overflow-y-auto flex items-start justify-center p-8"
      onClick={handleCanvasClick}
    >
      <DeviceFrame device={devicePreview} scale={scale}>
        <div
          className="min-h-full flex flex-col"
          style={{ backgroundColor: bgColor }}
        >
          {/* Progress bar */}
          {!isWelcome && !isThankyou && pages.length > 1 && (
            <FunnelProgress
              currentPage={pageIndex}
              totalPages={pages.length}
              primaryColor={theme.primaryColor}
            />
          )}

          {/* Page title */}
          <div className="p-6 pb-2 text-center">
            <h2
              className="text-xl font-bold mb-2"
              style={{ color: textColor }}
            >
              {page.title}
            </h2>
            {page.subtitle && (
              <p
                className="text-sm opacity-80 mb-4"
                style={{ color: textColor }}
              >
                {page.subtitle}
              </p>
            )}
          </div>

          {/* Elements area - droppable */}
          <div
            ref={setDropRef}
            className={`flex-1 px-6 pb-4 space-y-2 transition-colors ${
              isOver && isDragging ? "bg-primary/5" : ""
            }`}
            onClick={handleCanvasClick}
          >
            {page.elements.length === 0 ? (
              <EmptyCanvasPlaceholder isOver={isOver && isDragging} />
            ) : (
              <SortableContext
                items={elementIds}
                strategy={verticalListSortingStrategy}
              >
                {page.elements.map((el) => (
                  <CanvasElement
                    key={el.id}
                    element={el}
                    textColor={textColor}
                    primaryColor={theme.primaryColor}
                  />
                ))}
              </SortableContext>
            )}
          </div>

          {/* Page button */}
          {page.buttonText && (
            <div className="p-6 pt-2">
              <button
                className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg cursor-default"
                style={{
                  backgroundColor: isWelcome || isThankyou ? "#ffffff" : theme.primaryColor,
                  color: isWelcome || isThankyou ? theme.primaryColor : "#ffffff",
                }}
              >
                {page.buttonText}
              </button>
            </div>
          )}
        </div>
      </DeviceFrame>
    </div>
  );
}

/**
 * Placeholder wenn die Seite keine Elemente hat.
 */
function EmptyCanvasPlaceholder({ isOver }: { isOver: boolean }) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-8 border-2 border-dashed rounded-xl transition-all ${
        isOver
          ? "border-primary bg-primary/10 text-primary"
          : "border-gray-300 text-muted-foreground"
      }`}
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
          isOver ? "bg-primary/20" : "bg-muted"
        }`}
      >
        <Plus className={`h-6 w-6 ${isOver ? "text-primary" : ""}`} />
      </div>
      <p className="text-sm font-medium mb-1">
        {isOver ? "Element hier ablegen" : "Elemente hinzufügen"}
      </p>
      <p className="text-xs opacity-70">
        Ziehe Elemente aus der linken Seitenleiste hierher
      </p>
    </div>
  );
}
