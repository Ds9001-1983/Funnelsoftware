import { useState, useEffect, useCallback, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Copy, ExternalLink, Globe, Loader2, Code2, QrCode, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
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
  const [activeTab, setActiveTab] = useState<"url" | "share">("url");
  const qrRef = useRef<HTMLDivElement>(null);

  // Initialize slug when dialog opens
  useEffect(() => {
    if (open) {
      const initial = funnel.slug || generateSlug(funnel.name);
      setSlug(initial);
      setIsAvailable(funnel.slug ? true : null);
      setCopied(false);
      setActiveTab("url");
    }
  }, [open, funnel.slug, funnel.name]);

  // Debounced slug availability check
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setIsAvailable(null);
      return;
    }

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

  const embedCode = `<iframe src="${fullUrl}" width="100%" height="700" frameborder="0" style="border:none;border-radius:12px;max-width:480px;margin:0 auto;display:block;"></iframe>`;

  const handleSlugChange = useCallback((value: string) => {
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

  const handleCopy = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: `${label} kopiert!` });
    } catch {
      toast({ title: "Fehler", description: "Konnte nicht kopiert werden", variant: "destructive" });
    }
  }, [toast]);

  const handleDownloadQR = useCallback(() => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      ctx?.drawImage(img, 0, 0, 512, 512);
      const link = document.createElement("a");
      link.download = `qr-${slug}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  }, [slug]);

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
            {isPublished ? "Funnel teilen" : "Funnel veröffentlichen"}
          </DialogTitle>
          <DialogDescription>
            {isPublished
              ? "Teile deinen Funnel per URL, Embed-Code oder QR-Code."
              : "Wähle eine URL für deinen Funnel und veröffentliche ihn."}
          </DialogDescription>
        </DialogHeader>

        {/* Tab Switcher (only show when published) */}
        {isPublished && (
          <div className="flex gap-1 bg-muted rounded-lg p-0.5">
            <button
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === "url" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("url")}
            >
              <Globe className="h-3 w-3" />
              URL
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === "share" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("share")}
            >
              <Share2 className="h-3 w-3" />
              Teilen
            </button>
          </div>
        )}

        {activeTab === "url" ? (
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
                  onClick={() => handleCopy(fullUrl, "URL")}
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
                  Öffnen
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
        ) : (
          <div className="space-y-5 py-2">
            {/* Embed Code */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Embed-Code</Label>
              </div>
              <Textarea
                readOnly
                value={embedCode}
                className="font-mono text-xs h-20 resize-none"
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => handleCopy(embedCode, "Embed-Code")}
              >
                <Copy className="h-3.5 w-3.5" />
                Code kopieren
              </Button>
              <p className="text-xs text-muted-foreground">
                Füge diesen Code auf deiner Website ein, um den Funnel einzubetten.
              </p>
            </div>

            {/* QR Code */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">QR-Code</Label>
              </div>
              <div className="flex items-start gap-4">
                <div ref={qrRef} className="bg-white p-3 rounded-lg border">
                  <QRCodeSVG value={fullUrl} size={120} level="M" />
                </div>
                <div className="space-y-2 flex-1">
                  <p className="text-xs text-muted-foreground">
                    Scanne den QR-Code mit dem Smartphone, um den Funnel zu öffnen. Ideal für Printmaterialien, Visitenkarten und Präsentationen.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={handleDownloadQR}
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    Als PNG herunterladen
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
