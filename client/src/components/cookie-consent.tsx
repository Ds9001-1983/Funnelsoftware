import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Cookie, Settings, X, ChevronDown, ChevronUp } from "lucide-react";
import { trackPlatformEvent } from "@/lib/platform-tracker";

import { NECESSARY_ONLY, type CookiePreferences } from "@shared/privacy-consent";
import { PLATFORM_CONSENT, readConsent, saveConsent as persistConsent, resetConsent, confirmPlatformConsent, invalidateConsentStatus, type ConsentScope } from "@/lib/consent-store";

export function CookieConsent({ scope = PLATFORM_CONSENT }: { scope?: ConsentScope }) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [preferences, setPreferences] = useState<CookiePreferences>(NECESSARY_ONLY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const pending = readConsent(scope)?.withdrawalPending === true;

  useEffect(() => {
    const record = readConsent(scope);
    if (record && !record.withdrawalPending) {
      setPreferences(record.preferences);
      setIsVisible(false);
      return;
    }
    const timer = setTimeout(() => setIsVisible(true), 2500);
    return () => clearTimeout(timer);
  }, [scope.key, scope.version]);

  const saveConsent = async (prefs: CookiePreferences) => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await persistConsent(scope, prefs);
      setPreferences(prefs);
      setIsVisible(false);
      if (scope.key === "platform") trackPlatformEvent(window.location.pathname, prefs.marketing ? "consent_accept" : "consent_reject");
    } catch {
      setError("Die Auswahl konnte nicht gespeichert werden. Optionales Tracking bleibt ausgeschaltet. Bitte versuche es erneut.");
    } finally { setSaving(false); }
  };

  const acceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
    });
  };

  const acceptNecessary = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
    });
  };

  const savePreferences = () => {
    saveConsent(preferences);
  };

  // Escape schließt den Hinweis wie das X: als Ablehnung. Wegklicken führt damit
  // zum datenschutzfreundlichen Ergebnis — das ist die von der DSK geforderte
  // Gleichwertigkeit, kein Dark Pattern (das wäre die Umkehrung).
  useEffect(() => {
    if (!isVisible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving && !pending) acceptNecessary();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // acceptNecessary ist stabil genug: es liest keinen State, sondern schreibt
    // einen festen Satz Präferenzen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, saving, pending]);

  // Platz reservieren, statt Inhalt zu verdecken.
  //
  // Der Hinweis liegt `fixed` unten — auf /register deckte er dadurch alle drei
  // Eingabefelder ab (Viewport 664 px, Karte 278 px hoch). Ein Padding am Body in
  // Kartenhöhe schiebt das Seitenende nach oben, sodass jedes Feld frei
  // gescrollt werden kann. Aufgeräumt wird beim Verschwinden des Hinweises.
  useEffect(() => {
    if (!isVisible) return;
    const card = cardRef.current;
    if (!card) return;
    document.body.style.paddingBottom = `${card.offsetHeight + 24}px`;
    return () => {
      document.body.style.paddingBottom = "";
    };
    // `showDetails` in den Dependencies genügt: Die Kartenhöhe ändert sich nur
    // beim Auf- und Zuklappen der Details, dann läuft der Effekt erneut. Ein
    // ResizeObserver wäre hier Aufwand ohne Gegenwert.
  }, [isVisible, showDetails, error, pending]);

  if (!isVisible) return null;

  return (
    // Bewusst KEIN Overlay (früher `fixed inset-0` + `bg-black/50 backdrop-blur-sm`):
    // Ohne Einwilligung funktioniert die Seite vollständig — es gibt also keinen
    // Grund, sie zu verdecken. Der Blocker hat auf dem Handy die gesamte
    // Landingpage überdeckt. `pointer-events-none` am Wrapper hält den Streifen
    // links und rechts der Karte klickbar.
    <div
      role="region"
      aria-label="Hinweis zu Cookies"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-3 sm:p-4 pointer-events-none animate-in fade-in duration-300"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <Card
        ref={cardRef}
        className="w-full max-w-md max-h-[85dvh] overflow-y-auto shadow-lg relative pointer-events-auto animate-in slide-in-from-bottom-4 duration-300"
      >
        <CardContent className="p-3">
          <button
            type="button"
            onClick={acceptNecessary}
            disabled={saving || pending}
            aria-label="Hinweis schließen – nur notwendige Cookies verwenden"
            className="absolute right-1.5 top-1.5 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
            data-testid="cookie-consent-close"
          >
            <X className="h-4 w-4" />
          </button>

          {/*
            Bewusst knapp: Auf /register ist der Platz das Wertvollste. Die frühere
            Fassung mit Icon, Überschrift und zwei Sätzen war 278 px hoch und
            verdeckte damit das komplette Formular.
          */}
          <div className="flex items-start gap-2 mb-2.5 pr-6">
            <Cookie className="h-4 w-4 shrink-0 mt-0.5 text-purple-600" />
            <p className="text-xs leading-snug text-muted-foreground">
              Für {scope.label}: {scope.summary} Die Seite funktioniert auch ohne diese Zustimmung.{" "}
              <a href={scope.privacyUrl} className="text-purple-600 hover:underline" target="_blank" rel="noopener noreferrer">Datenschutz und Anbieter</a>
            </p>
          </div>

          {(error || pending) && <p role="alert" className="text-sm text-destructive mb-2">
            {pending ? "Tracking ist in diesem Browser ausgeschaltet. Der Widerruf auf dem Server konnte noch nicht bestätigt werden." : error}
          </p>}
          {pending && <Button variant="outline" onClick={() => void resetConsent(scope)}>Widerruf erneut senden</Button>}
          {/* Details Toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 mb-2.5 transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>Einstellungen anpassen</span>
            {showDetails ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {/* Detaillierte Einstellungen */}
          {showDetails && (
            <div className="space-y-4 mb-6 p-4 bg-muted/50 rounded-lg">
              {/* Notwendige Cookies */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    Notwendige Cookies
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Erforderlich für die Grundfunktionen der Website
                  </p>
                </div>
                <Switch checked={true} disabled className="opacity-50" />
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    Analyse-Cookies
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Helfen uns zu verstehen, wie Besucher die Website nutzen
                  </p>
                </div>
                <Switch
                  checked={preferences.analytics}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, analytics: checked })
                  }
                />
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    Marketing-Cookies
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {scope.marketingDescription}
                  </p>
                </div>
                <Switch
                  checked={preferences.marketing}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, marketing: checked })
                  }
                />
              </div>
            </div>
          )}

          {/*
            Beide Buttons bewusst identisch gestaltet (`variant="outline"`, gleiche
            Breite). Vorher war „Alle akzeptieren" ein gefüllter Primary-Button und
            „Nur Notwendige" ein Outline-Button — Ablehnen war damit optisch
            schwerer als Zustimmen, was die DSK-Orientierungshilfe Telemedien
            gerade untersagt.
          */}
          <div className="flex flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={acceptNecessary}
              disabled={saving || pending}
              data-testid="cookie-consent-reject"
            >
              Nur Notwendige
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={showDetails ? savePreferences : acceptAll}
              disabled={saving || pending}
              data-testid="cookie-consent-accept"
            >
              {showDetails ? "Auswahl speichern" : "Alle akzeptieren"}
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

