import { memo, useEffect, useState } from "react";
import {
  Play,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Star,
  Calendar,
  FileUp,
  Image,
  Plus,
  Code,
  ShoppingBag,
  Users,
  Music,
  Heart,
  Award,
  Shield,
  Trophy,
  Rocket,
  Zap,
  Circle,
  Mail,
  Phone,
  Home,
  UserRound,
  Settings,
} from "lucide-react";
import type { PageElement, Section } from "@shared/schema";
import { ElementWrapper, elementTypeLabels } from "./ElementWrapper";
import { FormFieldWithValidation } from "./FormFieldWithValidation";
import { InlineEditable } from "./InlineEditable";
import { sanitizeUrl } from "@/lib/utils";

/**
 * Wandelt eine YouTube-/Vimeo-URL in eine Embed-URL um (Allowlist-Ansatz:
 * nur bekannte Hosts, ID wird extrahiert statt die URL durchzureichen).
 * Gibt null zurück, wenn keine sichere Embed-URL ableitbar ist.
 */
export function getVideoEmbedUrl(
  videoType: string | undefined,
  videoUrl: string | undefined
): string | null {
  if (!videoUrl) return null;
  if (videoType === "youtube" || /youtu\.?be/.test(videoUrl)) {
    const m = videoUrl.match(
      /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,20})/
    );
    return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
  }
  if (videoType === "vimeo" || /vimeo\.com/.test(videoUrl)) {
    const m = videoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return m ? `https://player.vimeo.com/video/${m[1]}` : null;
  }
  return null;
}

/**
 * Verbleibende Zeit bis zu einem Zieldatum, sekündlich aktualisiert.
 * invalid = kein parsebares Datum; bei Ablauf bleibt alles auf 0 stehen.
 */
function useCountdown(target: string | undefined): {
  invalid: boolean;
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
} {
  const targetMs = target ? new Date(target).getTime() : NaN;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (isNaN(targetMs)) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [targetMs]);

  if (isNaN(targetMs)) {
    return { invalid: true, days: "00", hours: "00", minutes: "00", seconds: "00" };
  }
  const diff = Math.max(0, targetMs - now);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    invalid: false,
    days: pad(Math.floor(diff / 86_400_000)),
    hours: pad(Math.floor(diff / 3_600_000) % 24),
    minutes: pad(Math.floor(diff / 60_000) % 60),
    seconds: pad(Math.floor(diff / 1000) % 60),
  };
}

/**
 * Sichere Embed-URL für Terminbuchungs-Anbieter (Allowlist: Calendly, Cal.com).
 * Gibt null zurück, wenn der Host nicht erlaubt oder die URL unbrauchbar ist.
 */
export function getCalendarEmbedUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    const host = parsed.hostname.toLowerCase();
    const allowed =
      host === "calendly.com" ||
      host.endsWith(".calendly.com") ||
      host === "cal.com" ||
      host.endsWith(".cal.com");
    return allowed ? parsed.toString() : null;
  } catch {
    return null;
  }
}

