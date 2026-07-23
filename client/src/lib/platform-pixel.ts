/**
 * Meta-Pixel für trichterwerk.de selbst (Marketing-Seiten der Plattform).
 *
 * Abgrenzung zu den beiden anderen Tracking-Wegen im Projekt:
 *  - `platform-tracker.ts` — cookieless, eigene Reichweitenmessung, läuft ohne
 *    Einwilligung.
 *  - `meta-pixel.ts` + `public-funnel.tsx` — der Pixel, den KUNDEN pro Funnel
 *    hinterlegen. Gleiche Low-Level-Bausteine, andere Pixel-ID, anderer Consent.
 *
 * Dieser Hook ist der dritte Fall: unser eigener Pixel auf unseren eigenen
 * Seiten. Er lädt ausschließlich nach Marketing-Einwilligung (§ 25 TDDDG) und
 * nur für anonyme Besucher — eingeloggte Kunden, die die App benutzen, sind
 * keine Akquise und würden die Zahlen nur verwässern.
 */

import { useEffect, useRef } from "react";
import { useCookieConsent } from "@/components/cookie-consent";
import { injectMetaPixel, fbqTrack } from "@/lib/meta-pixel";
import { TRICHTERWERK_PIXEL_ID } from "@shared/meta";

/**
 * Lädt den Pixel und meldet Seitenaufrufe.
 *
 * @param location Aktueller Pfad (wouter) — jeder Wechsel erzeugt ein PageView.
 * @param enabled  Nur auf öffentlichen Marketing-Routen und nur für anonyme
 *                 Besucher true.
 */
export function useTrichterwerkPixel(location: string, enabled: boolean): void {
  const { allowsMarketing } = useCookieConsent();
  const isLoaded = useRef(false);
  // injectMetaPixel feuert beim ersten init bereits ein PageView. Ohne dieses
  // Flag käme für den Einstiegs-Seitenaufruf ein zweites hinterher.
  const initialPageViewDone = useRef(false);

  useEffect(() => {
    if (!enabled || !allowsMarketing || isLoaded.current) return;
    isLoaded.current = true;
    injectMetaPixel(TRICHTERWERK_PIXEL_ID);
  }, [enabled, allowsMarketing]);

  useEffect(() => {
    if (!enabled || !allowsMarketing || !isLoaded.current) return;
    if (!initialPageViewDone.current) {
      initialPageViewDone.current = true;
      return;
    }
    fbqTrack("PageView");
  }, [location, enabled, allowsMarketing]);
}
