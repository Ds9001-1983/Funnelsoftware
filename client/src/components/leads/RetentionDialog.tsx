import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { RetentionDraftInput, RetentionPreview, RetentionState } from "@shared/retention-contract";

const labels: Record<RetentionState, string> = {
  due: "Frist erreicht", waiting: "Frist läuft", open: "Noch offen", unknown: "Nicht beurteilbar",
  excluded: "Ausgenommen", review: "Ausnahme prüfen", committed: "Löschung beauftragt",
};
const date = (value: string) => new Date(value).toLocaleString("de-DE");
function DraftForm({ data, funnelId, refresh }: { data: RetentionPreview; funnelId: number; refresh: () => Promise<void> }) {
  const [mode, setMode] = useState<RetentionDraftInput["mode"]>(data.draft?.mode ?? "closed_applications");
  const [days, setDays] = useState(data.draft?.days?.toString() ?? "");
  const [purpose, setPurpose] = useState(data.draft?.purpose ?? "");
  const save = useMutation({
    mutationFn: () => apiRequest("PUT", `/api/retention/funnels/${funnelId}`, {
      expectedVersion: data.draft?.version ?? 0, mode, days: Number(days), purpose,
    }),
    onSuccess: refresh,
  });
  return <form className="space-y-3" onSubmit={event => { event.preventDefault(); save.mutate(); }}>
    <div><Label htmlFor="retention-mode">Daten und Fristbeginn</Label>
      <select id="retention-mode" className="block w-full rounded-md border bg-background p-2" value={mode} onChange={e => setMode(e.target.value as typeof mode)}>
        <option value="closed_applications">Abgeschlossene Bewerbungen – ab Abschluss</option>
        <option value="general_leads">Allgemeine Leads – ab Erfassung</option>
      </select>
    </div>
    <p className="text-sm text-muted-foreground">{mode === "closed_applications"
      ? "Konvertiert und Verloren gelten als abgeschlossen. Wiederöffnen setzt den Fristbeginn zurück. Altfälle ohne belegtes Abschlussdatum bleiben nicht beurteilbar."
      : "Diese Vorschau gilt für alle Leads dieses Funnels, auch für offene Datensätze. Wähle diesen Modus nur für allgemeine Leads, nicht für Bewerbungen."}</p>
    <div><Label htmlFor="retention-days">Aufbewahrung in Tagen (je 24 Stunden)</Label><Input id="retention-days" type="number" min="1" max="36500" required value={days} onChange={e => setDays(e.target.value)} /></div>
    <div><Label htmlFor="retention-purpose">Begründung für die gewählte Frist</Label><Textarea id="retention-purpose" required minLength={3} maxLength={1000} value={purpose} onChange={e => setPurpose(e.target.value)} /></div>
    {save.error && <p role="alert" className="text-sm text-destructive">{save.error.message}</p>}
    <p className="text-sm text-muted-foreground">Speichern pausiert die Automatik. Bereits verbindlich beauftragte Löschungen werden nach ihrer Sicherung ausgeführt.</p>
    <Button type="submit" disabled={save.isPending}>Entwurf speichern und Vorschau aktualisieren</Button>
  </form>;
}
function Activation({ data, funnelId, refresh }: { data: RetentionPreview; funnelId: number; refresh: () => Promise<void> }) {
  const [confirmed, setConfirmed] = useState(false);
  const change = useMutation({
    mutationFn: (active: boolean) => apiRequest("PUT", `/api/retention/funnels/${funnelId}/activation`, {
      expectedVersion: data.draft?.version, active, confirmed, previewToken: data.previewToken,
    }), onSuccess: refresh,
  });
  return <section className="rounded border p-3 space-y-3" aria-label="Löschautomatik">
    <p className="font-medium">{data.automaticDeletion ? "Automatische Löschung ist aktiviert." : "Automatische Löschung ist ausgeschaltet."}</p>
    <p className="text-sm">{data.backupReady ? "Externe Journalsicherung ist bestätigt." : "Wartet auf externe Journalsicherung. Ohne aktuelle Bestätigung werden keine automatischen Löschungen ausgeführt."}</p>
    <p className="text-sm">Die Automatik beauftragt fällige Löschungen schrittweise. Jeder Auftrag wird zuerst extern gesichert. Ist der Backup-Mac ausgeschaltet oder nicht verbunden, wartet die Ausführung.</p>
    <p className="text-sm">Bereits beauftragte Löschungen lassen sich nicht zurücknehmen – auch nicht durch Pausieren. Diese Leads können nicht mehr geändert oder ausgenommen werden. Vor der Beauftragung schützen Ausnahmen und ein Wiederöffnen abgeschlossener Bewerbungen.</p>
    {data.draft && (data.automaticDeletion
      ? <Button variant="outline" disabled={change.isPending} onClick={() => change.mutate(false)}>Automatik pausieren</Button>
      : <><label className="flex gap-2 items-start text-sm"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />Ich habe die Vorschau und Frist geprüft und beauftrage die dauerhafte automatische Löschung fälliger Leads einschließlich ihrer zugehörigen Daten.</label>
        <Button disabled={!confirmed || !data.backupReady || change.isPending} onClick={() => change.mutate(true)}>Löschautomatik aktivieren</Button></>)}
    {change.error && <p role="alert" className="text-sm text-destructive">{change.error.message}</p>}
  </section>;
}
function ExceptionForm({ item, refresh }: { item: RetentionPreview["items"][number]; refresh: () => Promise<void> }) {
  const [reason, setReason] = useState(item.exception.reason ?? "");
  const [review, setReview] = useState(() => {
    if (!item.exception.reviewAt) return "";
    const local = new Date(item.exception.reviewAt);
    return new Date(local.getTime() - local.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  });
  const save = useMutation({
    mutationFn: (clear: boolean) => apiRequest("PUT", `/api/retention/leads/${item.id}/exception`, {
      expectedVersion: item.exception.version,
      exception: clear ? null : { reason, reviewAt: new Date(review).toISOString() },
    }), onSuccess: refresh,
  });
  return <form className="space-y-2 rounded border p-3" onSubmit={event => { event.preventDefault(); save.mutate(false); }}>
    <Label htmlFor={`reason-${item.id}`}>Ausnahmegrund für Lead #{item.id}</Label>
    <Textarea id={`reason-${item.id}`} required minLength={3} maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} />
    <Label htmlFor={`review-${item.id}`}>Nächster Prüftermin</Label>
    <Input id={`review-${item.id}`} type="datetime-local" required value={review} onChange={e => setReview(e.target.value)} />
    <p className="text-xs text-muted-foreground">Ein erreichter Prüftermin hebt die Ausnahme nicht auf. Manuelle Löschungen bleiben möglich.</p>
    {save.error && <p role="alert" className="text-sm text-destructive">{save.error.message}</p>}
    <div className="flex gap-2"><Button size="sm" disabled={save.isPending}>Ausnahme speichern</Button>
      {item.exception.reason && <Button size="sm" variant="outline" type="button" disabled={save.isPending} onClick={() => save.mutate(true)}>Ausnahme aufheben</Button>}</div>
  </form>;
}
function RetentionContent({ funnelId, names }: { funnelId: number; names: Map<number, string> }) {
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<number | null>(null);
  const queryKey = [`/api/retention/funnels/${funnelId}?page=${page}`];
  const query = useQuery<RetentionPreview>({ queryKey, refetchInterval: 30_000 });
  const refresh = async () => { await queryClient.invalidateQueries({ predicate: q => typeof q.queryKey[0] === "string" && q.queryKey[0].startsWith(`/api/retention/funnels/${funnelId}?`) }); };
  if (query.isPending) return <p>Vorschau wird geladen …</p>;
  if (query.isError) return <div><p role="alert">{query.error.message}</p><Button onClick={() => query.refetch()}>Erneut laden</Button></div>;
  const data = query.data;
  return <div className="space-y-5" data-bug-mask>
    <DraftForm key={data.draft?.version ?? 0} data={data} funnelId={funnelId} refresh={refresh} />
    <Activation key={`activation-${data.draft?.version ?? 0}`} data={data} funnelId={funnelId} refresh={refresh} />
    <div className="flex items-center justify-between"><p className="text-sm">Stand: {date(data.asOf)} · Entwurf {data.draft?.version ?? 0}</p><Button variant="outline" size="sm" disabled={query.isFetching} onClick={refresh}>Neu laden</Button></div>
    <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2">{Object.entries(labels).map(([key, label]) => <div className="rounded bg-muted p-3" key={key}><dt className="text-sm">{label}</dt><dd className="text-lg font-semibold" data-testid={`retention-count-${key}`}>{data.counts[key as RetentionState]}</dd></div>)}</dl>
    {!data.draft && <p>Speichere einen Entwurf, um die Fristen zu berechnen.</p>}
    <p className="text-sm text-muted-foreground">Die Vorschau umfasst alle {data.total} Leads dieses Funnels. Ausnahmen bleiben auch nach dem Prüftermin geschützt. Analytics, gelöschte Funnels und Backups sind nicht Teil dieses Entwurfs.</p>
    <div className="space-y-3">{data.items.map(item => <div key={item.id} className="border rounded p-3 space-y-2">
      <div className="flex items-center justify-between gap-2"><div><p className="font-medium">{names.get(item.id) || `Lead #${item.id}`}</p><p className="text-sm">{labels[item.state]}{item.dueAt && ["due", "waiting"].includes(item.state) ? ` · ${date(item.dueAt)}` : ""}</p></div><Button size="sm" variant="outline" disabled={item.state === "committed"} onClick={() => setEditing(editing === item.id ? null : item.id)}>Ausnahme</Button></div>
      {item.exception.reason && <p className="text-sm">{item.exception.reason} · Prüfen: {item.exception.reviewAt && date(item.exception.reviewAt)}</p>}
      {editing === item.id && item.state !== "committed" && <ExceptionForm key={item.exception.version} item={item} refresh={refresh} />}
    </div>)}</div>
    {data.total > data.pageSize && <div className="flex justify-between items-center"><Button variant="outline" disabled={page === 0} onClick={() => { setPage(page - 1); setEditing(null); }}>Zurück</Button><span>Seite {page + 1}</span><Button variant="outline" disabled={(page + 1) * data.pageSize >= data.total} onClick={() => { setPage(page + 1); setEditing(null); }}>Weiter</Button></div>}
  </div>;
}
export function RetentionDialog({ funnelId, funnelName, names, open, onOpenChange }: {
  funnelId: number; funnelName: string; names: Map<number, string>; open: boolean; onOpenChange: (open: boolean) => void;
}) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader><DialogTitle>Aufbewahrung – {funnelName}</DialogTitle><DialogDescription>Lege Fristen fest, prüfe Ausnahmen und aktiviere die automatische Löschung ausdrücklich pro Funnel.</DialogDescription></DialogHeader>
    {open && <RetentionContent key={funnelId} funnelId={funnelId} names={names} />}
  </DialogContent></Dialog>;
}
