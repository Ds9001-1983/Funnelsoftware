import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { DeletedFunnelRetentionPreview, DeletedFunnelState } from "@shared/deleted-funnel-retention-contract";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const url = "/api/retention/deleted-funnels";
const labels: Record<DeletedFunnelState, string> = { due: "Frist erreicht", waiting: "Frist läuft", unknown: "Nicht beurteilbar", blocked: "Geschützt", committed: "Löschung beauftragt" };
function Rule({ data, refresh }: { data: DeletedFunnelRetentionPreview; refresh: () => Promise<void> }) {
  const [days, setDays] = useState(data.draft?.days.toString() ?? "");
  const [purpose, setPurpose] = useState(data.draft?.purpose ?? "");
  const [confirmed, setConfirmed] = useState(false);
  const dirty = days !== (data.draft?.days.toString() ?? "") || purpose !== (data.draft?.purpose ?? "");
  const save = useMutation({ mutationFn: () => apiRequest("PUT", url, { expectedVersion: data.draft?.version ?? 0, days: Number(days), purpose }), onSuccess: refresh });
  const activation = useMutation({ mutationFn: (active: boolean) => apiRequest("PUT", `${url}/activation`, { expectedVersion: data.draft?.version, active, confirmed, previewToken: data.previewToken }), onSuccess: refresh });
  const busy = save.isPending || activation.isPending;
  return <div className="space-y-4">
    <form className="space-y-3" onSubmit={e => { e.preventDefault(); setConfirmed(false); save.mutate(); }}>
      <div><Label htmlFor="deleted-funnel-days">Wartefrist nach Funnel-Löschung in Tagen</Label><Input id="deleted-funnel-days" type="number" min="1" max="36500" required value={days} onChange={e => { setDays(e.target.value); setConfirmed(false); }} /></div>
      <div><Label htmlFor="deleted-funnel-purpose">Begründung für die Funnel-Frist</Label><Textarea id="deleted-funnel-purpose" required minLength={3} maxLength={1000} value={purpose} onChange={e => { setPurpose(e.target.value); setConfirmed(false); }} /></div>
      <p className="text-sm">Die Frist gilt für alle bereits und künftig gelöschten Funnels deines Kontos. Ein Tag entspricht 24 Stunden. Speichern pausiert die Automatik.</p>
      <Button disabled={busy}>Entwurf speichern und Vorschau aktualisieren</Button>
      {save.error && <p role="alert" className="text-sm text-destructive">{save.error.message}</p>}
    </form>
    <section className="rounded border p-3 space-y-3">
      <p className="font-medium">{data.automaticDeletion ? "Endgültige Funnel-Löschung ist aktiviert." : "Endgültige Funnel-Löschung ist ausgeschaltet."}</p>
      <p className="text-sm">{data.backupReady ? "Externe Sicherung ist bestätigt." : "Wartet auf externe Sicherung. Ohne Bestätigung bleibt die Ausführung aus."}</p>
      <p className="text-sm">Beauftragte Löschungen lassen sich nicht zurücknehmen. Pausieren stoppt neue Aufträge; bereits beauftragte Funnels werden nach gesicherter Bestätigung endgültig entfernt.</p>
      {data.draft && (data.automaticDeletion
        ? <Button variant="outline" disabled={busy} onClick={() => activation.mutate(false)}>Funnel-Automatik pausieren</Button>
        : <><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} disabled={dirty || busy} onChange={e => setConfirmed(e.target.checked)} />Ich habe die gespeicherte Frist und Vorschau geprüft und beauftrage die endgültige automatische Löschung fälliger, bereits gelöschter Funnels ohne Leads und Domainzuordnungen.</label>
          {dirty && <p className="text-sm">Speichere deine Änderungen zuerst.</p>}
          <Button disabled={!confirmed || dirty || !data.backupReady || busy} onClick={() => activation.mutate(true)}>Endgültige Funnel-Löschung aktivieren</Button></>)}
      {activation.error && <p role="alert" className="text-sm text-destructive">{activation.error.message}</p>}
    </section>
  </div>;
}
function Content() {
  const [page, setPage] = useState(0);
  const query = useQuery<DeletedFunnelRetentionPreview>({ queryKey: [`${url}?page=${page}`], refetchInterval: 30_000 });
  const refresh = async () => { await queryClient.invalidateQueries({ predicate: q => typeof q.queryKey[0] === "string" && q.queryKey[0].startsWith(`${url}?`) }); };
  if (query.isPending) return <p>Gelöschte Funnels werden geprüft …</p>;
  if (query.isError) return <div><p role="alert">{query.error.message}</p><Button onClick={() => query.refetch()}>Erneut laden</Button></div>;
  const data = query.data;
  return <div className="space-y-4" data-bug-mask>
    <p className="text-sm">Endgültiges Entfernen löscht Funnel-Inhalte, Versionen, Statistikereignisse und zugehörige Einstellungen. Vorlagen und Dateien in deiner Mediathek bleiben erhalten.</p>
    <p className="text-sm">Jeder vorhandene Lead oder Bewerber schützt seinen Funnel, auch bei einer Ausnahme oder einer noch wartenden Lead-Löschung. Bearbeite diese Daten über die Leadverwaltung. Zugeordnete Domains müssen zuerst über die Domainverwaltung entfernt werden.</p>
    <div className="flex justify-between items-center gap-2"><p className="text-sm">Stand: {new Date(data.asOf).toLocaleString("de-DE")}</p><Button variant="outline" size="sm" disabled={query.isFetching} onClick={refresh}>Neu laden</Button></div>
    <dl className="grid grid-cols-2 gap-2">{(Object.keys(labels) as DeletedFunnelState[]).map(key => <div className="rounded bg-muted p-3" key={key}><dt className="text-sm">{labels[key]}</dt><dd className="font-semibold" data-testid={`deleted-funnel-${key}`}>{data.counts[key]}</dd></div>)}</dl>
    <p className="text-sm">{data.total} gelöschte Funnels in deinem Konto.</p>
    <div className="space-y-2">{data.items.map(item => <div key={item.id} className="rounded border p-3 text-sm"><p className="font-medium break-words">{item.name}</p><p>{labels[item.state]} · gelöscht am {new Date(item.deletedAt).toLocaleDateString("de-DE")}</p>{(item.leads > 0 || item.domains > 0) && <p>{item.leads} Leads/Bewerbungen · {item.domains} Domainzuordnungen</p>}</div>)}</div>
    {data.total > data.pageSize && <div className="flex justify-between items-center"><Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Zurück</Button><span>Seite {page + 1}</span><Button variant="outline" disabled={(page + 1) * data.pageSize >= data.total} onClick={() => setPage(page + 1)}>Weiter</Button></div>}
    <Rule key={data.draft?.version ?? 0} data={data} refresh={refresh} />
  </div>;
}
export function DeletedFunnelRetention() {
  const [open, setOpen] = useState(false);
  return <><Button variant="outline" onClick={() => setOpen(true)}>Gelöschte Funnels aufräumen</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader>
      <DialogTitle>Aufbewahrung gelöschter Funnels</DialogTitle><DialogDescription>Prüfe die Vorschau und lege eine eigene Wartefrist für dein Konto fest.</DialogDescription>
    </DialogHeader>{open && <Content />}</DialogContent></Dialog></>;
}
