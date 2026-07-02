import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Trash2, ShieldCheck, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

/**
 * DSGVO-Betroffenenanfrage: Der Funnel-Owner kann alle Lead-Daten zu einer
 * E-Mail exportieren (Art. 20) oder endgültig löschen (Art. 17) — über alle
 * seine Funnels hinweg.
 */
export function GdprRequestDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<null | "export" | "erase">(null);
  const validEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  const handleExport = async () => {
    setBusy("export");
    try {
      const res = await fetch(`/api/leads/gdpr-export?email=${encodeURIComponent(email.trim())}`, { credentials: "include" });
      if (!res.ok) throw new Error("Export fehlgeschlagen");
      const text = await res.text();
      const count = (() => { try { return JSON.parse(text)?.count ?? 0; } catch { return 0; } })();
      const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `dsgvo-export-${email.trim().replace(/[^a-z0-9._@-]/gi, "_")}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Export erstellt", description: `${count} Datensatz/Datensätze zu ${email.trim()} heruntergeladen.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Export fehlgeschlagen", description: e?.message || "Bitte erneut versuchen." });
    } finally {
      setBusy(null);
    }
  };

  const handleErase = async () => {
    if (!window.confirm(`Wirklich ALLE Lead-Daten zu „${email.trim()}" endgültig löschen? Das kann nicht rückgängig gemacht werden.`)) return;
    setBusy("erase");
    try {
      const res = await apiRequest("POST", "/api/leads/gdpr-erasure", { email: email.trim() });
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ title: "Löschung ausgeführt", description: `${data.deletedCount} Datensatz/Datensätze zu ${email.trim()} gelöscht.` });
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> DSGVO-Betroffenenanfrage
          </DialogTitle>
          <DialogDescription>
            E-Mail der betroffenen Person eingeben. Betrifft die Lead-Daten über alle deine Funnels.
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
          <strong>Exportieren (Art. 20):</strong> lädt alle gespeicherten Daten als JSON herunter.
          <br />
          <strong>Daten löschen (Art. 17):</strong> entfernt alle Lead-Datensätze dieser Person endgültig.
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
