import type { PublishIssue } from "@shared/publish-check";
import { Button } from "@/components/ui/button";

export function PublishChecklist({ issues, onFocus }: { issues: PublishIssue[]; onFocus?: (issue: PublishIssue) => void }) {
  return <section className="border rounded-lg p-3 space-y-2" aria-label="Qualitätscheck" data-testid="publish-checklist">
    <h3 className="font-medium text-sm">Qualitätscheck</h3>
    <p className="text-xs text-muted-foreground">Prüft Inhalte, Verknüpfungen und erkennbare Kontraste. Externe Adressen und die Darstellung bitte zusätzlich in der Vorschau testen.</p>
    {!issues.length ? <p className="text-sm text-emerald-700">Keine Auffälligkeiten in den geprüften Inhalten.</p> : <ul className="max-h-52 overflow-y-auto space-y-2">{issues.map(issue => <li key={issue.id} className="text-sm flex items-start justify-between gap-2">
      <div><span className={issue.severity === "error" ? "text-destructive font-medium" : "text-amber-700 font-medium"}>{issue.severity === "error" ? "Fehler: " : "Hinweis: "}</span>{issue.message}</div>
      {onFocus && <Button size="sm" variant="outline" onClick={() => onFocus(issue)}>{issue.variant ? "A/B-Test prüfen" : "Ansehen"}</Button>}
    </li>)}</ul>}
    {issues.some(issue => issue.severity === "error") && <p className="text-sm text-destructive" role="alert">Bitte behebe die Fehler vor der Veröffentlichung.</p>}
  </section>;
}
