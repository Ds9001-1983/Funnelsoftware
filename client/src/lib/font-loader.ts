/**
 * Lazy Font Loader — lädt Schriften als selbst gehostete @fontsource-Pakete
 * per dynamischem Import (Code-Splitting: jede Schrift ist ein eigener Chunk,
 * Browser lädt nur die tatsächlich genutzten woff2-Dateien).
 *
 * DSGVO: Vorher wurden die Schriften von fonts.googleapis.com geladen — dabei
 * geht die IP-Adresse jedes Besuchers ohne Einwilligung an Google
 * (abmahnfähig, vgl. LG München I, 3 O 17493/20). Inter ist als UI-Font
 * eager in main.tsx importiert.
 *
 * Gewichte: 400 + 700 sind für alle Familien verfügbar; fehlende
 * Zwischengewichte (500/600) rendert der Browser über den nächsten Schnitt.
 */
const FONT_LOADERS: Record<string, () => Promise<unknown>> = {
  // Sans
  'Inter': () => Promise.all([import('@fontsource/inter/400.css'), import('@fontsource/inter/600.css'), import('@fontsource/inter/700.css')]),
  'DM Sans': () => Promise.all([import('@fontsource/dm-sans/400.css'), import('@fontsource/dm-sans/700.css')]),
  'Poppins': () => Promise.all([import('@fontsource/poppins/400.css'), import('@fontsource/poppins/600.css'), import('@fontsource/poppins/700.css')]),
  'Montserrat': () => Promise.all([import('@fontsource/montserrat/400.css'), import('@fontsource/montserrat/700.css')]),
  'Open Sans': () => Promise.all([import('@fontsource/open-sans/400.css'), import('@fontsource/open-sans/700.css')]),
  'Roboto': () => Promise.all([import('@fontsource/roboto/400.css'), import('@fontsource/roboto/700.css')]),
  'Space Grotesk': () => Promise.all([import('@fontsource/space-grotesk/400.css'), import('@fontsource/space-grotesk/700.css')]),
  'Plus Jakarta Sans': () => Promise.all([import('@fontsource/plus-jakarta-sans/400.css'), import('@fontsource/plus-jakarta-sans/700.css')]),
  'Outfit': () => Promise.all([import('@fontsource/outfit/400.css'), import('@fontsource/outfit/700.css')]),
  // Hinweis: @fontsource registriert die Familie als 'Geist Sans' —
  // Alt-Funnels mit "Geist" fallen auf die System-Sans zurück.
  'Geist': () => Promise.all([import('@fontsource/geist-sans/400.css'), import('@fontsource/geist-sans/700.css')]),
  'Oxanium': () => Promise.all([import('@fontsource/oxanium/400.css'), import('@fontsource/oxanium/700.css')]),
  'IBM Plex Sans': () => Promise.all([import('@fontsource/ibm-plex-sans/400.css'), import('@fontsource/ibm-plex-sans/700.css')]),
  // Serif
  'Playfair Display': () => Promise.all([import('@fontsource/playfair-display/400.css'), import('@fontsource/playfair-display/700.css')]),
  'Lora': () => Promise.all([import('@fontsource/lora/400.css'), import('@fontsource/lora/700.css')]),
  'Merriweather': () => Promise.all([import('@fontsource/merriweather/400.css'), import('@fontsource/merriweather/700.css')]),
  'Libre Baskerville': () => Promise.all([import('@fontsource/libre-baskerville/400.css'), import('@fontsource/libre-baskerville/700.css')]),
  'Source Serif 4': () => Promise.all([import('@fontsource/source-serif-4/400.css'), import('@fontsource/source-serif-4/700.css')]),
  // Handschrift
  'Architects Daughter': () => import('@fontsource/architects-daughter/400.css'),
  // Mono
  'Fira Code': () => Promise.all([import('@fontsource/fira-code/400.css'), import('@fontsource/fira-code/700.css')]),
  'JetBrains Mono': () => Promise.all([import('@fontsource/jetbrains-mono/400.css'), import('@fontsource/jetbrains-mono/700.css')]),
  'Source Code Pro': () => Promise.all([import('@fontsource/source-code-pro/400.css'), import('@fontsource/source-code-pro/700.css')]),
  'IBM Plex Mono': () => Promise.all([import('@fontsource/ibm-plex-mono/400.css'), import('@fontsource/ibm-plex-mono/700.css')]),
  'Geist Mono': () => Promise.all([import('@fontsource/geist-mono/400.css'), import('@fontsource/geist-mono/700.css')]),
  'Roboto Mono': () => Promise.all([import('@fontsource/roboto-mono/400.css'), import('@fontsource/roboto-mono/700.css')]),
  'Space Mono': () => Promise.all([import('@fontsource/space-mono/400.css'), import('@fontsource/space-mono/700.css')]),
};

const loadedFonts = new Set<string>(['Inter']);

export function loadFont(fontFamily: string): void {
  if (!fontFamily || loadedFonts.has(fontFamily)) return;

  const loader = FONT_LOADERS[fontFamily];
  if (!loader) return;

  loadedFonts.add(fontFamily);
  loader().catch(() => {
    // Import fehlgeschlagen (z.B. offline) → beim nächsten Aufruf erneut versuchen
    loadedFonts.delete(fontFamily);
  });
}

export function getFontFamilies(): string[] {
  return Object.keys(FONT_LOADERS);
}
