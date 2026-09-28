import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { GripVertical, Lock, Mail, Settings2, RefreshCw, Users } from "lucide-react";
import type { PipelineStage, RecruitingBoard as BoardData, RecruitingHistoryEntry, RecruitingLead } from "@shared/recruiting-contract";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { RecruitingSettings } from "./RecruitingSettings";

export interface RecruitingBoardProps { funnelId: number; workspaceId?: number }
const statusLabels = { pending: "Geplant", processing: "In Bearbeitung", sent: "Vom Maildienst angenommen", failed: "Fehlgeschlagen", uncertain: "Versand unklar", cancelled: "Verworfen" };
const dateLabel = (value: string | Date) => new Date(value).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });

function LeadCard({ lead, stages, disabled, open, move }: {
  lead: RecruitingLead; stages: PipelineStage[]; disabled: boolean;
  open: () => void; move: (stageId: string) => void;
}) {
  const locked = !!lead.locked;
  const drag = useDraggable({ id: `lead-${lead.id}`, data: { lead }, disabled: disabled || locked });
  return <Card ref={drag.setNodeRef} data-bug-mask data-testid={`recruiting-lead-${lead.id}`} className={drag.isDragging ? "opacity-40" : ""}>
    <CardContent className="p-3 space-y-3">
      <div className="flex items-start gap-2">
        <button type="button" ref={drag.setActivatorNodeRef} {...drag.listeners} {...drag.attributes}
          disabled={disabled || locked} aria-label="Bewerbung ziehen" className="touch-none text-muted-foreground disabled:opacity-30 pt-1">
          <GripVertical className="h-4 w-4" />
        </button>
        <button type="button" onClick={open} disabled={locked} className="min-w-0 flex-1 text-left space-y-1 disabled:cursor-default">
          <p className="font-medium text-sm truncate">{locked ? "Geschützte Bewerbung" : lead.name || lead.email || "Bewerbung ohne Namen"}</p>
          {!locked && lead.email && <p className="text-xs text-muted-foreground truncate">{lead.email}</p>}
          <p className="text-xs text-muted-foreground">{dateLabel(lead.createdAt)}</p>
        </button>
        {locked && <Lock className="h-4 w-4 text-muted-foreground" aria-label="Geschützt" />}
      </div>
      {locked ? <p className="text-xs text-muted-foreground">Im aktuellen Tarif geschützt.</p> : <label className="block text-xs text-muted-foreground">
        Status ändern
        <select className="mt-1 w-full rounded-md border bg-background p-2 text-sm text-foreground" aria-label={`Status für ${lead.name || lead.email || "Bewerbung"}`}
          value={lead.stageId} disabled={disabled} onChange={e => move(e.target.value)}>
          {stages.map(stage => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
        </select>
      </label>}
    </CardContent>
  </Card>;
}

function StageColumn({ stage, leads, stages, disabled, open, move }: {
  stage: PipelineStage; leads: RecruitingLead[]; stages: PipelineStage[]; disabled: boolean;
  open: (id: number) => void; move: (lead: RecruitingLead, stageId: string) => void;
}) {
  const drop = useDroppable({ id: stage.id, disabled });
  return <section ref={drop.setNodeRef} aria-label={stage.name} className={`w-72 shrink-0 rounded-xl border p-3 space-y-3 ${drop.isOver ? "bg-primary/10 border-primary" : "bg-muted/30"}`}>
    <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color }} /><h3 className="font-semibold text-sm flex-1 truncate">{stage.name}</h3><Badge variant="secondary">{leads.length}</Badge></div>
    {leads.map(lead => <LeadCard key={lead.id} lead={lead} stages={stages} disabled={disabled} open={() => open(lead.id)} move={stageId => move(lead, stageId)} />)}
    {!leads.length && <p className="text-xs text-muted-foreground py-5 text-center">Keine Bewerbungen</p>}
  </section>;
}

