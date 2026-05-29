import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { isSafeUrl } from "@shared/schema"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Gibt die URL zurück, wenn ihr Protokoll erlaubt ist (http/https/mailto/tel)
 * oder sie relativ/ein Anker ist — andernfalls "". Verhindert ausführbare
 * `javascript:`/`data:`-URLs in href/window.open auf veröffentlichten Funnels.
 * Teilt die Whitelist mit dem Zod-Schema (`isSafeUrl` in shared/schema.ts).
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return ""
  const trimmed = url.trim()
  return isSafeUrl(trimmed) ? trimmed : ""
}

/** Parst #rgb / #rrggbb (mit/ohne #) zu [r,g,b]; null bei ungültiger Eingabe. */
function parseHexColor(hex: string): [number, number, number] | null {
  if (!hex || typeof hex !== "string") return null;
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h.split("").map((c) => c + c).join("");
  }
  if (h.length !== 6 || /[^0-9a-f]/i.test(h)) return null;
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Relative Luminanz nach WCAG (0 = schwarz, 1 = weiß). */
function relativeLuminance([r, g, b]: [number, number, number]): number {
  const toLinear = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** True, wenn auf dem Hintergrund weißer Text besser lesbar ist als schwarzer. */
function backgroundIsDark(hexColor: string): boolean {
  const rgb = parseHexColor(hexColor);
  if (!rgb) return false; // Fallback: heller Hintergrund annehmen → dunkler Text
  const lum = relativeLuminance(rgb);
  const contrastWithWhite = (1.0 + 0.05) / (lum + 0.05);
  const contrastWithBlack = (lum + 0.05) / (0.0 + 0.05);
  return contrastWithWhite >= contrastWithBlack;
}

/**
 * Liefert die besser lesbare Vordergrundfarbe (dunkel `#111827` oder weiß
 * `#FFFFFF`) für einen gegebenen Hintergrund — per WCAG-Luminanz.
 * Ungültige/leere Werte → dunkler Text (sicherer Default auf hellem Grund).
 */
export function getContrastColor(hexColor: string): string {
  return backgroundIsDark(hexColor) ? "#FFFFFF" : "#111827";
}

/**
 * Gedämpfte Variante für sekundären Text (Progress-Zähler, Footer):
 * helles Grau auf dunklem Hintergrund, bisheriges Grau auf hellem.
 */
export function getMutedContrastColor(hexColor: string): string {
  return backgroundIsDark(hexColor)
    ? "rgba(255, 255, 255, 0.7)"
    : "rgba(17, 24, 39, 0.55)";
}
