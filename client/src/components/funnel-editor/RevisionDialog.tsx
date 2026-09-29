import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import type { FunnelRevisionSummary } from "@shared/funnel-document";

export function RevisionDialog({ open, onOpenChange, funnelId, onRestore }: {
  open: boolean; onOpenChange: (open: boolean) => void; funnelId: number; onRestore: (id: number) => Promise<unknown>;
}) {
  const [selected, setSelected] = useState<FunnelRevisionSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const revisions = useInfiniteQuery({
    queryKey: ["/api/funnels", String(funnelId), "revisions"], enabled: open,
    initialPageParam: undefined as number | undefined,
    queryFn: async ({ pageParam }): Promise<FunnelRevisionSummary[]> => (await apiRequest("GET", `/api/funnels/${funnelId}/revisions${pageParam === undefined ? "" : `?before=${pageParam}`}`)).json(),
    getNextPageParam: (last: FunnelRevisionSummary[]) => last.length === 100 ? last[last.length - 1].version : undefined,
  });
  return <Dialog open={open} onOpenChange={next => { if (!busy) { setSelected(null); onOpenChange(next); } }}>
    <DialogContent className="max-w-xl" onEscapeKeyDown={event => { if (busy) event.preventDefault(); }} onPointerDownOutside={event => { if (busy) event.preventDefault(); }}>
      <DialogHeader><DialogTitle>Gespeicherte Versionen</DialogTitle><DialogDescription>
        Eine frühere Version wird als neuer Entwurf wiederhergestellt. Dein aktueller Entwurf wird vorher gesichert. Neue Bewerbungen und der Live-Stand bleiben erhalten.
      </DialogDescription></DialogHeader>
      {selected ? <div className="space-y-4">
        <p>Version {selected.version} vom {new Date(selected.createdAt).toLocaleString("de-DE")} wiederherstellen? Enthaltene A/B-Tests werden im Entwurf pausiert.</p>
        <div className="flex gap-2 justify-end"><Button variant="outline" disabled={busy} onClick={() => setSelected(null)}>Abbrechen</Button>
          <Button disabled={busy} onClick={async () => {
            setBusy(true);
            try { await onRestore(selected.id); setSelected(null); onOpenChange(false); }
            catch { /* editor displays a recoverable error */ }
            finally { setBusy(false); }
          }}>{busy ? "Wird wiederhergestellt …" : "Als Entwurf wiederherstellen"}</Button></div>
      </div> : <div className="max-h-[55vh] overflow-y-auto space-y-2">
        {revisions.isLoading && <p>Versionen werden geladen …</p>}
        {revisions.isError && <p>Versionen konnten nicht geladen werden. <Button variant="ghost" onClick={() => revisions.refetch()}>Erneut versuchen</Button></p>}
        {revisions.data?.pages.flat().map(revision => <div key={revision.id} className="flex items-center gap-3 border rounded-lg p-3">
          <div className="flex-1 min-w-0"><p className="text-sm font-medium">Version {revision.version}{revision.published ? " · Live" : ""}</p>
            <p className="text-xs text-muted-foreground">{new Date(revision.createdAt).toLocaleString("de-DE")} · {{ initial: "Ausgangsstand", draft: "Entwurf", publish: "Veröffentlicht", restore: "Wiederhergestellt" }[revision.action] ?? "Gespeichert"}</p></div>
          <Button variant="outline" size="sm" onClick={() => setSelected(revision)}>Wiederherstellen</Button>
        </div>)}
        {revisions.hasNextPage && <Button variant="outline" disabled={revisions.isFetchingNextPage} onClick={() => revisions.fetchNextPage()}>Ältere Versionen laden</Button>}
      </div>}
    </DialogContent>
  </Dialog>;
}
