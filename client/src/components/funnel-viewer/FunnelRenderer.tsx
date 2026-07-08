import { useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import confetti from "canvas-confetti";
import { Loader2, ChevronRight, ChevronLeft } from "lucide-react";

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
import { getNextPageIndex } from "@/lib/funnel-logic";
import { ElementPreviewRenderer } from "@/components/funnel-editor/ElementPreviewRenderer";
import { validateField } from "@/components/funnel-editor/FormFieldWithValidation";
import { FunnelProgress } from "@/components/funnel-editor/FunnelProgress";
import { getQuizAnswersFromFormValues } from "@/components/funnel-editor/QuizElementView";
import type { FunnelPage, Theme, PageElement } from "@shared/schema";

/** Minimale Funnel-Daten, die der Renderer braucht — erfüllt sowohl der
 *  Public-API-Response als auch ein ClientTemplate aus templates.ts. */
export interface RenderableFunnel {
  pages: FunnelPage[];
  theme: Theme;
}

/** Lead-Daten, die der Renderer beim Absenden aus den Formularwerten baut.
 *  Der Aufrufer ergänzt funnelId, source und Consent und POSTet selbst. */
export interface FunnelLeadPayload {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  message?: string;
  answers: Record<string, string>;
  /** Honeypot-Wert — bei Menschen immer leer; nur Bots befüllen ihn. */
  website?: string;
}

interface FunnelRendererProps {
  funnel: RenderableFunnel;
  /** Steuert nur das Scroll-Verhalten beim Seitenwechsel: "live" scrollt das
   *  Window (Vollseiten-Funnel), "preview" nur den eigenen Content-Container
   *  (eingebettet, z. B. im Phone-Mockup). */
  mode: "live" | "preview";
  /** Absenden des Leads. Fehlt der Callback (Vorschau), wird Erfolg simuliert:
   *  Sprung zur Danke-Seite + Konfetti, ohne jeden Netzwerk-Call.
   *  Rückgabe false → Fehlermeldung "Absenden fehlgeschlagen",
   *  Exception → "Verbindungsfehler". */
  onSubmit?: (payload: FunnelLeadPayload) => Promise<boolean>;
  /** Wird bei jeder Vorwärts-Navigation mit der Zielseite aufgerufen
   *  (Analytics/dataLayer). Fehlt er, wird nichts getrackt. */
  onPageView?: (pageId: string, pageIndex: number) => void;
  /** Optionaler Inhalt oberhalb des Funnels (z. B. Vorschau-Banner). */
  header?: ReactNode;
  /** Optionaler Footer; erhält die aktuelle Seite, damit z. B. die
   *  Textfarbe zur Seiten-Hintergrundfarbe passen kann. */
  renderFooter?: (currentPage: FunnelPage) => ReactNode;
  /** Überschreibt die Höhen-Klasse des Wurzelelements (Default min-h-screen);
   *  eingebettete Vorschauen übergeben z. B. "h-full". */
  className?: string;
}

/**
 * Interaktiver Funnel-Renderer: Seiten-Navigation mit Branching-Logik,
 * Validierung, Lead-Field-Mapping und Danke-Seite. Netzwerk- und
 * Tracking-Belange bleiben beim Aufrufer (onSubmit/onPageView) —
 * ohne Callbacks rendert die Komponente einen komplett offline
 * durchspielbaren Funnel (Template-/Owner-Vorschau).
 */
export function FunnelRenderer({
  funnel,
  mode,
  onSubmit,
  onPageView,
  header,
  renderFooter,
  className,
}: FunnelRendererProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left");
  const [isAnimating, setIsAnimating] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);

  // Theme-Font laden (Google Fonts) — gilt für Live wie Vorschau
  useEffect(() => {
    if (funnel.theme?.fontFamily) {
      loadFont(funnel.theme.fontFamily);
    }
  }, [funnel.theme?.fontFamily]);

  const updateFormValue = useCallback((elementId: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [elementId]: value }));
  }, []);

  const validateCurrentPage = useCallback((): boolean => {
    const page = funnel.pages[currentPageIndex];
    if (!page) return false;
    const errors: Record<string, string> = {};

    for (const el of page.elements) {
      const value = formValues[el.id] || "";

      if (el.type === "input" || el.type === "textarea") {
        // Konfigurierte Validierungsregeln (required, min/max, Typ, Pattern)
        // durchsetzen — vorher wurden sie beim Weiter/Absenden ignoriert.
        const result = validateField(el, value);
        if (!result.isValid) {
          errors[el.id] = result.errorMessage || "Ungültige Eingabe";
          continue;
        }
        // Fallback-Heuristik für Alt-Funnels ohne validation.type:
        // Felder, die nach E-Mail aussehen, müssen eine valide E-Mail enthalten.
        const label = (el.label || el.placeholder || "").toLowerCase();
        if (
          value &&
          !el.validation?.type &&
          (label.includes("email") || label.includes("e-mail")) &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ) {
          errors[el.id] = "Bitte gib eine gültige E-Mail-Adresse ein";
        }
      } else if (el.type === "quiz" && el.required && !value.trim()) {
        // Der el.id-Key wird erst nach Beantwortung aller Fragen befüllt.
        errors[el.id] = "Bitte beantworte alle Quiz-Fragen";
      } else if (el.required && !value.trim()) {
        errors[el.id] = "Dieses Feld ist erforderlich";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [funnel, currentPageIndex, formValues]);

  const resolveNextPageIndex = useCallback((): number | null => {
    return getNextPageIndex(funnel.pages, currentPageIndex, formValues);
  }, [funnel, currentPageIndex, formValues]);

  const navigateToPage = useCallback((targetIndex: number, direction: "left" | "right") => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSlideDirection(direction);
    setTimeout(() => {
      setCurrentPageIndex(targetIndex);
      setIsAnimating(false);
      if (mode === "live") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 50);
  }, [isAnimating, mode]);

  const handleNextPage = useCallback(() => {
    if (!validateCurrentPage()) return;
    const nextIndex = resolveNextPageIndex();
    if (nextIndex !== null) {
      navigateToPage(nextIndex, "left");
      onPageView?.(funnel.pages[nextIndex].id, nextIndex);
    }
  }, [funnel, validateCurrentPage, resolveNextPageIndex, onPageView, navigateToPage]);

  const handlePrevPage = useCallback(() => {
    if (currentPageIndex > 0) {
      navigateToPage(currentPageIndex - 1, "right");
    }
  }, [currentPageIndex, navigateToPage]);

  // Honeypot gegen Bot-Submissions: für Menschen unsichtbar (siehe Render unten),
  // nur Bots füllen es aus. Der Server (POST /api/public/leads) verwirft solche
  // Übermittlungen stumm.
  const honeypotRef = useRef<HTMLInputElement>(null);

  /** Formularwerte aller Seiten in Lead-Felder mappen. Explizites
   *  mapToLeadField hat Vorrang; andernfalls Label-/Placeholder-Heuristik
   *  (Fallback für Alt-Funnels). */
  const buildLeadPayload = useCallback((): FunnelLeadPayload => {
    const formData: Record<string, string> = {};
    let name = "";
    let email = "";
    let phone = "";
    let company = "";
    let message = "";

    for (const page of funnel.pages) {
      for (const el of page.elements) {
        const value = formValues[el.id];

        // Quiz: pro Frage die Antwort-Texte (statt IDs) + Ergebnis menschen-
        // lesbar in die answers legen. Muss VOR dem !value-Guard laufen — die
        // per-Frage-Keys existieren auch bei teilweise beantwortetem Quiz.
        if (el.type === "quiz" && el.quizConfig) {
          const quizAnswers = getQuizAnswersFromFormValues(el.id, el.quizConfig.questions, formValues);
          for (const q of el.quizConfig.questions) {
            const answerId = quizAnswers[q.id];
            if (!answerId) continue;
            const answerText = q.answers.find((a) => a.id === answerId)?.text ?? answerId;
            formData[q.question] = answerText;
          }
          // Der Ergebnis-Titel steht nach Abschluss unter el.id (QuizElementView
          // ist die einzige Quelle dieser Ableitung — hier nicht neu berechnen).
          if (value) {
            formData[el.label ? `${el.label} – Ergebnis` : "Quiz-Ergebnis"] = value;
          }
          // …und den el.id-Wert nicht nochmal generisch mappen.
          continue;
        }

        if (!value) continue;

        if (el.mapToLeadField) {
          if (el.mapToLeadField === "name") name = value;
          else if (el.mapToLeadField === "email") email = value;
          else if (el.mapToLeadField === "phone") phone = value;
          else if (el.mapToLeadField === "company") company = value;
          else if (el.mapToLeadField === "message") message = value;
        } else if (el.type === "input") {
          const label = (el.label || el.placeholder || "").toLowerCase();
          if (label.includes("email") || label.includes("e-mail")) email = value;
          else if (label.includes("telefon") || label.includes("phone") || label.includes("handy")) phone = value;
          else if (label.includes("name") || label.includes("vorname")) name = value;
          else if (label.includes("firma") || label.includes("unternehmen") || label.includes("company")) company = value;
        } else if (el.type === "textarea") {
          message = value;
        }
        formData[el.label || el.id] = value;
      }
    }

    return {
      name: name || undefined,
      email: email || undefined,
      phone: phone || undefined,
      company: company || undefined,
      message: message || undefined,
      answers: formData,
      website: honeypotRef.current?.value || undefined,
    };
  }, [funnel, formValues]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    // Validierung
    if (!validateCurrentPage()) return;

    const jumpToThankyou = () => {
      const thankyouIndex = funnel.pages.findIndex((p) => p.type === "thankyou");
      if (thankyouIndex >= 0) {
        setCurrentPageIndex(thankyouIndex);
      }
      // Konfetti-Animation
      setTimeout(() => {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }, 300);
    };

    // Ohne onSubmit (Vorschau): Erfolg simulieren, kein Lead, kein Netzwerk-Call
    if (!onSubmit) {
      setSubmitted(true);
      jumpToThankyou();
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const ok = await onSubmit(buildLeadPayload());
      if (ok) {
        setSubmitted(true);
        jumpToThankyou();
      } else {
        setSubmitError("Absenden fehlgeschlagen. Bitte versuche es erneut.");
      }
    } catch {
      setSubmitError("Verbindungsfehler. Bitte prüfe deine Internetverbindung.");
    } finally {
      setIsSubmitting(false);
    }
  }, [funnel, isSubmitting, validateCurrentPage, onSubmit, buildLeadPayload]);

  const currentPage = funnel.pages[currentPageIndex];
  if (!currentPage) return null;

  const { theme } = funnel;
  const isLastPage = currentPageIndex === funnel.pages.length - 1;
  const isFirstPage = currentPageIndex === 0;
  const isContactPage = currentPage.type === "contact";
  const isThankyouPage = currentPage.type === "thankyou";

  return (
    <div
      className={`${className ?? "min-h-screen"} flex flex-col`}
      style={{
        backgroundColor: currentPage.backgroundColor || theme.backgroundColor,
        color: theme.textColor,
        fontFamily: theme.fontFamily || "system-ui, sans-serif",
      }}
    >
      {header}

      {/* Progress bar */}
      {funnel.pages.length > 1 && !isThankyouPage && (
        <FunnelProgress
          currentPage={currentPageIndex}
          totalPages={funnel.pages.length}
          primaryColor={theme.primaryColor}
          backgroundColor={currentPage.backgroundColor || theme.backgroundColor}
        />
      )}

      {/* Page content with slide animation — vertikal zentriert bei wenig Inhalt,
          wächst nach oben/unten und bleibt scrollbar bei viel Inhalt (my-auto). */}
      <div ref={contentRef} className="flex-1 flex flex-col px-4 py-8 overflow-y-auto">
        <div
          key={currentPageIndex}
          className="w-full max-w-lg mx-auto my-auto space-y-6"
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
                    if (el.buttonAction === "page" && el.buttonNextPageId) {
                      const targetIdx = funnel.pages.findIndex(p => p.id === el.buttonNextPageId);
                      if (targetIdx >= 0) {
                        navigateToPage(targetIdx, targetIdx > currentPageIndex ? "left" : "right");
                        onPageView?.(funnel.pages[targetIdx].id, targetIdx);
                      }
                    } else if (el.buttonAction !== "url") {
                      handleNextPage();
                    }
                  }}
                  onListItemClick={(el, itemId) => {
                    const item = el.listItems?.find(i => i.id === itemId);
                    if (item?.targetPageId) {
                      const targetIdx = funnel.pages.findIndex(p => p.id === item.targetPageId);
                      if (targetIdx >= 0) {
                        navigateToPage(targetIdx, targetIdx > currentPageIndex ? "left" : "right");
                        onPageView?.(funnel.pages[targetIdx].id, targetIdx);
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

          {/* Honeypot: für Menschen unsichtbar (aria-hidden, tabindex -1, off-screen).
              Bots füllen es aus → der Server verwirft die Übermittlung stumm. */}
          <input
            ref={honeypotRef}
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
          />

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
                  data-testid="button-funnel-back"
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
                data-testid={isContactPage || isLastPage ? "button-funnel-submit" : "button-funnel-next"}
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

      {renderFooter?.(currentPage)}
    </div>
  );
}
