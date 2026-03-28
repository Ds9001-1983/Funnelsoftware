import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mail, Loader2, CheckCircle } from "lucide-react";

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user || user.emailVerifiedAt || user.isAdmin) return null;

  async function resendVerification() {
    setSending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setSent(true);
      }
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
        <div>
          <p className="font-medium text-amber-800 dark:text-amber-200 text-sm">
            E-Mail-Adresse nicht bestätigt
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Bitte bestätige deine E-Mail-Adresse ({user.email}), um alle Funktionen nutzen zu können.
          </p>
        </div>
      </div>
      {sent ? (
        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-sm shrink-0">
          <CheckCircle className="h-4 w-4" />
          Gesendet
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={resendVerification}
          disabled={sending}
          className="shrink-0"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <Mail className="h-4 w-4 mr-1.5" />
          )}
          Erneut senden
        </Button>
      )}
    </div>
  );
}