// Plattform-Zustimmung vor dem Laden zusätzlich serverseitig bestätigen.
export function useCookieConsent(scope: ConsentScope = PLATFORM_CONSENT) {
  const [state, setState] = useState<{ key: string; version: string; preferences: CookiePreferences | null }>({ key: "", version: "", preferences: null });
  useEffect(() => {
    let mounted = true;
    let generation = 0;
    let expiryTimer: ReturnType<typeof setTimeout> | undefined;
    let previousPreferences: CookiePreferences | null = null;
    const refresh = async (reloadOnRevocation = false) => {
      const current = ++generation;
      clearTimeout(expiryTimer);
      const record = readConsent(scope);
      let preferences = record?.preferences ?? null;
      if (preferences?.marketing && scope.key === "platform" && !(await confirmPlatformConsent())) preferences = { ...preferences, marketing: false };
      if (!mounted || current !== generation) return;
      const withdrawn = (previousPreferences?.marketing && !preferences?.marketing)
        || (previousPreferences?.analytics && !preferences?.analytics);
      previousPreferences = preferences;
      setState({ key: scope.key, version: scope.version, preferences });
      const pixel = (window as Window & { fbq?: (...args: unknown[]) => void }).fbq;
      if (withdrawn && (pixel || document.querySelector('script[src^="https://www.googletagmanager.com/gtm.js"]'))) {
        // Auch Widerrufe in einem anderen Tab bzw. Konto und der Ablauf einer
        // Zustimmung müssen bereits geladene Fremdskripte beenden.
        pixel?.("consent", "revoke");
        // Der lokale Widerruf muss erst seine Server-Anfrage abschließen.
        if (reloadOnRevocation) window.location.reload();
      }
      if (record) expiryTimer = setTimeout(() => {
        invalidateConsentStatus();
        void refresh(true);
      }, Math.min(Math.max(record.expiresAt - Date.now(), 0), 2_147_483_647));
    };
    const changed = (event: Event) => {
      if (event instanceof CustomEvent && event.detail?.scope !== scope.key) return;
      invalidateConsentStatus();
      void refresh(!(event instanceof CustomEvent));
    };
    const restored = (event: PageTransitionEvent) => {
      // Beim Zurückkehren aus dem Back/Forward-Cache lebt auch der alte
      // React-/Skriptzustand wieder auf. Verpasste Widerrufe neu prüfen;
      // beim normalen Seitenstart übernimmt bereits refresh() diese Aufgabe.
      if (event.persisted) changed(event);
    };
    void refresh();
    window.addEventListener("cookieConsentChanged", changed);
    window.addEventListener("storage", changed);
    window.addEventListener("focus", changed);
    window.addEventListener("pageshow", restored);
    return () => {
      mounted = false;
      clearTimeout(expiryTimer);
      window.removeEventListener("cookieConsentChanged", changed);
      window.removeEventListener("storage", changed);
      window.removeEventListener("focus", changed);
      window.removeEventListener("pageshow", restored);
    };
  }, [scope.key, scope.version]);
  const preferences = state.key === scope.key && state.version === scope.version ? state.preferences : null;
  return { hasConsent: preferences !== null, preferences, allowsAnalytics: preferences?.analytics ?? false, allowsMarketing: preferences?.marketing ?? false };
}

export const resetCookieConsent = resetConsent;
