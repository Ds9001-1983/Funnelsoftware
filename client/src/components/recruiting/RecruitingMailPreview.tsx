import { useState } from "react";
import { renderRecruitingText } from "@shared/recruiting-contract";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  senderName: string;
  subject: string;
  body: string;
  funnelName: string;
  replyTo?: string;
}

/** Uses the same text substitution as the worker; no save or mail request. */
export function RecruitingMailPreview({ senderName, subject, body, funnelName, replyTo }: Props) {
  const [name, setName] = useState("Alex Beispiel");
  const [company, setCompany] = useState("Beispiel GmbH");
  const values = { name, company, funnel: funnelName };
  const unknown = Array.from(new Set(
    Array.from(`${subject}\n${body}`.matchAll(/\{\{\s*([^{}]*?)\s*\}\}/g))
      .map(match => match[1].trim())
      .filter(key => !["name", "company", "funnel"].includes(key)),
  ));
  return <section aria-label="Vorschau der Bewerbermail" className="rounded-lg border p-4 space-y-4">
    <div><h3 className="font-semibold">Vorschau der Bewerbermail</h3><p className="text-sm text-muted-foreground">Dein aktueller Entwurf mit Beispieldaten. Die Vorschau speichert nichts und versendet keine E-Mail.</p></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1"><Label htmlFor="preview-applicant-name">Beispielname</Label><Input id="preview-applicant-name" value={name} maxLength={200} onChange={event => setName(event.target.value)} /></div>
      <div className="space-y-1"><Label htmlFor="preview-applicant-company">Beispielfirma</Label><Input id="preview-applicant-company" value={company} maxLength={200} onChange={event => setCompany(event.target.value)} /></div>
    </div>
    {!!unknown.length && <p role="status" className="text-sm text-amber-700 dark:text-amber-400 break-words">Unbekannte Platzhalter bleiben unverändert in der E-Mail stehen: {unknown.map(key => `{{${key}}}`).join(", ")}. Unterstützt werden {"{{name}}, {{company}} und {{funnel}}"}.</p>}
    <div className="rounded-md bg-muted/40 p-4 space-y-3 break-words">
      <dl className="text-sm space-y-1">
        <div><dt className="inline text-muted-foreground">Von: </dt><dd className="inline">{senderName || "–"} · via Trichterwerk</dd></div>
        <div><dt className="inline text-muted-foreground">Antwort an: </dt><dd className="inline">{replyTo || "Deine bestätigte Account-Adresse"}</dd></div>
        <div><dt className="inline text-muted-foreground">Betreff: </dt><dd className="inline font-medium" data-testid="mail-preview-subject">{renderRecruitingText(subject, values)}</dd></div>
      </dl>
      <p className="border-t pt-3 text-sm whitespace-pre-wrap" data-testid="mail-preview-body">{renderRecruitingText(body, values)}</p>
    </div>
  </section>;
}
