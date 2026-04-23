import { useState } from "react";
import { AlertTriangle, Sparkles, Loader2, X, LogOut } from "lucide-react";
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

interface UpgradeBannerProps {
  variant: "warning" | "expired" | "inline" | "payment-required";
}

export function UpgradeBanner({ variant }: UpgradeBannerProps) {
  const { user, logout } = useAuth();
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

  // Expired blocking modal (cannot be dismissed)
  if (variant === "expired") {
    const isExpired =
      (user.subscriptionStatus === "trial" && daysLeft <= 0) ||
      user.subscriptionStatus === "expired" ||
      user.subscriptionStatus === "cancelled";

    if (!isExpired) return null;

    return (
      <Dialog open={true}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {user.subscriptionStatus === "trial"
                ? "Testphase abgelaufen"
                : "Kein aktives Abo"}
            </DialogTitle>
            <DialogDescription>
              {user.subscriptionStatus === "trial"
                ? "Deine 14-tägige Testphase ist abgelaufen. Upgrade auf den Pro Plan, um deine Funnels weiter zu bearbeiten und neue zu erstellen."
                : "Dein Abonnement wurde beendet. Abonniere erneut, um alle Features zu nutzen."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-medium mb-2">Pro Plan beinhaltet:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Unbegrenzte Funnels erstellen</li>
                <li>Unbegrenzte Leads sammeln</li>
                <li>Custom URLs und Slugs</li>
                <li>Analytics und Statistiken</li>
                <li>Alle Element-Typen</li>
              </ul>
            </div>
            <Button className="w-full gap-2" size="lg" onClick={handleUpgrade} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Jetzt upgraden
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-2 text-muted-foreground"
              onClick={() => logout()}
            >
              <LogOut className="h-3.5 w-3.5" />
              Ausloggen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Payment required blocking modal (user cancelled Stripe Checkout after registration)
  if (variant === "payment-required") {
    const needsPayment = user.stripeCustomerId && !user.stripeSubscriptionId && !user.isPro;
    if (!needsPayment) return null;

    return (
      <Dialog open={true}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Registrierung abschließen
            </DialogTitle>
            <DialogDescription>
              Bitte hinterlege deine Zahlungsdaten, um Trichterwerk nutzen zu können.
              Du wirst 14 Tage lang nicht belastet und kannst jederzeit kündigen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-medium mb-2">14 Tage kostenlos testen:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Keine Kosten während der Testphase</li>
                <li>Jederzeit kündbar</li>
                <li>Alle Pro-Features sofort verfügbar</li>
                <li>Nahtloser Übergang nach der Testphase</li>
              </ul>
            </div>
            <Button className="w-full gap-2" size="lg" onClick={handleUpgrade} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Zahlungsdaten hinterlegen
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-2 text-muted-foreground"
              onClick={() => logout()}
            >
              <LogOut className="h-3.5 w-3.5" />
              Ausloggen
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
