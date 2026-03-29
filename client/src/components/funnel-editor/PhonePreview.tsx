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
import type { FunnelPage, PageElement } from "@shared/schema";
import { FunnelProgress } from "./FunnelProgress";
import { ElementPreviewRenderer, SectionPreviewRenderer } from "./ElementPreviewRenderer";
import { ElementWrapper } from "./ElementWrapper";

interface SortablePreviewElementProps {
  element: PageElement;
  textColor: string;
  primaryColor: string;
  selectedElementId?: string | null;
  onSelectElement?: (elementId: string | null) => void;
  formValues: Record<string, string>;
  updateFormValue: (elementId: string, value: string) => void;
  pageType: string;
}

function SortablePreviewElement({
  element,
  textColor,
  primaryColor,
  selectedElementId,
  onSelectElement,
  formValues,
  updateFormValue,
  pageType,
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

  // Multi-choice options get special treatment
  if (
    (pageType === "multiChoice" || pageType === "question") &&
    element.options
  ) {
    return (
      <div ref={setNodeRef} style={style} className="group">
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10 bg-white rounded-md shadow-sm border p-0.5"
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <ElementWrapper
          elementId={element.id}
          elementType={element.type}
          selectedElementId={selectedElementId}
          onSelectElement={onSelectElement}
        >
          <div className="space-y-2">
            {element.options.map((option, idx) => (
              <div
                key={`${element.id}-${idx}`}
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 text-sm text-left bg-white hover:border-primary/50 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
              >
                {option}
              </div>
            ))}
          </div>
        </ElementWrapper>
      </div>
    );
  }

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
        textColor={textColor}
        primaryColor={primaryColor}
        selectedElementId={selectedElementId}
        onSelectElement={onSelectElement}
        formValues={formValues}
        updateFormValue={updateFormValue}
      />
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
  onReorderElements?: (oldIndex: number, newIndex: number) => void;
}

/**
 * Enhanced Phone Preview with inline editing and element selection.
 * Displays a funnel page in a phone-like frame with interactive elements.
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
  onReorderElements,
}: PhonePreviewProps) {
  const [isDropOver, setIsDropOver] = useState(false);

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
  const bgColor = page.backgroundColor || (isWelcome || isThankyou ? primaryColor : "#ffffff");
  const textColor = isWelcome || isThankyou ? "#ffffff" : "#1a1a1a";

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
                <div className="mt-4 space-y-3">
                  {page.elements.map((el) => (
                    <SortablePreviewElement
                      key={el.id}
                      element={el}
                      textColor={textColor}
                      primaryColor={primaryColor}
                      selectedElementId={selectedElementId}
                      onSelectElement={onSelectElement}
                      formValues={formValues}
                      updateFormValue={updateFormValue}
                      pageType={page.type}
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
