/**
 * Lazy Font Loader - Lädt Google Fonts on-demand statt alle im <head>.
 * Inter ist immer vorgeladen (in index.html).
 */

const FONT_FAMILIES: Record<string, string> = {
  'Inter': 'Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900',
  'DM Sans': 'DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000',
  'Poppins': 'Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900',
  'Montserrat': 'Montserrat:ital,wght@0,100..900;1,100..900',
  'Open Sans': 'Open+Sans:ital,wght@0,300..800;1,300..800',
  'Roboto': 'Roboto:ital,wght@0,100..900;1,100..900',
  'Playfair Display': 'Playfair+Display:ital,wght@0,400..900;1,400..900',
  'Lora': 'Lora:ital,wght@0,400..700;1,400..700',
  'Space Grotesk': 'Space+Grotesk:wght@300..700',
  'Plus Jakarta Sans': 'Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800',
  'Outfit': 'Outfit:wght@100..900',
  'Geist': 'Geist:wght@100..900',
  'Oxanium': 'Oxanium:wght@200..800',
  'Merriweather': 'Merriweather:ital,opsz,wght@0,18..144,300..900;1,18..144,300..900',
  'Libre Baskerville': 'Libre+Baskerville:ital,wght@0,400;0,700;1,400',
  'Source Serif 4': 'Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900',
  'IBM Plex Sans': 'IBM+Plex+Sans:ital,wght@0,100..700;1,100..700',
  'Architects Daughter': 'Architects+Daughter',
  // Mono Fonts
  'Fira Code': 'Fira+Code:wght@300..700',
  'JetBrains Mono': 'JetBrains+Mono:ital,wght@0,100..800;1,100..800',
  'Source Code Pro': 'Source+Code+Pro:ital,wght@0,200..900;1,200..900',
  'IBM Plex Mono': 'IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700',
  'Geist Mono': 'Geist+Mono:wght@100..900',
  'Roboto Mono': 'Roboto+Mono:ital,wght@0,100..700;1,100..700',
  'Space Mono': 'Space+Mono:ital,wght@0,400;0,700;1,400;1,700',
};

const loadedFonts = new Set<string>(['Inter']);

export function loadFont(fontFamily: string): void {
  if (!fontFamily || loadedFonts.has(fontFamily)) return;

  const fontSpec = FONT_FAMILIES[fontFamily];
  if (!fontSpec) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontSpec}&display=swap`;
  document.head.appendChild(link);

  loadedFonts.add(fontFamily);
}

export function getFontFamilies(): string[] {
  return Object.keys(FONT_FAMILIES);
}
