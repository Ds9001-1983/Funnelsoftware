import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Trash2, ShieldCheck, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

/**
 * Owner-driven export and erasure across the owner's funnels. The download
 * contains application records for review, not an automatically sent reply.
 */
export function GdprRequestDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<null | "export" | "erase">(null);
  const validEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  const handleExport = async () => {
    setBusy("export");
    try {
      const res = await apiRequest("POST", "/api/leads/gdpr-export", { email: email.trim() });
      const text = await res.text();
      const data: { count: number; exportedAt: string; recruiting: { stageEvents: unknown[]; mailJobs: unknown[] } } = JSON.parse(text);
      const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `betroffenenauskunft-${data.exportedAt.slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Export erstellt", description: `${data.count} Leads, ${data.recruiting.stageEvents.length} Statusänderungen und ${data.recruiting.mailJobs.length} gespeicherte Mails heruntergeladen.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Export fehlgeschlagen", description: error instanceof Error ? error.message : "Bitte erneut versuchen." });
    } finally {
      setBusy(null);
    }
  };

  const handleErase = async () => {
    if (!window.confirm(`Wirklich ALLE Lead-Daten zu „${email.trim()}" endgültig löschen? Der Auftrag kann nicht zurückgenommen werden. Die Ausführung wartet auf die bestätigte Sicherung des Löschauftrags.`)) return;
    setBusy("erase");
    try {
      const res = await apiRequest("POST", "/api/leads/gdpr-erasure", { email: email.trim() });
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast(res.status === 202
        ? { title: "Löschung beauftragt", description: `${data.queuedCount} Datensatz/Datensätze warten auf die gesicherte Ausführung. Der Auftrag ist verbindlich.` }
        : { title: "Löschung ausgeführt", description: `${data.deletedCount} Datensatz/Datensätze zu ${email.trim()} gelöscht.` });
      onOpenChange(false);
      setEmail("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Löschung fehlgeschlagen", description: e?.message || "Bitte erneut versuchen." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> DSGVO-Betroffenenanfrage
          </DialogTitle>
          <DialogDescription>
            E-Mail der betroffenen Person eingeben. Die Suche umfasst deine Funnels einschließlich gelöschter Funnels.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="gdpr-email">E-Mail der Person</Label>
          <Input
            id="gdpr-email"
            type="email"
            placeholder="person@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground leading-relaxed">
          <strong>Exportieren:</strong> lädt passende Leads mit Antworten, Bewerbungsverläufen und gespeicherten Recruiting-Mails als JSON herunter. Auch frühere Mail-Empfänger werden durchsucht.
          <br />
          <strong>Daten löschen:</strong> beauftragt die endgültige Löschung der Leads mit dieser aktuell gespeicherten E-Mail-Adresse einschließlich ihrer Verläufe und Mailjobs. Der Auftrag ist verbindlich und wird nach bestätigter Sicherung automatisch ausgeführt. Bereits versandte Kopien bleiben gesondert zu bearbeiten.
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed">
          Prüfe vor einer Weitergabe die Identität, den Umfang der Anfrage und Angaben über andere Personen.
          Weitere E-Mail-Adressen, Support-Anhänge, Postfächer, Integrationen und Sicherungskopien sind gesondert zu prüfen.
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleExport} disabled={!validEmail || busy !== null}>
            {busy === "export" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Exportieren
          </Button>
          <Button variant="destructive" onClick={handleErase} disabled={!validEmail || busy !== null}>
            {busy === "erase" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Daten löschen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
