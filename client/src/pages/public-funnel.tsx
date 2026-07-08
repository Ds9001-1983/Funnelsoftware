import { useState, useEffect, useCallback } from "react";
import { useLocation, Link } from "wouter";
import {
  Loader2,
  AlertCircle,
  Eye,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";

import { getMutedContrastColor, sanitizeUrl } from "@/lib/utils";
import { injectMetaPixel, fbqTrack } from "@/lib/meta-pixel";
import { useCookieConsent, resetCookieConsent } from "@/components/cookie-consent";
import {
  FunnelRenderer,
  type FunnelLeadPayload,
} from "@/components/funnel-viewer/FunnelRenderer";
import type { FunnelPage, Theme, ABTest } from "@shared/schema";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

interface PublicFunnel {
  uuid: string;
  name: string;
  pages: FunnelPage[];
  theme: Theme;
  gtmId?: string | null;
  metaPixelId?: string | null;
  abTests?: ABTest[];
  impressumUrl?: string | null;
  datenschutzUrl?: string | null;
}

/** Analytics-Consent direkt aus dem gespeicherten Banner-Stand lesen (default-deny). */
function hasAnalyticsConsent(): boolean {
  try {
    const prefs = localStorage.getItem("trichterwerk-cookie-preferences");
    return prefs ? !!JSON.parse(prefs)?.analytics : false;
  } catch {
    return false;
  }
}

/**
 * Cookie-basiertes A/B-Test Variant-Assignment.
 * Gibt für jeden aktiven Test die zugewiesene Variante zurück.
 */
function getVariantAssignments(funnelUuid: string, abTests: ABTest[]): Record<string, string> {
  const storageKey = `tw_ab_${funnelUuid}`;

  // Bestehende Zuweisung lesen: Cookie (mit Consent gesetzt) vor sessionStorage
  let assignments: Record<string, string> = {};
  const existingCookie = document.cookie
    .split("; ")
    .find((c) => c.startsWith(storageKey + "="));
  try {
    if (existingCookie) {
      assignments = JSON.parse(decodeURIComponent(existingCookie.split("=")[1]));
    } else {
      const fromSession = sessionStorage.getItem(storageKey);
      if (fromSession) assignments = JSON.parse(fromSession);
    }
  } catch {
    assignments = {};
  }

  let changed = false;
  for (const test of abTests) {
    if (test.status !== "running") continue;
    if (assignments[test.id]) continue;

    // Weighted random selection
    const rand = Math.random() * 100;
    let cumulative = 0;
    for (const variant of test.variants) {
      cumulative += variant.trafficAllocation;
      if (rand <= cumulative) {
        assignments[test.id] = variant.id;
        changed = true;
        break;
      }
    }
  }

  if (changed) {
    // § 25 TDDDG: sessionStorage (Session-Konsistenz, technisch erforderlich)
    // immer; das 30-Tage-Cookie nur mit Analytics-Consent des Besuchers.
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(assignments));
    } catch {
      // Storage voll/blockiert → Zuweisung gilt nur für diesen Seitenaufruf
    }
    if (hasAnalyticsConsent()) {
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `${storageKey}=${encodeURIComponent(JSON.stringify(assignments))}; expires=${expires}; path=/; SameSite=Lax`;
    }
  }

  return assignments;
}

/**
 * Wendet A/B-Test-Varianten auf Seiten an (Title, Subtitle, Elements Override).
 */
function applyVariantOverrides(
  pages: FunnelPage[],
  abTests: ABTest[],
  assignments: Record<string, string>
): FunnelPage[] {
  return pages.map((page) => {
    for (const test of abTests) {
      if (test.pageId !== page.id || test.status !== "running") continue;
      const variantId = assignments[test.id];
      if (!variantId) continue;

      const variant = test.variants.find((v) => v.id === variantId);
      if (!variant) continue;

      // Variante 0 (Kontrolle) = keine Änderung
      if (test.variants[0]?.id === variantId) continue;

      return {
        ...page,
        title: variant.title || page.title,
        subtitle: variant.subtitle || page.subtitle,
        elements: variant.elements || page.elements,
        backgroundColor: variant.backgroundColor || page.backgroundColor,
        buttonText: variant.buttonText || page.buttonText,
      };
    }
    return page;
  });
}

