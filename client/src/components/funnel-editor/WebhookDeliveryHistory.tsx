import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { WebhookDeliveryList } from "@shared/webhook-delivery";

const labels: Record<string, string> = { pending: "Wartet", processing: "Wird gesendet", delivered: "Zugestellt", failed: "Fehlgeschlagen", cancelled: "Abgebrochen", retry: "Wiederholung geplant", interrupted: "Unterbrochen" };
const errors: Record<string, string> = {
  lease_expired: "Server wurde während der Zustellung unterbrochen.", resource_unavailable: "Funnel, Lead oder Konto nicht mehr verfügbar.",
  owner_not_verified: "E-Mail-Adresse des Kontos ist nicht bestätigt.", webhook_disabled: "Webhook wurde deaktiviert.",
  config_changed: "Webhook-Adresse oder Schlüssel wurde geändert.", lead_locked: "Lead liegt über dem monatlichen Freikontingent.",
  unsafe_destination: "Zieladresse ist nicht öffentlich erreichbar oder nicht zulässig.", redirect_rejected: "Ziel antwortet mit einer Weiterleitung. Bitte die endgültige URL eintragen.",
  dns_unavailable: "Zieladresse konnte nicht aufgelöst werden.", delivery_timeout: "Zeitlimit der Zustellung erreicht.", network_error: "Verbindung zum Ziel fehlgeschlagen.",
};
const formatDate = (value: string) => new Date(value).toLocaleString("de-DE");
const explain = (code: string) => errors[code] ?? (/^http_\d+$/.test(code) ? `Ziel antwortete mit HTTP ${code.slice(5)}.` : "Zustellung fehlgeschlagen.");

export function WebhookDeliveryHistory({ funnelId }: { funnelId: number }) {
  const [opened, setOpened] = useState(false);
  const [cursors, setCursors] = useState<number[]>([]);
  const before = cursors[cursors.length - 1];
  const query = useQuery<WebhookDeliveryList>({
    queryKey: ["webhook-deliveries", funnelId, before], enabled: opened,
    queryFn: async () => {
      const response = await fetch(`/api/funnels/${funnelId}/webhook-deliveries${before ? `?before=${before}` : ""}`, { credentials: "include" });
      if (!response.ok) throw new Error("Versandverlauf konnte nicht geladen werden");
      return response.json();
    },
    refetchInterval: opened ? 5_000 : false,
  });
  return <div className="space-y-3" data-testid="webhook-history">
    <Button variant="outline" size="sm" onClick={() => setOpened(value => !value)} aria-expanded={opened}>Versandverlauf {opened ? "schließen" : "anzeigen"}</Button>
    {opened && <>
      <p className="text-xs text-muted-foreground">Neue Leads werden dauerhaft vorgemerkt. Bei Verbindungsfehlern, HTTP 408, 429 und Serverfehlern folgen bis zu vier Wiederholungen nach 1, 5, 15 und 60 Minuten. Empfangende Systeme sollten doppelte Ereignisse anhand von event_id erkennen.</p>
      {query.isPending && <p className="text-xs">Verlauf wird geladen…</p>}
      {query.isError && <div className="text-xs" role="alert">Versandverlauf konnte nicht geladen werden. <Button variant="ghost" size="sm" onClick={() => query.refetch()}>Erneut laden</Button></div>}
      {query.data && <>
        {!query.data.items.length && <p className="text-xs text-muted-foreground">Noch keine Zustellungen in diesem Zeitraum.</p>}
        <div className="space-y-2">{query.data.items.map(job => <details key={job.id} className="rounded border p-2 text-xs">
          <summary className="cursor-pointer space-y-1"><Badge variant={job.status === "failed" ? "destructive" : "secondary"}>{labels[job.status] ?? job.status}</Badge> <span>Lead #{job.leadId} · {job.attempts}/5 Versuche</span><span className="block text-muted-foreground">{formatDate(job.createdAt)}</span></summary>
          <div className="mt-2 space-y-2">
            <p className="break-all">Ereignis-ID: {job.eventId}</p>
            {job.errorCode && <p>{explain(job.errorCode)}</p>}
            {job.status === "pending" && <p>Nächster Versuch frühestens: {formatDate(job.nextAttemptAt)}</p>}
            {job.deliveredAt && <p>Zugestellt: {formatDate(job.deliveredAt)}</p>}
            <ol className="space-y-2">{job.history.map(item => <li key={item.attempt}>Versuch {item.attempt}: {labels[item.outcome] ?? item.outcome}{item.statusCode ? ` · HTTP ${item.statusCode}` : ""}<span className="block text-muted-foreground">{formatDate(item.startedAt)}</span>{item.errorCode && <span className="block">{explain(item.errorCode)}</span>}</li>)}</ol>
          </div>
        </details>)}</div>
        <div className="flex gap-2">
          {cursors.length > 0 && <Button size="sm" variant="outline" onClick={() => setCursors(values => values.slice(0, -1))}>Neuere Zustellungen</Button>}
          {query.data.nextCursor && <Button size="sm" variant="outline" onClick={() => setCursors(values => [...values, query.data!.nextCursor!])}>Ältere Zustellungen</Button>}
        </div>
      </>}
    </>}
  </div>;
}
