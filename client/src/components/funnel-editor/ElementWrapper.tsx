import { useState, ReactNode } from "react";

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
  // Quiz
  quiz: "Quiz",
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
}

/**
 * Wrapper component for elements in the preview with selection handling.
 * Provides visual feedback for hover and selection states.
 */
export function ElementWrapper({
  elementId,
  elementType,
  selectedElementId,
  onSelectElement,
  children,
}: ElementWrapperProps) {
  const isSelected = selectedElementId === elementId;
  const [isHovered, setIsHovered] = useState(false);

  return (
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
                : "bg-white text-gray-700 border border-gray-200"
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
}
