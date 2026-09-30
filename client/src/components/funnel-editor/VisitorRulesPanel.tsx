import { useState } from "react";
import type { Funnel, FunnelPage, VisitorCondition, VisitorRouting } from "@shared/schema";
import { elementChoices, evaluateVisitorRules, fieldLabel, proposedVisitorRouting, responseTypes, visitorRoutingErrors } from "@shared/funnel-routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const operatorNames: Record<string, string> = { equals: "ist gleich", notEquals: "ist ungleich", contains: "enthält", isEmpty: "ist leer", isNotEmpty: "ist ausgefüllt", greater: "größer als", atLeast: "mindestens", less: "kleiner als", atMost: "höchstens" };
const selectClass = "w-full rounded border bg-background px-2 py-1.5 text-sm";
interface Props { funnel: Funnel; page: FunnelPage; onUpdate: (updates: Partial<FunnelPage>) => void }

export function VisitorRulesPanel({ funnel, page, onUpdate }: Props) {
  const [proposal, setProposal] = useState<VisitorRouting | null>(null);
  const [testValues, setTestValues] = useState<Record<string, string>>({});
  const routing = page.routing;
  const fields = funnel.pages.filter(page => !page.hidden).flatMap(page => page.elements.filter(element => responseTypes.has(element.type)).map(element => ({ page, element })));
  const blocked = funnel.abTests?.some(test => test.status === "running");
  const targets = funnel.pages.filter(target => target.id !== page.id && !target.hidden && (page.type !== "contact" || target.type === "thankyou"));
  const field = (id: string) => fields.find(field => field.element.id === id)?.element;
  const initialCondition = (fieldId = fields[0]?.element.id ?? ""): VisitorCondition => {
    const element = field(fieldId);
    return element && (element.type === "select" || element.type === "radio")
      ? { id: crypto.randomUUID(), fieldId, kind: "choice", operator: "equals", value: elementChoices(element)[0]?.id ?? "" }
      : { id: crypto.randomUUID(), fieldId, kind: "text", operator: "equals", value: "" };
  };
  const update = (updates: Partial<VisitorRouting>) => { if (routing && !blocked) onUpdate({ routing: { ...routing, ...updates } }); };
  const changeRule = (index: number, changes: Partial<VisitorRouting["rules"][number]>) => update({ rules: routing!.rules.map((rule, i) => i === index ? { ...rule, ...changes } : rule) });
  const moveRule = (index: number, offset: number) => {
    const rules = [...routing!.rules];
    [rules[index], rules[index + offset]] = [rules[index + offset], rules[index]];
    update({ rules });
  };
  const result = routing ? evaluateVisitorRules(routing, testValues) : null;
  const issues = visitorRoutingErrors(funnel.pages, funnel.abTests ?? []);
  const targetSelect = (label: string, value: string, onChange: (value: string) => void) => <label className="block space-y-1 text-xs">{label}
    <select aria-label={label} value={value} className={selectClass} onChange={event => onChange(event.target.value)}>
      <option value="">Ziel wählen</option>
      {!!value && !targets.some(page => page.id === value) && <option value={value}>Ungültiges Ziel – bitte ändern</option>}
      {targets.map(target => <option key={target.id} value={target.id}>{target.title}</option>)}
    </select>
  </label>;

  return <section className="space-y-4 p-4" aria-label="Besucherregeln">
    <h3 className="font-semibold">Besucherregeln · {page.title}</h3>
    {page.type === "thankyou" ? <p className="text-sm text-muted-foreground">Diese Ergebnisseite beendet den Besucherweg. Sie erscheint nach erfolgreichem Absenden.</p> : <>
      <p className="text-xs text-muted-foreground">Die erste zutreffende Regel gewinnt. Ohne Treffer gilt das Standardziel. Regeln können Antworten anderer bereits besuchter Seiten verwenden. Leere Antworten erfüllen nur „ist leer“.</p>
      {blocked && <p className="text-sm text-amber-700">Pausiere laufende A/B-Tests, bevor du Besucherregeln änderst.</p>}
      {!routing ? <>
        <p className="text-xs text-muted-foreground">Diese Seite verwendet bisherige Weiterleitungen. Die Aktivierung zeigt einen Vorschlag und kann rückgängig gemacht werden.</p>
        <Button disabled={!!blocked} onClick={() => setProposal(proposedVisitorRouting(funnel.pages, page))}>Besucherregeln aktivieren</Button>
      </> : <>
        <fieldset disabled={!!blocked} className="space-y-3">
          {routing.rules.map((rule, index) => <div className="rounded border p-3 space-y-2" key={rule.id} data-testid={`visitor-rule-${index}`}>
            <div className="flex items-center gap-1"><strong className="text-xs flex-1">Regel {index + 1}</strong>
              <Button size="sm" variant="ghost" aria-label={`Regel ${index + 1} nach oben`} disabled={index === 0} onClick={() => moveRule(index, -1)}>↑</Button>
              <Button size="sm" variant="ghost" aria-label={`Regel ${index + 1} nach unten`} disabled={index === routing.rules.length - 1} onClick={() => moveRule(index, 1)}>↓</Button>
              <Button size="sm" variant="ghost" aria-label={`Regel ${index + 1} löschen`} onClick={() => update({ rules: routing.rules.filter((_, i) => i !== index) })}>Löschen</Button>
            </div>
            <Input aria-label={`Name von Regel ${index + 1}`} maxLength={100} value={rule.name} onChange={event => changeRule(index, { name: event.target.value })} />
            <select aria-label={`Verknüpfung in Regel ${index + 1}`} value={rule.match} className={selectClass} onChange={event => changeRule(index, { match: event.target.value as "all" | "any" })}><option value="all">UND · Alle Bedingungen</option><option value="any">ODER · Mindestens eine</option></select>
            {rule.conditions.map((condition, conditionIndex) => {
              const label = `Regel ${index + 1}, Bedingung ${conditionIndex + 1}`;
              const element = field(condition.fieldId);
              const change = (next: VisitorCondition) => changeRule(index, { conditions: rule.conditions.map((item, i) => i === conditionIndex ? next : item) });
              const operators = condition.kind === "number" ? ["equals", "notEquals", "greater", "atLeast", "less", "atMost"] : condition.kind === "choice" ? ["equals", "notEquals"] : ["equals", "notEquals", "contains", "isEmpty", "isNotEmpty"];
              return <div key={condition.id} className="border-l-2 pl-2 space-y-2">
                <select aria-label={`${label}: Feld`} className={selectClass} value={condition.fieldId} onChange={event => change({ ...initialCondition(event.target.value), id: condition.id })}>
                  {!element && <option value={condition.fieldId}>Feld fehlt – bitte auswählen</option>}
                  {fields.map(({ page, element }) => <option key={element.id} value={element.id}>{page.title} · {fieldLabel(element)}</option>)}
                </select>
                {!element?.choices && !["radio", "select"].includes(element?.type ?? "") && <select aria-label={`${label}: Vergleichstyp`} className={selectClass} value={condition.kind} onChange={event => change(event.target.value === "number" ? { id: condition.id, fieldId: condition.fieldId, kind: "number", operator: "atLeast", value: 0 } : { id: condition.id, fieldId: condition.fieldId, kind: "text", operator: "equals", value: "" })}><option value="text">Text</option><option value="number">Zahl</option></select>}
                <select aria-label={`${label}: Vergleich`} className={selectClass} value={condition.operator} onChange={event => change({ ...condition, operator: event.target.value } as VisitorCondition)}>{operators.map(operator => <option key={operator} value={operator}>{operatorNames[operator]}</option>)}</select>
                {condition.kind === "choice" ? <select aria-label={`${label}: Wert`} className={selectClass} value={condition.value} onChange={event => change({ ...condition, value: event.target.value })}>
                  {!elementChoices(element ?? { id: "", type: "radio" }).some(choice => choice.id === condition.value) && <option value={condition.value}>Option fehlt</option>}
                  {element && elementChoices(element).map(choice => <option key={choice.id} value={choice.id}>{choice.label}</option>)}
                </select> : !["isEmpty", "isNotEmpty"].includes(condition.operator) && <Input aria-label={`${label}: Wert`} type={condition.kind === "number" ? "number" : "text"} value={condition.value ?? ""} onChange={event => change(condition.kind === "number" ? { ...condition, value: Number(event.target.value) } : { ...condition, value: event.target.value })} />}
                <Button size="sm" variant="ghost" disabled={rule.conditions.length === 1} aria-label={`${label} löschen`} onClick={() => changeRule(index, { conditions: rule.conditions.filter((_, i) => i !== conditionIndex) })}>Bedingung löschen</Button>
              </div>;
            })}
            <Button size="sm" variant="outline" disabled={!fields.length || rule.conditions.length >= 20} onClick={() => changeRule(index, { conditions: [...rule.conditions, initialCondition()] })}>Bedingung hinzufügen</Button>
            {targetSelect(`Ziel von Regel ${index + 1}`, rule.targetPageId, value => changeRule(index, { targetPageId: value }))}
          </div>)}
          <Button size="sm" variant="outline" disabled={!fields.length || routing.rules.length >= 50} onClick={() => update({ rules: [...routing.rules, { id: crypto.randomUUID(), name: `Regel ${routing.rules.length + 1}`, match: "all", conditions: [initialCondition()], targetPageId: routing.fallbackPageId }] })}>Regel hinzufügen</Button>
          {targetSelect("Standardziel", routing.fallbackPageId, value => update({ fallbackPageId: value }))}
        </fieldset>
        <details className="border-t pt-3"><summary className="cursor-pointer text-sm font-semibold">Regeln mit Beispielantworten testen</summary>
          <div className="space-y-3 pt-3">
            <p className="text-xs text-muted-foreground">Nur Testwerte. Keine Leads und keine Änderung am Funnel. Direkte Button-Ziele haben Vorrang; hier wird der normale Weiter-Schritt geprüft.</p>
            {Array.from(new Set(routing.rules.flatMap(rule => rule.conditions.map(condition => condition.fieldId)))).map(id => {
              const element = field(id);
              return <label key={id} className="block space-y-1 text-xs">{element ? fieldLabel(element) : "Gelöschtes Feld"}
                {element && ["select", "radio"].includes(element.type) ? <select aria-label={`Testantwort: ${fieldLabel(element)}`} className={selectClass} value={testValues[id] ?? ""} onChange={event => setTestValues(values => ({ ...values, [id]: event.target.value }))}><option value="">Unbeantwortet</option>{elementChoices(element).map(choice => <option key={choice.id} value={choice.id}>{choice.label}</option>)}</select> : <Input aria-label={`Testantwort: ${element ? fieldLabel(element) : id}`} value={testValues[id] ?? ""} onChange={event => setTestValues(values => ({ ...values, [id]: event.target.value }))} />}
              </label>;
            })}
            <p className="text-sm font-semibold" role="status">Ziel: {funnel.pages.find(page => page.id === result?.targetPageId)?.title ?? "Ziel fehlt"} · {result?.ruleId ? result.trace.find(rule => rule.id === result.ruleId)?.name : "Standardziel"}</p>
            {result?.trace.map(rule => <div key={rule.id} className="text-xs border rounded p-2"><strong>{rule.name}: {rule.id === result.ruleId ? "greift zuerst" : rule.matched ? "trifft zu, frühere Regel gewinnt" : "trifft nicht zu"}</strong>{rule.conditions.map(condition => <p key={condition.id}>{field(condition.fieldId) ? fieldLabel(field(condition.fieldId)!) : "Feld fehlt"}: {condition.unanswered ? "unbeantwortet · " : ""}{condition.matched ? "erfüllt" : "nicht erfüllt"}</p>)}</div>)}
          </div>
        </details>
      </>}
    </>}
    {!!issues.length && <div className="border border-amber-300 rounded p-3 text-xs space-y-1"><strong>Vor dem Veröffentlichen prüfen</strong>{issues.slice(0, 8).map(issue => <p key={issue}>{issue}</p>)}</div>}
    <Dialog open={!!proposal} onOpenChange={open => { if (!open) setProposal(null); }}>
      <DialogContent><DialogHeader><DialogTitle>Besucherregeln aktivieren</DialogTitle><DialogDescription>Für „{page.title}“ werden {proposal?.rules.length} bisherige Bedingungen als geordnete Regeln vorgeschlagen. Standardziel: {funnel.pages.find(page => page.id === proposal?.fallbackPageId)?.title ?? "noch auswählen"}.</DialogDescription></DialogHeader>
        <p className="text-sm">Im gesamten Funnel folgt „Zurück“ danach dem besuchten Weg. Antworten verlassener Zweige werden verworfen. Unbeantwortete Felder erfüllen keine Vergleiche außer „ist leer“. Direkte Buttons behalten Vorrang und prüfen Pflichtfelder. Bitte prüfe die Wege in der Vorschau vor dem Veröffentlichen.</p>
        <p className="text-xs text-muted-foreground">Bisherige Auswahlfelder bleiben textbezogen. Neue Auswahlfelder erhalten feste Options-IDs. Gespeicherte Leads bleiben erhalten. Die Aktivierung ist ein Undo-Schritt und wird erst beim Veröffentlichen live.</p>
        <DialogFooter><Button variant="outline" onClick={() => setProposal(null)}>Abbrechen</Button><Button disabled={!!blocked} onClick={() => { if (proposal) onUpdate({ routing: proposal }); setProposal(null); }}>Regeln übernehmen</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </section>;
}
