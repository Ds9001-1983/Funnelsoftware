import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PipelineStage, RecruitingPipeline, RecruitingMailRule, MailRuleInput } from "@shared/recruiting-contract";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props { open: boolean; onOpenChange: (open: boolean) => void; funnelId: number; funnelName: string; pipeline: RecruitingPipeline; onSaved: () => unknown }
const legacyNames = { new: "Neu", contacted: "Kontaktiert", qualified: "Qualifiziert", converted: "Konvertiert", lost: "Verloren" };
const emptyRule = (): MailRuleInput => ({ expectedVersion: 0, trigger: "created", stageId: null, enabled: false, senderName: "Bewerbungsteam", subject: "Deine Bewerbung bei {{funnel}}", body: "Hallo {{name}},\n\nvielen Dank für deine Bewerbung. Wir haben deine Angaben erhalten und melden uns bei dir.\n\nViele Grüße\nDein Bewerbungsteam" });

export function RecruitingSettings({ open, onOpenChange, funnelId, funnelName, pipeline, onSaved }: Props) {
  const { user } = useAuth(); const { toast } = useToast(); const cache = useQueryClient();
  const [stages, setStages] = useState<PipelineStage[]>(pipeline.stages);
  const [version, setVersion] = useState(pipeline.version);
  const [ruleKey, setRuleKey] = useState("created");
  const [form, setForm] = useState<MailRuleInput>(emptyRule);
  const rulesKey = ["recruiting-rules", user?.id, funnelId];
  const rules = useQuery<{ rules: RecruitingMailRule[]; replyTo: string }>({ queryKey: rulesKey, enabled: open, queryFn: async () => (await apiRequest("GET", `/api/recruiting/funnels/${funnelId}/rules`)).json(), retry: false, gcTime: 0 });
  useEffect(() => {
    if (open) { setStages(pipeline.stages.map(s => ({ ...s }))); setVersion(pipeline.version); }
    // Ein beim Bearbeiten aktualisiertes Board darf den lokalen Entwurf nicht ersetzen.
  }, [open, funnelId]);
  useEffect(() => {
    const existing = rules.data?.rules.find(rule => rule.ruleKey === ruleKey);
    if (existing) {
      setForm({ expectedVersion: existing.version, trigger: existing.trigger, stageId: existing.stageId, enabled: existing.enabled, senderName: existing.senderName, subject: existing.subject, body: existing.body });
    } else setForm({ ...emptyRule(), ...(ruleKey === "created" ? {} : { trigger: "stage_entered" as const, stageId: ruleKey.slice(6), subject: "Deine Bewerbung bei {{funnel}}", body: "Hallo {{name}},\n\nhier erhältst du eine Nachricht zu deiner Bewerbung.\n\nViele Grüße\nDein Bewerbungsteam" }) });
  }, [ruleKey, rules.data]);
  const error = (err: Error) => toast({ title: "Änderung nicht gespeichert", description: err.message, variant: "destructive" });
  const savePipeline = useMutation({
    mutationFn: async () => (await apiRequest("PUT", `/api/recruiting/funnels/${funnelId}/pipeline`, { expectedVersion: version, stages })).json() as Promise<RecruitingPipeline>,
    onSuccess: data => { setVersion(data.version); setStages(data.stages); onSaved(); toast({ title: "Spalten gespeichert" }); }, onError: error,
  });
  const saveRule = useMutation({
    mutationFn: async () => (await apiRequest("PUT", `/api/recruiting/funnels/${funnelId}/rules`, form)).json() as Promise<RecruitingMailRule>,
    onSuccess: async () => { await cache.invalidateQueries({ queryKey: rulesKey }); onSaved(); toast({ title: "Mailregel gespeichert", description: "Sie gilt für neue Bewerbungen bzw. künftige Statuswechsel." }); }, onError: error,
  });
  const existing = rules.data?.rules.find(rule => rule.ruleKey === ruleKey);
  const testMail = useMutation({ mutationFn: async () => apiRequest("POST", `/api/recruiting/funnels/${funnelId}/test-mail`, { ruleId: existing?.id }), onSuccess: () => toast({ title: "Testmail an deine bestätigte Adresse gesendet" }), onError: error });
  function updateStage(index: number, update: Partial<PipelineStage>) { setStages(current => current.map((s, i) => i === index ? { ...s, ...update } : s)); }
  function move(index: number, offset: number) { setStages(current => { const next = [...current]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; return next; }); }

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Bewerberprozess einrichten</DialogTitle><DialogDescription>{funnelName}: Spalten und automatische Nachrichten verwalten.</DialogDescription></DialogHeader>
    <Tabs defaultValue="stages"><TabsList><TabsTrigger value="stages">Spalten</TabsTrigger><TabsTrigger value="emails">E-Mails</TabsTrigger></TabsList>
      <TabsContent value="stages" className="space-y-4">
        <p className="text-sm text-muted-foreground">Die erste Spalte nimmt neue Bewerbungen auf. Die Zuordnung für die Auswertung hält deine bisherige Lead-Statistik vergleichbar.</p>
        {stages.map((stage, index) => <fieldset key={stage.id} className="border rounded-lg p-3 space-y-3"><legend className="px-1 text-sm">Spalte {index + 1}</legend>
          <div className="flex gap-2"><Input aria-label={`Name der Spalte ${index + 1}`} value={stage.name} maxLength={60} onChange={e => updateStage(index, { name: e.target.value })} /><input type="color" aria-label={`Farbe der Spalte ${index + 1}`} value={stage.color} onChange={e => updateStage(index, { color: e.target.value })} className="h-10 w-12" /></div>
          <div className="flex gap-2 flex-wrap items-center"><label className="text-sm">Auswertung <select aria-label={`Auswertung der Spalte ${index + 1}`} disabled={index === 0} value={stage.legacyStatus} onChange={e => updateStage(index, { legacyStatus: e.target.value as PipelineStage["legacyStatus"] })} className="border rounded p-2 bg-background">{Object.entries(legacyNames).map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label>
            <Button variant="outline" size="sm" disabled={index < 2} onClick={() => move(index, -1)} aria-label={`${stage.name} nach vorne`}>↑</Button>
            <Button variant="outline" size="sm" disabled={index === 0 || index === stages.length - 1} onClick={() => move(index, 1)} aria-label={`${stage.name} nach hinten`}>↓</Button>
            <Button variant="ghost" size="sm" disabled={index === 0 || stages.length <= 2} onClick={() => setStages(current => current.filter(s => s.id !== stage.id))}>Entfernen</Button>
          </div>
        </fieldset>)}
        <div className="flex gap-2"><Button variant="outline" disabled={stages.length >= 20} onClick={() => setStages(current => [...current, { id: crypto.randomUUID(), name: "Neue Spalte", color: "#6366f1", legacyStatus: "contacted" }])}>Spalte hinzufügen</Button><Button disabled={savePipeline.isPending} onClick={() => savePipeline.mutate()}>{savePipeline.isPending ? "Speichert …" : "Spalten speichern"}</Button></div>
        <p className="text-xs text-muted-foreground">Spalten mit Bewerbern oder gespeicherten Mailregeln können nicht entfernt werden.</p>
      </TabsContent>
      <TabsContent value="emails" className="space-y-4">
        {rules.isPending ? <p>Lade Mailregeln …</p> : rules.isError ? <p role="alert">{rules.error.message}</p> : <>
          <div className="space-y-2"><Label htmlFor="mail-trigger">Auslöser</Label><select id="mail-trigger" className="w-full border rounded p-2 bg-background" value={ruleKey} onChange={e => setRuleKey(e.target.value)}><option value="created">Neue Bewerbung: Eingangsbestätigung</option>{pipeline.stages.map(stage => <option key={stage.id} value={`stage:${stage.id}`}>Wechsel zu „{stage.name}“</option>)}</select></div>
          <p className="text-sm text-muted-foreground">Versand über Trichterwerk. Antworten gehen an {rules.data?.replyTo}. Pro Bewerbung und Regel wird höchstens ein automatischer Versandauftrag erstellt.</p>
          <div className="space-y-2"><Label htmlFor="mail-sender">Angezeigter Absendername</Label><Input id="mail-sender" value={form.senderName} maxLength={80} onChange={e => setForm({ ...form, senderName: e.target.value })} /></div>
          <div className="space-y-2"><Label htmlFor="mail-subject">Betreff</Label><Input id="mail-subject" value={form.subject} maxLength={160} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
          <div className="space-y-2"><Label htmlFor="mail-body">Nachricht</Label><Textarea id="mail-body" rows={9} value={form.body} maxLength={10000} onChange={e => setForm({ ...form, body: e.target.value })} /><p className="text-xs text-muted-foreground">Platzhalter: {"{{name}}, {{company}}, {{funnel}}"}. Der Inhalt wird als Text versendet.</p></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} />Automatischen Versand aktivieren</label>
          <p className="text-xs text-muted-foreground">Das Aktivieren versendet keine Mails an vorhandene Bewerbungen. Bereits versendete Nachrichten können nicht zurückgerufen werden. Abschalten verwirft noch ausstehende Aufträge.</p>
          <div className="flex gap-2 flex-wrap"><Button disabled={saveRule.isPending} onClick={() => saveRule.mutate()}>Mailregel speichern</Button><Button variant="outline" disabled={!existing || testMail.isPending} onClick={() => testMail.mutate()}>Gespeicherte Vorlage an mich testen</Button></div>
        </>}
      </TabsContent>
    </Tabs>
  </DialogContent></Dialog>;
}
