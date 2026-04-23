import { useState, ReactNode } from "react";
import {
  Copy,
  ClipboardPaste,
  Trash2,
  MoveUp,
  MoveDown,
  Scissors,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

// Element type labels for display - Extended with OpenFunnels types
export const elementTypeLabels: Record<string, string> = {
  // Basic
  heading: "Überschrift",
  text: "Text",
  image: "Bild",
  button: "Button",
  // Media
  video: "Video",
  audio: "Audio",
  embed: "Einbetten",
  // Form
  input: "Eingabefeld",
  textarea: "Textbereich",
  select: "Dropdown",
  radio: "Auswahl",
  checkbox: "Checkbox",
  date: "Datum",
  fileUpload: "Datei-Upload",
  calendar: "Kalender",
  // Interactive
  list: "Liste",
  faq: "FAQ",
  timer: "Timer",
  countdown: "Countdown",
  progressBar: "Fortschritt",
  // Social Proof
  testimonial: "Bewertung",
  slider: "Slider",
  socialProof: "Social Proof",
  team: "Team",
  // Advanced
  map: "Karte",
  chart: "Diagramm",
  code: "Code",
  // E-Commerce
  product: "Produkt",
  // Layout
  divider: "Trennlinie",
  spacer: "Abstand",
  icon: "Icon",
};

interface ElementWrapperProps {
  elementId: string;
  elementType: string;
  selectedElementId?: string | null;
  onSelectElement?: (elementId: string | null) => void;
  children: ReactNode;
  /** Context-menu actions. Wenn mindestens einer gesetzt ist, wird bei
   * Rechtsklick ein Kontextmenü angezeigt. */
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  canPaste?: boolean;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

/**
 * Wrapper component for elements in the preview with selection handling.
 * Provides visual feedback for hover and selection states.
 * Optional: Right-click context-menu with element actions.
 */
export function ElementWrapper({
  elementId,
  elementType,
  selectedElementId,
  onSelectElement,
  children,
  onCopy,
  onCut,
  onPaste,
  canPaste,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
}: ElementWrapperProps) {
  const isSelected = selectedElementId === elementId;
  const [isHovered, setIsHovered] = useState(false);

  const hasContextMenu =
    !!(onCopy || onCut || onPaste || onDuplicate || onDelete || onMoveUp || onMoveDown);

  const wrapped = (
    <div
      data-element-id={elementId}
      className={`element-wrapper relative group cursor-pointer transition-all duration-200 rounded-lg p-1 ${
        isSelected
          ? "ring-2 ring-primary ring-offset-2 bg-primary/5"
          : isHovered
          ? "ring-2 ring-primary/40 ring-offset-1 bg-primary/5"
          : "hover:ring-2 hover:ring-primary/30 hover:ring-offset-1"
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onSelectElement?.(elementId);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}

      {/* Element type label at top-left - shown on hover or when selected */}
      {(isSelected || isHovered) && (
        <div className="absolute -top-3 left-2 z-10 transition-opacity duration-200">
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded shadow-sm transition-all ${
              isSelected
                ? "bg-primary text-primary-foreground"
                : "bg-popover text-popover-foreground border"
            }`}
          >
            {elementTypeLabels[elementType] || elementType}
          </span>
        </div>
      )}

      {/* Resize handles when selected (visual only for now) */}
      {isSelected && (
        <>
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-primary rounded-full" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary rounded-full" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary rounded-full" />
        </>
      )}
    </div>
  );

  if (!hasContextMenu) return wrapped;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild onContextMenu={() => onSelectElement?.(elementId)}>
        {wrapped}
      </ContextMenuTrigger>
      <ContextMenuContent>
        {onCopy && (
          <ContextMenuItem onSelect={onCopy}>
            <Copy />
            Kopieren
            <ContextMenuShortcut>⌘C</ContextMenuShortcut>
          </ContextMenuItem>
        )}
        {onCut && (
          <ContextMenuItem onSelect={onCut}>
            <Scissors />
            Ausschneiden
            <ContextMenuShortcut>⌘X</ContextMenuShortcut>
          </ContextMenuItem>
        )}
        {onPaste && (
          <ContextMenuItem onSelect={onPaste} disabled={!canPaste}>
            <ClipboardPaste />
            Einfügen
            <ContextMenuShortcut>⌘V</ContextMenuShortcut>
          </ContextMenuItem>
        )}
        {(onCopy || onCut || onPaste) && (onDuplicate || onMoveUp || onMoveDown || onDelete) && (
          <ContextMenuSeparator />
        )}
        {onDuplicate && (
          <ContextMenuItem onSelect={onDuplicate}>
            <Copy />
            Duplizieren
            <ContextMenuShortcut>⌘D</ContextMenuShortcut>
          </ContextMenuItem>
        )}
        {onMoveUp && (
          <ContextMenuItem onSelect={onMoveUp} disabled={!canMoveUp}>
            <MoveUp />
            Nach oben
            <ContextMenuShortcut>⌘↑</ContextMenuShortcut>
          </ContextMenuItem>
        )}
        {onMoveDown && (
          <ContextMenuItem onSelect={onMoveDown} disabled={!canMoveDown}>
            <MoveDown />
            Nach unten
            <ContextMenuShortcut>⌘↓</ContextMenuShortcut>
          </ContextMenuItem>
        )}
        {onDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onSelect={onDelete}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash2 />
              Löschen
              <ContextMenuShortcut>Del</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
