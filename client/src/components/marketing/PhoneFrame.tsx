import type { ReactNode } from "react";

interface PhoneFrameProps {
  /** Bildschirm-Inhalt; erhält die volle Höhe des Screens (h-full nutzen). */
  children: ReactNode;
  /** Zusätzliche Klassen am Rahmen (z. B. abweichende Breite für Kacheln). */
  className?: string;
  /** Höhen-Klasse des Screens — Default passt für die Detailseiten-Vorschau. */
  screenClassName?: string;
  /** false → pointer-events-none auf dem Screen (reine Anzeige-Kachel). */
  interactive?: boolean;
}

/**
 * Marketing-Smartphone-Mockup (reines CSS, kein Bild): dunkle Bezel mit
 * Dynamic-Island-Notch. Umschließt die Live-Vorschau eines Templates oder
 * ein Poster/Video in der Galerie-Kachel. Bewusst getrennt von den
 * Editor-Komponenten (DeviceFrame/PhonePreview), die Editor-Chrome tragen.
 */
export function PhoneFrame({
  children,
  className,
  screenClassName,
  interactive = true,
}: PhoneFrameProps) {
  return (
    <div
      className={`relative w-[375px] max-w-full rounded-[2.75rem] bg-gray-900 p-[10px] shadow-2xl ring-1 ring-black/40 ${className ?? ""}`}
    >
      {/* Notch / Dynamic Island */}
      <div
        className="absolute top-[18px] left-1/2 -translate-x-1/2 h-[22px] w-24 rounded-full bg-gray-900 z-10"
        aria-hidden="true"
      />
      <div
        className={`relative overflow-hidden rounded-[2.25rem] bg-white ${
          screenClassName ?? "h-[min(700px,70vh)]"
        } ${interactive ? "" : "pointer-events-none"}`}
      >
        {children}
      </div>
    </div>
  );
}
