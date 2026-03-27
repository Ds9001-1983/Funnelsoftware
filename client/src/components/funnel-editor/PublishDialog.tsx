import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, Copy, ExternalLink, Globe, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { generateSlug } from "@shared/schema";
import type { Funnel } from "@shared/schema";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funnel: Funnel;
  onPublish: (slug: string) => Promise<void>;
  onUpdateSlug: (slug: string) => Promise<void>;
}

export function PublishDialog({
  open,
  onOpenChange,
  funnel,
  onPublish,
  onUpdateSlug,
}: PublishDialogProps) {
  const { toast } = useToast();
  const isPublished = funnel.status === "published";
  const [slug, setSlug] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize slug when dialog opens
  useEffect(() => {
    if (open) {
      const initial = funnel.slug || generateSlug(funnel.name);
      setSlug(initial);
      setIsAvailable(funnel.slug ? true : null);
      setCopied(false);
    }
  }, [open, funnel.slug, funnel.name]);

  // Debounced slug availability check
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setIsAvailable(null);
      return;
    }

    // If slug hasn't changed from current, it's available
    if (slug === funnel.slug) {
      setIsAvailable(true);
      return;
    }

    setIsChecking(true);
    const timer = setTimeout(async () => {
      try {
        const response = await apiRequest(
          "GET",
          `/api/funnels/check-slug?slug=${encodeURIComponent(slug)}&funnelId=${funnel.id}`
        );
        const data = await response.json();
        setIsAvailable(data.available);
      } catch {
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [slug, funnel.id, funnel.slug]);

  const baseUrl = typeof window !== "undefined"
    ? `${window.location.origin}/f/`
    : "https://trichterwerk.de/f/";

  const fullUrl = `${baseUrl}${slug}`;

  const handleSlugChange = useCallback((value: string) => {
    // Auto-format: lowercase, only allowed chars
    const formatted = value
      .toLowerCase()
      .replace(/[äÄ]/g, "ae")
      .replace(/[öÖ]/g, "oe")
      .replace(/[üÜ]/g, "ue")
      .replace(/[ß]/g, "ss")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/--+/g, "-")
      .replace(/^-/, "");
    setSlug(formatted);
  }, []);

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "URL kopiert!" });
    } catch {
      toast({ title: "Fehler", description: "URL konnte nicht kopiert werden", variant: "destructive" });
    }
  }, [fullUrl, toast]);

  const handleSubmit = useCallback(async () => {
    if (!slug || slug.length < 3 || isAvailable === false) return;
    setIsSubmitting(true);
    try {
      if (isPublished) {
        await onUpdateSlug(slug);
      } else {
        await onPublish(slug);
      }
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  }, [slug, isAvailable, isPublished, onPublish, onUpdateSlug]);

  const isSlugValid = slug.length >= 3 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            {isPublished ? "Funnel-URL verwalten" : "Funnel veröffentlichen"}
          </DialogTitle>
          <DialogDescription>
            {isPublished
              ? "Bearbeite die URL deines veröffentlichten Funnels."
              : "Wähle eine URL für deinen Funnel und veröffentliche ihn."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* URL Preview */}
          <div className="bg-muted rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Deine Funnel-URL</p>
            <div className="flex items-center gap-2">
              <code className="text-sm font-medium flex-1 break-all">
                {fullUrl}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleCopyUrl}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Slug Input */}
          <div className="space-y-2">
            <Label className="text-sm">URL-Pfad</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">/f/</span>
              <div className="relative flex-1">
                <Input
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="mein-funnel"
                  className="pr-8"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  {isChecking && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {!isChecking && isAvailable === true && isSlugValid && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                  {!isChecking && isAvailable === false && (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
            </div>
            {!isChecking && isAvailable === false && (
              <p className="text-xs text-destructive">
                Dieser URL-Pfad ist bereits vergeben.
              </p>
            )}
            {slug.length > 0 && !isSlugValid && (
              <p className="text-xs text-muted-foreground">
                Mindestens 3 Zeichen, nur Kleinbuchstaben, Zahlen und Bindestriche.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isPublished && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => window.open(fullUrl, "_blank")}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Im neuen Tab öffnen
              </Button>
            )}
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                !isSlugValid ||
                isAvailable === false ||
                isChecking ||
                (isPublished && slug === funnel.slug)
              }
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isPublished ? "Slug speichern" : "Jetzt veröffentlichen"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