/** Timer-Element mit echtem Live-Countdown (eigene Komponente wegen Hook). */
function TimerElementView({ el, textColor }: { el: PageElement; textColor: string }) {
  const t = useCountdown(el.timerEndDate);
  const timerUnits =
    el.timerShowDays !== false
      ? [
          { value: t.days, label: "Tage" },
          { value: t.hours, label: "Std" },
          { value: t.minutes, label: "Min" },
          { value: t.seconds, label: "Sek" },
        ]
      : [
          { value: t.hours, label: "Std" },
          { value: t.minutes, label: "Min" },
          { value: t.seconds, label: "Sek" },
        ];
  return (
    <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
      <div className="flex justify-center gap-3">
        {timerUnits.map((unit, idx) => (
          <div key={idx}>
            <div className="text-2xl font-bold" style={{ color: textColor }}>
              {unit.value}
            </div>
            <div className="text-xs opacity-60" style={{ color: textColor }}>
              {unit.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Countdown-Element mit echtem Live-Countdown (eigene Komponente wegen Hook). */
function CountdownElementView({ el }: { el: PageElement }) {
  const t = useCountdown(el.countdownDate);
  const items = [
    { value: t.days, label: "Tage" },
    { value: t.hours, label: "Std" },
    { value: t.minutes, label: "Min" },
    { value: t.seconds, label: "Sek" },
  ];
  return (
    <div
      className={`p-4 rounded-xl ${
        el.countdownStyle === "flip" ? "bg-gray-900" : "bg-white border"
      }`}
    >
      <div className="flex justify-center gap-2">
        {items.map((item, idx) => (
          <div key={idx} className="text-center">
            <div
              className={`text-2xl font-bold px-3 py-2 rounded ${
                el.countdownStyle === "flip"
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              {item.value}
            </div>
            {el.countdownShowLabels !== false && (
              <div
                className={`text-xs mt-1 ${
                  el.countdownStyle === "flip" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {item.label}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export interface ElementActions {
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

interface ElementPreviewRendererProps extends ElementActions {
  element: PageElement;
  textColor: string;
  primaryColor: string;
  selectedElementId?: string | null;
  onSelectElement?: (elementId: string | null) => void;
  formValues?: Record<string, string>;
  updateFormValue?: (elementId: string, value: string) => void;
  onButtonClick?: (element: PageElement) => void;
  onListItemClick?: (element: PageElement, itemId: string) => void;
  /** Inline-Edit commit für heading/text/button. Bindet element.id extern. */
  onContentCommit?: (content: string) => void;
}

/**
 * Renders a single element in the preview based on its type.
 */
function ElementPreviewRendererBase({
  element: el,
  textColor,
  primaryColor,
  selectedElementId,
  onSelectElement,
  formValues = {},
  updateFormValue,
  onButtonClick,
  onListItemClick,
  onCopy,
  onCut,
  onPaste,
  canPaste,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onContentCommit,
}: ElementPreviewRendererProps) {
  const wrapperProps = {
    elementId: el.id,
    elementType: el.type,
    selectedElementId,
    onSelectElement,
    onCopy,
    onCut,
    onPaste,
    canPaste,
    onDuplicate,
    onDelete,
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown,
  };

  // Im Edit-Mode (mit onContentCommit) wird der Element-Link NICHT klickbar,
  // damit der Nutzer das Element noch auswählen/bearbeiten kann. Im Public-
  // Funnel wickelt der Helper das Element in ein <a href> mit Target.
  // sanitizeUrl blockt `javascript:`/`data:`-URLs (Stored XSS) — bei
  // unsicherer/leerer URL wird gar kein <a> gerendert.
  const safeLinkUrl = !onContentCommit ? sanitizeUrl(el.linkUrl) : "";
  const withLink = (node: React.ReactNode) =>
    safeLinkUrl ? (
      <a
        href={safeLinkUrl}
        target={el.linkTarget || "_self"}
        rel="noopener noreferrer"
        className="block hover:opacity-90 transition-opacity"
      >
        {node}
      </a>
    ) : (
      node
    );

  switch (el.type) {
    case "input":
    case "textarea":
      return (
        <ElementWrapper {...wrapperProps}>
          <FormFieldWithValidation
            element={el}
            value={formValues[el.id] || ""}
            onChange={(value) => updateFormValue?.(el.id, value)}
            className="shadow-sm"
          />
        </ElementWrapper>
      );

    case "select": {
      // Interaktiv, sobald updateFormValue verfügbar ist (Public + Editor-
      // Vorschau) — sonst landet die Auswahl nie in formValues: kein Lead-Wert,
      // kein optionRouting, required blockiert die Navigation dauerhaft.
      if (updateFormValue) {
        return (
          <ElementWrapper {...wrapperProps}>
            <div className="space-y-2">
              {el.label && (
                <p className="text-sm font-medium text-left" style={{ color: textColor }}>
                  {el.label}
                </p>
              )}
              <div className="relative">
                <select
                  value={formValues[el.id] || ""}
                  onChange={(e) => updateFormValue(el.id, e.target.value)}
                  className="w-full appearance-none px-4 py-3 pr-10 rounded-lg border border-gray-200 text-sm bg-white shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-gray-900"
                >
                  <option value="" disabled>
                    {el.placeholder || "Option wählen..."}
                  </option>
                  {el.options?.map((option, idx) => (
                    <option key={idx} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </ElementWrapper>
        );
      }
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm bg-white flex items-center justify-between shadow-sm">
            <span className="text-gray-400">
              {el.placeholder || "Option wählen..."}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </ElementWrapper>
      );
    }

    case "radio":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="space-y-2">
            {el.label && (
              <p className="text-sm font-medium text-left" style={{ color: textColor }}>
                {el.label}
              </p>
            )}
            {el.options?.map((option, idx) => {
              if (updateFormValue) {
                const checked = formValues[el.id] === option;
                return (
                  <label
                    key={idx}
                    className={`flex items-center gap-3 px-4 py-2.5 bg-white rounded-lg border text-sm shadow-sm cursor-pointer transition-colors ${
                      checked ? "" : "border-gray-200 hover:border-gray-300"
                    }`}
                    style={checked ? { borderColor: primaryColor } : undefined}
                  >
                    <input
                      type="radio"
                      name={el.id}
                      value={option}
                      checked={checked}
                      onChange={() => updateFormValue(el.id, option)}
                      className="sr-only"
                    />
                    <span
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                      style={{ borderColor: checked ? primaryColor : "#d1d5db" }}
                    >
                      {checked && (
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: primaryColor }}
                        />
                      )}
                    </span>
                    <span className="text-gray-900">{option}</span>
                  </label>
                );
              }
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm shadow-sm"
                >
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                  <span>{option}</span>
                </div>
              );
            })}
          </div>
        </ElementWrapper>
      );

    case "checkbox": {
      if (updateFormValue) {
        const checked = !!formValues[el.id];
        return (
          <ElementWrapper {...wrapperProps}>
            <label className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-gray-200 text-sm shadow-sm cursor-pointer hover:border-gray-300 transition-colors">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => updateFormValue(el.id, e.target.checked ? "Ja" : "")}
                className="sr-only"
              />
              <span
                className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0"
                style={{
                  borderColor: checked ? primaryColor : "#d1d5db",
                  backgroundColor: checked ? primaryColor : "transparent",
                }}
              >
                {checked && <Check className="h-3 w-3 text-white" />}
              </span>
              <span className="text-gray-900">{el.label || "Checkbox"}</span>
            </label>
          </ElementWrapper>
        );
      }
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-gray-200 text-sm shadow-sm">
            <div className="w-4 h-4 rounded border-2 border-gray-300" />
            <span>{el.label || "Checkbox"}</span>
          </div>
        </ElementWrapper>
      );
    }

    case "date":
      if (updateFormValue) {
        return (
          <ElementWrapper {...wrapperProps}>
            <div className="space-y-2">
              {el.label && (
                <p className="text-sm font-medium text-left" style={{ color: textColor }}>
                  {el.label}
                </p>
              )}
              <input
                type="date"
                value={formValues[el.id] || ""}
                onChange={(e) => updateFormValue(el.id, e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm bg-white shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-gray-900"
              />
            </div>
          </ElementWrapper>
        );
      }
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm bg-white flex items-center gap-2 shadow-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-400">
              {el.placeholder || "Datum wählen..."}
            </span>
          </div>
        </ElementWrapper>
      );

    case "fileUpload":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="w-full px-4 py-5 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-center">
            <FileUp className="h-6 w-6 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">{el.label || "Datei hochladen"}</p>
            <p className="text-xs text-gray-400 mt-1">
              {el.acceptedFileTypes?.length
                ? el.acceptedFileTypes.join(", ")
                : "PDF, Bilder, Dokumente"}
            </p>
          </div>
        </ElementWrapper>
      );

    case "video": {
      // Public-Funnel (kein onContentCommit): echten Player rendern — das
      // statische Play-Symbol machte VSL-/Video-Funnels funktionslos.
      if (!onContentCommit) {
        if (el.videoType === "upload" && el.videoUrl) {
          return (
            <ElementWrapper {...wrapperProps}>
              <video
                controls
                playsInline
                src={el.videoUrl}
                className="w-full aspect-video rounded-lg bg-black shadow-md"
              />
            </ElementWrapper>
          );
        }
        const embedUrl = getVideoEmbedUrl(el.videoType, el.videoUrl);
        if (embedUrl) {
          return (
            <ElementWrapper {...wrapperProps}>
              <div className="w-full aspect-video rounded-lg overflow-hidden shadow-md bg-black">
                <iframe
                  src={embedUrl}
                  title="Video"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </ElementWrapper>
          );
        }
        // Keine (sichere) Video-URL konfiguriert → für Besucher nichts rendern
        return null;
      }
      // Editor-Vorschau: Mockup mit Hinweis, ob eine URL hinterlegt ist
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="w-full aspect-video rounded-lg bg-gray-900 flex flex-col items-center justify-center shadow-md gap-2">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Play className="h-7 w-7 text-white ml-1" />
            </div>
            {!el.videoUrl && (
              <p className="text-xs text-white/60">Keine Video-URL hinterlegt</p>
            )}
          </div>
        </ElementWrapper>
      );
    }

    case "audio": {
      // Public-Funnel: echter Player statt Fake-Mockup mit hartkodiertem "3:24"
      if (!onContentCommit) {
        if (!el.audioUrl) return null;
        return (
          <ElementWrapper {...wrapperProps}>
            <audio controls src={el.audioUrl} className="w-full" preload="metadata" />
          </ElementWrapper>
        );
      }
      // Editor-Vorschau: Mockup + Hinweis, ob eine Datei hinterlegt ist
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="bg-gray-100 rounded-xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <Play className="h-5 w-5 text-white ml-0.5" />
            </div>
            <div className="flex-1">
              <div className="h-1 bg-gray-300 rounded-full">
                <div className="h-1 bg-primary rounded-full w-1/3" />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {el.audioUrl ? "Audio hinterlegt" : "Keine Audio-Datei — für Besucher ausgeblendet"}
              </p>
            </div>
          </div>
        </ElementWrapper>
      );
    }

    case "list":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="text-left space-y-2">
            {el.listItems?.map((item, idx) => {
              const isClickable = !!item.targetPageId && !!onListItemClick;
              const ItemTag = isClickable ? "button" : "div";
              return (
                <ItemTag
                  key={idx}
                  className={`flex items-start gap-2 w-full text-left ${isClickable ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                  onClick={isClickable ? () => onListItemClick(el, item.id) : undefined}
                >
                  {el.listStyle === "number" ? (
                    <span
                      className="text-sm font-medium shrink-0 w-5 text-center"
                      style={{ color: primaryColor }}
                    >
                      {idx + 1}.
                    </span>
                  ) : el.listStyle === "bullet" ? (
                    <Circle
                      className="h-2 w-2 shrink-0 mt-1.5"
                      style={{ fill: primaryColor, color: primaryColor }}
                    />
                  ) : (
                    <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  )}
                  <span className="text-sm flex-1" style={{ color: textColor }}>
                    {item.text}
                  </span>
                  {item.targetPageId && (
                    <ChevronRight className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                  )}
                </ItemTag>
              );
            })}
          </div>
        </ElementWrapper>
      );

    case "faq":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="space-y-2 text-left">
            {el.faqItems?.map((item, idx) => (
              <div key={idx} className="bg-white rounded-lg p-3 shadow-sm">
                <div className="font-medium text-sm flex items-center justify-between">
                  {item.question}
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </ElementWrapper>
      );

    case "divider":
      return (
        <ElementWrapper {...wrapperProps}>
          {el.dividerStyle === "gradient" ? (
            <div className="my-4 h-0.5 bg-gradient-to-r from-transparent via-gray-400 to-transparent" />
          ) : (
            <hr
              className="my-4"
              style={{
                borderStyle: el.dividerStyle || "solid",
                borderColor: el.styles?.color || "#e5e7eb",
              }}
            />
          )}
        </ElementWrapper>
      );

    case "spacer":
      return (
        <ElementWrapper {...wrapperProps}>
          <div style={{ height: el.spacerHeight || 24 }} />
        </ElementWrapper>
      );

    case "timer": {
      // Ohne Zieldatum gibt es nichts herunterzuzählen: im Public-Funnel
      // ausblenden (statt Fake-Zahlen), im Editor Hinweis zeigen.
      if (!el.timerEndDate) {
        if (!onContentCommit) return null;
        return (
          <ElementWrapper {...wrapperProps}>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
              <p className="text-xs opacity-60" style={{ color: textColor }}>
                Timer: Kein Zieldatum gesetzt — für Besucher ausgeblendet.
              </p>
            </div>
          </ElementWrapper>
        );
      }
      return (
        <ElementWrapper {...wrapperProps}>
          <TimerElementView el={el} textColor={textColor} />
        </ElementWrapper>
      );
    }

    case "countdown": {
      if (!el.countdownDate) {
        if (!onContentCommit) return null;
        return (
          <ElementWrapper {...wrapperProps}>
            <div className="p-4 rounded-xl bg-white border text-center">
              <p className="text-xs text-gray-500">
                Countdown: Kein Zieldatum gesetzt — für Besucher ausgeblendet.
              </p>
            </div>
          </ElementWrapper>
        );
      }
      return (
        <ElementWrapper {...wrapperProps}>
          <CountdownElementView el={el} />
        </ElementWrapper>
      );
    }

    case "heading": {
      const headingStyle = {
        color: el.styles?.color || textColor,
        fontSize: el.styles?.fontSize || "1.25rem",
        fontWeight: el.styles?.fontWeight || "bold",
        fontStyle: el.styles?.fontStyle || "normal",
        textAlign: (el.styles?.textAlign as "left" | "center" | "right") || "center",
      } as const;
      return withLink(
        <ElementWrapper {...wrapperProps}>
          {onContentCommit ? (
            <InlineEditable
              value={el.content || ""}
              onCommit={onContentCommit}
              placeholder="Überschrift"
              className="font-bold w-full text-center"
              style={headingStyle}
              renderDisplay={(v) => (
                <h3 className="font-bold" style={headingStyle}>
                  {v || "Überschrift"}
                </h3>
              )}
            />
          ) : (
            <h3 className="font-bold" style={headingStyle}>
              {el.content || "Überschrift"}
            </h3>
          )}
        </ElementWrapper>
      );
    }

    case "text": {
      const textStyle = {
        color: el.styles?.color || textColor,
        fontSize: el.styles?.fontSize || "0.875rem",
        fontWeight: el.styles?.fontWeight || "normal",
        fontStyle: el.styles?.fontStyle || "normal",
        textAlign: (el.styles?.textAlign as "left" | "center" | "right") || "center",
      } as const;
      return withLink(
        <ElementWrapper {...wrapperProps}>
          {onContentCommit ? (
            <InlineEditable
              value={el.content || ""}
              onCommit={onContentCommit}
              multiline
              placeholder="Text hier..."
              className="text-sm w-full"
              style={textStyle}
              renderDisplay={(v) => (
                <p className="text-sm" style={textStyle}>
                  {v || "Text hier..."}
                </p>
              )}
            />
          ) : (
            <p className="text-sm" style={textStyle}>
              {el.content || "Text hier..."}
            </p>
          )}
        </ElementWrapper>
      );
    }

    case "image": {
      // S/M/L/XL aus den Bild-Properties auswerten (Default: L)
      const size = el.styles?.imageSize || "L";
      const sizeStyle: React.CSSProperties =
        size === "S"
          ? { maxWidth: 200, maxHeight: 160 }
          : size === "M"
          ? { maxWidth: 320, maxHeight: 240 }
          : size === "XL"
          ? { maxWidth: "100%", maxHeight: 480 }
          : { maxWidth: 500, maxHeight: 360 }; // L (default)
      return withLink(
        <ElementWrapper {...wrapperProps}>
          <div className="w-full flex justify-center">
            {el.imageUrl ? (
              <img
                src={el.imageUrl}
                alt={el.imageAlt || "Bild"}
                className="rounded-lg shadow-md object-cover w-full"
                style={sizeStyle}
              />
            ) : (
              <div
                className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center w-full"
                style={sizeStyle}
              >
                <Image className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
        </ElementWrapper>
      );
    }

    case "icon": {
      const iconSizeClass =
        el.iconSize === "xl"
          ? "h-16 w-16"
          : el.iconSize === "lg"
          ? "h-12 w-12"
          : el.iconSize === "sm"
          ? "h-6 w-6"
          : "h-8 w-8";

      // Map muss alle in IconProperties wählbaren Namen abdecken — sonst
      // rendert die Auswahl stillschweigend als Stern.
      const IconComponent = {
        star: Star,
        heart: Heart,
        check: Check,
        award: Award,
        shield: Shield,
        trophy: Trophy,
        rocket: Rocket,
        lightning: Zap,
        zap: Zap,
        "arrow-right": ChevronRight,
        mail: Mail,
        phone: Phone,
        home: Home,
        user: UserRound,
        settings: Settings,
      }[el.iconName || "star"] || Star;

      return (
        <ElementWrapper {...wrapperProps}>
          <div
            className="flex justify-center"
            style={{ color: el.styles?.color || textColor }}
          >
            <div className={iconSizeClass}>
              <IconComponent className="w-full h-full" />
            </div>
          </div>
        </ElementWrapper>
      );
    }

    case "progressBar":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="w-full">
            {el.progressShowLabel !== false && (
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-500">Fortschritt</span>
                <span className="text-xs font-medium" style={{ color: primaryColor }}>
                  {el.progressValue || 60}%
                </span>
              </div>
            )}
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${el.progressValue || 60}%`, backgroundColor: primaryColor }}
              />
            </div>
          </div>
        </ElementWrapper>
      );

    case "button": {
      const btnClass = `w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all ${
        el.buttonVariant === "outline"
          ? "border-2 border-primary text-primary bg-transparent"
          : el.buttonVariant === "secondary"
          ? "bg-gray-200 text-gray-800"
          : el.buttonVariant === "ghost"
          ? "bg-transparent text-primary hover:bg-primary/10"
          : "bg-primary text-white"
      }`;
      const btnStyle =
        el.buttonVariant === "primary" || !el.buttonVariant
          ? { backgroundColor: primaryColor }
          : undefined;
      const handleClick = (e: React.MouseEvent) => {
        if (!onButtonClick) return;
        e.stopPropagation();
        if (el.buttonAction === "url" && el.buttonUrl) {
          // sanitizeUrl blockt javascript:/data: (XSS/Open-Redirect);
          // noopener,noreferrer kappt den Zugriff der Zielseite auf window.opener.
          const safeUrl = sanitizeUrl(el.buttonUrl);
          if (safeUrl) {
            window.open(safeUrl, el.buttonTarget || "_self", "noopener,noreferrer");
          }
        } else {
          onButtonClick(el);
        }
      };
      return (
        <ElementWrapper {...wrapperProps}>
          {onContentCommit ? (
            <InlineEditable
              value={el.content || ""}
              onCommit={onContentCommit}
              placeholder="Button"
              className={btnClass}
              style={btnStyle}
              renderDisplay={(v) => (
                <button className={btnClass} style={btnStyle} onClick={handleClick}>
                  {v || "Button"}
                </button>
              )}
            />
          ) : (
            <button className={btnClass} style={btnStyle} onClick={handleClick}>
              {el.content || "Button"}
            </button>
          )}
        </ElementWrapper>
      );
    }

    case "testimonial": {
      // ALLE konfigurierten Bewertungen rendern — das Properties-Panel erlaubt
      // mehrere, gerendert wurde bisher überall nur die erste.
      const testimonials = el.slides?.length
        ? el.slides
        : [{ id: "placeholder", text: "", author: "", role: "" }];
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="space-y-3">
            {testimonials.map((slide, idx) => (
              <div key={slide.id || idx} className="bg-white rounded-xl p-4 shadow-md">
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-700 mb-3 text-left">
                  "{slide.text || "Großartiger Service!"}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
                  <div className="text-left">
                    <p className="text-sm font-semibold">{slide.author || "Kunde"}</p>
                    <p className="text-xs text-gray-500">{slide.role || "Position"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ElementWrapper>
      );
    }

    case "slider": {
      const slides = el.slides || [{ id: "1" }, { id: "2" }, { id: "3" }];
      const firstSlide = slides[0];
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="relative">
            <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden shadow-md">
              {firstSlide?.image ? (
                <img
                  src={firstSlide.image}
                  alt={firstSlide.title || "Slide"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4">
                  <Image className="h-10 w-10 mb-2" />
                  {firstSlide?.title && (
                    <h4 className="text-sm font-medium text-gray-600">{firstSlide.title}</h4>
                  )}
                  {firstSlide?.text && (
                    <p className="text-xs text-gray-500 text-center mt-1">{firstSlide.text}</p>
                  )}
                </div>
              )}
            </div>
            <button className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="flex justify-center gap-1.5 mt-3">
              {slides.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === 0 ? "bg-gray-800" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </ElementWrapper>
      );
    }

    case "socialProof":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="flex flex-wrap justify-center gap-3">
            {el.socialProofItems && el.socialProofItems.length > 0 ? (
              el.socialProofItems.map((item) => (
                <div key={item.id} className="flex flex-col items-center">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.text || "Logo"}
                      className="h-8 w-auto object-contain"
                    />
                  ) : (
                    <div className="h-8 w-16 bg-white/20 rounded" />
                  )}
                  {(el.socialProofType === "stats" || el.socialProofType === "reviews") && (
                    <div className="text-center mt-1">
                      {item.value && (
                        <div className="text-lg font-bold" style={{ color: textColor }}>
                          {item.value}
                        </div>
                      )}
                      {item.text && (
                        <div className="text-xs text-gray-500">{item.text}</div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-16 bg-white/20 rounded" />
              ))
            )}
          </div>
        </ElementWrapper>
      );

    case "calendar": {
      const calendarEmbed = getCalendarEmbedUrl(el.calendarUrl);
      // Public-Funnel: echtes Buchungs-Embed (Calendly/Cal.com) oder nichts —
      // der statische Kalender-Mock war für Besucher komplett funktionslos.
      if (!onContentCommit) {
        if (!calendarEmbed) return null;
        return (
          <ElementWrapper {...wrapperProps}>
            <iframe
              src={calendarEmbed}
              title="Terminbuchung"
              className="w-full rounded-xl border bg-white"
              style={{ height: 640 }}
            />
          </ElementWrapper>
        );
      }
      // Editor-Vorschau: Mock + klarer Hinweis auf den Konfigurationsstand
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="bg-white rounded-xl p-4 shadow-md border">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-medium">Termin buchen</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-3">
              {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
                <div key={d} className="text-gray-500 py-1">
                  {d}
                </div>
              ))}
              {Array.from({ length: 28 }, (_, i) => (
                <div
                  key={i}
                  className={`py-1 rounded ${
                    i === 14 ? "bg-primary text-white" : "hover:bg-gray-100"
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <p className="text-xs text-center font-medium">
              {calendarEmbed ? (
                <span className="text-green-600">Buchungs-Link aktiv — Besucher sehen das echte Calendly/Cal.com-Widget</span>
              ) : (
                <span className="text-amber-600">Keine gültige Calendly-/Cal.com-URL — für Besucher ausgeblendet</span>
              )}
            </p>
          </div>
        </ElementWrapper>
      );
    }

    case "chart":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="bg-white rounded-xl p-4 shadow-md border">
            <div className="flex items-end justify-around h-32 gap-2">
              {(el.chartData?.datasets[0]?.data || [10, 20, 30, 40]).map((value, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${(value / 50) * 100}%`,
                      backgroundColor: primaryColor,
                      minHeight: "8px",
                    }}
                  />
                  <span className="text-xs text-gray-500 mt-1">
                    {el.chartData?.labels[idx] || `${idx + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ElementWrapper>
      );

    case "code":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="bg-gray-900 rounded-xl p-4 overflow-hidden">
            <div className="flex gap-1.5 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <pre className="text-xs text-green-400 font-mono overflow-x-auto">
              <code>{el.codeContent || "// Code hier..."}</code>
            </pre>
          </div>
        </ElementWrapper>
      );

    case "embed":
      // Embed ist nicht fertig gebaut (kein sicheres Iframe-Rendering, CSP
      // blockt fremde Hosts) — Besucher sehen nichts, Editor zeigt WIP-Hinweis.
      // Aus der Palette entfernt; bestehende Elemente bleiben editierbar.
      if (!onContentCommit) return null;
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="aspect-video bg-amber-50 rounded-xl flex items-center justify-center border-2 border-dashed border-amber-300">
            <div className="text-center">
              <Code className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm text-amber-700">Einbetten — in Arbeit</p>
              <p className="text-xs text-amber-600 mt-1">Für Besucher aktuell ausgeblendet</p>
            </div>
          </div>
        </ElementWrapper>
      );

    case "product":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="bg-white rounded-xl shadow-md overflow-hidden border">
            <div className="aspect-square bg-gray-100 flex items-center justify-center">
              {el.productImage ? (
                <img
                  src={el.productImage}
                  alt={el.productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ShoppingBag className="h-12 w-12 text-gray-300" />
              )}
            </div>
            <div className="p-4">
              <h4 className="font-semibold">{el.productName || "Produkt"}</h4>
              <p className="text-sm text-gray-600 mt-1">
                {el.productDescription || "Beschreibung..."}
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-lg font-bold" style={{ color: primaryColor }}>
                  {el.productPrice || "€99"}
                </span>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {el.productButtonText || "Kaufen"}
                </button>
              </div>
            </div>
          </div>
        </ElementWrapper>
      );

    case "team":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="grid grid-cols-2 gap-3">
            {(el.teamMembers || []).slice(0, 4).map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-xl p-3 shadow-md border text-center"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center mb-2">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Users className="h-6 w-6 text-primary" />
                  )}
                </div>
                <h5 className="font-medium text-sm">{member.name}</h5>
                <p className="text-xs text-gray-500">{member.role}</p>
              </div>
            ))}
          </div>
        </ElementWrapper>
      );

    case "quiz": {
      // Das interaktive Quiz ist im öffentlichen Funnel (noch) nicht funktionsfähig
      // — es wurde nur statisch gerendert. Bis es richtig gebaut ist, blenden wir
      // es für Besucher KOMPLETT aus (kein irreführender Klick-Schein) und zeigen
      // im Editor nur einen klaren WIP-Platzhalter.
      // Public-Render (kein onContentCommit) → nichts anzeigen.
      if (!onContentCommit) return null;
      const config = el.quizConfig;
      const questionCount = config?.questions?.length ?? 0;
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Award className="h-5 w-5 text-amber-600" />
              <span className="font-semibold text-amber-900 text-sm">
                Quiz ({questionCount} {questionCount === 1 ? "Frage" : "Fragen"})
              </span>
            </div>
            <p className="text-xs text-amber-700">
              Interaktive Funktion in Arbeit — für Besucher aktuell ausgeblendet.
            </p>
          </div>
        </ElementWrapper>
      );
    }

    default:
      return null;
  }
}

function arePropsEqual(
  prev: ElementPreviewRendererProps,
  next: ElementPreviewRendererProps
): boolean {
  if (prev.textColor !== next.textColor) return false;
  if (prev.primaryColor !== next.primaryColor) return false;
  if (prev.selectedElementId !== next.selectedElementId) return false;
  // Deep compare element (covers all properties: slides, faqItems, listItems, options, etc.)
  if (prev.element !== next.element && JSON.stringify(prev.element) !== JSON.stringify(next.element)) return false;
  if (JSON.stringify(prev.formValues) !== JSON.stringify(next.formValues)) return false;
  return true;
}

const MemoizedElementPreviewRenderer = memo(ElementPreviewRendererBase, arePropsEqual);
export { MemoizedElementPreviewRenderer as ElementPreviewRenderer };

interface SectionPreviewProps {
  section: Section;
  selectedElementId?: string | null;
  onSelectElement?: (elementId: string | null) => void;
}

/**
 * Renders a section with columns in the preview.
 */
export function SectionPreviewRenderer({
  section,
  selectedElementId,
  onSelectElement,
}: SectionPreviewProps) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: section.styles?.backgroundColor || "transparent",
        padding: section.styles?.padding || "16px",
        minHeight: section.styles?.minHeight,
      }}
    >
      {section.name && (
        <div className="text-xs text-gray-500 mb-2 font-medium">{section.name}</div>
      )}
      <div className="flex gap-2">
        {section.columns.map((column) => (
          <div
            key={column.id}
            className="min-h-[60px] rounded-lg border-2 border-dashed border-gray-200 hover:border-primary/30 transition-colors p-2"
            style={{
              width: `${column.width}%`,
              backgroundColor: column.styles?.backgroundColor || "transparent",
              padding: column.styles?.padding || "8px",
            }}
          >
            {column.elements.length > 0 ? (
              <div className="space-y-2">
                {column.elements.map((el) => (
                  <ElementWrapper
                    key={el.id}
                    elementId={el.id}
                    elementType={el.type}
                    selectedElementId={selectedElementId}
                    onSelectElement={onSelectElement}
                  >
                    <div className="text-xs text-gray-600 bg-gray-50 rounded p-2 text-center">
                      {elementTypeLabels[el.type] || el.type}
                    </div>
                  </ElementWrapper>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                <Plus className="h-3 w-3 mr-1" />
                Element
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