export default function PublicFunnelView() {
  const [location] = useLocation();
  // Preview-Mode wenn Route /preview/:id ist (nur für eingeloggte Owner)
  const isPreviewMode = location.startsWith("/preview/");
  // ID/UUID aus der Pfad-URL extrahieren (/f/:uuid oder /preview/:id)
  const params = {
    uuid: location.replace(/^\/(f|preview)\//, "").split(/[/?#]/)[0],
  };

  const [funnel, setFunnel] = useState<PublicFunnel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const [viewTracked, setViewTracked] = useState(false);
  const [variantAssignments, setVariantAssignments] = useState<Record<string, string>>({});

  // Fetch funnel data (public ODER preview, je nach Route)
  useEffect(() => {
    if (!params.uuid) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s Timeout

    async function loadFunnel() {
      setIsLoading(true);
      setError(null);
      try {
        const url = isPreviewMode
          ? `/api/funnels/${params.uuid}/preview`
          : `/api/public/funnels/${params.uuid}`;

        const res = await fetch(url, {
          credentials: isPreviewMode ? "include" : "same-origin",
          signal: controller.signal,
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setError("Bitte melde dich an, um diese Vorschau zu sehen.");
          } else if (res.status === 404) {
            setError(
              isPreviewMode
                ? "Funnel nicht gefunden — bitte prüfe die ID."
                : "Dieser Funnel existiert nicht oder ist nicht veröffentlicht.",
            );
          } else if (res.status === 410) {
            setError("Dieser Funnel ist derzeit pausiert.");
          } else {
            setError("Funnel konnte nicht geladen werden.");
          }
          return;
        }

        const data = await res.json();
        // Versteckte Seiten herausfiltern (Preview zeigt Owner auch versteckte — Audit-freundlich)
        if (!isPreviewMode) {
          data.pages = data.pages.filter((p: FunnelPage) => !p.hidden);
        }

        // A/B-Test Varianten anwenden (nur public, nicht im Preview)
        const activeTests: ABTest[] = data.abTests || [];
        if (!isPreviewMode && activeTests.length > 0) {
          const assignments = getVariantAssignments(data.uuid, activeTests);
          data.pages = applyVariantOverrides(data.pages, activeTests, assignments);
          setVariantAssignments(assignments);
        }

        setFunnel(data);
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") {
          setError(
            "Ladevorgang hat länger als 15 Sekunden gedauert. Bitte versuche es erneut.",
          );
        } else {
          setError("Verbindungsfehler. Bitte versuche es später erneut.");
        }
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    }

    loadFunnel();

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [params.uuid, isPreviewMode, retryNonce]);

  // Set page title for SEO (Font lädt der FunnelRenderer)
  useEffect(() => {
    if (funnel) {
      document.title = funnel.name;
    }
    return () => { document.title = "Trichterwerk"; };
  }, [funnel]);

  // Cookie-Consent des Besuchers — gated GTM (§ 25 TDDDG / DSGVO)
  const { allowsAnalytics, allowsMarketing } = useCookieConsent();
  const gtmAllowed = allowsAnalytics || allowsMarketing;

  // Load GTM script — NUR mit Consent. Vorher lud der Container (inkl. der
  // darüber konfigurierten Tracking-Tags) unbedingt bei Seitenaufruf, auch
  // nach "Nur Notwendige" — abmahnfähig auf jedem Kunden-Funnel.
  useEffect(() => {
    if (!funnel?.gtmId || !gtmAllowed) return;
    const gtmId = funnel.gtmId;

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];

    // Consent Mode v2: Granulare Freigabe VOR dem Laden des Containers melden
    // (GTM erwartet das arguments-Objekt, kein Array).
    function gtag(..._args: unknown[]) {
      // eslint-disable-next-line prefer-rest-params
      (window.dataLayer as unknown[]).push(arguments);
    }
    gtag("consent", "default", {
      ad_storage: allowsMarketing ? "granted" : "denied",
      ad_user_data: allowsMarketing ? "granted" : "denied",
      ad_personalization: allowsMarketing ? "granted" : "denied",
      analytics_storage: allowsAnalytics ? "granted" : "denied",
    });

    // Inject GTM script
    const script = document.createElement("script");
    script.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`;
    document.head.appendChild(script);

    // Bei Widerruf führt resetCookieConsent() einen Reload aus —
    // ein geladener Container lässt sich nicht sauber entladen.
    return () => { script.remove(); };
  }, [funnel?.gtmId, gtmAllowed, allowsAnalytics, allowsMarketing]);

  // Browser-Meta-Pixel — die Client-Hälfte zur Server-CAPI. Lädt NUR mit
  // Marketing-Consent (das Pixel setzt _fbp/_fbc-Cookies) und nie im
  // Preview-Mode. Nebeneffekt: die Cookies verbessern die Match-Quality der
  // CAPI-Events, weil der Server sie aus dem Lead-Request liest.
  useEffect(() => {
    if (!funnel?.metaPixelId || !allowsMarketing || isPreviewMode) return;
    return injectMetaPixel(funnel.metaPixelId);
  }, [funnel?.metaPixelId, allowsMarketing, isPreviewMode]);

  // Push GTM dataLayer event helper
  const pushDataLayer = useCallback((eventData: Record<string, unknown>) => {
    if (window.dataLayer) {
      window.dataLayer.push(eventData);
    }
  }, []);

  // Track view on first load (nicht im Preview-Mode — Owner-Tests sollen Stats nicht verfälschen)
  useEffect(() => {
    if (funnel && !viewTracked && !isPreviewMode) {
      setViewTracked(true);
      fetch("/api/public/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funnelUuid: funnel.uuid,
          eventType: "view",
          metadata: Object.keys(variantAssignments).length > 0
            ? { abVariants: variantAssignments }
            : undefined,
        }),
      }).catch((e) => console.warn("Analytics tracking failed:", e));

      pushDataLayer({ event: "funnel_view", funnel_name: funnel.name, funnel_id: funnel.uuid });
    }
  }, [funnel, viewTracked, pushDataLayer, variantAssignments, isPreviewMode]);

  // Track page navigation (nur live — im Preview-Mode wird der Callback nicht übergeben)
  const trackPageView = useCallback(
    (pageId: string, pageIndex: number) => {
      if (!funnel) return;
      fetch("/api/public/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funnelUuid: funnel.uuid,
          eventType: "pageView",
          pageId,
        }),
      }).catch((e) => console.warn("Analytics tracking failed:", e));

      // Virtueller PageView pro Funnel-Schritt (Standard-SPA-Praxis) —
      // No-op ohne Consent/Pixel.
      fbqTrack("PageView");

      const page = funnel.pages[pageIndex];
      if (page) {
        pushDataLayer({
          event: "funnel_step",
          funnel_name: funnel.name,
          funnel_id: funnel.uuid,
          step_number: pageIndex + 1,
          step_title: page.title,
        });
      }
    },
    [funnel, pushDataLayer]
  );

  // Lead absenden: Payload kommt fertig gemappt aus dem FunnelRenderer,
  // hier kommen funnelId, Source und Consent dazu.
  const submitLead = useCallback(
    async (payload: FunnelLeadPayload): Promise<boolean> => {
      if (!funnel) return false;

      // DSGVO: Marketing-Consent aus dem Cookie-Banner auslesen — gated
      // server-side Tracking (z. B. Meta CAPI). Wenn kein Banner gespeichert
      // wurde, gilt default-deny.
      let marketingConsent = false;
      try {
        const prefs = localStorage.getItem("trichterwerk-cookie-preferences");
        if (prefs) marketingConsent = !!JSON.parse(prefs)?.marketing;
      } catch {
        // ungültiges JSON → kein Consent
      }

      const res = await fetch("/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funnelId: funnel.uuid,
          // Honeypot: bei Menschen immer leer; nur Bots befüllen es.
          website: payload.website,
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          company: payload.company,
          message: payload.message,
          answers: payload.answers,
          source: document.referrer || "direct",
          marketingConsent,
        }),
      });

      if (!res.ok) return false;

      // Browser-Lead mit eventID = Lead-UUID (Server-Response): Meta
      // dedupliziert gegen das server-seitige CAPI-Event mit derselben
      // event_id — beide Events zählen als eines.
      const data = (await res.json().catch(() => null)) as { id?: string } | null;
      fbqTrack("Lead", {}, data?.id ? { eventID: data.id } : undefined);

      fetch("/api/public/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funnelUuid: funnel.uuid,
          eventType: "submit",
        }),
      }).catch((e) => console.warn("Analytics tracking failed:", e));

      pushDataLayer({ event: "funnel_submit", funnel_name: funnel.name, funnel_id: funnel.uuid });

      // Track completion
      fetch("/api/public/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funnelUuid: funnel.uuid,
          eventType: "complete",
        }),
      }).catch((e) => console.warn("Analytics tracking failed:", e));

      pushDataLayer({ event: "funnel_complete", funnel_name: funnel.name, funnel_id: funnel.uuid });

      return true;
    },
    [funnel, pushDataLayer]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <p className="text-sm text-gray-500">
          {isPreviewMode ? "Vorschau wird geladen …" : "Funnel wird geladen …"}
        </p>
      </div>
    );
  }

  // Error state — mit Retry + Zurück-Link für Preview-Mode
  if (error || !funnel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            {isPreviewMode ? "Vorschau nicht verfügbar" : "Seite nicht verfügbar"}
          </h1>
          <p className="text-gray-500 mb-6">{error || "Funnel nicht gefunden."}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setRetryNonce((n) => n + 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Erneut versuchen
            </button>
            {isPreviewMode && (
              <Link
                href={`/funnels/${params.uuid}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Zurück zum Editor
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Preview-Mode Banner — zeigt Owner „Dies ist nur eine Vorschau"
  const previewBanner = isPreviewMode ? (
    <div className="sticky top-0 z-50 bg-amber-500 text-amber-950 text-xs font-medium px-4 py-2 flex items-center justify-center gap-2 shadow-sm">
      <Eye className="h-3.5 w-3.5 shrink-0" />
      <span>
        Vorschau-Modus — diese Seite ist für Besucher noch nicht erreichbar.
      </span>
      <Link
        href={`/funnels/${params.uuid}`}
        className="ml-2 underline underline-offset-2 hover:no-underline"
      >
        Zurück zum Editor
      </Link>
    </div>
  ) : undefined;

  return (
    <FunnelRenderer
      funnel={funnel}
      mode="live"
      onSubmit={isPreviewMode ? undefined : submitLead}
      onPageView={isPreviewMode ? undefined : trackPageView}
      header={previewBanner}
      renderFooter={(currentPage) => (
        // Footer: Rechtslinks des Funnel-Owners + Consent-Widerruf + Branding
        <div
          className="text-center py-4 text-xs space-y-1.5"
          style={{ color: getMutedContrastColor(currentPage.backgroundColor || funnel.theme.backgroundColor) }}
        >
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {sanitizeUrl(funnel.impressumUrl) && (
              <a
                href={sanitizeUrl(funnel.impressumUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:opacity-80"
              >
                Impressum
              </a>
            )}
            {sanitizeUrl(funnel.datenschutzUrl) && (
              <a
                href={sanitizeUrl(funnel.datenschutzUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:opacity-80"
              >
                Datenschutz
              </a>
            )}
            {/* Art. 7 Abs. 3 DSGVO: Widerruf so einfach wie die Erteilung */}
            <button
              onClick={resetCookieConsent}
              className="underline underline-offset-2 hover:opacity-80"
            >
              Cookie-Einstellungen
            </button>
          </div>
          <div>Erstellt mit Trichterwerk</div>
        </div>
      )}
    />
  );
}
