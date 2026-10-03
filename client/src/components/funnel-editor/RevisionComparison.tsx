import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { FunnelRenderer } from "@/components/funnel-viewer/FunnelRenderer";
import { compareDocuments, type RevisionContent } from "@shared/funnel-comparison";
import { documentFromFunnel } from "@shared/funnel-document";
import type { Funnel } from "@shared/schema";

export function RevisionComparison({ funnel, revisionId }: { funnel: Funnel; revisionId: number | "published" }) {
  const revision = useQuery<RevisionContent>({ queryKey: ["/api/funnels", funnel.id, "revisions", revisionId, funnel.publishedRevisionId],
    queryFn: async () => (await apiRequest("GET", `/api/funnels/${funnel.id}/revisions/${revisionId}`)).json(), staleTime: 0 });
  const draft = useMemo(() => documentFromFunnel(funnel), [funnel]);
  const [selectedPage, setSelectedPage] = useState("");
  const before = revision.data?.content;
  const pages = Array.from(new Map([...(before?.pages ?? []), ...draft.pages].map(page => [page.id, page])).values());
  const pageId = pages.some(page => page.id === selectedPage) ? selectedPage : pages[0]?.id;
  if (revision.isLoading) return <p>Version wird geladen …</p>;
  if (revision.isError || !before) return <p role="alert">Version konnte nicht geladen werden. <Button variant="outline" onClick={() => revision.refetch()}>Erneut versuchen</Button></p>;
  const changes = compareDocuments(before, draft);
  return <section className="space-y-4" aria-label="Versionsvergleich" data-testid="revision-comparison">
    <p className="text-sm">{revisionId === "published" ? "Live-Stand" : `Version ${revision.data?.version}`} und aktueller Entwurf einschließlich ungespeicherter Änderungen.</p>
    <div className="max-h-36 overflow-y-auto border rounded p-3 text-sm">{changes.length ? <ul className="space-y-1">{changes.map((change, index) => <li key={index}>{({ added: "Hinzugefügt", removed: "Entfernt", changed: "Geändert" })[change.kind]}: {change.label}</li>)}</ul> : <p>Keine Inhaltsänderungen.</p>}</div>
    <label className="block text-sm">Seite vergleichen<select className="block w-full border rounded bg-background p-2 mt-1" value={pageId} onChange={event => setSelectedPage(event.target.value)}>{pages.map(page => <option key={page.id} value={page.id}>{page.title}</option>)}</select></label>
    <p className="text-xs text-muted-foreground">Statische Vorschau ohne Absenden oder Tracking. Persönliche Texte verwenden Ersatzwerte. Die Vorschau zeigt die Basisinhalte; A/B-Änderungen stehen in der Änderungsliste.</p>
    <div className="grid md:grid-cols-2 gap-4">{[{ label: revisionId === "published" ? "Live-Stand" : `Version ${revision.data?.version}`, document: before }, { label: "Aktueller Entwurf", document: draft }].map(({ label, document }) => {
      const page = document.pages.find(page => page.id === pageId);
      return <div key={label} className="min-w-0"><h3 className="font-medium text-sm mb-2">{label}</h3><div className="h-[420px] overflow-auto border rounded bg-muted" data-testid={label === "Aktueller Entwurf" ? "comparison-draft" : "comparison-before"}>
        {page ? <div ref={node => node?.setAttribute("inert", "")}><FunnelRenderer key={`${revision.data?.id}:${pageId}:${label}`} mode="preview" initialPageId={pageId} funnel={{ ...document, documentVersion: document.version, pages: document.pages.map(page => ({ ...page, hidden: false })) }} className="min-h-[400px]" /></div> : <p className="p-4 text-sm">Diese Seite ist in diesem Stand nicht enthalten.</p>}
      </div></div>;
    })}</div>
  </section>;
}
