export interface FunnelThemePreset {
  id: string;
  name: string;
  colors: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
  };
}

export const themePresets: FunnelThemePreset[] = [
  {
    id: "modern-blue",
    name: "Modern Blau",
    colors: { primaryColor: "#3B82F6", backgroundColor: "#ffffff", textColor: "#1a1a1a", fontFamily: "Inter" },
  },
  {
    id: "elegant-black",
    name: "Elegant Schwarz",
    colors: { primaryColor: "#18181b", backgroundColor: "#ffffff", textColor: "#18181b", fontFamily: "Inter" },
  },
  {
    id: "warm-orange",
    name: "Warm Orange",
    colors: { primaryColor: "#F97316", backgroundColor: "#fffbf5", textColor: "#1a1a1a", fontFamily: "Inter" },
  },
  {
    id: "nature-green",
    name: "Natur Grün",
    colors: { primaryColor: "#22C55E", backgroundColor: "#f8fdf8", textColor: "#1a1a1a", fontFamily: "Inter" },
  },
  {
    id: "tech-indigo",
    name: "Tech Indigo",
    colors: { primaryColor: "#6366F1", backgroundColor: "#ffffff", textColor: "#1a1a1a", fontFamily: "Inter" },
  },
  {
    id: "sunset-rose",
    name: "Sunset Rose",
    colors: { primaryColor: "#E11D48", backgroundColor: "#fff5f7", textColor: "#1a1a1a", fontFamily: "Inter" },
  },
  {
    id: "ocean-teal",
    name: "Ozean Teal",
    colors: { primaryColor: "#14B8A6", backgroundColor: "#f0fdfa", textColor: "#1a1a1a", fontFamily: "Inter" },
  },
  {
    id: "premium-gold",
    name: "Premium Gold",
    colors: { primaryColor: "#D97706", backgroundColor: "#1a1a1a", textColor: "#ffffff", fontFamily: "Inter" },
  },
  {
    id: "dark-purple",
    name: "Dunkel Lila",
    colors: { primaryColor: "#A855F7", backgroundColor: "#0f0a1a", textColor: "#f0e6ff", fontFamily: "Inter" },
  },
  {
    id: "corporate-blue",
    name: "Corporate Blau",
    colors: { primaryColor: "#1D4ED8", backgroundColor: "#f8fafc", textColor: "#1e293b", fontFamily: "Inter" },
  },
  {
    id: "solar-yellow",
    name: "Solar Gelb",
    colors: { primaryColor: "#EAB308", backgroundColor: "#ffffff", textColor: "#1a1a1a", fontFamily: "Inter" },
  },
  {
    id: "minimal-gray",
    name: "Minimal Grau",
    colors: { primaryColor: "#64748B", backgroundColor: "#ffffff", textColor: "#334155", fontFamily: "Inter" },
  },
];
