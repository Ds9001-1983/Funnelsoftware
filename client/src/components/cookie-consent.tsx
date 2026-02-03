import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Cookie, Settings, X, ChevronDown, ChevronUp } from "lucide-react";

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
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Immer aktiviert
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Prüfen ob bereits Consent gegeben wurde
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Kurze Verzögerung für bessere UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
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

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <Cookie className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">
                Cookie-Einstellungen
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Wir verwenden Cookies, um dir die bestmögliche Erfahrung zu bieten.
              </p>
            </div>
          </div>

          {/* Kurze Beschreibung */}
          <p className="text-sm text-muted-foreground mb-4">
            Einige Cookies sind notwendig, damit unsere Website funktioniert. 
            Andere helfen uns, die Website zu verbessern und dir personalisierte 
            Inhalte anzuzeigen.{" "}
            <Link href="/datenschutz" className="text-purple-600 hover:underline">
              Mehr erfahren
            </Link>
          </p>

          {/* Details Toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 mb-4 transition-colors"
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
                    Werden verwendet, um relevante Werbung anzuzeigen
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

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {showDetails ? (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={acceptNecessary}
                >
                  Nur Notwendige
                </Button>
                <Button
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  onClick={savePreferences}
                >
                  Auswahl speichern
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={acceptNecessary}
                >
                  Nur Notwendige
                </Button>
                <Button
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  onClick={acceptAll}
                >
                  Alle akzeptieren
                </Button>
              </>
            )}
          </div>

          {/* Links */}
          <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <Link href="/impressum" className="hover:text-foreground hover:underline">
              Impressum
            </Link>
            <span>·</span>
            <Link href="/datenschutz" className="hover:text-foreground hover:underline">
              Datenschutz
            </Link>
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
