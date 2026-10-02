import type { FunnelMetrics } from "@shared/funnel-metrics";

export function VisitorPaths({ paths }: { paths: FunnelMetrics["paths"] }) {
  return <div className="space-y-4" data-testid="visitor-paths">
    <p className="text-sm text-muted-foreground">{paths.trackedVisits} erfasste Besuche mit Wegdaten. Ein erneuter Seitenaufruf beginnt einen neuen Besuch. Frühere Aufrufe ohne Wegdaten: {paths.legacyPageViews}.</p>
    <div><h3 className="font-medium mb-2">Beobachtete Übergänge</h3>
      {paths.transitions.length ? <ul className="space-y-2">{paths.transitions.map(edge => <li className="flex justify-between gap-4 text-sm" key={JSON.stringify([edge.from, edge.to])}><span>{edge.fromTitle} → {edge.toTitle}</span><span>{edge.visits} Besuche</span></li>)}</ul> : <p className="text-sm text-muted-foreground">Noch keine Übergänge erfasst.</p>}
    </div>
    <div><h3 className="font-medium mb-2">Letzte Seite ohne beobachteten Abschluss</h3>
      <p className="text-xs text-muted-foreground mb-2">Seit mindestens 30 Minuten keine Aktivität. Ein fehlendes Messereignis kann ebenfalls die Ursache sein. Verzweigungen zählen nicht als Abbruch.</p>
      {paths.exits.length ? <ul className="space-y-2">{paths.exits.map(exit => <li className="flex justify-between gap-4 text-sm" key={exit.pageId}><span>{exit.title}</span><span>{exit.visits} Besuche</span></li>)}</ul> : <p className="text-sm text-muted-foreground">Keine entsprechenden Besuche erfasst.</p>}
    </div>
  </div>;
}
