// Design-System Definitionen für den Funnel-Editor
// Farbpaletten, Typografie, Spacing und Theme-Presets

export interface ColorPalette {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
}

export interface TypographyScale {
  heading1: { fontSize: string; fontWeight: string; lineHeight: string };
  heading2: { fontSize: string; fontWeight: string; lineHeight: string };
  body: { fontSize: string; fontWeight: string; lineHeight: string };
  small: { fontSize: string; fontWeight: string; lineHeight: string };
}

export interface SpacingScale {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  palette: ColorPalette;
}

// --- Farbpaletten ---

export const palettes: Record<string, ColorPalette> = {
  default: {
    name: "Standard",
    primary: "#6366f1",
    secondary: "#8b5cf6",
    accent: "#f59e0b",
    background: "#ffffff",
    surface: "#f8fafc",
    text: "#0f172a",
    muted: "#64748b",
  },
  ocean: {
    name: "Ocean",
    primary: "#0ea5e9",
    secondary: "#06b6d4",
    accent: "#14b8a6",
    background: "#f0f9ff",
    surface: "#e0f2fe",
    text: "#0c4a6e",
    muted: "#7dd3fc",
  },
  sunset: {
    name: "Sunset",
    primary: "#f97316",
    secondary: "#ef4444",
    accent: "#eab308",
    background: "#fffbeb",
    surface: "#fef3c7",
    text: "#78350f",
    muted: "#fbbf24",
  },
  forest: {
    name: "Forest",
    primary: "#22c55e",
    secondary: "#16a34a",
    accent: "#84cc16",
    background: "#f0fdf4",
    surface: "#dcfce7",
    text: "#14532d",
    muted: "#86efac",
  },
};

// --- Typografie ---

export const typography: TypographyScale = {
  heading1: {
    fontSize: "2.25rem",
    fontWeight: "700",
    lineHeight: "1.2",
  },
  heading2: {
    fontSize: "1.5rem",
    fontWeight: "600",
    lineHeight: "1.3",
  },
  body: {
    fontSize: "1rem",
    fontWeight: "400",
    lineHeight: "1.6",
  },
  small: {
    fontSize: "0.875rem",
    fontWeight: "400",
    lineHeight: "1.5",
  },
};

// --- Spacing ---

export const spacing: SpacingScale = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
};

// --- Theme-Presets ---

export const themePresets: ThemePreset[] = [
  {
    id: "default",
    name: "Standard",
    description: "Klassisches Indigo-Violet Design",
    palette: palettes.default,
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Frisches Blau-Türkis Design",
    palette: palettes.ocean,
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warmes Orange-Rot Design",
    palette: palettes.sunset,
  },
  {
    id: "forest",
    name: "Forest",
    description: "Natürliches Grün Design",
    palette: palettes.forest,
  },
];

// --- Hilfsfunktionen ---

export function getPresetById(id: string): ThemePreset | undefined {
  return themePresets.find((preset) => preset.id === id);
}

export function getPaletteColors(paletteId: string): string[] {
  const palette = palettes[paletteId];
  if (!palette) return [];
  return [
    palette.primary,
    palette.secondary,
    palette.accent,
    palette.background,
    palette.surface,
    palette.text,
    palette.muted,
  ];
}
