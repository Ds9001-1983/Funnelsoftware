import { Link } from "wouter";
import { Check, X, Rocket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useOnboardingProgress, updateOnboardingProgress } from "@/lib/onboarding-progress";
import type { Funnel, Lead } from "@shared/schema";

interface OnboardingChecklistProps {
  userId: number;
  funnels: Funnel[];
  leads?: Lead[];
  leadsLoading?: boolean;
  leadsError?: boolean;
}

export function OnboardingChecklist({ userId, funnels, leads, leadsLoading, leadsError }: OnboardingChecklistProps) {
  const preferences = useOnboardingProgress(userId);
  const available = funnels.filter(funnel => funnel.status !== "archived");
  // Keep the chosen funnel stable, regardless of list sorting after autosaves.
  const first = [...available].sort((a, b) => a.id - b.id)[0];
  const funnel = available.find(item => item.id === preferences.selectedFunnelId) ?? first;
  const progress = useOnboardingProgress(userId, funnel?.uuid);
  const firstLead = leads?.filter(lead => lead.funnelId === funnel?.id).sort((a, b) => a.id - b.id)[0];
  const editorUrl = funnel ? `/funnels/${funnel.id}` : "/funnels/new";
  const published = funnel?.status === "published";
  const steps = [
    {
      key: "create",
      label: "Vorlage auswählen",
      hint: "Starte mit einer Vorlage für dein Ziel oder einem leeren Funnel.",
      done: !!funnel,
      href: "/funnels/new",
      cta: "Vorlagen ansehen",
      enabled: true,
    },
    {
      key: "edit",
      label: "Inhalte anpassen",
      hint: progress.edited ? "Änderungen gespeichert oder Inhalte als geprüft bestätigt." : "Passe Texte, Bilder und Kontaktangaben an. Passende Inhalte kannst du auch direkt bestätigen.",
      done: !!funnel && !!progress.edited,
      href: editorUrl,
      cta: "Inhalte bearbeiten",
      enabled: !!funnel,
    },
    {
      key: "test",
      label: "Funnel testen",
      hint: progress.tested ? "Ein Testdurchlauf wurde abgeschlossen. Nach Änderungen kannst du erneut testen." : "Fülle die Vorschau bis zum Absenden aus. Dabei entstehen keine echten Anfragen oder E-Mails.",
      done: !!funnel && !!progress.tested,
      href: `/preview/${funnel?.id}`,
      cta: "Vorschau testen",
      enabled: !!funnel,
    },
    {
      key: "publish",
      label: "Veröffentlichen und Link teilen",
      hint: published ? "Dein Funnel ist live. Im Veröffentlichungsdialog findest du den Link zum Teilen." : "Prüfe die Veröffentlichung im Editor. Fehlende Angaben werden dir dort angezeigt.",
      done: published,
      href: `${editorUrl}?action=publish`,
      cta: published ? "Link teilen" : "Veröffentlichung prüfen",
      enabled: !!funnel,
    },
    {
      key: "lead",
      label: "Erste Anfrage ansehen",
      hint: leadsError ? "Anfragen konnten nicht geladen werden. Öffne die Lead-Übersicht, um es erneut zu versuchen." : leadsLoading ? "Anfragen werden geladen …" : firstLead ? "Deine erste Anfrage ist da. Öffne die Details und nimm Kontakt auf." : "Sobald eine Bewerbung oder Anfrage eingeht, findest du sie hier. Teile dafür deinen veröffentlichten Link.",
      done: !!firstLead,
      href: firstLead ? `/leads?funnel=${funnel?.id}&lead=${firstLead.id}` : `/leads?funnel=${funnel?.id}`,
      cta: firstLead ? "Anfrage ansehen" : "Anfragen öffnen",
      enabled: !!funnel,
    },
  ];
  const doneCount = steps.filter(step => step.done).length;
  const nextStep = steps.find(step => !step.done);

  if (preferences.dismissed) return (
    <Button variant="ghost" size="sm" onClick={() => updateOnboardingProgress(userId, undefined, { dismissed: false })}>
      <Rocket className="mr-2 h-4 w-4" />Erste Schritte wieder anzeigen
    </Button>
  );

  return (
    <Card data-testid="onboarding-checklist">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg"><Rocket className="h-5 w-5 text-primary" />Dein erster erfolgreicher Funnel</CardTitle>
          <p className="text-sm text-muted-foreground" role="status">
            {doneCount === steps.length ? "Geschafft! Dein Funnel ist live und die erste Anfrage ist eingegangen." : `${doneCount} von ${steps.length} Schritten erledigt. Nächster Schritt: ${nextStep?.label}.`}
          </p>
        </div>
        <Button size="icon" variant="ghost" className="shrink-0" aria-label="Checkliste ausblenden" onClick={() => updateOnboardingProgress(userId, undefined, { dismissed: true })} data-testid="button-dismiss-onboarding"><X className="h-4 w-4" /></Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={doneCount / steps.length * 100} aria-label="Fortschritt der ersten Schritte" aria-valuenow={doneCount / steps.length * 100} aria-valuetext={`${doneCount} von ${steps.length} Schritten erledigt`} className="h-2" />
        {funnel && <div className="space-y-1">
          <label htmlFor="onboarding-funnel" className="text-sm font-medium">Dein Funnel für diese Schritte</label>
          <select id="onboarding-funnel" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={funnel.id} onChange={event => updateOnboardingProgress(userId, undefined, { selectedFunnelId: Number(event.target.value) })}>
            {available.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>}
        <ol className="space-y-2">
          {steps.map((step, index) => (
            <li key={step.key} aria-current={nextStep?.key === step.key ? "step" : undefined} className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center ${nextStep?.key === step.key ? "border-primary/50 bg-primary/5" : ""}`} data-testid={`onboarding-step-${step.key}`}>
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${step.done ? "bg-primary text-primary-foreground" : "border border-muted-foreground/40"}`}>
                  {step.done ? <><Check className="h-3.5 w-3.5" aria-hidden="true" /><span className="sr-only">Erledigt</span></> : index + 1}
                </span>
                <div className="min-w-0 space-y-1"><p className="text-sm font-medium">{step.label}</p><p className="text-sm text-muted-foreground">{step.hint}</p></div>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                {step.enabled ? <Button asChild size="sm" variant={nextStep?.key === step.key ? "default" : "outline"}><Link href={step.href}>{step.cta}</Link></Button> : <Button size="sm" variant="outline" disabled>{step.cta}</Button>}
                {step.key === "edit" && funnel && !step.done && <Button size="sm" variant="ghost" onClick={() => updateOnboardingProgress(userId, funnel.uuid, { edited: true })}>Inhalte sind geprüft</Button>}
                {step.key === "create" && !funnel && <div className="flex flex-wrap gap-3 text-sm"><Link className="text-primary underline underline-offset-2" href="/funnels/new?category=recruiting">Bewerber gewinnen</Link><Link className="text-primary underline underline-offset-2" href="/funnels/new?category=leads">Anfragen erhalten</Link></div>}
              </div>
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted-foreground">Ausblenden, Inhaltsprüfung und Testfortschritt werden für dein Konto in diesem Browser gemerkt.</p>
      </CardContent>
    </Card>
  );
}
