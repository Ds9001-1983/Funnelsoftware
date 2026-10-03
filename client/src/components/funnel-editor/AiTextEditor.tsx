import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { aiEditInputSchema, aiEditOutputSchema, validEditSuggestions, type AiEditInput, type AiEditOutput } from "@shared/ai-edit";
import type { FunnelPage, PageElement } from "@shared/schema";

export function AiTextEditor({ funnelId, page, element, onApply }: { funnelId: number; page: FunnelPage; element: PageElement; onApply: (pageId: string, elementId: string, original: string, replacement: string) => void }) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
  const [scope, setScope] = useState<"element" | "section">("element");
  const [intent, setIntent] = useState<AiEditInput["intent"]>("shorten");
  const [audience, setAudience] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ source: AiEditInput; output: AiEditOutput; pageId: string } | null>(null);
  const [applied, setApplied] = useState<string[]>([]);
  const section = page.layout?.sections.find(section => section.columns.some(column => column.elementIds.includes(element.id)));
  const generate = async () => {
    const ids = scope === "section" && section ? section.columns.flatMap(column => column.elementIds) : [element.id];
    const items = page.elements.filter(item => ids.includes(item.id) && ["heading", "text", "button"].includes(item.type) && item.content?.trim()).map(item => ({ id: item.id, type: item.type, content: item.content }));
    const parsed = aiEditInputSchema.safeParse({ intent, audience, items });
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    setError(""); setBusy(true); setResult(null); setApplied([]);
    try {
      const output = aiEditOutputSchema.parse(await (await apiRequest("POST", `/api/funnels/${funnelId}/ai/rewrite`, parsed.data)).json());
      if (!validEditSuggestions(parsed.data, output)) throw new Error("Die Vorschläge konnten nicht geprüft werden.");
      setResult({ source: parsed.data, output, pageId: page.id });
    } catch (error) { setError(error instanceof Error ? error.message : "Vorschläge konnten nicht erstellt werden."); }
    finally { setBusy(false); }
  };
  return <section className="px-4 pb-4"><Button variant="outline" size="sm" onClick={() => { setOpen(true); setError(""); setResult(null); setApplied([]); }}>Mit KI bearbeiten</Button>
    <Dialog open={open} onOpenChange={next => { if (!busy) setOpen(next); }}><DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Textvorschläge mit KI</DialogTitle><DialogDescription>Ausgewählte Texte gehen an deinen verbundenen KI-Anbieter. Du prüfst jeden Vorschlag vor der Übernahme in den Entwurf. Es gelten die Nutzungskosten deines Anbieters.</DialogDescription></DialogHeader>
      <p className="text-xs"><Link href="/settings" className="underline">KI-Verbindung in den Einstellungen verwalten</Link> · Pro und bestätigte E-Mail erforderlich.</p>
      <label className="text-sm">Umfang<select aria-label="KI-Umfang" className="block w-full border rounded p-2 bg-background" value={scope} disabled={busy} onChange={event => { setScope(event.target.value as typeof scope); if (event.target.value === "section" && intent === "variants") setIntent("audience"); }}><option value="element">Ausgewählter Text</option>{section && <option value="section">Texte dieses Abschnitts</option>}</select></label>
      <label className="text-sm">Aufgabe<select aria-label="KI-Aufgabe" className="block w-full border rounded p-2 bg-background" value={intent} disabled={busy} onChange={event => setIntent(event.target.value as typeof intent)}><option value="shorten">Kürzen</option>{scope === "element" && <option value="variants">Drei Varianten</option>}<option value="audience">Für Zielgruppe umschreiben</option></select></label>
      {intent === "audience" && <label className="text-sm">Zielgruppe<Textarea value={audience} disabled={busy} maxLength={500} onChange={event => setAudience(event.target.value)} placeholder="Zum Beispiel: Fachkräfte im Handwerk" /></label>}
      <Button disabled={busy} onClick={generate}>{busy ? "Vorschläge werden erstellt …" : "Vorschläge erstellen"}</Button>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {result?.output.suggestions.map(suggestion => {
        const source = result.source.items.find(item => item.id === suggestion.id)!;
        return <div key={suggestion.id} className="border rounded p-3 space-y-3"><div><p className="text-xs text-muted-foreground">Ausgangstext</p><p className="whitespace-pre-wrap text-sm">{source.content}</p></div>{suggestion.variants.map((text, index) => <div key={index} className="border-t pt-3 space-y-2"><p className="text-xs text-muted-foreground">Vorschlag {index + 1}</p><p className="whitespace-pre-wrap text-sm">{text}</p><Button variant="outline" size="sm" disabled={applied.includes(suggestion.id)} onClick={() => { try { onApply(result.pageId, suggestion.id, source.content, text); setApplied(items => [...items, suggestion.id]); setError(""); } catch (error) { setError(error instanceof Error ? error.message : "Übernahme fehlgeschlagen."); } }}>{applied.includes(suggestion.id) ? "Übernommen" : `Vorschlag ${index + 1} übernehmen`}</Button></div>)}</div>;
      })}
    </DialogContent></Dialog>
  </section>;
}
