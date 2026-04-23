import { useState, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import confetti from "canvas-confetti";
import { Loader2, AlertCircle, ChevronRight, ChevronLeft } from "lucide-react";

// Inject slide animation keyframes
const slideStyles = document.createElement("style");
slideStyles.textContent = `
  @keyframes slideInFromRight { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes slideInFromLeft { from { transform: translateX(-30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
`;
if (!document.getElementById("funnel-slide-styles")) {
  slideStyles.id = "funnel-slide-styles";
  document.head.appendChild(slideStyles);
}
import { loadFont } from "@/lib/font-loader";
import { ElementPreviewRenderer } from "@/components/funnel-editor/ElementPreviewRenderer";
import { FunnelProgress } from "@/components/funnel-editor/FunnelProgress";
import type { FunnelPage, Theme, PageElement, ABTest } from "@shared/schema";

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
  abTests?: ABTest[];
}

/**
 * Cookie-basiertes A/B-Test Variant-Assignment.
 * Gibt für jeden aktiven Test die zugewiesene Variante zurück.
 */
function getVariantAssignments(funnelUuid: string, abTests: ABTest[]): Record<string, string> {
  const cookieKey = `tw_ab_${funnelUuid}`;
  const existing = document.cookie
    .split("; ")
    .find((c) => c.startsWith(cookieKey + "="));

  let assignments: Record<string, string> = {};
  if (existing) {
    try {
      assignments = JSON.parse(decodeURIComponent(existing.split("=")[1]));
    } catch {
      assignments = {};
    }
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
    // Cookie für 30 Tage setzen
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${cookieKey}=${encodeURIComponent(JSON.stringify(assignments))}; expires=${expires}; path=/; SameSite=Lax`;
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
  const params = useParams<{ uuid: string }>();
  const [funnel, setFunnel] = useState<PublicFunnel | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left");
  const [isAnimating, setIsAnimating] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [viewTracked, setViewTracked] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [variantAssignments, setVariantAssignments] = useState<Record<string, string>>({});

  // Fetch funnel data
  useEffect(() => {
    async function loadFunnel() {
      try {
        const res = await fetch(`/api/public/funnels/${params.uuid}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Dieser Funnel existiert nicht oder ist nicht veröffentlicht.");
          } else {
            setError("Funnel konnte nicht geladen werden.");
          }
          return;
        }
        const data = await res.json();
        // Versteckte Seiten herausfiltern
        data.pages = data.pages.filter((p: FunnelPage) => !p.hidden);

        // A/B-Test Varianten anwenden
        const activeTests: ABTest[] = data.abTests || [];
        if (activeTests.length > 0) {
          const assignments = getVariantAssignments(data.uuid, activeTests);
          data.pages = applyVariantOverrides(data.pages, activeTests, assignments);
          setVariantAssignments(assignments);
        }

        setFunnel(data);
      } catch {
        setError("Verbindungsfehler. Bitte versuche es später erneut.");
      } finally {
        setIsLoading(false);
      }
    }
    if (params.uuid) loadFunnel();
  }, [params.uuid]);

  // Set page title for SEO + load font
  useEffect(() => {
    if (funnel) {
      document.title = funnel.name;
      if (funnel.theme?.fontFamily) {
        loadFont(funnel.theme.fontFamily);
      }
    }
    return () => { document.title = "Trichterwerk"; };
  }, [funnel]);

  // Load GTM script if configured
  useEffect(() => {
    if (!funnel?.gtmId) return;
    const gtmId = funnel.gtmId;

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];

    // Inject GTM script
    const script = document.createElement("script");
    script.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`;
    document.head.appendChild(script);

    return () => { script.remove(); };
  }, [funnel?.gtmId]);

  // Push GTM dataLayer event helper
  const pushDataLayer = useCallback((eventData: Record<string, unknown>) => {
    if (window.dataLayer) {
      window.dataLayer.push(eventData);
    }
  }, []);

  // Track view on first load
  useEffect(() => {
    if (funnel && !viewTracked) {
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
  }, [funnel, viewTracked, pushDataLayer, variantAssignments]);

  // Track page navigation
  const trackPageView = useCallback(
    (pageId: string) => {
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

      const pageIdx = funnel.pages.findIndex(p => p.id === pageId);
      const page = funnel.pages[pageIdx];
      if (page) {
        pushDataLayer({
          event: "funnel_step",
          funnel_name: funnel.name,
          funnel_id: funnel.uuid,
          step_number: pageIdx + 1,
          step_title: page.title,
        });
      }
    },
    [funnel, pushDataLayer]
  );

  const updateFormValue = useCallback((elementId: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [elementId]: value }));
  }, []);

  const validateCurrentPage = useCallback((): boolean => {
    if (!funnel) return false;
    const page = funnel.pages[currentPageIndex];
    const errors: Record<string, string> = {};

    for (const el of page.elements) {
      if (el.required && !formValues[el.id]?.trim()) {
        errors[el.id] = "Dieses Feld ist erforderlich";
      }
      // Email-Format prüfen
      const label = (el.label || el.placeholder || "").toLowerCase();
      if (el.type === "input" && (label.includes("email") || label.includes("e-mail")) && formValues[el.id]) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues[el.id])) {
          errors[el.id] = "Bitte gib eine gültige E-Mail-Adresse ein";
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [funnel, currentPageIndex, formValues]);

  const resolveNextPageIndex = useCallback((): number | null => {
    if (!funnel) return null;
    const page = funnel.pages[currentPageIndex];

    // 0. Check button elements with specific page targets
    for (const el of page.elements) {
      if (el.type === "button" && el.buttonAction === "page" && el.buttonNextPageId) {
        const targetIdx = funnel.pages.findIndex(p => p.id === el.buttonNextPageId);
        if (targetIdx >= 0) return targetIdx;
      }
    }

    // 0.5 Check element-level optionRouting (select/radio)
    for (const el of page.elements) {
      if ((el.type === "select" || el.type === "radio") && el.optionRouting) {
        const selectedValue = formValues[el.id];
        if (selectedValue && el.optionRouting[selectedValue]) {
          const targetIdx = funnel.pages.findIndex(p => p.id === el.optionRouting![selectedValue]);
          if (targetIdx >= 0) return targetIdx;
        }
      }
    }

    // 1. Check conditional routing (option → pageId)
    if (page.conditionalRouting) {
      for (const el of page.elements) {
        const value = formValues[el.id];
        if (value && page.conditionalRouting[value]) {
          const targetIdx = funnel.pages.findIndex(p => p.id === page.conditionalRouting![value]);
          if (targetIdx >= 0) return targetIdx;
        }
      }
    }

    // 2. Check advanced conditions
    if (page.conditions && page.conditions.length > 0) {
      for (const cond of page.conditions) {
        const value = formValues[cond.elementId] || "";
        let match = false;
        switch (cond.operator) {
          case "equals": match = value === cond.value; break;
          case "notEquals": match = value !== cond.value; break;
          case "contains": match = value.includes(cond.value || ""); break;
          case "isEmpty": match = !value.trim(); break;
        }
        if (match) {
          const targetIdx = funnel.pages.findIndex(p => p.id === cond.targetPageId);
          if (targetIdx >= 0) return targetIdx;
        }
      }
    }

    // 3. Check fixed nextPageId
    if (page.nextPageId) {
      const targetIdx = funnel.pages.findIndex(p => p.id === page.nextPageId);
      if (targetIdx >= 0) return targetIdx;
    }

    // 4. Default: next sequential page
    const nextIndex = currentPageIndex + 1;
    return nextIndex < funnel.pages.length ? nextIndex : null;
  }, [funnel, currentPageIndex, formValues]);

  const navigateToPage = useCallback((targetIndex: number, direction: "left" | "right") => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSlideDirection(direction);
    setTimeout(() => {
      setCurrentPageIndex(targetIndex);
      setIsAnimating(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  }, [isAnimating]);

  const handleNextPage = useCallback(() => {
    if (!funnel) return;
    if (!validateCurrentPage()) return;
    const nextIndex = resolveNextPageIndex();
    if (nextIndex !== null) {
      navigateToPage(nextIndex, "left");
      trackPageView(funnel.pages[nextIndex].id);
    }
  }, [funnel, validateCurrentPage, resolveNextPageIndex, trackPageView, navigateToPage]);

  const handlePrevPage = useCallback(() => {
    if (currentPageIndex > 0) {
      navigateToPage(currentPageIndex - 1, "right");
    }
  }, [currentPageIndex, navigateToPage]);

  const handleSubmit = useCallback(async () => {
    if (!funnel || isSubmitting) return;

    // Validierung
    if (!validateCurrentPage()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Collect form data from all pages
      const formData: Record<string, string> = {};
      let name = "";
      let email = "";
      let phone = "";
      let company = "";
      let message = "";

      // Map form values to lead fields based on element type + label
      for (const page of funnel.pages) {
        for (const el of page.elements) {
          const value = formValues[el.id];
          if (!value) continue;

          // Map fields based on label/placeholder text
          if (el.type === "input") {
            const label = (el.label || el.placeholder || "").toLowerCase();
            if (label.includes("email") || label.includes("e-mail")) email = value;
            else if (label.includes("telefon") || label.includes("phone") || label.includes("handy")) phone = value;
            else if (label.includes("name") || label.includes("vorname")) name = value;
            else if (label.includes("firma") || label.includes("unternehmen") || label.includes("company")) company = value;
          }
          if (el.type === "textarea") {
            message = value;
          }
          formData[el.label || el.id] = value;
        }
      }

      const res = await fetch("/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funnelId: funnel.uuid,
          name: name || undefined,
          email: email || undefined,
          phone: phone || undefined,
          company: company || undefined,
          message: message || undefined,
          answers: formData,
          source: document.referrer || "direct",
        }),
      });

      if (res.ok) {
        setSubmitted(true);
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

        const thankyouIndex = funnel.pages.findIndex((p) => p.type === "thankyou");
        if (thankyouIndex >= 0) {
          setCurrentPageIndex(thankyouIndex);
        }
        // Konfetti-Animation
        setTimeout(() => {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }, 300);
      } else {
        setSubmitError("Absenden fehlgeschlagen. Bitte versuche es erneut.");
      }
    } catch {
      setSubmitError("Verbindungsfehler. Bitte prüfe deine Internetverbindung.");
    } finally {
      setIsSubmitting(false);
    }
  }, [funnel, formValues, isSubmitting, validateCurrentPage]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Error state
  if (error || !funnel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            Seite nicht verfügbar
          </h1>
          <p className="text-gray-500">{error || "Funnel nicht gefunden."}</p>
        </div>
      </div>
    );
  }

  const currentPage = funnel.pages[currentPageIndex];
  if (!currentPage) return null;

  const { theme } = funnel;
  const isLastPage = currentPageIndex === funnel.pages.length - 1;
  const isFirstPage = currentPageIndex === 0;
  const isContactPage = currentPage.type === "contact";
  const isThankyouPage = currentPage.type === "thankyou";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: currentPage.backgroundColor || theme.backgroundColor,
        color: theme.textColor,
        fontFamily: theme.fontFamily || "system-ui, sans-serif",
      }}
    >
      {/* Progress bar */}
      {funnel.pages.length > 1 && !isThankyouPage && (
        <FunnelProgress
          currentPage={currentPageIndex}
          totalPages={funnel.pages.length}
          primaryColor={theme.primaryColor}
        />
      )}

      {/* Page content with slide animation */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 overflow-hidden">
        <div
          key={currentPageIndex}
          className="w-full max-w-lg mx-auto space-y-6"
          style={{
            animation: `${slideDirection === "left" ? "slideInFromRight" : "slideInFromLeft"} 0.35s ease-out`,
          }}
        >
          {/* Page title */}
          {currentPage.title && (
            <h1
              className="text-2xl md:text-3xl font-bold text-center leading-tight"
              style={{ color: theme.textColor }}
            >
              {currentPage.title}
            </h1>
          )}

          {/* Page subtitle */}
          {currentPage.subtitle && (
            <p className="text-center text-base opacity-70">
              {currentPage.subtitle}
            </p>
          )}

          {/* Elements */}
          <div className="space-y-4">
            {currentPage.elements.map((element: PageElement) => (
              <div key={element.id}>
                <ElementPreviewRenderer
                  element={element}
                  textColor={theme.textColor}
                  primaryColor={theme.primaryColor}
                  formValues={formValues}
                  updateFormValue={(id, value) => {
                    updateFormValue(id, value);
                    if (validationErrors[id]) {
                      setValidationErrors((prev) => {
                        const next = { ...prev };
                        delete next[id];
                        return next;
                      });
                    }
                  }}
                  onButtonClick={(el) => {
                    if (el.buttonAction === "page" && el.buttonNextPageId && funnel) {
                      const targetIdx = funnel.pages.findIndex(p => p.id === el.buttonNextPageId);
                      if (targetIdx >= 0) {
                        navigateToPage(targetIdx, targetIdx > currentPageIndex ? "left" : "right");
                        trackPageView(funnel.pages[targetIdx].id);
                      }
                    } else if (el.buttonAction !== "url") {
                      handleNextPage();
                    }
                  }}
                  onListItemClick={(el, itemId) => {
                    const item = el.listItems?.find(i => i.id === itemId);
                    if (item?.targetPageId && funnel) {
                      const targetIdx = funnel.pages.findIndex(p => p.id === item.targetPageId);
                      if (targetIdx >= 0) {
                        navigateToPage(targetIdx, targetIdx > currentPageIndex ? "left" : "right");
                        trackPageView(funnel.pages[targetIdx].id);
                      }
                    }
                  }}
                />
                {validationErrors[element.id] && (
                  <p className="text-red-500 text-xs mt-1 px-1">{validationErrors[element.id]}</p>
                )}
              </div>
            ))}
          </div>

          {/* Submit error */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {submitError}
            </div>
          )}

          {/* Navigation buttons */}
          {!isThankyouPage && (
            <div className="flex gap-3 pt-4">
              {!isFirstPage && (
                <button
                  onClick={handlePrevPage}
                  className="flex items-center gap-1 px-5 py-3 rounded-xl text-sm font-medium opacity-70 hover:opacity-100 transition-opacity"
                  style={{ color: theme.textColor }}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Zurück
                </button>
              )}

              <button
                onClick={
                  isContactPage || isLastPage ? handleSubmit : handleNextPage
                }
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: theme.primaryColor }}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isContactPage || isLastPage ? (
                  currentPage.buttonText || "Absenden"
                ) : (
                  <>
                    {currentPage.buttonText || "Weiter"}
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Success message for thank you page */}
          {isThankyouPage && submitted && (
            <div
              className="text-center p-6 rounded-2xl"
              style={{
                backgroundColor: `${theme.primaryColor}10`,
              }}
            >
              <div
                className="h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Branding footer */}
      <div className="text-center py-4 text-xs opacity-30">
        Erstellt mit Trichterwerk
      </div>
    </div>
  );
}
