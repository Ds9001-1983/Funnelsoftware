import { lazy, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { freeOffer } from "@shared/marketing-offer";

// Editor renderer and templates are loaded only after opening the preview.
const FreeFunnelContent = lazy(() => import("./FreeFunnelContent"));

export function FreePlanPreview() {
  const [open, setOpen] = useState(false);
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button variant="ghost" className="mt-3 h-auto whitespace-normal px-0 text-sm text-primary underline underline-offset-4">So sieht dein Free-Funnel aus</Button></DialogTrigger>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto p-4 sm:p-6" aria-describedby="free-preview-description">
      <DialogHeader>
        <DialogTitle className="pr-5">Dein Funnel im Free-Plan</DialogTitle>
        <DialogDescription id="free-preview-description">{freeOffer.allowance}. Die Trichterwerk-Adresse und das Badge sind enthalten.</DialogDescription>
      </DialogHeader>
      <div className="min-w-0 overflow-hidden rounded-xl border" data-testid="free-plan-preview">
        <div className="border-b bg-muted/40 px-3 py-2 text-xs"><span className="block text-muted-foreground">Beispieladresse</span><span className="break-all font-medium">trichterwerk.de/f/dein-beispiel</span></div>
        <div className="h-[min(48dvh,420px)]">
          {open && <Suspense fallback={<p role="status" className="p-6 text-sm">Vorschau wird geladen…</p>}><FreeFunnelContent /></Suspense>}
        </div>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">Interaktives Produktbeispiel: Deine Eingaben werden nicht als Leads gespeichert. Texte, Bilder und den letzten Teil deiner Funnel-Adresse legst du selbst fest. Eigene Domains und das Ausblenden des Badges sind mit Pro möglich.</p>
      <DialogClose asChild><Button variant="outline">Vorschau schließen</Button></DialogClose>
    </DialogContent>
  </Dialog>;
}