function LeadDetails({ lead, stages, workspaceId, userId, close }: { lead: RecruitingLead; stages: PipelineStage[]; workspaceId?: number; userId?: number; close: () => void }) {
  const suffix = workspaceId ? `?workspaceId=${workspaceId}` : "";
  const history = useQuery<RecruitingHistoryEntry[]>({
    queryKey: ["recruiting", userId, workspaceId ?? "owner", lead.funnelId, "history", lead.id],
    queryFn: async () => (await apiRequest("GET", `/api/recruiting/leads/${lead.id}/history${suffix}`)).json(),
    staleTime: 0, gcTime: 0, retry: false, refetchInterval: 10_000,
  });
  const stageName = (id?: string | null) => stages.find(stage => stage.id === id)?.name || id || "–";
  const answers = lead.answers && typeof lead.answers === "object" ? Object.entries(lead.answers) : [];
  return <Dialog open onOpenChange={value => { if (!value) close(); }}>
    <DialogContent data-bug-mask className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
      <DialogHeader><DialogTitle>{lead.name || "Bewerbung"}</DialogTitle><DialogDescription>Kontaktdaten, Antworten und Verlauf</DialogDescription></DialogHeader>
      {history.isError ? <p role="alert" className="text-destructive">Der Zugriff auf diese Bewerbung konnte nicht bestätigt werden. Bitte schließe die Ansicht und lade das Board neu.</p> : <>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">{[["E-Mail", lead.email], ["Telefon", lead.phone], ["Unternehmen", lead.company], ["Eingang", dateLabel(lead.createdAt)]].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="break-words">{value || "–"}</dd></div>)}</dl>
        {!!answers.length && <section className="space-y-3"><h3 className="font-semibold">Antworten</h3>{answers.map(([key, value]) => <div key={key} className="text-sm"><p className="text-muted-foreground break-words">{key}</p><p className="whitespace-pre-wrap break-words">{typeof value === "string" ? value : JSON.stringify(value)}</p></div>)}</section>}
        <section className="space-y-3"><h3 className="font-semibold">Verlauf und E-Mails</h3>
          {history.isPending && <p className="text-sm text-muted-foreground">Verlauf wird geladen …</p>}
          {history.data?.length === 0 && <p className="text-sm text-muted-foreground">Noch keine Statusänderungen oder E-Mails.</p>}
          {history.data?.map(entry => <div key={`${entry.kind}-${entry.id}`} className="border-l-2 pl-3 space-y-1 text-sm">
            <p>{entry.kind === "stage" ? `${stageName(entry.fromStageId)} → ${stageName(entry.toStageId)}` : entry.subject || "E-Mail"}</p>
            {entry.kind === "email" && entry.status && <p className="text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{statusLabels[entry.status]}{entry.attempts ? ` · ${entry.attempts} Versuch(e)` : ""}</p>}
            <p className="text-xs text-muted-foreground">{dateLabel(entry.createdAt)}{entry.actorName ? ` · ${entry.actorName}` : ""}</p>
          </div>)}
        </section>
      </>}
      <DialogFooter><Button variant="outline" onClick={close}>Schließen</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}

function BoardContent({ funnelId, workspaceId }: RecruitingBoardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const cache = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pendingMove, setPendingMove] = useState<{ lead: RecruitingLead; stageId: string } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dragging, setDragging] = useState<RecruitingLead | null>(null);
  const scope = ["recruiting", user?.id, workspaceId ?? "owner", funnelId] as const;
  const queryKey = [...scope, "board"];
  const suffix = workspaceId ? `?workspaceId=${workspaceId}` : "";
  const board = useQuery<BoardData>({
    queryKey,
    queryFn: async () => (await apiRequest("GET", `/api/recruiting/funnels/${funnelId}/board${suffix}`)).json(),
    staleTime: 0, gcTime: 0, retry: false, refetchInterval: 15_000,
  });
  useEffect(() => () => { cache.removeQueries({ queryKey: ["recruiting", user?.id, workspaceId ?? "owner", funnelId] }); }, [cache, user?.id, workspaceId, funnelId]);
  const mutation = useMutation({
    mutationFn: async ({ lead, stageId }: { lead: RecruitingLead; stageId: string }) => apiRequest("PATCH", `/api/recruiting/leads/${lead.id}/stage${suffix}`, { stageId, expectedVersion: lead.stageVersion }),
    onSuccess: async () => {
      setPendingMove(null);
      await cache.invalidateQueries({ queryKey: scope });
      await cache.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ title: "Status aktualisiert", description: "Aktivierte E-Mail-Regeln werden geprüft. Den Versandstatus findest du im Verlauf." });
    },
    onError: (error: Error) => {
      setPendingMove(null);
      void cache.invalidateQueries({ queryKey: scope });
      toast({ variant: "destructive", title: "Status nicht geändert", description: error.message });
    },
  });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const requestMove = (lead: RecruitingLead, stageId: string) => {
    if (lead.locked || !board.data?.canChangeStatus || mutation.isPending || lead.stageId === stageId) return;
    if (board.data.pipeline.stages.some(stage => stage.id === stageId)) setPendingMove({ lead, stageId });
  };
  const dragEnd = (event: DragEndEvent) => {
    setDragging(null);
    const lead = event.active.data.current?.lead as RecruitingLead | undefined;
    if (lead && event.over) requestMove(lead, String(event.over.id));
  };
  if (board.isPending) return <p role="status" className="py-8 text-muted-foreground">Bewerbungen werden geladen …</p>;
  if (board.isError || !board.data) return <div role="alert" className="rounded-lg border p-6 space-y-3"><p>{board.error?.message || "Das Board konnte nicht geladen werden."}</p><Button variant="outline" onClick={() => board.refetch()}>Erneut laden</Button></div>;
  const data = board.data;
  const selected = data.leads.find(lead => lead.id === selectedId && !lead.locked);
  return <div className="space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">{data.funnel.name}</h2><p className="text-sm text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" />{data.leads.length} Bewerbungen</p></div><div className="flex gap-2"><Button variant="outline" size="sm" disabled={board.isFetching} onClick={() => board.refetch()}><RefreshCw className="h-4 w-4 mr-2" />Aktualisieren</Button>{data.canConfigure && !workspaceId && <Button variant="outline" size="sm" onClick={() => setSettingsOpen(value => !value)}><Settings2 className="h-4 w-4 mr-2" />Board & E-Mails</Button>}</div></div>
    {settingsOpen && data.canConfigure && !workspaceId && <RecruitingSettings open={settingsOpen} onOpenChange={setSettingsOpen} funnelId={funnelId} funnelName={data.funnel.name} pipeline={data.pipeline} onSaved={() => cache.invalidateQueries({ queryKey: scope })} />}
    <p className="rounded-lg bg-muted p-3 text-sm">Statusänderungen können automatische E-Mails auslösen. Jede Änderung wird vor dem Speichern bestätigt; der Verlauf zeigt den Versandstatus.</p>
    {!data.canChangeStatus && <p className="text-sm text-muted-foreground">Du kannst dieses Board ansehen. Statusänderungen sind derzeit nicht verfügbar.</p>}
    <DndContext sensors={sensors} onDragStart={event => setDragging(event.active.data.current?.lead ?? null)} onDragCancel={() => setDragging(null)} onDragEnd={dragEnd}><div className="flex items-start gap-4 overflow-x-auto pb-4">{data.pipeline.stages.map(stage => <StageColumn key={stage.id} stage={stage} leads={data.leads.filter(lead => lead.stageId === stage.id)} stages={data.pipeline.stages} disabled={!data.canChangeStatus || mutation.isPending} open={setSelectedId} move={requestMove} />)}</div><DragOverlay>{dragging && <Card data-bug-mask className="p-4 shadow-xl border-primary"><p className="font-medium">{dragging.name || dragging.email || "Bewerbung"}</p></Card>}</DragOverlay></DndContext>
    {selected && <LeadDetails key={selected.id} lead={selected} stages={data.pipeline.stages} workspaceId={workspaceId} userId={user?.id} close={() => setSelectedId(null)} />}
    <AlertDialog open={!!pendingMove} onOpenChange={open => { if (!open && !mutation.isPending) setPendingMove(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Status ändern?</AlertDialogTitle><AlertDialogDescription>Die Bewerbung wird nach „{data.pipeline.stages.find(stage => stage.id === pendingMove?.stageId)?.name}“ verschoben. Eine dafür aktivierte automatische E-Mail kann danach nicht zurückgerufen werden.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={mutation.isPending}>Abbrechen</AlertDialogCancel><AlertDialogAction disabled={mutation.isPending} onClick={event => { event.preventDefault(); if (pendingMove) mutation.mutate(pendingMove); }}>{mutation.isPending ? "Wird gespeichert …" : "Status verbindlich ändern"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

export function RecruitingBoard(props: RecruitingBoardProps) {
  return <BoardContent key={`${props.workspaceId ?? "owner"}-${props.funnelId}`} {...props} />;
}
export default RecruitingBoard;
