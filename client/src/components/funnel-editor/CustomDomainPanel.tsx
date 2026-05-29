import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe, Plus, Trash2, CheckCircle2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { hostnameRegex, type Domain } from "@shared/schema";

interface CustomDomainPanelProps {
  funnelId: number;
}

/**
 * UI-Bereich „Eigene Domain" in den Funnel-Einstellungen.
 * Listet alle Domains des aktuellen Funnels, erlaubt Hinzufügen, TXT-Verifikation
 * und Löschen. Funktioniert mit dem `/api/domains`-Backend.
 */
export function CustomDomainPanel({ funnelId }: CustomDomainPanelProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [hostname, setHostname] = useState("");

  const { data: domains = [], isLoading } = useQuery<Domain[]>({
    queryKey: ["/api/domains"],
  });

  const forFunnel = domains.filter((d) => d.funnelId === funnelId);

  // Frontend-Validierung: gleiche Regel wie das Server-Zod-Schema.
  const normalizedHost = hostname.trim().toLowerCase();
  const isValidHost = hostnameRegex.test(normalizedHost);
  const showHostError = hostname.trim().length > 0 && !isValidHost;

  const createMutation = useMutation({
    mutationFn: async (host: string) => {
      const res = await apiRequest("POST", "/api/domains", { funnelId, hostname: host });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/domains"] });
      setHostname("");
      toast({ title: "Domain angelegt", description: "Jetzt TXT-Record setzen und verifizieren." });
    },
    onError: (err: { message?: string }) => {
      toast({
        title: "Fehler",
        description: err?.message || "Domain konnte nicht angelegt werden.",
        variant: "destructive",
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/domains/${id}/verify`);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/domains"] });
      toast({ title: "Verifiziert ✓", description: "Domain ist jetzt aktiv." });
    },
    onError: (err: { message?: string }) => {
      toast({
        title: "Verifikation fehlgeschlagen",
        description: err?.message || "DNS-TXT-Eintrag prüfen und erneut versuchen.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/domains/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/domains"] });
      toast({ title: "Domain entfernt" });
    },
    onError: () =>
      toast({ title: "Fehler", description: "Domain konnte nicht entfernt werden.", variant: "destructive" }),
  });

  const copy = (txt: string) => {
    navigator.clipboard?.writeText(txt).catch(() => {});
    toast({ title: "In Zwischenablage kopiert" });
  };

  return (
    <div className="space-y-3 pt-2 border-t">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-primary" />
        <Label className="text-sm">Eigene Domain</Label>
      </div>
      <p className="text-xs text-muted-foreground">
        Statt <code>/f/&lt;uuid&gt;</code> kannst du eine eigene Domain (z. B. <code>funnel.deine-firma.de</code>) verbinden. Ablauf: CNAME auf <code>trichterwerk.de</code> zeigen, TXT-Verifikation setzen, hier verifizieren.
      </p>

      <div className="flex gap-2">
        <Input
          value={hostname}
          onChange={(e) => setHostname(e.target.value)}
          placeholder="funnel.deine-firma.de"
          className="text-sm"
          disabled={createMutation.isPending}
          aria-invalid={showHostError}
        />
        <Button
          size="sm"
          onClick={() => createMutation.mutate(normalizedHost)}
          disabled={!isValidHost || createMutation.isPending}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Hinzufügen
        </Button>
      </div>
      {showHostError && (
        <p className="text-xs text-destructive">
          Bitte einen gültigen Hostnamen eingeben (z. B. <code>funnel.deine-firma.de</code>) — ohne <code>https://</code> oder Pfad.
        </p>
      )}

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Lade Domains…</p>
      ) : forFunnel.length === 0 ? (
        <p className="text-xs text-muted-foreground">Noch keine Domain für diesen Funnel.</p>
      ) : (
        <div className="space-y-2">
          {forFunnel.map((d) => (
            <div key={d.id} className="rounded-md border p-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium truncate">{d.hostname}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {d.verified ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Verifiziert
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Unverifiziert</Badge>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    aria-label="Domain entfernen"
                    onClick={() => deleteMutation.mutate(d.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {!d.verified && (
                <>
                  <div className="text-xs text-muted-foreground space-y-1.5">
                    <p>
                      <strong>1.</strong> CNAME-Record setzen: <code>{d.hostname}</code> → <code>trichterwerk.de</code>
                    </p>
                    <p>
                      <strong>2.</strong> TXT-Record auf <code>_trichterwerk-verify.{d.hostname}</code> mit Wert:
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted px-2 py-1.5 rounded text-xs break-all">
                      {d.verificationToken}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      aria-label="Token kopieren"
                      onClick={() => copy(d.verificationToken)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => verifyMutation.mutate(d.id)}
                    disabled={verifyMutation.isPending}
                    className="w-full"
                  >
                    Jetzt verifizieren
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
