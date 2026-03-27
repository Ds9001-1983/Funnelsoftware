import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Zap, Rocket, Layout, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface WelcomeModalProps {
  hasFunnels: boolean;
  userName?: string | null;
}

export function WelcomeModal({ hasFunnels, userName }: WelcomeModalProps) {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (hasFunnels) return;
    const completed = localStorage.getItem("onboarding-completed");
    if (!completed) {
      setOpen(true);
    }
  }, [hasFunnels]);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem("onboarding-completed", "true");
  };

  const handleStartTemplate = () => {
    handleClose();
    setLocation("/funnels/new");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl">
            Willkommen{userName ? `, ${userName}` : ""}!
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Deine 14-Tage-Testphase hat begonnen. Erstelle deinen ersten Funnel
            und sammle Leads in wenigen Minuten.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 mt-4">
          <button
            onClick={handleStartTemplate}
            className="flex items-center gap-4 p-4 rounded-xl border-2 border-transparent hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
          >
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="font-semibold">Mit Template starten</div>
              <div className="text-sm text-muted-foreground">
                Wähle aus 10 professionellen Vorlagen
              </div>
            </div>
          </button>

          <button
            onClick={handleStartTemplate}
            className="flex items-center gap-4 p-4 rounded-xl border-2 border-transparent hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
          >
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <Layout className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="font-semibold">Leeren Funnel erstellen</div>
              <div className="text-sm text-muted-foreground">
                Starte mit einem leeren Canvas
              </div>
            </div>
          </button>

          <button
            onClick={handleClose}
            className="flex items-center gap-4 p-4 rounded-xl border-2 border-transparent hover:border-muted hover:bg-muted/50 transition-all text-left group"
          >
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Eye className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <div className="font-semibold text-muted-foreground">Erst mal umschauen</div>
              <div className="text-sm text-muted-foreground">
                Erkunde das Dashboard in deinem Tempo
              </div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
