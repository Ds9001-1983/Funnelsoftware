import { getMutedContrastColor } from "@/lib/utils";

interface FunnelProgressProps {
  currentPage: number;
  totalPages: number;
  primaryColor: string;
  /** Effektive Hintergrundfarbe der Seite — steuert die Textfarbe für Lesbarkeit. */
  backgroundColor?: string;
}

/**
 * Fortschrittsanzeige für den Funnel.
 * Zeigt dem Benutzer an, wie weit er im Funnel fortgeschritten ist.
 */
export function FunnelProgress({ currentPage, totalPages, primaryColor, backgroundColor }: FunnelProgressProps) {
  const progress = ((currentPage + 1) / totalPages) * 100;

  // Auf dunklen Seitenhintergründen ist text-gray-500 unlesbar — Farbe anhand
  // der effektiven Hintergrundfarbe wählen.
  const labelColor = backgroundColor ? getMutedContrastColor(backgroundColor) : undefined;
  const trackColor = backgroundColor
    ? "rgba(127, 127, 127, 0.25)"
    : undefined;

  return (
    <div className="w-full px-4 py-2">
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: trackColor ?? "rgb(229 231 235)" /* gray-200 */ }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            backgroundColor: primaryColor,
          }}
        />
      </div>
      <div
        className="flex justify-between mt-1.5 text-xs"
        style={labelColor ? { color: labelColor } : undefined}
      >
        <span className={labelColor ? undefined : "text-gray-500"}>
          Schritt {currentPage + 1} von {totalPages}
        </span>
        <span className={labelColor ? undefined : "text-gray-500"}>
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}
