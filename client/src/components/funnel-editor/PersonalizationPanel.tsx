import { useState } from "react";
import { personalizationBindingSchema, type Funnel, type PageElement, type PersonalizationBinding } from "@shared/schema";
import { personalizationAnswerTypes, personalizationErrors, resolvePersonalizedContent, suggestedToken, templateTokens } from "@shared/funnel-personalization";
import { elementChoices, fieldLabel, visitorRoutingErrors } from "@shared/funnel-routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface PersonalizationTestValues {
  enabled: boolean;
  answers: Record<string, string>;
  campaign: Record<string, string>;
}
interface Props {
  funnel: Funnel;
  element: PageElement;
  onUpdate: (updates: Partial<PageElement>) => void;
  testValues: PersonalizationTestValues;
  onTestValues: (values: PersonalizationTestValues) => void;
}
const selectClass = "w-full rounded border bg-background px-2 py-2 text-sm";

/** Only configured bindings resolve; old brace text is explicitly assigned. */
export function PersonalizationPanel({ funnel, element, onUpdate, testValues, onTestValues }: Props) {
  const [activationOpen, setActivationOpen] = useState(false);
  const [kind, setKind] = useState<"answer" | "campaign">("answer");
  const [fieldId, setFieldId] = useState("");
  const [campaignKey, setCampaignKey] = useState("utm_campaign");
  const [existingToken, setExistingToken] = useState("");
  const [fallback, setFallback] = useState("");
  const fields = funnel.pages.filter(page => !page.hidden).flatMap(page => page.elements.filter(field => personalizationAnswerTypes.has(field.type)).map(field => ({ page, field })));
  const bindings = element.personalization?.bindings ?? [];
  const availableTokens = templateTokens(element.content).filter(token => !bindings.some(binding => binding.token === token));
  const selectedField = fields.find(({ field }) => field.id === fieldId)?.field ?? fields[0]?.field;
  const blocked = !!funnel.abTests?.some(test => test.status === "running");
  const update = (next: PersonalizationBinding[], content = element.content) => { if (!blocked) onUpdate({ content, personalization: { version: 1, bindings: next } }); };
  const change = (binding: PersonalizationBinding, changes: Partial<PersonalizationBinding>) => update(bindings.map(item => item.id === binding.id ? { ...binding, ...changes } : item));
  const source: PersonalizationBinding["source"] = kind === "answer" ? { kind, fieldId: selectedField?.id ?? "" } : { kind, key: campaignKey };
  const token = existingToken || suggestedToken(kind === "answer" && selectedField ? fieldLabel(selectedField) : campaignKey, bindings);
  const candidate = { id: "pending", token, source, fallback };
  const canAdd = personalizationBindingSchema.safeParse(candidate).success && bindings.length < 20 && (!existingToken || availableTokens.includes(existingToken));
  const issues = [...personalizationErrors(funnel.pages, funnel.abTests), ...visitorRoutingErrors(funnel.pages, funnel.abTests)];
  const preview = resolvePersonalizedContent(element, { pages: funnel.pages, path: funnel.pages.filter(page => !page.hidden).map(page => page.id), answers: testValues.answers, campaign: testValues.campaign });

  return <section aria-label="Personalisierung" className="space-y-3 border-t pt-4">
    <h4 className="font-semibold text-sm">Persönliche Ansprache</h4>
    {blocked && <p className="text-xs text-amber-700">Pausiere laufende A/B-Tests, bevor du Personalisierung änderst.</p>}
    {!element.personalization ? <>
      <p className="text-xs text-muted-foreground">Antworten oder freigegebene Kampagnenwerte in diesen Text einsetzen. Bestehende Platzhalter bleiben bis zu ihrer Zuordnung unverändert.</p>
      <Button size="sm" variant="outline" disabled={blocked} onClick={() => setActivationOpen(true)}>Personalisierung aktivieren</Button>
    </> : <>
      <p className="text-xs text-muted-foreground">Nur zugeordnete Platzhalter werden ersetzt. Fehlt eine Antwort im besuchten Weg, erscheint ihr Ersatztext.</p>
      <fieldset disabled={blocked} className="space-y-3">
        {bindings.map(binding => <div key={binding.id} className="rounded border p-2 space-y-2">
          <code className="text-xs">{`{{${binding.token}}}`}</code>
          {binding.source.kind === "answer" ? <label className="block text-xs space-y-1">Antwortquelle
            <select aria-label={`Quelle für ${binding.token}`} className={selectClass} value={binding.source.fieldId} onChange={event => change(binding, { source: { kind: "answer", fieldId: event.target.value } })}>
              {!fields.some(({ field }) => field.id === (binding.source.kind === "answer" ? binding.source.fieldId : "")) && <option value={binding.source.fieldId}>Quelle fehlt – neu zuordnen</option>}
              {fields.map(({ page, field }) => <option key={field.id} value={field.id}>{page.title} · {fieldLabel(field)}</option>)}
            </select>
          </label> : <p className="text-xs">Freigegebener URL-Wert: <code>{binding.source.key}</code></p>}
          <label className="block text-xs space-y-1">Ersatztext<Input aria-label={`Ersatztext für ${binding.token}`} maxLength={200} value={binding.fallback} onChange={event => change(binding, { fallback: event.target.value })} /></label>
          <Button size="sm" variant="ghost" aria-label={`Platzhalter ${binding.token} entfernen`} onClick={() => update(bindings.filter(item => item.id !== binding.id), (element.content ?? "").split(`{{${binding.token}}}`).join(binding.fallback))}>Durch Ersatztext ersetzen</Button>
        </div>)}
        <div className="space-y-2 rounded border p-2">
          <strong className="text-xs">Platzhalter hinzufügen</strong>
          <label className="block text-xs space-y-1">Quelle<select aria-label="Neue Variablenquelle" className={selectClass} value={kind} onChange={event => setKind(event.target.value as "answer" | "campaign")}><option value="answer">Antwortfeld</option><option value="campaign">Kampagnenwert aus der URL</option></select></label>
          {kind === "answer" ? <select aria-label="Antwortfeld für neue Variable" className={selectClass} value={selectedField?.id ?? ""} onChange={event => setFieldId(event.target.value)}>
            {!fields.length && <option value="">Zuerst ein Antwortfeld hinzufügen</option>}
            {fields.map(({ page, field }) => <option key={field.id} value={field.id}>{page.title} · {fieldLabel(field)}</option>)}
          </select> : <label className="block text-xs space-y-1">URL-Parameter freigeben<Input aria-label="Freigegebener URL-Parameter" maxLength={64} value={campaignKey} onChange={event => setCampaignKey(event.target.value)} placeholder="utm_campaign" /><span className="block text-muted-foreground">Genau dieser Schlüssel wird verwendet, z. B. ?utm_campaign=Herbst. Buchstaben, Zahlen, _ und -; Beginn mit einem Buchstaben.</span></label>}
          {!!availableTokens.length && <label className="block text-xs space-y-1">Vorhandener Platzhalter<select aria-label="Vorhandenen Platzhalter zuordnen" className={selectClass} value={existingToken} onChange={event => setExistingToken(event.target.value)}><option value="">Neuen Platzhalter anhängen</option>{availableTokens.map(token => <option key={token} value={token}>{`{{${token}}}`}</option>)}</select></label>}
          <label className="block text-xs space-y-1">Ersatztext<Input aria-label="Ersatztext der neuen Variable" value={fallback} maxLength={200} onChange={event => setFallback(event.target.value)} placeholder="z. B. deine Region" /></label>
          <Button size="sm" disabled={!canAdd} onClick={() => {
            update([...bindings, { ...candidate, id: crypto.randomUUID() }], existingToken ? element.content : `${element.content ?? ""}${element.content && !/\s$/.test(element.content) ? " " : ""}{{${token}}}`);
            setExistingToken(""); setFallback("");
          }}>{existingToken ? "Platzhalter zuordnen" : "Variable einfügen"}</Button>
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={testValues.enabled} onChange={event => onTestValues({ ...testValues, enabled: event.target.checked })} />Testwerte im Canvas anzeigen</label>
      {testValues.enabled && <div className="space-y-2 rounded bg-muted/50 p-2">
        <p className="text-xs text-muted-foreground">Nur diese Editoransicht. Die Funktionsvorschau verwendet ihre eigenen Eingaben. Doppelklick bearbeitet weiterhin den Vorlagentext.</p>
        {Array.from(new Map(bindings.map(binding => [binding.source.kind === "answer" ? `a:${binding.source.fieldId}` : `c:${binding.source.key}`, binding])).values()).map(binding => {
          const answer = binding.source.kind === "answer";
          const key = binding.source.kind === "answer" ? binding.source.fieldId : binding.source.key;
          const field = answer ? fields.find(item => item.field.id === key)?.field : undefined;
          const label = field ? fieldLabel(field) : key;
          const values = answer ? testValues.answers : testValues.campaign;
          const setValue = (value: string) => onTestValues({ ...testValues, [answer ? "answers" : "campaign"]: { ...values, [key]: value } });
          return <label key={`${answer}:${key}`} className="block text-xs space-y-1">{answer ? "Antwort" : "Kampagne"}: {label}
            {field && ["select", "radio"].includes(field.type) ? <select aria-label={`Testwert: ${label}`} className={selectClass} value={values[key] ?? ""} onChange={event => setValue(event.target.value)}><option value="">Keine Antwort</option>{elementChoices(field).map(choice => <option key={choice.id} value={choice.id}>{choice.label}</option>)}</select> : <Input aria-label={`Testwert: ${label}`} maxLength={200} value={values[key] ?? ""} onChange={event => setValue(event.target.value)} />}
          </label>;
        })}
        <p className="text-sm break-words" data-testid="personalization-test-result">{preview}</p>
      </div>}
      {!!availableTokens.length && <p className="text-xs text-amber-700">Noch ohne Zuordnung: {availableTokens.map(token => `{{${token}}}`).join(", ")}. Diese Texte bleiben wörtlich sichtbar.</p>}
    </>}
    {!!issues.length && <div className="text-xs text-amber-700 space-y-1"><strong>Vor dem Veröffentlichen prüfen</strong>{issues.slice(0, 5).map(issue => <p key={issue}>{issue}</p>)}</div>}
    <Dialog open={activationOpen} onOpenChange={setActivationOpen}><DialogContent>
      <DialogHeader><DialogTitle>Personalisierung aktivieren</DialogTitle><DialogDescription>Nur ausdrücklich zugeordnete Platzhalter in diesem Text werden ersetzt. Der Vorlagentext bleibt gespeichert.</DialogDescription></DialogHeader>
      <p className="text-sm">Im gesamten Funnel folgt „Zurück“ danach dem besuchten Weg; Antworten verlassener Zweige werden verworfen. Direkte Seitensprünge prüfen Pflichtfelder. Bitte prüfe die Wege und eine passende Danke-Seite vor dem Veröffentlichen.</p>
      <p className="text-xs text-muted-foreground">Die Aktivierung lässt sich rückgängig machen und wird erst beim Veröffentlichen live. Gespeicherte Leads bleiben erhalten.</p>
      <DialogFooter><Button variant="outline" onClick={() => setActivationOpen(false)}>Abbrechen</Button><Button disabled={blocked} onClick={() => { if (!blocked) onUpdate({ personalization: { version: 1, bindings: [] } }); setActivationOpen(false); }}>Personalisierung übernehmen</Button></DialogFooter>
    </DialogContent></Dialog>
  </section>;
}
