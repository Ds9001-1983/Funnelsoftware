import { useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { downloadRecovery } from "@/lib/editor-recovery";
import { DOCUMENT_VERSION, documentFromFunnel, type FunnelDocument } from "@shared/funnel-document";
import type { Funnel } from "@shared/schema";

export function EditorRecoveryBar({ funnel, recovery, conflict, unavailable, onDiscard }: {
  funnel: Funnel; recovery: FunnelDocument | null; conflict: boolean; unavailable: boolean; onDiscard: () => void;
}) {
  const [, navigate] = useLocation();
  const [busy, setBusy] = useState(false);
  const [secured, setSecured] = useState(false);
  const [error, setError] = useState("");
  if (!recovery && !conflict && !unavailable) return null;
  const source = recovery ?? documentFromFunnel(funnel);
  const content = { ...source, abTests: source.abTests?.map(test => ({ ...test, status: test.status === "running" ? "paused" as const : test.status })) };
  const bar = <div role="alert" className="border-b bg-amber-50 text-amber-950 px-4 py-3 flex flex-wrap items-center gap-3 text-sm">
    <p className="flex-1 min-w-64">{recovery ? "Es gibt eine lokale Sicherung aus einer vorherigen Sitzung. Sichere sie als eigenen Funnel oder lade sie herunter." : conflict ? "Der Serverstand wurde in einer anderen Sitzung geändert. Dein lokaler Inhalt ist weiterhin hier; sichere ihn vor dem Neuladen." : "Dein Browser kann keine lokale Sicherung ablegen. Du kannst deinen Inhalt herunterladen."}</p>
    <Button variant="outline" size="sm" disabled={busy} onClick={async () => {
      setBusy(true); setError("");
      try {
        const created: Funnel = await (await apiRequest("POST", "/api/funnels", { ...content, description: content.description ?? undefined, name: `${content.name} (Sicherung)`, status: "draft" })).json();
        const { version: _, ...fields } = content;
        await apiRequest("PATCH", `/api/funnels/${created.id}`, { ...fields, name: created.name, expectedVersion: created.editVersion, documentVersion: DOCUMENT_VERSION, mutationId: crypto.randomUUID() });
        onDiscard(); navigate(`/funnels/${created.id}`);
      } catch { setError("Die Kopie konnte nicht vollständig gesichert werden. Deine lokalen Daten bleiben erhalten."); }
      finally { setBusy(false); }
    }}>{busy ? "Kopie wird gesichert …" : "Als neuen Funnel sichern"}</Button>
    <Button variant="outline" size="sm" onClick={() => { downloadRecovery(content); setSecured(true); }}>Inhalt herunterladen</Button>
    {recovery && <Button variant="ghost" size="sm" disabled={busy} onClick={() => { if (window.confirm("Die lokale Sicherung verwerfen und mit dem Serverstand weiterarbeiten?")) onDiscard(); }}>Sicherung verwerfen</Button>}
    {conflict && secured && <Button variant="outline" size="sm" onClick={() => { onDiscard(); window.location.reload(); }}>Aktuellen Stand laden</Button>}
    {error && <p className="w-full">{error}</p>}
  </div>;
  return recovery ? <Dialog open><DialogContent onEscapeKeyDown={event => event.preventDefault()} onPointerDownOutside={event => event.preventDefault()}>
    <DialogHeader><DialogTitle>Lokale Inhaltssicherung gefunden</DialogTitle><DialogDescription>Entscheide zuerst, wie du deine bisherige Arbeit sichern möchtest.</DialogDescription></DialogHeader>{bar}
  </DialogContent></Dialog> : bar;
}
