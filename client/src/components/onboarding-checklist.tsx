import { useState } from "react";
import { Link } from "wouter";
import { Check, X, Rocket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const DISMISS_KEY = "onboarding-checklist-dismissed";

interface OnboardingChecklistProps {
  /** Anzahl veröffentlichter Funnels */
  publishedCount: number;
  /** Anzahl gesammelter Leads */
  totalLeads: number;
}

/**
 * Aktivierungs-Checkliste fürs Dashboard. Der Status jedes Schritts wird aus
 * echten Daten abgeleitet (keine manuellen Häkchen). Wird ausgeblendet, sobald
 * alle Schritte erledigt sind oder der Nutzer sie wegklickt.
 */
export function OnboardingChecklist({ publishedCount, totalLeads }: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === "true",
  );

  // In dieser Komponente gilt der erste Schritt als erledigt — sie wird vom
  // Dashboard nur gerendert, wenn der Nutzer bereits mindestens einen Funnel hat.
  const steps = [
    {
      key: "create",
      label: "Ersten Funnel erstellt",
      hint: "Ein Template ausgewählt und angepasst.",
      done: true,
      href: "/funnels/new",
      cta: "Weiteren Funnel erstellen",
    },
    {
      key: "publish",
      label: "Funnel veröffentlichen",
      hint: "Schalte deinen Funnel live, damit Besucher ihn erreichen.",
      done: publishedCount > 0,
      href: "/funnels",
      cta: "Jetzt veröffentlichen",
    },
    {
      key: "lead",
      label: "Ersten Lead empfangen",
      hint: "Teile deinen Funnel und sammle den ersten Kontakt.",
      done: totalLeads > 0,
      href: "/funnels",
      cta: "Funnel teilen",
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  if (dismissed || allDone) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Rocket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Erste Schritte</CardTitle>
            <p className="text-sm text-muted-foreground">
              {doneCount} von {steps.length} erledigt
            </p>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0 -mr-1 -mt-1"
          aria-label="Checkliste ausblenden"
          onClick={handleDismiss}
          data-testid="button-dismiss-onboarding"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={(doneCount / steps.length) * 100} className="h-2" />
        <ul className="space-y-2">
          {steps.map((step) => (
            <li
              key={step.key}
              className="flex items-center gap-3 rounded-lg border p-3"
              data-testid={`onboarding-step-${step.key}`}
            >
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  step.done
                    ? "bg-primary text-primary-foreground"
                    : "border-2 border-muted-foreground/30"
                }`}
              >
                {step.done && <Check className="h-3.5 w-3.5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${step.done ? "text-muted-foreground line-through" : ""}`}
                >
                  {step.label}
                </p>
                {!step.done && (
                  <p className="text-xs text-muted-foreground">{step.hint}</p>
                )}
              </div>
              {!step.done && (
                <Link href={step.href}>
                  <Button size="sm" variant="outline" className="shrink-0">
                    {step.cta}
                  </Button>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
