import { useState, useEffect, Fragment } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Layers } from "lucide-react";
import type { FunnelPage, PageElement } from "@shared/schema";
import { FunnelProgress } from "./FunnelProgress";
import { SectionPreviewRenderer } from "./ElementPreviewRenderer";
import { SortableCanvasElement } from "./SortableCanvasElement";
import { CanvasDropZone, EmptyCanvasDropZone } from "./CanvasDropZone";

interface EditorCanvasProps {
  page: FunnelPage | null;
  pageIndex: number;
  totalPages: number;
  primaryColor: string;
  selectedElementId: string | null;
  onSelectElement: (elementId: string | null) => void;
  onUpdatePage: (updates: Partial<FunnelPage>) => void;
  onAddElementAtIndex: (type: PageElement["type"], index: number) => void;
  onDeleteElement: (elementId: string) => void;
  onDuplicateElement: (elementId: string) => void;
  isDragActive?: boolean;
}

/**
 * Interaktiver Editor-Canvas (Elementor-Stil).
 * Ersetzt PhonePreview als Haupt-Bearbeitungsfläche.
 * Elemente sind sortierbar (Drag-to-Reorder) mit Drop-Zonen und Plus-Buttons dazwischen.
 */
export function EditorCanvas({
  page,
  pageIndex,
  totalPages,
  primaryColor,
  selectedElementId,
  onSelectElement,
  onUpdatePage,
  onAddElementAtIndex,
  onDeleteElement,
  onDuplicateElement,
  isDragActive = false,
}: EditorCanvasProps) {
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
    if (localTitle !== page?.title) {
      onUpdatePage({ title: localTitle });
    }
    setEditingField(null);
  };

  const handleSubtitleSave = () => {
    if (localSubtitle !== page?.subtitle) {
      onUpdatePage({ subtitle: localSubtitle });
    }
    setEditingField(null);
  };

  // Kein Seiten-Auswahl
  if (!page) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center bg-muted/30">
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
    <div
      className="w-full rounded-lg shadow-lg border border-gray-200 overflow-hidden"
      onClick={() => onSelectElement(null)}
    >
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

        <div className="flex-1 flex flex-col p-6 text-center overflow-y-auto">
          {/* Editierbarer Titel */}
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
              onClick={(e) => {
                e.stopPropagation();
                setEditingField("title");
              }}
              title="Klicken zum Bearbeiten"
            >
              {page.title}
            </h2>
          )}

          {/* Editierbarer Untertitel */}
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
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingField("subtitle");
                }}
                title="Klicken zum Bearbeiten"
              >
                {page.subtitle || "Untertitel hinzufügen..."}
              </p>
            ))}

          {/* Elemente mit SortableContext + Drop-Zonen */}
          {page.elements.length > 0 ? (
            <div className="mt-4">
              <SortableContext
                items={page.elements.map((el) => el.id)}
                strategy={verticalListSortingStrategy}
              >
                {/* Drop-Zone vor dem ersten Element */}
                <CanvasDropZone
                  id="canvas-drop-0"
                  onAddElement={(type) => onAddElementAtIndex(type, 0)}
                  isDragActive={isDragActive}
                />

                {page.elements.map((el, index) => (
                  <Fragment key={el.id}>
                    <SortableCanvasElement
                      element={el}
                      textColor={textColor}
                      primaryColor={primaryColor}
                      isSelected={selectedElementId === el.id}
                      onSelect={() => onSelectElement(el.id)}
                      onDelete={() => onDeleteElement(el.id)}
                      onDuplicate={() => onDuplicateElement(el.id)}
                      formValues={formValues}
                      updateFormValue={updateFormValue}
                    />
                    {/* Drop-Zone nach jedem Element */}
                    <CanvasDropZone
                      id={`canvas-drop-${index + 1}`}
                      onAddElement={(type) => onAddElementAtIndex(type, index + 1)}
                      isDragActive={isDragActive}
                    />
                  </Fragment>
                ))}
              </SortableContext>
            </div>
          ) : (
            <div className="mt-4">
              <EmptyCanvasDropZone
                onAddElement={(type) => onAddElementAtIndex(type, 0)}
                isDragActive={isDragActive}
              />
            </div>
          )}

          {/* Sections mit Spalten */}
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

        {/* Seiten-Button */}
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
