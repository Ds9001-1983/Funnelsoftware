import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Cookie, Settings, X, ChevronDown, ChevronUp } from "lucide-react";
import { trackPlatformEvent } from "@/lib/platform-tracker";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_CONSENT_KEY = "trichterwerk-cookie-consent";
const COOKIE_PREFERENCES_KEY = "trichterwerk-cookie-preferences";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Immer aktiviert
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Prüfen ob bereits Consent gegeben wurde
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Bewusst spät: Der Besucher soll Überschrift und CTA gesehen haben,
      // bevor unten der Hinweis einfährt. Bei 1 s war er schneller da als das
      // Lesen der ersten Zeile.
      const timer = setTimeout(() => setIsVisible(true), 2500);
      return () => clearTimeout(timer);
    } else {
      // Gespeicherte Präferenzen laden
      const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setIsVisible(false);

    // Erst damit wird messbar, wie blind der Meta-Pixel eigentlich ist: er sieht
    // ausschließlich Besucher mit Marketing-Einwilligung. Ohne diese Quote weiß
    // niemand, ob das 60 % oder 5 % der Besucher sind.
    trackPlatformEvent(
      window.location.pathname,
      prefs.marketing ? "consent_accept" : "consent_reject",
    );

    // Event für Analytics/Marketing Tools auslösen
    window.dispatchEvent(
      new CustomEvent("cookieConsentChanged", { detail: prefs })
    );
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
      if (e.key === "Escape") acceptNecessary();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // acceptNecessary ist stabil genug: es liest keinen State, sondern schreibt
    // einen festen Satz Präferenzen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

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
  }, [isVisible, showDetails]);

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
        className="w-full max-w-md shadow-lg relative pointer-events-auto animate-in slide-in-from-bottom-4 duration-300"
      >
        <CardContent className="p-3">
          <button
            type="button"
            onClick={acceptNecessary}
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
              Marketing-Cookies (Meta-Pixel) nur mit deiner Zustimmung. Notwendige
              Cookies halten die Seite am Laufen.{" "}
              <Link href="/datenschutz" className="text-purple-600 hover:underline">
                Mehr erfahren
              </Link>
            </p>
          </div>

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
                    Meta-Pixel (Meta Platforms Ireland Ltd.). Misst, ob eine
                    Anzeige zu einer Registrierung geführt hat. Setzt{" "}
                    <code>_fbp</code>/<code>_fbc</code>; Übermittlung in die USA
                    möglich.
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
              data-testid="cookie-consent-reject"
            >
              Nur Notwendige
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={showDetails ? savePreferences : acceptAll}
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

// Hook um Cookie-Präferenzen abzufragen
export function useCookieConsent() {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }

    // Auf Änderungen reagieren
    const handleConsentChange = (event: CustomEvent<CookiePreferences>) => {
      setPreferences(event.detail);
    };

    window.addEventListener(
      "cookieConsentChanged",
      handleConsentChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "cookieConsentChanged",
        handleConsentChange as EventListener
      );
    };
  }, []);

  return {
    hasConsent: preferences !== null,
    preferences,
    allowsAnalytics: preferences?.analytics ?? false,
    allowsMarketing: preferences?.marketing ?? false,
  };
}

// Funktion um Cookie-Banner erneut anzuzeigen (z.B. für Footer-Link)
export function resetCookieConsent() {
  localStorage.removeItem(COOKIE_CONSENT_KEY);
  localStorage.removeItem(COOKIE_PREFERENCES_KEY);
  window.location.reload();
}
