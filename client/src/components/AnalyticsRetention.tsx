import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Funnel } from "@shared/schema";
import type { AnalyticsRetentionPreview } from "@shared/analytics-retention-contract";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const labels = { due: "Frist erreicht", waiting: "Frist läuft", unknown: "Nicht beurteilbar", committed: "Löschung beauftragt" };
const eventLabels: Record<string, string> = { view: "Funnel-Aufrufe", pageView: "Seitenaufrufe", click: "Klicks", submit: "Absendungen", complete: "Abschlüsse" };
function RuleForm({ data, url, refresh }: { data: AnalyticsRetentionPreview; url: string; refresh: () => Promise<void> }) {
  const [days, setDays] = useState(data.draft?.days.toString() ?? "");
  const [purpose, setPurpose] = useState(data.draft?.purpose ?? "");
  const [confirmed, setConfirmed] = useState(false);
  const dirty = days !== (data.draft?.days.toString() ?? "") || purpose !== (data.draft?.purpose ?? "");
  const save = useMutation({
    mutationFn: () => apiRequest("PUT", url, { expectedVersion: data.draft?.version ?? 0, days: Number(days), purpose }),
    onSuccess: refresh,
  });
  const activation = useMutation({
    mutationFn: (active: boolean) => apiRequest("PUT", `${url}/activation`, {
      expectedVersion: data.draft?.version, active, confirmed, previewToken: data.previewToken,
    }), onSuccess: refresh,
  });
  const busy = save.isPending || activation.isPending;
  return <div className="space-y-4">
    <form className="space-y-3" onSubmit={e => { e.preventDefault(); setConfirmed(false); save.mutate(); }}>
      <div><Label htmlFor="analytics-retention-days">Statistik-Aufbewahrung in Tagen (je 24 Stunden)</Label>
        <Input id="analytics-retention-days" type="number" min="1" max="36500" required value={days} onChange={e => { setDays(e.target.value); setConfirmed(false); }} /></div>
      <div><Label htmlFor="analytics-retention-purpose">Begründung für die Statistik-Frist</Label>
        <Textarea id="analytics-retention-purpose" required minLength={3} maxLength={1000} value={purpose} onChange={e => { setPurpose(e.target.value); setConfirmed(false); }} /></div>
      <p className="text-sm text-muted-foreground">Die Frist beginnt beim jeweiligen Ereignis. Speichern pausiert die Automatik und aktualisiert die Vorschau.</p>
      <Button disabled={busy}>Entwurf speichern und Vorschau aktualisieren</Button>
      {save.error && <p role="alert" className="text-sm text-destructive">{save.error.message}</p>}
    </form>
    <section className="rounded border p-3 space-y-3" aria-label="Statistik-Löschautomatik">
      <p className="font-medium">{data.automaticDeletion ? "Automatische Statistik-Löschung ist aktiviert." : "Automatische Statistik-Löschung ist ausgeschaltet."}</p>
      <p className="text-sm">{data.backupReady ? "Externe Sicherung ist bestätigt." : "Wartet auf externe Sicherung. Die Löschung wird erst nach Bestätigung ausgeführt."}</p>
      <p className="text-sm">Neue fällige Ereignisse werden pro Funnel einmal täglich beauftragt und zuerst gesichert. Bereits beauftragte Löschungen bleiben verbindlich, auch wenn du die Automatik pausierst oder die Frist änderst.</p>
      {data.draft && (data.automaticDeletion
        ? <Button variant="outline" disabled={busy} onClick={() => activation.mutate(false)}>Statistik-Automatik pausieren</Button>
        : <><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} disabled={dirty || busy} onChange={e => setConfirmed(e.target.checked)} />Ich habe die gespeicherte Frist und Vorschau geprüft und beauftrage die dauerhafte automatische Löschung fälliger Statistikereignisse.</label>
          {dirty && <p className="text-sm">Speichere deine Änderungen zuerst, um die passende Vorschau zu erhalten.</p>}
          <Button disabled={!confirmed || dirty || !data.backupReady || busy} onClick={() => activation.mutate(true)}>Statistik-Löschung aktivieren</Button></>)}
      {activation.error && <p role="alert" className="text-sm text-destructive">{activation.error.message}</p>}
    </section>
  </div>;
}
function Content({ funnelId }: { funnelId: number }) {
  const url = `/api/retention/analytics/${funnelId}`;
  const query = useQuery<AnalyticsRetentionPreview>({ queryKey: [url], refetchInterval: 30_000 });
  const refresh = async () => { await queryClient.invalidateQueries({ queryKey: [url] }); };
  if (query.isPending) return <p>Statistik-Vorschau wird geladen …</p>;
  if (query.isError) return <div><p role="alert">{query.error.message}</p><Button onClick={() => query.refetch()}>Erneut laden</Button></div>;
  const data = query.data;
  return <div className="space-y-4" data-bug-mask>
    <p className="text-sm">Die Löschung verkürzt Seiten-, Zeitverlaufs- und A/B-Auswertungen. Der Gesamtzähler für Funnel-Aufrufe bleibt erhalten. Leads, Bewerbungen und deren Antworten haben eigene Aufbewahrungsregeln.</p>
    <div className="flex justify-between items-center gap-2"><p className="text-sm">Vorschau vom {new Date(data.asOf).toLocaleString("de-DE")}</p><Button variant="outline" size="sm" onClick={refresh} disabled={query.isFetching}>Neu laden</Button></div>
    {data.cutoff && <p className="text-sm">Nach gespeicherter Frist fällig: Ereignisse bis einschließlich {new Date(data.cutoff).toLocaleString("de-DE")}.</p>}
    {!data.draft && <p className="text-sm">Speichere eine eigene Frist, um die Fälligkeit zu berechnen.</p>}
    <dl className="grid grid-cols-2 gap-2">{(Object.keys(labels) as (keyof typeof labels)[]).map(key => <div className="rounded bg-muted p-3" key={key}><dt className="text-sm">{labels[key]}</dt><dd className="font-semibold" data-testid={`analytics-retention-${key}`}>{data.counts[key]}</dd></div>)}</dl>
    <p className="text-sm">Insgesamt {data.total} gespeicherte Statistikereignisse.</p>
    {data.eventTypes.length > 0 && <ul className="text-sm space-y-1">{data.eventTypes.map(item => <li key={item.eventType}>{eventLabels[item.eventType] ?? "Weitere Ereignisse"}: {item.total} gesamt · {item.due} fällig · {item.committed} beauftragt</li>)}</ul>}
    <RuleForm key={data.draft?.version ?? 0} data={data} url={url} refresh={refresh} />
  </div>;
}
export function AnalyticsRetention({ funnels }: { funnels: Funnel[] }) {
  const { user } = useAuth();
  const own = funnels.filter(funnel => funnel.userId === user?.id);
  const [selectedId, setSelectedId] = useState("");
  const [open, setOpen] = useState(false);
  const selected = own.find(funnel => String(funnel.id) === selectedId) ?? own[0];
  if (!selected) return null;
  return <Card><CardHeader><CardTitle className="text-lg">Statistik-Aufbewahrung</CardTitle>
    <CardDescription>Lege für jeden Funnel eine eigene Frist fest und prüfe die betroffenen Ereignisse vor der Aktivierung.</CardDescription></CardHeader>
    <CardContent className="flex flex-wrap items-end gap-3"><div className="min-w-0 flex-1"><Label htmlFor="analytics-retention-funnel">Funnel für Statistik-Aufbewahrung</Label>
      <select id="analytics-retention-funnel" className="block w-full rounded-md border bg-background p-2" value={String(selected.id)} onChange={e => setSelectedId(e.target.value)}>
        {own.map(funnel => <option key={funnel.id} value={funnel.id}>{funnel.name}</option>)}
      </select></div><Button variant="outline" onClick={() => setOpen(true)}>Statistik-Aufbewahrung planen</Button></CardContent>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader>
      <DialogTitle>Statistik-Aufbewahrung – {selected.name}</DialogTitle>
      <DialogDescription>Eine gespeicherte Frist aktiviert noch keine Löschung.</DialogDescription>
    </DialogHeader>{open && <Content key={selected.id} funnelId={selected.id} />}</DialogContent></Dialog>
  </Card>;
}
