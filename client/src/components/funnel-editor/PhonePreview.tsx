import { useState, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Layers, Plus } from "lucide-react";
import type { FunnelPage, PageElement } from "@shared/schema";
import { FunnelProgress } from "./FunnelProgress";
import { ElementPreviewRenderer, SectionPreviewRenderer } from "./ElementPreviewRenderer";
import { ElementWrapper } from "./ElementWrapper";

interface PreviewDropZoneProps {
  id: string;
  children?: React.ReactNode;
}

/**
 * Drop-Zone zwischen Elementen in der Vorschau.
 * Zeigt einen visuellen Indikator, wenn ein Element darüber gezogen wird.
 */
function PreviewDropZone({ id, children }: PreviewDropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { type: "preview-drop-zone" },
  });

  return (
    <div
      ref={setNodeRef}
      className={`transition-all duration-200 ${
        isOver
          ? "py-3"
          : "py-0.5"
      }`}
    >
      {isOver ? (
        <div className="h-1 bg-primary rounded-full mx-2 animate-pulse" />
      ) : children ? (
        children
      ) : null}
    </div>
  );
}

/**
 * Leere Drop-Zone wenn keine Elemente vorhanden sind.
 */
function EmptyPreviewDropZone() {
  const { isOver, setNodeRef } = useDroppable({
    id: "preview-drop-empty",
    data: { type: "preview-drop-zone" },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed transition-all duration-200 ${
        isOver
          ? "border-primary bg-primary/10"
          : "border-gray-300/60"
      }`}
    >
      <Plus className={`h-8 w-8 mb-2 ${isOver ? "text-primary" : "text-gray-400"}`} />
      <p className={`text-sm font-medium ${isOver ? "text-primary" : "text-gray-500"}`}>
        {isOver ? "Element hier ablegen" : "Element hierhin ziehen"}
      </p>
      <p className="text-xs text-gray-400 mt-1">
        oder aus der Palette links klicken
      </p>
    </div>
  );
}

interface PhonePreviewProps {
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
}

/**
 * Enhanced Phone Preview with inline editing, element selection and drag-and-drop.
 * Displays a funnel page with elements rendered in their actual order,
 * with drop zones between elements for Elementor-style DnD.
 */
export function PhonePreview({
  page,
  pageIndex,
  totalPages,
  primaryColor,
  onUpdatePage,
  selectedElementId,
  onSelectElement,
  onAddElement,
}: PhonePreviewProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [localTitle, setLocalTitle] = useState(page?.title || "");
  const [localSubtitle, setLocalSubtitle] = useState(page?.subtitle || "");
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocalTitle(page?.title || "");
    setLocalSubtitle(page?.subtitle || "");
  }, [page?.title, page?.subtitle]);

  const updateFormValue = (elementId: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [elementId]: value }));
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
          {page.subtitle !== undefined &&
            (editingField === "subtitle" ? (
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
            ))}

          {/* Elements rendered in order with drop zones */}
          {page.elements.length > 0 ? (
            <div className="mt-4 space-y-0">
              {/* Drop zone before first element */}
              <PreviewDropZone id="preview-drop-0" />

              {page.elements.map((el, index) => (
                <div key={el.id}>
                  <ElementPreviewRenderer
                    element={el}
                    textColor={textColor}
                    primaryColor={primaryColor}
                    selectedElementId={selectedElementId}
                    onSelectElement={onSelectElement}
                    formValues={formValues}
                    updateFormValue={updateFormValue}
                  />
                  {/* Drop zone after each element */}
                  <PreviewDropZone id={`preview-drop-${index + 1}`} />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyPreviewDropZone />
            </div>
          )}

          {/* Sections with Columns */}
          {page.sections && page.sections.length > 0 && (
            <div className="mt-4 space-y-4">
              {page.sections.map((section) => (
                <SectionPreviewRenderer
                  key={section.id}
                  section={section}
                  selectedElementId={selectedElementId}
                  onSelectElement={onSelectElement}
                />
              ))}
            </div>
          )}
        </div>

        {/* Page button */}
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
