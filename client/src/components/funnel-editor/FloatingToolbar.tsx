import { useState, useRef, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import {
  Plus,
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  X,
  Type,
  Image,
  Video,
  FormInput,
  List,
  HelpCircle,
  Clock,
  Star,
  Minus,
  Space,
  CheckSquare,
  Calendar,
  FileUp,
  Music,
  MapPin,
  Code,
  BarChart2,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { elementCategories } from "./constants";
import type { PageElement } from "@shared/schema";

interface FloatingToolbarProps {
  elementId: string;
  elementType: string;
  position: { top: number; right: number };
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

/**
 * Floating Toolbar außerhalb der Preview.
 * Wird rechts neben dem ausgewählten Element angezeigt.
 */
export function FloatingToolbar({
  elementId,
  elementType,
  position,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  canMoveUp = true,
  canMoveDown = true,
}: FloatingToolbarProps) {
  return (
    <div
      className="fixed z-[100] flex flex-col gap-1 bg-white rounded-lg shadow-xl border p-1.5 animate-in slide-in-from-left-2"
      style={{
        top: position.top,
        right: position.right,
      }}
    >
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={onMoveUp}
        disabled={!canMoveUp}
        title="Nach oben"
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={onMoveDown}
        disabled={!canMoveDown}
        title="Nach unten"
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
      <div className="h-px bg-border my-0.5" />
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={onDuplicate}
        title="Duplizieren"
      >
        <Copy className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={onDelete}
        title="Löschen"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface InlineElementPickerProps {
  onAddElement: (type: PageElement["type"]) => void;
  onClose?: () => void;
}

interface DraggablePickerItemProps {
  type: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onAdd: () => void;
}

function DraggablePickerItem({ type, label, icon: Icon, onAdd }: DraggablePickerItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `picker-${type}`,
    data: { type, isNew: true },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onAdd();
      }}
      className={`
        flex flex-col items-center justify-center p-2 rounded-lg cursor-grab
        bg-white/80 hover:bg-primary/10 border border-gray-200 hover:border-primary/50
        transition-all duration-150 group
        ${isDragging ? "opacity-50 scale-95 ring-2 ring-primary shadow-lg" : ""}
      `}
      title={`${label} hinzufügen (Klicken oder Ziehen)`}
    >
      <Icon className={`h-5 w-5 mb-1 ${isDragging ? "text-primary" : "text-gray-500 group-hover:text-primary"}`} />
      <span className="text-[10px] font-medium text-gray-600 group-hover:text-primary truncate w-full text-center">
        {label}
      </span>
    </div>
  );
}

/**
 * Inline Element Picker - erscheint direkt in der Preview.
 * Alle Elemente auf einen Blick, per Klick oder Drag & Drop hinzufügbar.
 */
export function InlineElementPicker({ onAddElement, onClose }: InlineElementPickerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Alle Elemente flach zusammenfassen
  const allElements = elementCategories.flatMap(cat => cat.elements);

  // Häufig verwendete Elemente
  const quickElements = allElements.slice(0, 8);
  const moreElements = allElements.slice(8);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={pickerRef}
      className="relative my-4 mx-2"
    >
      {!isExpanded ? (
        // Collapsed: Plus-Button mit Hinweis
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full py-4 border-2 border-dashed border-gray-300/60 hover:border-primary/50 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:bg-white/50 group"
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
            <Plus className="h-5 w-5 text-gray-400 group-hover:text-primary" />
          </div>
          <span className="text-xs text-gray-400 group-hover:text-primary">Element hinzufügen</span>
        </button>
      ) : (
        // Expanded: Element Grid
        <div className="bg-white/95 backdrop-blur rounded-xl border border-gray-200 shadow-lg p-3 animate-in fade-in-0 zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-600">Element wählen oder ziehen</span>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded hover:bg-gray-100"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          {/* Quick Elements Grid */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            {quickElements.map((el) => (
              <DraggablePickerItem
                key={el.type}
                type={el.type}
                label={el.label}
                icon={el.icon}
                onAdd={() => {
                  onAddElement(el.type as PageElement["type"]);
                  setIsExpanded(false);
                }}
              />
            ))}
          </div>

          {/* More Elements (expandable) */}
          {moreElements.length > 0 && (
            <>
              <button
                onClick={() => {}}
                className="w-full text-xs text-gray-400 hover:text-primary py-1 flex items-center justify-center gap-1"
              >
                <span>Mehr Elemente</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {moreElements.map((el) => (
                  <DraggablePickerItem
                    key={el.type}
                    type={el.type}
                    label={el.label}
                    icon={el.icon}
                    onAdd={() => {
                      onAddElement(el.type as PageElement["type"]);
                      setIsExpanded(false);
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Hook zur Berechnung der Toolbar-Position basierend auf dem ausgewählten Element.
 */
export function useToolbarPosition(
  selectedElementId: string | null,
  containerRef: React.RefObject<HTMLElement>
) {
  const [position, setPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (!selectedElementId || !containerRef.current) {
      return;
    }

    const element = document.querySelector(`[data-element-id="${selectedElementId}"]`);
    const container = containerRef.current;

    if (element && container) {
      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      setPosition({
        top: elementRect.top + window.scrollY,
        right: window.innerWidth - containerRect.right + 16,
      });
    }
  }, [selectedElementId, containerRef]);

  return position;
}
