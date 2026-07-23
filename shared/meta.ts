/**
 * Meta-Pixel von trichterwerk.de SELBST — nicht zu verwechseln mit den
 * Pixel-IDs, die Kunden pro Funnel hinterlegen (`funnels.metaPixelId`).
 *
 * Die ID ist öffentlich (sie steht ohnehin im ausgelieferten Browser-Code) und
 * liegt deshalb bewusst als Konstante hier statt in einer ENV-Variable:
 *
 *  - Client und Server teilen sich damit garantiert DIESELBE ID. Driften die
 *    beiden auseinander, dedupliziert Meta Browser- und Server-Event nicht mehr
 *    und jede Registrierung zählt doppelt.
 *  - Eine `VITE_`-Variable würde zur Buildzeit eingebacken. Der Build läuft im
 *    Deploy auf dem Server — eine fehlende Variable fiele dort erst auf, wenn
 *    der Pixel in Production still bleibt.
 *
 * Der zugehörige CAPI-Token ist ein Secret und steht in `META_CAPI_TOKEN`.
 */
export const TRICHTERWERK_PIXEL_ID = "1328032266066211";
