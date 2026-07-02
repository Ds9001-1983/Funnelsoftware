import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe, Plus, Trash2, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { hostnameRegex, type PublicDomain } from "@shared/schema";

interface CustomDomainPanelProps {
  funnelId: number;
}

/**
 * UI-Bereich „Eigene Domain" in den Funnel-Einstellungen.
 * Perspective-UX: Der Kunde trägt nur einen CNAME auf trichterwerk.de ein
 * (Root-Domains: A-Record), verifiziert hier — das SSL-Zertifikat richtet
 * der Server danach automatisch ein (sslStatus: pending → active).
 */
export function CustomDomainPanel({ funnelId }: CustomDomainPanelProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [hostname, setHostname] = useState("");

  const { data: domains = [], isLoading } = useQuery<PublicDomain[]>({
    queryKey: ["/api/domains"],
    // Nur pollen, solange mindestens ein SSL-Setup läuft — sonst wäre das
    // Panel eine dauerhafte Request-Quelle in jedem offenen Editor.
    refetchInterval: (query) =>
      (query.state.data ?? []).some((d) => d.verified && d.sslStatus === "pending")
        ? 10_000
        : false,
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
      toast({ title: "Domain angelegt", description: "Jetzt CNAME-Record setzen und verifizieren." });
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
      toast({
        title: "Verifiziert ✓",
        description: "SSL-Zertifikat wird automatisch eingerichtet — dauert nur wenige Minuten.",
      });
    },
    onError: (err: { message?: string }) => {
      toast({
        title: "Verifikation fehlgeschlagen",
        description: err?.message || "DNS-Eintrag prüfen und erneut versuchen.",
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

  /** Status-Badge: Unverifiziert → SSL läuft → Aktiv / SSL-Fehler. */
  const statusBadge = (d: PublicDomain) => {
    if (!d.verified) {
      return <Badge variant="secondary">Unverifiziert</Badge>;
    }
    if (d.sslStatus === "active") {
      return (
        <Badge className="gap-1 bg-green-600 text-white hover:bg-green-600">
          <CheckCircle2 className="h-3 w-3" />
          Aktiv
        </Badge>
      );
    }
    if (d.sslStatus === "error") {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          SSL-Fehler
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        SSL wird eingerichtet
      </Badge>
    );
  };

  return (
    <div className="space-y-3 pt-2 border-t">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-primary" />
        <Label className="text-sm">Eigene Domain</Label>
      </div>
      <p className="text-xs text-muted-foreground">
        Statt <code>/f/&lt;uuid&gt;</code> kannst du eine eigene Domain (z. B. <code>funnel.deine-firma.de</code>) verbinden: CNAME auf <code>trichterwerk.de</code> zeigen lassen und hier verifizieren — das SSL-Zertifikat wird danach automatisch eingerichtet.
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
                  {statusBadge(d)}
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
                      <strong>Subdomain</strong> (empfohlen): CNAME-Record <code>{d.hostname}</code> → <code>trichterwerk.de</code>
                    </p>
                    <p>
                      <strong>Root-Domain</strong> (ohne Subdomain): A-Record → <code>116.203.40.49</code>
                    </p>
                    <p>DNS-Änderungen brauchen meist nur wenige Minuten, können aber bis zu 24 h dauern.</p>
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
              {d.verified && d.sslStatus === "pending" && (
                <p className="text-xs text-muted-foreground">
                  Das SSL-Zertifikat wird automatisch ausgestellt — in der Regel dauert das nur wenige Minuten.
                </p>
              )}
              {d.verified && d.sslStatus === "error" && (
                <>
                  <p className="text-xs text-muted-foreground">
                    Die SSL-Einrichtung ist fehlgeschlagen — meist zeigt der DNS-Eintrag (noch) nicht auf trichterwerk.de. Bitte prüfen und erneut verifizieren.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => verifyMutation.mutate(d.id)}
                    disabled={verifyMutation.isPending}
                    className="w-full"
                  >
                    Erneut prüfen
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
