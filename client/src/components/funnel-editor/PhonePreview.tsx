import type { PersonalizationContext } from "@shared/funnel-personalization";
import { useState, useEffect, useCallback } from "react";
import { GripVertical, Layers } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { FunnelPage, PageElement, Theme } from "@shared/schema";
import { designButtonStyle, resolveDesign } from "@shared/funnel-layout";
import { loadFont } from "@/lib/font-loader";
import { FunnelProgress } from "./FunnelProgress";
import { ElementPreviewRenderer, SectionPreviewRenderer } from "./ElementPreviewRenderer";

import type { ElementActions } from "./ElementPreviewRenderer";

interface SortablePreviewElementProps extends ElementActions {
  element: PageElement;
  personalizationContext?: PersonalizationContext;
  textColor: string;
  primaryColor: string;
  design?: Theme["design"];
  selectedElementId?: string | null;
  onSelectElement?: (elementId: string | null) => void;
  formValues: Record<string, string>;
  updateFormValue: (elementId: string, value: string) => void;
  onContentCommit?: (content: string) => void;
}

function SortablePreviewElement({
  element,
  personalizationContext,
  textColor,
  primaryColor,
  design,
  selectedElementId,
  onSelectElement,
  formValues,
  updateFormValue,
  onContentCommit,
  ...actions
}: SortablePreviewElementProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
  };


  return (
    <div ref={setNodeRef} style={style} className="group">
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10 bg-white rounded-md shadow-sm border p-0.5"
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <ElementPreviewRenderer
        element={element}
        personalizationContext={personalizationContext}
        textColor={textColor}
        primaryColor={primaryColor}
        design={design}
        selectedElementId={selectedElementId}
        onSelectElement={onSelectElement}
        formValues={formValues}
        updateFormValue={updateFormValue}
        onContentCommit={onContentCommit}
        {...actions}
      />
    </div>
  );
}

interface PhonePreviewProps {
  page: FunnelPage | null;
  personalizationContext?: PersonalizationContext;
  pageIndex: number;
  totalPages: number;
  primaryColor: string;
  theme?: Theme;
  onUpdatePage?: (updates: Partial<FunnelPage>) => void;
  isEditing?: boolean;
  setIsEditing?: (editing: boolean) => void;
  selectedElementId?: string | null;
  onSelectElement?: (elementId: string | null) => void;
  onAddElement?: (type: PageElement["type"]) => void;
  onDeleteElement?: () => void;
  onDuplicateElement?: () => void;
  onCopyElement?: () => void;
  onCutElement?: () => void;
  onPasteElement?: () => void;
  canPasteElement?: boolean;
  onMoveElementUp?: () => void;
  onMoveElementDown?: () => void;
  canMoveElementUp?: boolean;
  canMoveElementDown?: boolean;
  onShowElementPicker?: () => void;
  onReorderElements?: (oldIndex: number, newIndex: number) => void;
  /** Inline-Edit commit für ein konkretes Element (heading/text/button). */
  onUpdateElementContent?: (elementId: string, content: string) => void;
}

/**
 * Enhanced Phone Preview with inline editing and element selection.
 * Displays a funnel page in a phone-like frame with interactive elements.
 */
