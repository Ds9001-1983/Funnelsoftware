import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, XCircle, Loader2, Trash2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { AiCredentialStatus } from "@shared/schema";

const PROVIDERS = [
  { value: "anthropic", label: "Anthropic (Claude)", modelHint: "z. B. claude-3-5-sonnet-latest" },
  { value: "openai", label: "OpenAI (GPT)", modelHint: "z. B. gpt-4o" },
  { value: "openai-compatible", label: "OpenAI-kompatibel (eigener Endpoint)", modelHint: "Modellname deines Anbieters" },
];

/**
 * „KI verbinden" (Bring-Your-Own-Key): Der Kunde hinterlegt seinen eigenen
 * Provider + API-Key. Der Key wird serverseitig verschlüsselt gespeichert und
 * nie wieder an den Client zurückgegeben (nur die letzten 4 Zeichen).
 */
export function AiConnectionSettings() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: status, isLoading } = useQuery<AiCredentialStatus>({
    queryKey: ["/api/ai/credentials"],
    queryFn: async () => {
      const res = await fetch("/api/ai/credentials", { credentials: "include" });
      if (!res.ok) throw new Error("Status konnte nicht geladen werden");
      return res.json();
    },
  });

  const [provider, setProvider] = useState("anthropic");
  const [model, setModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [testResult, setTestResult] = useState<null | { ok: boolean; msg: string }>(null);

  useEffect(() => {
    if (status?.configured) {
      if (status.provider) setProvider(status.provider);
      if (status.model) setModel(status.model);
      if (status.baseUrl) setBaseUrl(status.baseUrl);
    }
  }, [status]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = { provider, model, apiKey };
      if (provider === "openai-compatible") body.baseUrl = baseUrl;
      const res = await apiRequest("PUT", "/api/ai/credentials", body);
      return res.json();
    },
    onSuccess: () => {
      setApiKey("");
      setTestResult(null);
      qc.invalidateQueries({ queryKey: ["/api/ai/credentials"] });
      toast({ title: "KI verbunden", description: "Deine Zugangsdaten wurden verschlüsselt gespeichert." });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Speichern fehlgeschlagen", description: e?.message || "Bitte Eingaben prüfen." }),
  });

  const testMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/test-key");
      return res.json();
    },
    onSuccess: () => {
      setTestResult({ ok: true, msg: "Verbindung erfolgreich" });
      qc.invalidateQueries({ queryKey: ["/api/ai/credentials"] });
    },
    onError: (e: any) => setTestResult({ ok: false, msg: e?.message || "Test fehlgeschlagen" }),
  });

  const delMut = useMutation({
    mutationFn: async () => { await apiRequest("DELETE", "/api/ai/credentials"); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/ai/credentials"] });
      setModel(""); setBaseUrl(""); setApiKey(""); setTestResult(null);
      toast({ title: "KI-Verbindung entfernt" });
    },
  });

  const activeProvider = PROVIDERS.find((p) => p.value === provider);
  const canSave = apiKey.trim().length >= 20 && model.trim().length > 0 && (provider !== "openai-compatible" || baseUrl.startsWith("https://"));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          KI verbinden (dein eigener Anbieter)
        </CardTitle>
        <CardDescription>
          Schließe deine eigene KI an, um Funnels aus einer Beschreibung generieren zu lassen.
          Du nutzt deinen eigenen API-Key — es entstehen keine KI-Kosten über Trichterwerk.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Lädt…</p>
        ) : (
          <>
            {status?.configured && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
                <Badge variant="secondary">Verbunden</Badge>
                <span className="text-muted-foreground">
                  {PROVIDERS.find((p) => p.value === status.provider)?.label ?? status.provider} · {status.model} · Key …{status.keyLast4}
                </span>
                {status.testedAt ? (
                  <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> getestet</span>
                ) : (
                  <span className="text-amber-600">noch nicht getestet</span>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Anbieter</Label>
              <Select value={provider} onValueChange={(v) => { setProvider(v); setTestResult(null); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (<SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            {provider === "openai-compatible" && (
              <div className="space-y-2">
                <Label htmlFor="ai-baseurl">Base-URL</Label>
                <Input id="ai-baseurl" placeholder="https://api.dein-anbieter.de/v1" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="ai-model">Modell</Label>
              <Input id="ai-model" placeholder={activeProvider?.modelHint} value={model} onChange={(e) => setModel(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-key">API-Key {status?.configured && <span className="text-xs text-muted-foreground">(zum Ändern erneut eingeben)</span>}</Label>
              <Input id="ai-key" type="password" autoComplete="off" placeholder={status?.configured ? `…${status.keyLast4} gespeichert` : "sk-…"} value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            </div>

            {testResult && (
              <div className={`flex items-center gap-2 text-sm ${testResult.ok ? "text-emerald-600" : "text-red-600"}`}>
                {testResult.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {testResult.msg}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => saveMut.mutate()} disabled={!canSave || saveMut.isPending}>
                {saveMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Speichern
              </Button>
              <Button variant="outline" onClick={() => testMut.mutate()} disabled={!status?.configured || testMut.isPending}>
                {testMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Verbindung testen
              </Button>
              {status?.configured && (
                <Button variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => delMut.mutate()} disabled={delMut.isPending}>
                  <Trash2 className="h-4 w-4 mr-2" /> Entfernen
                </Button>
              )}
            </div>

            <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <span>
                Dein Key wird verschlüsselt gespeichert und nie im Klartext angezeigt. Bei der
                Funnel-Generierung wird deine Beschreibung an den von dir gewählten Anbieter
                ({activeProvider?.label}) übertragen — die Verantwortung für diesen Vertrag liegt bei dir (BYOK).
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
