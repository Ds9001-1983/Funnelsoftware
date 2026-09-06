import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { usePageMeta } from "@/hooks/use-document-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, AlertCircle, Check, Sparkles, Eye, EyeOff } from "lucide-react";
import { SIGNUP_TEMPLATE_STORAGE_KEY } from "@shared/seo-links";
import { PASSWORD_MIN_LENGTH } from "@shared/schema";
import { useCookieConsent } from "@/components/cookie-consent";
import { fbqTrack } from "@/lib/meta-pixel";
import { trackPlatformEvent } from "@/lib/platform-tracker";

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const { allowsMarketing } = useCookieConsent();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Funnel-Messung: Wer hat angefangen zu tippen, und wer hat danach
  // abgebrochen? Genau diese beiden Zahlen fehlten, um „Formular gesehen" von
  // „Formular versucht" zu unterscheiden.
  const formStarted = useRef(false);
  const formSubmitted = useRef(false);

  usePageMeta({
    title: "Kostenlos starten",
    description: "Erstelle deinen kostenlosen Trichterwerk-Account — für immer kostenloser Free-Plan, 14 Tage Pro-Features, ohne Code, DSGVO-konform.",
    canonical: "/register",
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) setLocation("/");
  }, [isAuthenticated, setLocation]);

  // Aus der Template-Galerie gekommen (?template=<slug>)? Auswahl merken —
  // localStorage überlebt Stripe-Checkout-Redirect und E-Mail-Verifizierung;
  // /funnels/new liest den Key und wählt die Vorlage vor.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("template");
    if (slug && /^[a-z0-9-]+$/.test(slug)) {
      try {
        localStorage.setItem(SIGNUP_TEMPLATE_STORAGE_KEY, slug);
      } catch {
        // Storage blockiert → Auswahl geht verloren, Registrierung läuft normal
      }
    }
  }, []);

  // Abbruch messen: Formular begonnen, aber nie abgesendet. `pagehide` statt
  // `beforeunload`, weil Safari/iOS letzteres bei Tab-Wechsel nicht feuert — und
  // mobil kommt der Großteil des Traffics.
  useEffect(() => {
    const onLeave = () => {
      if (formStarted.current && !formSubmitted.current) {
        trackPlatformEvent("/register", "form_abort");
      }
    };
    window.addEventListener("pagehide", onLeave);
    return () => window.removeEventListener("pagehide", onLeave);
  }, []);

  if (isAuthenticated) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formStarted.current) {
      formStarted.current = true;
      trackPlatformEvent("/register", "form_start");
    }
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Spiegelt passwordSchema in shared/schema.ts: nur Länge, keine
    // Zeichenklassen-Regeln (NIST SP 800-63B).
    if (formData.password.length < PASSWORD_MIN_LENGTH) {
      setError(`Das Passwort muss mindestens ${PASSWORD_MIN_LENGTH} Zeichen haben`);
      trackPlatformEvent("/register", "form_submit_error", "password_short");
      return;
    }

    setIsLoading(true);

    // Kein `username`: der Server leitet ihn aus der E-Mail ab.
    const result = await register({
      email: formData.email,
      password: formData.password,
      displayName: formData.displayName || undefined,
      marketingConsent: allowsMarketing,
    });

    if (result.success) {
      formSubmitted.current = true;
      // Browser-Seite der Conversion. Der Server hat dasselbe Event bereits
      // über die CAPI gemeldet — identische eventID, Meta dedupliziert. Geht
      // dieses hier beim Stripe-Redirect verloren, ist die Conversion trotzdem
      // gezählt. Ohne Marketing-Consent ist der Pixel nie geladen und fbqTrack
      // damit ein No-op.
      if (result.capiEventId) {
        fbqTrack("CompleteRegistration", {}, { eventID: result.capiEventId });
      }

      if (result.checkoutUrl) {
        // Nur noch mit SIGNUP_REQUIRE_CARD=true: Zahlung sofort hinterlegen.
        trackPlatformEvent("/register", "checkout_redirect");
        window.location.href = result.checkoutUrl;
      } else if (result.checkoutError) {
        // Account erstellt, aber die Weiterleitung zur Zahlung schlug fehl —
        // sichtbar machen (Toast im Dashboard) statt den Nutzer stumm abzulegen.
        setLocation("/?checkout=error");
      } else {
        // Regelfall: Trial ohne Karte → direkt ins Produkt statt in ein leeres
        // Dashboard. /funnels/new liest SIGNUP_TEMPLATE_STORAGE_KEY und wählt
        // eine aus der Galerie mitgebrachte Vorlage vor.
        setLocation("/funnels/new");
      }
    } else {
      setError(result.error || "Registrierung fehlgeschlagen");
      trackPlatformEvent(
        "/register",
        "form_submit_error",
        /E-Mail bereits/i.test(result.error || "") ? "email_taken" : "server_error",
      );
    }

    setIsLoading(false);
  };

  const features = [
    "Für immer kostenloser Free-Plan",
    "14 Tage Pro-Features gratis",
    "Drag & Drop Builder",
    "Analytics & Insights",
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Brand */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-primary text-primary-foreground">
              <Zap className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Trichterwerk</h1>
          <Badge variant="secondary" className="mt-2">
            <Sparkles className="h-3 w-3 mr-1" />
            Kostenlos starten
          </Badge>
          <p className="text-muted-foreground mt-2">
            Für immer kostenloser Free-Plan — mit 14 Tagen Pro-Features
          </p>
        </div>

        {/* Features List */}
        <div className="flex flex-wrap justify-center gap-3">
          {features.map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-1.5 text-sm text-muted-foreground"
            >
              <Check className="h-4 w-4 text-green-500" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* Register Card */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Kostenlos starten</CardTitle>
            <CardDescription className="text-center">
              Erstelle deinen Account und teste 14 Tage kostenlos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="displayName">Name (optional)</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  type="text"
                  placeholder="Max Mustermann"
                  value={formData.displayName}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-Mail *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="max@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Passwort *</Label>
                {/*
                  Augen-Toggle statt eines zweiten "Passwort bestätigen"-Felds:
                  streicht ein Pflichtfeld und die häufigste Fehlermeldung, ohne
                  Tippfehler zu riskieren.
                */}
                <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="pr-10"
                  placeholder={`Mindestens ${PASSWORD_MIN_LENGTH} Zeichen`}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/*
                  Nur noch Länge — die alten Zeichenklassen-Häkchen
                  (Großbuchstabe, Zahl) sind mit der Policy weggefallen.
                */}
                {formData.password.length > 0 && (
                  <p
                    className={`text-xs ${
                      formData.password.length >= PASSWORD_MIN_LENGTH
                        ? "text-emerald-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {formData.password.length >= PASSWORD_MIN_LENGTH ? "\u2713" : "\u2717"}{" "}
                    Mindestens {PASSWORD_MIN_LENGTH} Zeichen — Länge zählt mehr
                    als Sonderzeichen
                  </p>
                )}
              </div>


              <Button type="submit" className="w-full" disabled={isLoading} size="lg" data-testid="button-register-submit">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Account wird erstellt...
                  </>
                ) : (
                  "Kostenlos starten"
                )}
              </Button>
              <div className="mt-3 space-y-2">
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  <strong className="font-medium text-foreground">
                    Keine Zahlungsdaten nötig.
                  </strong>{" "}
                  14 Tage volle Pro-Features — danach läuft dein Account im für
                  immer kostenlosen Free-Plan weiter (Pro: 49&nbsp;€/Monat inkl. MwSt.).
                </p>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Bereits registriert?
                </span>
              </div>
            </div>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">
                Zur Anmeldung
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Mit der Registrierung akzeptierst du unsere{" "}
          <Link href="/agb" className="underline underline-offset-4 hover:text-primary">
            AGB
          </Link>{" "}
          und{" "}
          <Link href="/datenschutz" className="underline underline-offset-4 hover:text-primary">
            Datenschutzerklärung
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