export function PhonePreview({
  page,
  personalizationContext,
  pageIndex,
  totalPages,
  primaryColor,
  theme,
  onUpdatePage,
  selectedElementId,
  onSelectElement,
  onAddElement,
  onReorderElements,
  onDeleteElement,
  onDuplicateElement,
  onCopyElement,
  onCutElement,
  onPasteElement,
  canPasteElement,
  onMoveElementUp,
  onMoveElementDown,
  canMoveElementUp,
  canMoveElementDown,
  onUpdateElementContent,
}: PhonePreviewProps) {
  theme = page?.themeOverride ?? theme;
  primaryColor = theme?.primaryColor ?? primaryColor;
  const [isDropOver, setIsDropOver] = useState(false);
  useEffect(() => {
    if (page && theme) loadFont(resolveDesign(theme, page).fontFamily);
  }, [page, theme]);

  // DnD Sensors - 8px Distanz um Klick vs Drag zu unterscheiden
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleSortDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !page) return;

    const oldIndex = page.elements.findIndex((el) => el.id === active.id);
    const newIndex = page.elements.findIndex((el) => el.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1 && onReorderElements) {
      onReorderElements(oldIndex, newIndex);
    }
  }, [page, onReorderElements]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDropOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDropOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDropOver(false);
    const elementType = e.dataTransfer.getData("elementType");
    if (elementType && onAddElement) {
      onAddElement(elementType as PageElement["type"]);
    }
  }, [onAddElement]);

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
  const resolved = resolveDesign(theme ?? { primaryColor, backgroundColor: "#ffffff", textColor: "#1a1a1a", fontFamily: "Inter" }, page);
  const textColor = resolved.textColor;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`preview-container w-full rounded-lg shadow-lg border overflow-hidden transition-all duration-200 ${
        isDropOver
          ? "border-primary border-2 ring-2 ring-primary/20"
          : "border-gray-200"
      }`}
    >
      <div
        className="min-h-[500px] flex flex-col overflow-hidden"
        data-testid="phone-preview-content"
        style={{ backgroundColor: resolved.backgroundColor, color: textColor, fontFamily: resolved.fontFamily }}
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
              style={{ color: textColor, fontSize: resolved.headingSize }}
            />
          ) : (
            <h2
              className="text-2xl md:text-3xl font-bold mb-2 cursor-pointer hover:opacity-80 transition-opacity"
              style={{ color: textColor, fontSize: resolved.headingSize }}
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
                style={{ color: textColor, fontSize: resolved.bodySize }}
                rows={2}
              />
            ) : (
              <p
                className="text-base opacity-70 mb-6 cursor-pointer hover:opacity-60 transition-opacity"
                style={{ color: textColor, fontSize: resolved.bodySize }}
                onClick={() => onUpdatePage && setEditingField("subtitle")}
                title="Klicken zum Bearbeiten"
              >
                {page.subtitle || "Untertitel hinzufügen..."}
              </p>
            ))}

          {/* Empty-State: keine Elemente, keine Sektionen */}
          {page.elements.length === 0 && (!page.sections || page.sections.length === 0) && (
            <div
              className="mt-8 mx-auto max-w-[280px] rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-6 text-center"
              style={{ color: textColor }}
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Layers className="h-5 w-5 opacity-60" />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: textColor }}>
                Noch keine Elemente
              </p>
              <p className="text-xs opacity-70 leading-relaxed">
                Ziehe ein Element aus der Palette links oder drücke{" "}
                <kbd className="px-1 py-0.5 rounded bg-background/60 text-[10px] font-semibold">⌘K</kbd>
                {" "}für die Command-Palette.
              </p>
            </div>
          )}

          {/* All elements with Drag & Drop reordering */}
          {page.elements.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSortDragEnd}
            >
              <SortableContext
                items={page.elements.map((el) => el.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="mt-4 flex flex-col" style={{ gap: resolved.spacing }}>
                  {page.elements.map((el, idx) => (
                    <SortablePreviewElement
                      key={el.id}
                      element={el}
                      personalizationContext={personalizationContext}
                      textColor={textColor}
                      primaryColor={primaryColor}
                      design={theme?.design}
                      selectedElementId={selectedElementId}
                      onSelectElement={onSelectElement}
                      formValues={formValues}
                      updateFormValue={updateFormValue}
                      // Actions operieren auf dem gerade selektierten Element.
                      // ElementWrapper selektiert bei Rechtsklick via onContextMenu
                      // synchron, bevor das Menü aufgeht – also wirken die Handler
                      // auf genau das Element, auf das der Nutzer geklickt hat.
                      onCopy={onCopyElement}
                      onCut={onCutElement}
                      onPaste={onPasteElement}
                      canPaste={canPasteElement}
                      onDuplicate={onDuplicateElement}
                      onDelete={onDeleteElement}
                      onMoveUp={onMoveElementUp}
                      onMoveDown={onMoveElementDown}
                      canMoveUp={canMoveElementUp ?? idx > 0}
                      canMoveDown={canMoveElementDown ?? idx < page.elements.length - 1}
                      onContentCommit={
                        onUpdateElementContent
                          ? (content) => onUpdateElementContent(el.id, content)
                          : undefined
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
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
              className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-[0.98] shadow-lg"
              style={designButtonStyle(primaryColor, theme?.design)}
            >
              {page.buttonText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
