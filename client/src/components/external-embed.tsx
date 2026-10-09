import { useEffect, useState, type IframeHTMLAttributes } from "react";
import { Button } from "@/components/ui/button";

/** Ohne Aktivierung entsteht weder iframe noch Verbindung zum Anbieter.
 * Die Auswahl gilt nur für diesen Inhalt in diesem Seitenlauf. */
export function ExternalEmbed({ src, title, ...props }: IframeHTMLAttributes<HTMLIFrameElement> & { src: string }) {
  const [acceptedSource, setAcceptedSource] = useState<string | null>(null);
  useEffect(() => {
    const revoke = () => setAcceptedSource(null);
    window.addEventListener("cookieConsentChanged", revoke);
    window.addEventListener("storage", revoke);
    return () => {
      window.removeEventListener("cookieConsentChanged", revoke);
      window.removeEventListener("storage", revoke);
    };
  }, []);
  if (acceptedSource === src) return <iframe {...props} src={src} title={title} referrerPolicy="no-referrer" />;
  const host = new URL(src).hostname;
  const provider = host.includes("youtube") ? "YouTube (Google)" : host.includes("vimeo") ? "Vimeo" : host === "calendly.com" ? "Calendly" : "Cal.com";
  const privacyUrl = host.includes("youtube") ? "https://policies.google.com/privacy" : host.includes("vimeo") ? "https://vimeo.com/privacy" : host === "calendly.com" ? "https://calendly.com/privacy" : "https://cal.com/privacy";
  return (
    <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 rounded-lg border bg-white p-4 text-center text-slate-900" data-testid="external-content-placeholder">
      <p className="text-sm">{title} von {provider}</p>
      <p className="max-w-md text-xs">Mit „Inhalt laden“ stimmst du zu, dass dieser Anbieter deine IP-Adresse und Browserinformationen erhält und eigene Speichertechniken einsetzen kann. Eine Verarbeitung außerhalb der EU ist möglich.</p>
      <a className="text-xs underline" href={privacyUrl} target="_blank" rel="noopener noreferrer">Datenschutz bei {provider}</a>
      <Button type="button" variant="outline" onClick={() => setAcceptedSource(src)}>Inhalt laden</Button>
    </div>
  );
}
