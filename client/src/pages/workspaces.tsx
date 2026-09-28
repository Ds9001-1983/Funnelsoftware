import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WorkspaceSummary, WorkspaceInvitation, WorkspaceFunnel, WorkspaceMember, WorkspaceInviteResponse } from "@shared/workspace-contract";
import type { Funnel } from "@shared/schema";
import { RecruitingBoard } from "@/components/recruiting/RecruitingBoard";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDocumentTitle } from "@/hooks/use-document-title";

async function get<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { credentials: "include", signal });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Die Daten konnten nicht geladen werden.");
  return data;
}
function AssignFunnels({ workspaceId, assigned, onClose }: { workspaceId: number; assigned: WorkspaceFunnel[]; onClose: () => void }) {
  const { user } = useAuth(); const cache = useQueryClient(); const { toast } = useToast();
  const [chosen, setChosen] = useState(assigned.map(funnel => funnel.id));
  const own = useQuery<Funnel[]>({ queryKey: ["workspace-own-funnels", user?.id], queryFn: ({ signal }) => get("/api/funnels", signal), gcTime: 0 });
  const save = useMutation({ mutationFn: async () => apiRequest("PUT", `/api/workspaces/${workspaceId}/funnels`, { funnelIds: chosen }), onSuccess: async () => { await cache.invalidateQueries({ queryKey: ["workspace", user?.id, workspaceId] }); onClose(); }, onError: (error: Error) => toast({ title: "Zuordnung nicht gespeichert", description: error.message, variant: "destructive" }) });
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent><DialogHeader><DialogTitle>Funnels zuordnen</DialogTitle><DialogDescription>Kunden in diesem Bereich können die Bewerbungen der ausgewählten Funnels sehen und deren Status ändern.</DialogDescription></DialogHeader>
    {own.isPending ? <p>Lade Funnels …</p> : own.isError ? <p role="alert">{own.error.message}</p> : <div className="space-y-3 max-h-80 overflow-y-auto">{own.data?.map(funnel => <label key={funnel.id} className="flex gap-2 items-center"><input type="checkbox" checked={chosen.includes(funnel.id)} onChange={e => setChosen(values => e.target.checked ? [...values, funnel.id] : values.filter(id => id !== funnel.id))} />{funnel.name}</label>)}{!own.data?.length && <p>Du hast noch keine Funnels angelegt.</p>}</div>}
    <p className="text-xs text-muted-foreground">Ein Funnel kann genau einem Kundenbereich zugeordnet sein. Das Entfernen einer Zuordnung löscht keine Bewerbungen.</p><Button disabled={save.isPending || own.isPending || own.isError} onClick={() => save.mutate()}>Zuordnung speichern</Button>
  </DialogContent></Dialog>;
}
function WorkspaceDetail({ id }: { id: number }) {
  const { user } = useAuth(); const { toast } = useToast(); const cache = useQueryClient(); const [, navigate] = useLocation();
  const scope = ["workspace", user?.id, id];
  const [funnelId, setFunnelId] = useState<number>(); const [assigning, setAssigning] = useState(false); const [email, setEmail] = useState(""); const [editingName, setEditingName] = useState(false); const [name, setName] = useState("");
  const workspace = useQuery<WorkspaceSummary>({ queryKey: [...scope, "details"], queryFn: ({ signal }) => get(`/api/workspaces/${id}`, signal), retry: false, gcTime: 0, refetchInterval: 15000 });
  const owner = workspace.data?.role === "owner";
  const funnels = useQuery<WorkspaceFunnel[]>({ queryKey: [...scope, "funnels"], queryFn: ({ signal }) => get(`/api/workspaces/${id}/funnels`, signal), enabled: !!workspace.data && !workspace.data.paused && !workspace.isError, retry: false, gcTime: 0, refetchInterval: 15000 });
  const members = useQuery<WorkspaceMember[]>({ queryKey: [...scope, "members"], queryFn: ({ signal }) => get(`/api/workspaces/${id}/members`, signal), enabled: owner && !workspace.isError, retry: false, gcTime: 0 });
  useEffect(() => () => { cache.removeQueries({ queryKey: ["workspace", user?.id, id] }); }, [cache, user?.id, id]);
  const report = (error: Error) => toast({ title: "Aktion nicht möglich", description: error.message, variant: "destructive" });
  const invite = useMutation({ mutationFn: async () => (await apiRequest("POST", `/api/workspaces/${id}/invitations`, { email })).json() as Promise<WorkspaceInviteResponse>, onSuccess: async data => { setEmail(""); await cache.invalidateQueries({ queryKey: [...scope, "members"] }); toast({ title: "Einladung angelegt", description: data.emailSent ? "Die Einladungsmail wurde versendet." : "Die E-Mail konnte nicht versendet werden. Die Person kann die Einladung nach Anmeldung unter Kundenbereiche annehmen." }); }, onError: report });
  const remove = useMutation({ mutationFn: async (memberId: number) => apiRequest("DELETE", `/api/workspaces/${id}/members/${memberId}`), onSuccess: () => cache.invalidateQueries({ queryKey: [...scope, "members"] }), onError: report });
  const rename = useMutation({ mutationFn: async () => apiRequest("PATCH", `/api/workspaces/${id}`, { name }), onSuccess: async () => { setEditingName(false); await cache.invalidateQueries({ queryKey: scope }); await cache.invalidateQueries({ queryKey: ["workspaces", user?.id] }); }, onError: report });
  const destroy = useMutation({ mutationFn: async () => apiRequest("DELETE", `/api/workspaces/${id}`), onSuccess: async () => { cache.removeQueries({ queryKey: scope }); await cache.invalidateQueries({ queryKey: ["workspaces", user?.id] }); navigate("/workspaces"); }, onError: report });
  if (workspace.isPending) return <p role="status">Kundenbereich wird geladen …</p>;
  if (workspace.isError || !workspace.data) return <div role="alert" className="space-y-3"><p>{workspace.error?.message || "Kundenbereich nicht gefunden"}</p><Link href="/workspaces">Zur Übersicht</Link></div>;
  const data = workspace.data;
  const selected = funnels.data?.find(funnel => funnel.id === funnelId) ?? funnels.data?.[0];
  return <div className="space-y-6"><Link href="/workspaces" className="text-sm underline">Alle Kundenbereiche</Link><div className="flex justify-between items-center gap-3 flex-wrap"><div><h1 className="text-2xl font-bold">{data.name}</h1><Badge variant="secondary">{owner ? "Von dir verwaltet" : "Kundenzugang"}</Badge></div>{owner && <div className="flex gap-2"><Button variant="outline" disabled={!data.canManage} onClick={() => { setName(data.name); setEditingName(true); }}>Umbenennen</Button><Button variant="outline" disabled={!data.canManage || !funnels.data || funnels.isError} onClick={() => setAssigning(true)}>Funnels zuordnen</Button></div>}</div>
    {data.paused ? <p role="status" className="border rounded p-4">Dieser Kundenbereich ist pausiert. Der Betreiber benötigt einen aktiven Pro-Plan. Deine eigenen Bewerbungen bleiben in der Lead-Verwaltung erhalten.</p> : funnels.isPending ? <p>Lade zugeordnete Funnels …</p> : funnels.isError ? <p role="alert">{funnels.error.message}</p> : selected ? <><div className="space-y-2"><Label htmlFor="workspace-funnel">Funnel</Label><select id="workspace-funnel" className="border rounded p-2 w-full sm:w-80 bg-background" value={selected.id} onChange={e => setFunnelId(Number(e.target.value))}>{funnels.data?.map(funnel => <option key={funnel.id} value={funnel.id}>{funnel.name}</option>)}</select></div><RecruitingBoard funnelId={selected.id} workspaceId={id} /></> : <p className="border rounded p-6 text-muted-foreground">Diesem Kundenbereich sind noch keine Funnels zugeordnet.</p>}
    {owner && <Card><CardHeader><CardTitle>Kundenzugänge</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Eingeladene Personen sehen die zugeordneten Bewerbungen und dürfen ihren Status ändern. Sie erhalten keinen Zugriff auf Editor, Abrechnung oder andere Kundenbereiche.</p><form className="flex gap-2 flex-wrap" onSubmit={e => { e.preventDefault(); invite.mutate(); }}><Input type="email" placeholder="kunde@firma.de" aria-label="E-Mail für Kundeneinladung" value={email} onChange={e => setEmail(e.target.value)} required className="flex-1 min-w-48" /><Button disabled={!data.canManage || invite.isPending}>Einladen</Button></form>
      {members.isError && <p role="alert">{members.error.message}</p>}{members.data?.map(member => <div key={member.id} className="flex gap-2 justify-between items-center border rounded p-3"><div className="min-w-0"><p className="truncate">{member.displayName || member.invitedEmail}</p><p className="text-xs text-muted-foreground">{member.acceptedAt ? "Zugang aktiv" : "Annahme ausstehend"}</p></div><Button variant="outline" size="sm" disabled={remove.isPending} onClick={() => { if (window.confirm("Zugang dieser Person entziehen? Die Bewerbungen bleiben erhalten.")) remove.mutate(member.id); }}>Zugang entziehen</Button></div>)}
      <Button variant="ghost" className="text-destructive" disabled={destroy.isPending} onClick={() => { if (window.confirm("Kundenbereich und seine Freigaben löschen? Funnels und Bewerbungen bleiben erhalten.")) destroy.mutate(); }}>Kundenbereich löschen</Button>
    </CardContent></Card>}
    {assigning && <AssignFunnels workspaceId={id} assigned={funnels.data ?? []} onClose={() => setAssigning(false)} />}
    <Dialog open={editingName} onOpenChange={setEditingName}><DialogContent><DialogHeader><DialogTitle>Kundenbereich umbenennen</DialogTitle><DialogDescription>Der Name ist für eingeladene Kunden sichtbar.</DialogDescription></DialogHeader><Input aria-label="Name des Kundenbereichs" value={name} maxLength={100} onChange={e => setName(e.target.value)} /><Button disabled={!name.trim() || rename.isPending} onClick={() => rename.mutate()}>Name speichern</Button></DialogContent></Dialog>
  </div>;
}
export default function WorkspacesPage() {
  useDocumentTitle("Kundenbereiche"); const { user } = useAuth(); const [, params] = useRoute("/workspaces/:id"); const [, navigate] = useLocation(); const { toast } = useToast(); const cache = useQueryClient(); const [name, setName] = useState("");
  const key = ["workspaces", user?.id];
  const list = useQuery<WorkspaceSummary[]>({ queryKey: key, queryFn: ({ signal }) => get("/api/workspaces", signal), retry: false, gcTime: 0 });
  const invitations = useQuery<WorkspaceInvitation[]>({ queryKey: ["workspace-invitations", user?.id], queryFn: ({ signal }) => get("/api/workspace-invitations", signal), retry: false, gcTime: 0 });
  const create = useMutation({ mutationFn: async () => (await apiRequest("POST", "/api/workspaces", { name })).json() as Promise<WorkspaceSummary>, onSuccess: async data => { setName(""); await cache.invalidateQueries({ queryKey: key }); navigate(`/workspaces/${data.id}`); }, onError: (error: Error) => toast({ title: "Kundenbereich nicht angelegt", description: error.message, variant: "destructive" }) });
  const accept = useMutation({ mutationFn: async (id: number) => apiRequest("POST", `/api/workspace-invitations/${id}/accept`, {}), onSuccess: async () => { await cache.invalidateQueries({ queryKey: ["workspace-invitations", user?.id] }); await cache.invalidateQueries({ queryKey: key }); }, onError: (error: Error) => toast({ title: "Einladung nicht angenommen", description: error.message, variant: "destructive" }) });
  const id = params?.id ? Number(params.id) : undefined;
  return <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">{id !== undefined ? <WorkspaceDetail key={`${user?.id}-${id}`} id={id} /> : <>
    <div><h1 className="text-2xl font-bold">Kundenbereiche</h1><p className="text-muted-foreground">Funnels und Bewerbungen getrennt mit deinen Kunden bearbeiten.</p></div>
    {invitations.isError && <p role="alert">{invitations.error.message}</p>}{invitations.data?.map(invitation => <Card key={invitation.id}><CardContent className="p-4 flex gap-3 justify-between items-center"><div><p className="font-medium">Einladung: {invitation.workspaceName}</p><p className="text-sm text-muted-foreground">Du erhältst Zugriff auf die Bewerbungen dieses Kundenbereichs.</p></div><Button disabled={accept.isPending} onClick={() => accept.mutate(invitation.id)}>Einladung annehmen</Button></CardContent></Card>)}
    <Card><CardHeader><CardTitle>Kundenbereich anlegen</CardTitle></CardHeader><CardContent><form className="flex gap-2 flex-wrap" onSubmit={e => { e.preventDefault(); create.mutate(); }}><Input aria-label="Name des neuen Kundenbereichs" placeholder="Zum Beispiel: Musterfirma" value={name} maxLength={100} onChange={e => setName(e.target.value)} className="flex-1 min-w-48" required /><Button disabled={create.isPending || user?.plan === "free"}>Kundenbereich anlegen</Button></form><p className="text-xs text-muted-foreground mt-2">Für eigene Kundenbereiche brauchst du Pro. Eingeladene Kunden benötigen kein eigenes Pro-Abo.</p></CardContent></Card>
    {list.isPending ? <p role="status">Lade Kundenbereiche …</p> : list.isError ? <p role="alert">{list.error.message}</p> : <div className="grid md:grid-cols-2 gap-4">{list.data?.map(workspace => <Link key={workspace.id} href={`/workspaces/${workspace.id}`}><Card className="h-full hover:border-primary"><CardHeader><CardTitle>{workspace.name}</CardTitle></CardHeader><CardContent><Badge variant="secondary">{workspace.role === "owner" ? "Von dir verwaltet" : "Kundenzugang"}</Badge>{workspace.paused && <p className="text-sm mt-2 text-muted-foreground">Pausiert</p>}</CardContent></Card></Link>)}{!list.data?.length && <p className="text-muted-foreground">Du hast noch keine Kundenbereiche.</p>}</div>}
  </>}</div>;
}
