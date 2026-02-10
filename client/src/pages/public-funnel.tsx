import { useState, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { FunnelPage, PageElement } from "@shared/schema";
import { FunnelProgress } from "@/components/funnel-editor/FunnelProgress";
import { ElementPreviewRenderer } from "@/components/funnel-editor/ElementPreviewRenderer";
import { SectionPreviewRenderer } from "@/components/funnel-editor/ElementPreviewRenderer";

interface PublicFunnel {
  uuid: string;
  name: string;
  pages: FunnelPage[];
  theme: {
    primaryColor: string;
    fontFamily?: string;
    borderRadius?: string;
  };
}

/**
 * Öffentliche Funnel-Viewer-Seite.
 * Rendert einen veröffentlichten Funnel im Fullscreen ohne Editor-UI.
 * Unterstützt Navigation zwischen Seiten, Formulare und Analytics.
 */
export default function PublicFunnel() {
  const params = useParams<{ uuid: string }>();
  const [funnel, setFunnel] = useState<PublicFunnel | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  // Funnel laden
  useEffect(() => {
    async function loadFunnel() {
      try {
        const response = await fetch(`/api/public/funnels/${params.uuid}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Dieser Funnel wurde nicht gefunden oder ist nicht veröffentlicht.");
          } else {
            setError("Fehler beim Laden des Funnels.");
          }
          return;
        }
        const data = await response.json();
        setFunnel(data);

        // Analytics: Page View
        trackEvent(data.uuid, "page_view", data.pages[0]?.id);
      } catch {
        setError("Verbindungsfehler. Bitte versuche es später erneut.");
      } finally {
        setIsLoading(false);
      }
    }
    if (params.uuid) {
      loadFunnel();
    }
  }, [params.uuid]);

  // Analytics Event
  const trackEvent = useCallback((funnelUuid: string, eventType: string, pageId?: string) => {
    fetch("/api/public/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ funnelUuid, eventType, pageId }),
    }).catch(() => {});
  }, []);

  // Form Values
  const updateFormValue = useCallback((elementId: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [elementId]: value }));
  }, []);

  // Nächste Seite
  const goToNextPage = useCallback(() => {
    if (!funnel) return;
    const page = funnel.pages[currentPageIndex];

    // Conditional Logic prüfen
    if (page.conditions && page.conditions.length > 0) {
      for (const condition of page.conditions) {
        const fieldValue = formValues[condition.elementId];
        if (fieldValue) {
          let matches = false;
          if (condition.operator === "equals") matches = fieldValue === condition.value;
          if (condition.operator === "contains") matches = fieldValue.includes(condition.value || "");
          if (condition.operator === "notEquals") matches = fieldValue !== condition.value;
          if (condition.operator === "isEmpty") matches = !fieldValue || fieldValue.trim() === "";

          if (matches) {
            const targetIndex = funnel.pages.findIndex((p) => p.id === condition.targetPageId);
            if (targetIndex !== -1) {
              setCurrentPageIndex(targetIndex);
              trackEvent(funnel.uuid, "page_view", funnel.pages[targetIndex].id);
              return;
            }
          }
        }
      }
    }

    // Simple conditional routing (option -> pageId mapping)
    if (page.conditionalRouting) {
      for (const [value, targetPageId] of Object.entries(page.conditionalRouting)) {
        const hasMatch = Object.values(formValues).some((v) => v === value);
        if (hasMatch) {
          const targetIndex = funnel.pages.findIndex((p) => p.id === targetPageId);
          if (targetIndex !== -1) {
            setCurrentPageIndex(targetIndex);
            trackEvent(funnel.uuid, "page_view", funnel.pages[targetIndex].id);
            return;
          }
        }
      }
    }

    // Standard-Weiterleitung
    if (page.nextPageId) {
      const targetIndex = funnel.pages.findIndex((p) => p.id === page.nextPageId);
      if (targetIndex !== -1) {
        setCurrentPageIndex(targetIndex);
        trackEvent(funnel.uuid, "page_view", funnel.pages[targetIndex].id);
        return;
      }
    }

    // Nächste Seite in Reihenfolge
    if (currentPageIndex < funnel.pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
      trackEvent(funnel.uuid, "page_view", funnel.pages[currentPageIndex + 1].id);
    }
  }, [funnel, currentPageIndex, formValues, trackEvent]);

  // Vorherige Seite
  const goToPreviousPage = useCallback(() => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
      if (funnel) {
        trackEvent(funnel.uuid, "page_view", funnel.pages[currentPageIndex - 1].id);
      }
    }
  }, [currentPageIndex, funnel, trackEvent]);

  // Lead-Daten senden
  const submitLead = useCallback(async () => {
    if (!funnel) return;

    try {
      await fetch("/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funnelId: funnel.uuid,
          data: formValues,
        }),
      });
      trackEvent(funnel.uuid, "lead_submit", funnel.pages[currentPageIndex].id);
    } catch {
      // Silent fail for lead submission
    }

    goToNextPage();
  }, [funnel, formValues, currentPageIndex, trackEvent, goToNextPage]);

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Error
  if (error || !funnel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Nicht gefunden</h1>
          <p className="text-gray-500">{error || "Dieser Funnel existiert nicht."}</p>
        </div>
      </div>
    );
  }

  const page = funnel.pages[currentPageIndex];
  if (!page) return null;

  const primaryColor = funnel.theme.primaryColor;
  const isWelcome = page.type === "welcome";
  const isThankyou = page.type === "thankyou";
  const isContact = page.type === "contact";
  const bgColor = page.backgroundColor || (isWelcome || isThankyou ? primaryColor : "#ffffff");
  const textColor = isWelcome || isThankyou ? "#ffffff" : "#1a1a1a";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div
        className="w-full max-w-md mx-auto rounded-2xl shadow-2xl overflow-hidden"
        style={{ fontFamily: funnel.theme.fontFamily || "inherit" }}
      >
        <div
          className="min-h-[500px] flex flex-col"
          style={{ backgroundColor: bgColor }}
        >
          {/* Progress bar */}
          {!isWelcome && !isThankyou && funnel.pages.length > 1 && (
            <FunnelProgress
              currentPage={currentPageIndex}
              totalPages={funnel.pages.length}
              primaryColor={primaryColor}
            />
          )}

          <div className="flex-1 flex flex-col p-6 text-center">
            {/* Titel */}
            <h2
              className="text-xl font-bold mb-2"
              style={{ color: textColor }}
            >
              {page.title}
            </h2>

            {/* Untertitel */}
            {page.subtitle && (
              <p
                className="text-sm opacity-80 mb-6"
                style={{ color: textColor }}
              >
                {page.subtitle}
              </p>
            )}

            {/* Elemente */}
            {page.elements.length > 0 && (
              <div className="space-y-3 mt-4">
                {page.elements.map((el) => (
                  <ElementPreviewRenderer
                    key={el.id}
                    element={el}
                    textColor={textColor}
                    primaryColor={primaryColor}
                    formValues={formValues}
                    updateFormValue={updateFormValue}
                  />
                ))}
              </div>
            )}

            {/* Sections */}
            {page.sections && page.sections.length > 0 && (
              <div className="mt-4 space-y-4">
                {page.sections.map((section) => (
                  <SectionPreviewRenderer
                    key={section.id}
                    section={section}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="p-6 pt-0 space-y-3">
            {page.buttonText && (
              <button
                onClick={isContact ? submitLead : goToNextPage}
                className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] shadow-lg"
                style={{
                  backgroundColor: isWelcome || isThankyou ? "#ffffff" : primaryColor,
                  color: isWelcome || isThankyou ? primaryColor : "#ffffff",
                }}
              >
                {page.buttonText}
              </button>
            )}

            {/* Zurück-Button (nicht auf Welcome-Seite) */}
            {currentPageIndex > 0 && !isWelcome && (
              <button
                onClick={goToPreviousPage}
                className="w-full py-2 text-sm opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center gap-1"
                style={{ color: textColor }}
              >
                <ChevronLeft className="h-4 w-4" />
                Zurück
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
