import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Zap,
  Rocket,
  Layout,
  MousePointerClick,
  Share2,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface WelcomeModalProps {
  hasFunnels: boolean;
  userName?: string | null;
}

const STEPS = [
  {
    icon: Zap,
    title: "Willkommen bei Trichterwerk!",
    description:
      "Erstelle mobile-optimierte Marketing-Funnels, die Besucher in Kunden verwandeln — ganz ohne Code.",
    details: [
      "10+ professionelle Templates",
      "Drag & Drop Editor",
      "Echtzeit-Analytics",
      "14 Tage kostenlos testen",
    ],
  },
  {
    icon: Rocket,
    title: "Template auswählen",
    description:
      "Starte mit einer bewährten Vorlage oder einem leeren Canvas. Jedes Template ist für maximale Conversion optimiert.",
    details: [
      "Lead-Generierung, Recruiting, Quiz & mehr",
      "Sofort einsatzbereit — nur Text anpassen",
      "Oder komplett eigenes Design erstellen",
    ],
  },
  {
    icon: MousePointerClick,
    title: "Per Drag & Drop anpassen",
    description:
      "Ziehe Elemente in deinen Funnel, passe Texte und Farben an und erstelle mehrseitige Flows mit bedingter Logik.",
    details: [
      "20+ Elemente: Text, Bilder, Videos, Formulare",
      "Live-Vorschau für Desktop & Mobile",
      "Bedingte Navigation zwischen Seiten",
    ],
  },
  {
    icon: Share2,
    title: "Veröffentlichen & Leads sammeln",
    description:
      'Klicke auf "Veröffentlichen", teile den Link und beobachte in Echtzeit, wie Leads eingehen.',
    details: [
      "Ein Klick zum Veröffentlichen",
      "Eigene Domain oder Trichterwerk-Link",
      "Webhook-Integration & E-Mail-Benachrichtigung",
    ],
  },
];

export function WelcomeModal({ hasFunnels, userName }: WelcomeModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (hasFunnels) return;
    const completed = localStorage.getItem("onboarding-completed");
    if (!completed) {
      setOpen(true);
    }
  }, [hasFunnels]);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem("onboarding-completed", "true");
  };

  const handleStartTemplate = () => {
    handleClose();
    setLocation("/funnels/new");
  };

  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;
  const isFirstStep = step === 0;
  const Icon = currentStep.icon;

  // Personalize first step title
  const title =
    step === 0 && userName
      ? `Willkommen, ${userName}!`
      : currentStep.title;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-6 pb-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-8 bg-primary"
                  : i < step
                    ? "w-1.5 bg-primary/50"
                    : "w-1.5 bg-muted-foreground/20"
              }`}
            />
          ))}
        </div>

        <div className="px-6 pb-6 pt-2">
          {/* Icon + Title */}
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Icon className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-muted-foreground mt-2">
              {currentStep.description}
            </p>
          </div>

          {/* Details list */}
          <div className="space-y-2.5 mb-6">
            {currentStep.details.map((detail, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm">{detail}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          {isLastStep ? (
            <div className="grid gap-2">
              <Button size="lg" className="w-full gap-2" onClick={handleStartTemplate}>
                <Rocket className="h-4 w-4" />
                Ersten Funnel erstellen
              </Button>
              <Button size="lg" variant="outline" className="w-full" onClick={handleClose}>
                Erst mal umschauen
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              {!isFirstStep ? (
                <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Zurück
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={handleClose} className="text-muted-foreground">
                  Überspringen
                </Button>
              )}
              <Button onClick={() => setStep(step + 1)} className="gap-1">
                Weiter
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
