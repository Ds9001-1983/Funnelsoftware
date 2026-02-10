import { useState, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import type { PageElement } from "@shared/schema";
import { elementCategories } from "./constants";

interface CanvasDropZoneProps {
  id: string;
  onAddElement: (type: PageElement["type"]) => void;
}

/**
 * Drop-Zone zwischen Elementen im Canvas mit Plus-Button.
 * Zeigt Drop-Indikator beim Drag und einen Plus-Button bei Hover.
 * Der Plus-Button öffnet ein Element-Picker-Popover.
 */
export function CanvasDropZone({ id, onAddElement }: CanvasDropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { type: "canvas-drop-zone" },
  });
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    }
    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showPicker]);

  return (
    <div
      ref={setNodeRef}
      className={`relative group transition-all duration-200 ${
        isOver ? "py-3" : "py-1"
      }`}
    >
      {/* Drop-Indikator (beim Drag) */}
      {isOver && (
        <div className="h-1 bg-primary rounded-full mx-2 animate-pulse" />
      )}

      {/* Plus-Button (bei Hover, wenn nicht gerade Drop aktiv) */}
      {!isOver && (
        <div className="flex justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowPicker(!showPicker);
            }}
            className="w-5 h-5 rounded-full bg-primary/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-125 hover:bg-primary"
            title="Element hinzufügen"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Element-Picker Popover */}
      {showPicker && (
        <div ref={pickerRef} className="absolute left-1/2 -translate-x-1/2 z-50 mt-1">
          <ElementPickerPopover
            onAdd={(type) => {
              onAddElement(type);
              setShowPicker(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

interface EmptyCanvasDropZoneProps {
  onAddElement: (type: PageElement["type"]) => void;
}

/**
 * Leere Drop-Zone wenn der Canvas keine Elemente hat.
 * Zeigt einen großen Bereich zum Ablegen oder Klicken.
 */
export function EmptyCanvasDropZone({ onAddElement }: EmptyCanvasDropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: "canvas-drop-empty",
    data: { type: "canvas-drop-zone" },
  });
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    }
    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showPicker]);

  return (
    <div className="relative">
      <div
        ref={setNodeRef}
        onClick={() => setShowPicker(!showPicker)}
        className={`flex flex-col items-center justify-center py-16 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
          isOver
            ? "border-primary bg-primary/10"
            : "border-gray-300/60 hover:border-primary/50 hover:bg-primary/5"
        }`}
      >
        <Plus className={`h-10 w-10 mb-3 ${isOver ? "text-primary" : "text-gray-400"}`} />
        <p className={`text-sm font-medium ${isOver ? "text-primary" : "text-gray-500"}`}>
          {isOver ? "Element hier ablegen" : "Element hinzufügen"}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Ziehe ein Element hierhin oder klicke zum Auswählen
        </p>
      </div>

      {showPicker && (
        <div ref={pickerRef} className="absolute left-1/2 -translate-x-1/2 top-full z-50 mt-2">
          <ElementPickerPopover
            onAdd={(type) => {
              onAddElement(type);
              setShowPicker(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

interface ElementPickerPopoverProps {
  onAdd: (type: PageElement["type"]) => void;
}

/**
 * Kompaktes Element-Picker-Popover als Grid.
 * Zeigt die wichtigsten Elemente in einem schnell-zugänglichen Grid.
 */
function ElementPickerPopover({ onAdd }: ElementPickerPopoverProps) {
  return (
    <div className="w-72 bg-white rounded-xl shadow-2xl border p-3 max-h-80 overflow-y-auto">
      {elementCategories.map((category) => (
        <div key={category.name} className="mb-2 last:mb-0">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-1">
            {category.name}
          </div>
          <div className="grid grid-cols-2 gap-1">
            {category.elements.map((el) => (
              <button
                key={el.type}
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd(el.type);
                }}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-accent transition-colors"
              >
                <el.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium truncate">{el.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
