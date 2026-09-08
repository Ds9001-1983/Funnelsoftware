import { useState } from "react";
import { useLocation } from "wouter";
import { Bug, Loader2, X, Paperclip, ShieldAlert, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { captureViewport } from "@/lib/screenshot";
import { getRecentClientErrors } from "@/lib/error-log";
import { BUG_REPORT_MAX_DESCRIPTION, MAX_BUG_ATTACHMENT_BYTES } from "@shared/schema";

/** Query-Parameter, die niemals mitgeschickt werden — sie sind Zugangsdaten. */
const SECRET_QUERY_PARAMS = ["token", "code", "session_id", "invite"];

/** Aktuelle Adresse ohne Secrets in der Query. */
function currentPage(): string {
  const url = new URL(window.location.href);
  for (const key of SECRET_QUERY_PARAMS) {
    if (url.searchParams.has(key)) url.searchParams.set(key, "…");
  }
  return `${url.pathname}${url.search}`;
}

function viewportInfo(): string {
  return `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio || 1}`;
}

/**
 * Schwebender „Problem melden"-Knopf für den eingeloggten Bereich.
 *
 * Beim Klick wird zuerst die Seite aufgenommen und erst danach der Dialog
 * geöffnet — sonst läge das Dialogfenster über dem Bild. Der Nutzer sieht die
 * Vorschau und kann sie entfernen, bevor irgendetwas den Browser verlässt.
 */
export default function BugReportWidget() {
  const [location] = useLocation();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [sending, setSending] = useState(false);
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState<Blob | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [captureFailed, setCaptureFailed] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const [clientErrors, setClientErrors] = useState("");

  const tooShort = description.trim().length < 5;

  const resetState = () => {
    if (screenshotUrl) URL.revokeObjectURL(screenshotUrl);
    setScreenshot(null);
    setScreenshotUrl(null);
    setCaptureFailed(false);
    setAttachment(null);
    setAttachmentError(null);
    setShowDetails(false);
    setDescription("");
  };

  const handleOpen = async () => {
    setCapturing(true);
    // Kontext einfrieren, bevor der Dialog die Seite überlagert.
    setPageUrl(currentPage());
    setClientErrors(getRecentClientErrors());
    try {
      const blob = await captureViewport();
      if (blob) {
        setScreenshot(blob);
        setScreenshotUrl(URL.createObjectURL(blob));
        setCaptureFailed(false);
      } else {
        setCaptureFailed(true);
      }
    } finally {
      setCapturing(false);
      setOpen(true);
    }
  };

  const removeScreenshot = () => {
    if (screenshotUrl) URL.revokeObjectURL(screenshotUrl);
    setScreenshot(null);
    setScreenshotUrl(null);
  };

  const handleAttachment = (file: File | undefined) => {
    setAttachmentError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAttachmentError("Bitte ein Bild auswählen (JPG, PNG, WebP oder GIF).");
      return;
    }
    if (file.size > MAX_BUG_ATTACHMENT_BYTES) {
      setAttachmentError(`Das Bild ist zu groß (max. ${Math.round(MAX_BUG_ATTACHMENT_BYTES / 1024 / 1024)} MB).`);
      return;
    }
    setAttachment(file);
  };

  const handleSubmit = async () => {
    setSending(true);
    try {
      const form = new FormData();
      form.append("description", description.trim());
      form.append("pageUrl", pageUrl || currentPage());
      form.append("userAgent", navigator.userAgent);
      form.append("viewport", viewportInfo());
      if (clientErrors) form.append("clientErrors", clientErrors);
      if (screenshot) form.append("screenshot", screenshot, "screenshot.webp");
      if (attachment) form.append("attachment", attachment, attachment.name);

      await apiRequest("POST", "/api/bug-reports", form);

      toast({
        title: "Danke für die Meldung",
        description: "Wir haben sie erhalten und melden uns per E-Mail, wenn wir Rückfragen haben.",
      });
      setOpen(false);
      resetState();
    } catch (e: any) {
      // Der globale Handler kümmert sich nur um Plan-Fehlercodes — alles andere
      // muss diese Komponente selbst melden, sonst scheitert der Versand still.
      toast({
        variant: "destructive",
        title: "Meldung konnte nicht gesendet werden",
        description: e?.message || "Bitte in einem Moment erneut versuchen.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        data-bug-widget
        type="button"
        size="icon"
        variant="secondary"
        aria-label="Problem melden"
        title="Problem melden"
        onClick={handleOpen}
        disabled={capturing}
        // bottom-20 auf Mobil: im Funnel-Editor liegt dort eine feste Leiste.
        className="fixed right-4 bottom-20 md:bottom-6 z-40 h-11 w-11 rounded-full shadow-lg border"
      >
        {capturing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Bug className="h-5 w-5" />}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetState();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-primary" /> Problem melden
            </DialogTitle>
            <DialogDescription>
              Beschreibe kurz, was nicht funktioniert hat. Wir haben die Seite bereits abfotografiert.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bug-description">Was ist passiert?</Label>
              <Textarea
                id="bug-description"
                rows={4}
                maxLength={BUG_REPORT_MAX_DESCRIPTION}
                placeholder="Beispiel: Beim Speichern des Funnels dreht sich das Rad endlos, danach sind meine Änderungen weg."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {description.length} / {BUG_REPORT_MAX_DESCRIPTION} Zeichen
              </p>
            </div>

            <div className="space-y-2">
              <Label>Screenshot</Label>
              {screenshotUrl ? (
                <div className="relative w-fit">
                  <img
                    src={screenshotUrl}
                    alt="Automatisch aufgenommener Screenshot der aktuellen Seite"
                    className="max-h-40 rounded-md border object-contain"
                  />
                  <button
                    type="button"
                    onClick={removeScreenshot}
                    aria-label="Screenshot entfernen"
                    className="absolute -right-2 -top-2 rounded-full bg-background border p-1 shadow"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {captureFailed
                    ? "Der automatische Screenshot hat nicht geklappt. Du kannst unten ein eigenes Bild anhängen."
                    : "Kein Screenshot — die Meldung wird ohne Bild gesendet."}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bug-attachment" className="flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5" /> Eigenes Bild anhängen (optional)
              </Label>
              <input
                id="bug-attachment"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => handleAttachment(e.target.files?.[0])}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm"
              />
              {attachment && <p className="text-xs text-muted-foreground">Ausgewählt: {attachment.name}</p>}
              {attachmentError && <p className="text-xs text-destructive">{attachmentError}</p>}
            </div>

            <div className="rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
              <p className="flex gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  Der Screenshot zeigt, was gerade auf deinem Bildschirm zu sehen ist. Kontaktdaten deiner
                  Leads machen wir automatisch unkenntlich — sieh trotzdem kurz nach und entferne das Bild
                  mit dem X, falls dort etwas Vertrauliches steht. Wir speichern die Meldung 12 Monate, das
                  Bild 90 Tage. Mehr dazu in der{" "}
                  <a href="/datenschutz" target="_blank" rel="noopener" className="underline">
                    Datenschutzerklärung
                  </a>
                  .
                </span>
              </p>
              <button
                type="button"
                onClick={() => setShowDetails((v) => !v)}
                className="mt-2 flex items-center gap-1 underline"
              >
                <ChevronDown className={`h-3 w-3 transition-transform ${showDetails ? "rotate-180" : ""}`} />
                Technische Angaben, die mitgesendet werden
              </button>
              {showDetails && (
                <ul className="mt-2 space-y-1 pl-5 list-disc">
                  <li>Seite: {pageUrl || location}</li>
                  <li>Fenstergröße: {viewportInfo()}</li>
                  <li>Browserkennung: {navigator.userAgent}</li>
                  <li>
                    Zuletzt protokollierte Browser-Fehler:{" "}
                    {clientErrors ? `${clientErrors.split("\n").length} Eintrag/Einträge` : "keine"}
                  </li>
                  <li>Dein Konto (E-Mail und Tarif) — damit wir antworten können</li>
                </ul>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={tooShort || sending}>
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Meldung senden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
