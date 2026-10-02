import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VisitorPaths } from "@/components/visitor-paths";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { apiRequest } from "@/lib/queryClient";
import type { AnalyticsOverview, FunnelMetrics, MetricRange } from "@shared/funnel-metrics";

export function MetricRangeSelect({ value, onChange }: { value: MetricRange; onChange: (range: MetricRange) => void }) {
  return <Select value={value} onValueChange={value => onChange(value as MetricRange)}>
    <SelectTrigger className="w-44" aria-label="Zeitraum" data-testid="select-time-range"><SelectValue /></SelectTrigger>
    <SelectContent>{(["7d", "30d", "90d", "all"] as const).map(range => <SelectItem key={range} value={range}>{range === "all" ? "Gesamt" : `Letzte ${range.slice(0, -1)} Tage`}</SelectItem>)}</SelectContent>
  </Select>;
}
const statusLabels: Record<string, string> = { new: "Neu", contacted: "Kontaktiert", qualified: "Qualifiziert", converted: "Konvertiert", lost: "Verloren" };

export default function Analytics() {
  useDocumentTitle("Analytics");
  const [range, setRange] = useState<MetricRange>("30d");
  const [selectedId, setSelectedId] = useState<string>("");
  const overview = useQuery<AnalyticsOverview>({ queryKey: ["/api/analytics/overview", range], queryFn: async () => (await apiRequest("GET", `/api/analytics/overview?range=${range}`)).json() });
  const data = overview.data;
  const ranked = [...(data?.funnels ?? [])].sort((a, b) => b.leads - a.leads || b.views - a.views);
  const funnelId = data?.funnels.some(funnel => String(funnel.id) === selectedId) ? selectedId : String(ranked[0]?.id ?? "");
  const metrics = useQuery<FunnelMetrics>({ queryKey: ["/api/funnels", funnelId, "metrics", range], enabled: !!funnelId,
    queryFn: async () => (await apiRequest("GET", `/api/funnels/${funnelId}/metrics?range=${range}`)).json() });
  return <div className="p-6 space-y-6 max-w-7xl mx-auto">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold">Analytics</h1><p className="text-muted-foreground">Besuche, Leads und Conversion im gewählten Zeitraum</p></div><MetricRangeSelect value={range} onChange={setRange} /></div>
    {overview.isError ? <p role="alert">Auswertung konnte nicht geladen werden. <Button variant="outline" onClick={() => overview.refetch()}>Erneut versuchen</Button></p> : overview.isLoading ? <p>Auswertung wird geladen …</p> : data && <>
      <div className="grid gap-4 sm:grid-cols-3">{[["Besuche", data.totalViews], ["Leads", data.totalLeads], ["Conversion-Rate", `${data.conversionRate}%`]].map(([label, value]) => <Card key={label}><CardHeader><CardTitle className="text-sm">{label}</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{value}</CardContent></Card>)}</div>
      <p className="text-xs text-muted-foreground">Conversion = eingegangene Leads / erfasste Besuche im selben Zeitraum. Besuche sind Seitenaufrufe des Funnels, keine eindeutigen Personen.</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Top Funnels</CardTitle></CardHeader><CardContent className="space-y-3">{ranked.slice(0, 5).map(funnel => <div className="flex justify-between gap-3 text-sm" key={funnel.id}><Link href={`/funnels/${funnel.id}/metrics`} className="font-medium underline">{funnel.name}</Link><span>{funnel.views} Besuche · {funnel.leads} Leads · {funnel.conversionRate}%</span></div>)}{!ranked.length && <p>Noch keine Funnels vorhanden.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Lead-Quellen</CardTitle></CardHeader><CardContent className="space-y-2">{data.sources.slice(0, 10).map(source => <div className="flex justify-between gap-4 text-sm" key={source.source}><span className="break-all">{source.source}</span><span>{source.count} Leads</span></div>)}{!data.sources.length && <p>Noch keine Quelldaten vorhanden.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Lead-Status</CardTitle></CardHeader><CardContent className="space-y-2">{Object.entries(data.statuses).map(([status, count]) => <div className="flex justify-between text-sm" key={status}><span>{statusLabels[status] ?? status}</span><span>{count}</span></div>)}{!data.totalLeads && <p>Noch keine Leads im Zeitraum.</p>}</CardContent></Card>
      </div>
      {!!funnelId && <Card><CardHeader className="gap-3"><CardTitle>Besucherwege</CardTitle><Select value={funnelId} onValueChange={setSelectedId}><SelectTrigger className="max-w-sm" aria-label="Funnel auswählen"><SelectValue /></SelectTrigger><SelectContent>{data.funnels.map(funnel => <SelectItem key={funnel.id} value={String(funnel.id)}>{funnel.name}</SelectItem>)}</SelectContent></Select></CardHeader><CardContent>
        {metrics.isLoading ? <p>Besucherwege werden geladen …</p> : metrics.isError ? <p role="alert">Besucherwege konnten nicht geladen werden. <Button variant="outline" onClick={() => metrics.refetch()}>Erneut versuchen</Button></p> : metrics.data && <VisitorPaths paths={metrics.data.paths} />}
      </CardContent></Card>}
    </>}
  </div>;
}
