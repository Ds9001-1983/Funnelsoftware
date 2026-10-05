import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePageMeta } from "@/hooks/use-document-title";
import { contactPage } from "@shared/seo-links";
import { CONTACT_EMAIL, CONTACT_MESSAGE_MAX, CONTACT_UNAVAILABLE, contactSchema } from "@shared/contact";

export default function Kontakt() {
  usePageMeta({ title: contactPage.metaTitle, description: contactPage.metaDescription, canonical: contactPage.path });
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => { if (sent || error) resultRef.current?.focus(); }, [sent, error]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const parsed = contactSchema.safeParse({ email, message, website });
    if (!parsed.success) { setError("Bitte prüfe deine E-Mail-Adresse und gib eine Nachricht mit 10 bis 3000 Zeichen ein."); return; }
    submitting.current = true; setPending(true); setError("");
    try {
      const response = await fetch("/api/public/contact", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        setError(response.status === 429 ? "Zu viele Kontaktanfragen. Bitte warte 15 Minuten oder schreib uns per E-Mail." : CONTACT_UNAVAILABLE);
        return;
      }
      const result = await response.json();
      if (result.ok !== true) throw new Error("Unconfirmed contact submission");
      setSent(true); setEmail(""); setMessage(""); setWebsite("");
    } catch { setError(CONTACT_UNAVAILABLE); }
    finally { submitting.current = false; setPending(false); }
  }

  return <div className="min-h-screen bg-background">
    <MarketingHeader />
    <main className="mx-auto max-w-2xl px-4 pb-20 pt-28 sm:pt-32">
      <p className="mb-3 text-sm font-medium text-primary">Kontakt zum Team</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Wie können wir dir helfen?</h1>
      <p className="mt-4 text-muted-foreground">Fragen zum Einstieg, zu deinem Funnel oder zu besonderen Anforderungen? Schreib uns direkt. Du brauchst dafür keinen Account.</p>
      <div className="mt-8 rounded-xl border bg-card p-5 sm:p-8">
        {sent ? <div ref={resultRef} tabIndex={-1} role="status" className="space-y-4 outline-none">
          <CheckCircle2 className="h-8 w-8 text-primary" aria-hidden="true" />
          <h2 className="text-xl font-semibold">Danke für deine Nachricht!</h2>
          <p className="text-muted-foreground">Wir haben deine Nachricht erhalten und antworten dir per E-Mail.</p>
          <Button variant="outline" onClick={() => setSent(false)}>Weitere Nachricht schreiben</Button>
        </div> : <form onSubmit={submit} aria-label="Kontaktformular" aria-busy={pending}>
          <fieldset disabled={pending} className="space-y-5">
            <div className="space-y-2"><Label htmlFor="contact-email">E-Mail</Label><Input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="contact-message">Deine Nachricht</Label><Textarea id="contact-message" name="message" required minLength={10} maxLength={CONTACT_MESSAGE_MAX} rows={6} value={message} onChange={event => setMessage(event.target.value)} aria-describedby="contact-limit" /><p id="contact-limit" className="text-xs text-muted-foreground">10 bis {CONTACT_MESSAGE_MAX} Zeichen</p></div>
            <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true"><label htmlFor="contact-website">Website bitte leer lassen</label><input id="contact-website" name="website" autoComplete="off" tabIndex={-1} maxLength={200} value={website} onChange={event => setWebsite(event.target.value)} /></div>
            <p className="text-sm text-muted-foreground">Wir verwenden deine E-Mail-Adresse und Nachricht, um deine Anfrage zu beantworten. Mehr dazu im <Link href="/datenschutz" className="underline underline-offset-4">Datenschutz</Link>.</p>
            {error && <div ref={resultRef} tabIndex={-1} role="alert" className="rounded-md border border-destructive/30 p-3 text-sm text-destructive outline-none">{error}</div>}
            <Button type="submit" className="min-h-11 w-full gap-2 sm:w-auto">{pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{pending ? "Wird gesendet …" : "Nachricht senden"}</Button>
          </fieldset>
        </form>}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">Lieber per E-Mail? <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex max-w-full items-center gap-1 break-all text-primary underline underline-offset-4"><Mail className="h-4 w-4 shrink-0" aria-hidden="true" />{CONTACT_EMAIL}</a></p>
    </main>
    <MarketingFooter />
  </div>;
}
