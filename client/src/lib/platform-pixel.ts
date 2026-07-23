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
 * Veröffentlichter Kundenfunnel oder dessen Owner-Vorschau.
 *
 * Diese Routen sind für unseren Pixel tabu. Sie gelten zwar als „öffentlich"
 * (der Cookie-Banner muss dort erscheinen), gehören aber dem Kunden — teils
 * unter seiner eigenen Domain — und tragen bereits SEINEN Pixel. Würden wir
 * dort zusätzlich initialisieren, bekäme `fbq("track", "PageView")` zwei
 * initialisierte Pixel und jeder Seitenaufruf des Kunden zählte doppelt.
 */
export function isCustomerFunnelRoute(location: string): boolean {
  return location.startsWith("/f/") || location.startsWith("/preview/");
}

/**
 * Lädt den Pixel und meldet Seitenaufrufe.
 *
 * @param location Aktueller Pfad (wouter) — jeder Wechsel erzeugt ein PageView.
 * @param enabled  Nur auf öffentlichen Routen und nur für anonyme Besucher
 *                 true. Kundenfunnel-Routen schließt der Hook selbst aus.
 */
export function useTrichterwerkPixel(location: string, enabled: boolean): void {
  const { allowsMarketing } = useCookieConsent();
  const isLoaded = useRef(false);
  // injectMetaPixel feuert beim ersten init bereits ein PageView. Ohne dieses
  // Flag käme für den Einstiegs-Seitenaufruf ein zweites hinterher.
  const initialPageViewDone = useRef(false);

  // Bewusst im Hook geprüft und nicht nur beim Aufrufer: Ein künftiger Aufrufer
  // soll den Pixel nicht versehentlich auf einen Kundenfunnel bringen können.
  const active = enabled && allowsMarketing && !isCustomerFunnelRoute(location);

  useEffect(() => {
    if (!active || isLoaded.current) return;
    isLoaded.current = true;
    injectMetaPixel(TRICHTERWERK_PIXEL_ID);
  }, [active]);

  useEffect(() => {
    if (!active || !isLoaded.current) return;
    if (!initialPageViewDone.current) {
      initialPageViewDone.current = true;
      return;
    }
    fbqTrack("PageView");
  }, [location, active]);
}
