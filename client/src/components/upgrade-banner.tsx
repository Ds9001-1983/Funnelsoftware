import { useState } from "react";
import { AlertTriangle, Sparkles, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FREE_MAX_PUBLISHED_FUNNELS, FREE_MONTHLY_LEAD_LIMIT } from "@shared/schema";

interface UpgradeBannerProps {
  variant: "warning" | "expired" | "inline";
}

/** Einmal-pro-Account-Merker (Free-Info-Dialog) — localStorage kann in
 *  Private-Windows werfen, deshalb überall try/catch mit Fallback. */
function freeInfoDismissedKey(userId: number): string {
  return `tw-free-info-dismissed-${userId}`;
}

export function UpgradeBanner({ variant }: UpgradeBannerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!user || user.isPro || user.isAdmin) return null;

  const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const daysLeft = trialEndsAt
    ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/billing/create-checkout");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Fehler", description: data.error || "Checkout nicht verfügbar", variant: "destructive" });
      }
    } catch {
      toast({ title: "Fehler", description: "Verbindungsfehler", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Warning banner (dismissible)
  if (variant === "warning") {
    if (dismissed || daysLeft > 3 || daysLeft <= 0) return null;

    return (
      <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
          <div>
            <p className="font-medium text-sm">
              Dein Testzeitraum endet in {daysLeft} {daysLeft === 1 ? "Tag" : "Tagen"}
            </p>
            <p className="text-sm text-muted-foreground">
              Upgrade jetzt, um deine Funnels weiter zu nutzen.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" onClick={handleUpgrade} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
            Upgraden
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDismissed(true)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Free-Info-Dialog nach Trial-Ende: KEINE Sperre mehr — der Account läuft
  // im Free-Plan weiter. Einmalig pro Account anzeigen, schließbar.
  if (variant === "expired") {
    // user.plan ist die serverseitig abgeleitete Wahrheit (getUserPlan) —
    // die Status-String-Ableitung bleibt NUR als Fallback für gecachte
    // Sessions ohne das Feld. (Wichtig: ein zahlender Kunde mit
    // "cancel at period end" hat Status "cancelled", aber plan "pro" —
    // der darf diesen Dialog nicht sehen.)
    const isOnFreePlan = user.plan
      ? user.plan === "free"
      : (user.subscriptionStatus === "trial" && daysLeft <= 0) ||
        user.subscriptionStatus === "free" ||
        user.subscriptionStatus === "expired";

    let alreadyDismissed = false;
    try {
      alreadyDismissed = localStorage.getItem(freeInfoDismissedKey(user.id)) === "1";
    } catch {
      // localStorage nicht verfügbar → Dialog bleibt schließbar, nur ohne Merker
    }

    if (!isOnFreePlan || dismissed || alreadyDismissed) return null;

    const close = () => {
      setDismissed(true);
      try {
        localStorage.setItem(freeInfoDismissedKey(user.id), "1");
      } catch {
        // ohne Merker erscheint der Dialog beim nächsten Laden erneut — verschmerzbar
      }
    };

    return (
      <Dialog open={true} onOpenChange={(open) => !open && close()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Du bist jetzt im Free-Plan
            </DialogTitle>
            <DialogDescription>
              {/* Neutral formuliert: trifft Trial-Ende UND Abo-Ende (Ex-Zahler) */}
              Dein Account läuft im kostenlosen Free-Plan weiter:{" "}
              {FREE_MAX_PUBLISHED_FUNNELS} veröffentlichter Funnel,{" "}
              {FREE_MONTHLY_LEAD_LIMIT} Leads pro Monat, alle Editor-Funktionen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-medium mb-2">Mit Pro (49 €/Monat) bekommst du:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Unbegrenzte veröffentlichte Funnels</li>
                <li>Unbegrenzte Leads</li>
                <li>Eigene Domain & Teams</li>
                <li>KI-Funnel-Generator</li>
                <li>„Erstellt mit Trichterwerk“-Badge entfernbar</li>
              </ul>
            </div>
            <Button className="w-full gap-2" size="lg" onClick={handleUpgrade} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Jetzt upgraden
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={close}
            >
              Weiter im Free-Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Inline CTA (small, for sidebar etc.)
  if (variant === "inline") {
    if (user.subscriptionStatus !== "trial" || daysLeft <= 0) return null;

    return (
      <button
        onClick={handleUpgrade}
        disabled={isLoading}
        className="w-full p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 text-left hover:from-primary/15 hover:to-primary/10 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" />
          Pro upgraden
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Noch {daysLeft} {daysLeft === 1 ? "Tag" : "Tage"} im Trial
        </p>
      </button>
    );
  }

  return null;
}
