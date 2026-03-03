import { useState } from "react";
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
  ChevronRight,
  ChevronDown,
  GripVertical,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Type,
  Image,
  Video,
  Layout,
  Square,
  Circle,
  Layers,
  FileText,
  FormInput,
  List,
  HelpCircle,
  Clock,
  Star,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FunnelPage, PageElement, Section } from "@shared/schema";

interface NavigatorPanelProps {
  page: FunnelPage;
  selectedElementId: string | null;
  onSelectElement: (elementId: string | null) => void;
  onReorderElements: (oldIndex: number, newIndex: number) => void;
  onRenameElement?: (elementId: string, name: string) => void;
  onDeleteElement?: (elementId: string) => void;
  onDuplicateElement?: (elementId: string) => void;
}

// Mapping von Element-Typen zu Icons
const elementIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  heading: Type,
  text: FileText,
  image: Image,
  video: Video,
  input: FormInput,
  textarea: FormInput,
  select: FormInput,
  radio: Circle,
  checkbox: Square,
  list: List,
  faq: HelpCircle,
  timer: Clock,
  testimonial: Star,
  divider: Layout,
  spacer: Layout,
  button: Square,
  section: Layers,
};

// Mapping von Element-Typen zu Labels
const elementLabels: Record<string, string> = {
  heading: "Überschrift",
  text: "Text",
  image: "Bild",
  video: "Video",
  input: "Eingabefeld",
  textarea: "Textbereich",
  select: "Dropdown",
  radio: "Auswahl",
  checkbox: "Checkbox",
  list: "Liste",
  faq: "FAQ",
  timer: "Timer",
  testimonial: "Bewertung",
  divider: "Trennlinie",
  spacer: "Abstand",
  button: "Button",
  section: "Sektion",
};

interface NavigatorItemProps {
  element: PageElement;
  isSelected: boolean;
  onSelect: () => void;
  onRename?: (name: string) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  depth?: number;
}

/**
 * Einzelnes Element im Navigator.
 */
function NavigatorItem({
  element,
  isSelected,
  onSelect,
  onRename,
  onDelete,
  onDuplicate,
  depth = 0,
}: NavigatorItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localName, setLocalName] = useState(element.label || elementLabels[element.type] || element.type);

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
  };

  const Icon = elementIcons[element.type] || Square;

  const handleRename = () => {
    setIsEditing(false);
    if (localName !== (element.label || elementLabels[element.type])) {
      onRename?.(localName);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, paddingLeft: `${depth * 16 + 4}px` }}
      className={`
        group flex items-center gap-1 py-1 px-1 rounded cursor-pointer transition-colors
        ${isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"}
        ${isDragging ? "z-50 shadow-lg bg-white" : ""}
      `}
      onClick={onSelect}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>

      {/* Icon */}
      <Icon className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />

      {/* Name */}
      {isEditing ? (
        <Input
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRename();
            if (e.key === "Escape") {
              setIsEditing(false);
              setLocalName(element.label || elementLabels[element.type] || element.type);
            }
          }}
          className="h-5 px-1 py-0 text-xs flex-1"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="text-xs truncate flex-1"
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          {element.label || elementLabels[element.type] || element.type}
        </span>
      )}

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditing(true)}>
            Umbenennen
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDuplicate?.()}>
            Duplizieren
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete?.()} className="text-red-600">
            Löschen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * Navigator-Panel zur Anzeige aller Elemente als Baumstruktur.
 * Ermöglicht das Auswählen, Umbenennen und Neuordnen von Elementen.
 */
export function NavigatorPanel({
  page,
  selectedElementId,
  onSelectElement,
  onReorderElements,
  onRenameElement,
  onDeleteElement,
  onDuplicateElement,
}: NavigatorPanelProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = page.elements.findIndex((el) => el.id === active.id);
      const newIndex = page.elements.findIndex((el) => el.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderElements(oldIndex, newIndex);
      }
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Filter elements by search query
  const filteredElements = searchQuery
    ? page.elements.filter((el) => {
        const label = el.label || elementLabels[el.type] || el.type;
        return label.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : page.elements;

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-2 border-b">
        <Input
          placeholder="Element suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-7 text-xs"
        />
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Page root */}
        <div className="mb-2">
          <div
            className="flex items-center gap-1 py-1 px-1 text-xs font-medium text-muted-foreground cursor-pointer hover:bg-muted rounded"
            onClick={() => onSelectElement(null)}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>{page.title || "Seite"}</span>
            <span className="ml-auto text-[10px]">{page.elements.length} Elemente</span>
          </div>
        </div>

        {/* Sections */}
        {page.sections && page.sections.length > 0 && (
          <div className="mb-2">
            {page.sections.map((section) => {
              const isExpanded = expandedSections.includes(section.id);
              return (
                <div key={section.id}>
                  <div
                    className="flex items-center gap-1 py-1 px-1 text-xs cursor-pointer hover:bg-muted rounded"
                    onClick={() => toggleSection(section.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{section.name || "Sektion"}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {section.columns.reduce((acc, col) => acc + col.elements.length, 0)}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="ml-4">
                      {section.columns.map((column, colIndex) => (
                        <div key={column.id} className="mb-1">
                          <div className="flex items-center gap-1 py-0.5 px-1 text-[10px] text-muted-foreground">
                            Spalte {colIndex + 1} ({column.width}%)
                          </div>
                          {column.elements.map((element) => (
                            <NavigatorItem
                              key={element.id}
                              element={element}
                              isSelected={selectedElementId === element.id}
                              onSelect={() => onSelectElement(element.id)}
                              onRename={(name) => onRenameElement?.(element.id, name)}
                              onDelete={() => onDeleteElement?.(element.id)}
                              onDuplicate={() => onDuplicateElement?.(element.id)}
                              depth={2}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Elements */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredElements.map((el) => el.id)}
            strategy={verticalListSortingStrategy}
          >
            {filteredElements.map((element) => (
              <NavigatorItem
                key={element.id}
                element={element}
                isSelected={selectedElementId === element.id}
                onSelect={() => onSelectElement(element.id)}
                onRename={(name) => onRenameElement?.(element.id, name)}
                onDelete={() => onDeleteElement?.(element.id)}
                onDuplicate={() => onDuplicateElement?.(element.id)}
                depth={1}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Empty state */}
        {filteredElements.length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground">
            {searchQuery ? "Keine Elemente gefunden" : "Keine Elemente vorhanden"}
          </div>
        )}
      </div>

      {/* Footer with element count */}
      <div className="p-2 border-t text-[10px] text-muted-foreground">
        {page.elements.length} Elemente
        {page.sections && page.sections.length > 0 && ` • ${page.sections.length} Sektionen`}
      </div>
    </div>
  );
}
