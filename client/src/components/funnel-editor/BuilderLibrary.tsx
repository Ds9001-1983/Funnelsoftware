import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import type { Funnel, FunnelPage } from "@shared/schema";
import { captureLibraryContent, externalLibraryReferences, initialLibraryAssignments, insertLibraryTemplate, type ContentTemplate, type LibraryList, type ReferenceAssignments } from "@shared/builder-library";
import { elementChoices, fieldLabel, responseTypes } from "@shared/funnel-routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { FunnelRenderer } from "@/components/funnel-viewer/FunnelRenderer";
import { MediaLibrary } from "./MediaLibrary";

interface Props { maxDocumentVersion?: number; funnel: Funnel; pageIndex: number; onInsert: (pages: FunnelPage[]) => void }

function TemplateLibrary({ funnel, pageIndex, onInsert, maxDocumentVersion = 5 }: Props) {
  const { user } = useAuth(), { toast } = useToast(), cache = useQueryClient();
  const [name, setName] = useState(""), [selection, setSelection] = useState("page"), [search, setSearch] = useState("");
  const [archived, setArchived] = useState(false), [busy, setBusy] = useState(false), [cursors, setCursors] = useState<number[]>([]);
  const [proposal, setProposal] = useState<ContentTemplate | null>(null), [design, setDesign] = useState<"source" | "target">("source"), [assignments, setAssignments] = useState<ReferenceAssignments>({});
  const sourcePage = funnel.pages[pageIndex], cursor = cursors[cursors.length - 1];
  const library = useQuery<LibraryList<ContentTemplate>>({ queryKey: ["content-library", user?.id, search, archived, cursor], queryFn: async () => {
    const params = new URLSearchParams({ q: search, archived: String(archived) });
    if (cursor) params.set("cursor", String(cursor));
    return (await apiRequest("GET", `/api/library/templates?${params}`)).json();
  } });
  const refresh = () => cache.invalidateQueries({ queryKey: ["content-library"] });
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try { await action(); await refresh(); }
    catch (error) { toast({ title: "Vorlage nicht gespeichert", description: error instanceof Error ? error.message : "Bitte erneut versuchen.", variant: "destructive" }); await refresh(); }
    finally { setBusy(false); }
  };
  const capture = () => captureLibraryContent(funnel, sourcePage, selection === "page" ? undefined : selection);
  const update = (item: ContentTemplate, changes: Record<string, unknown>) => run(() => apiRequest("PATCH", `/api/library/templates/${item.id}`, { ...changes, expectedVersion: item.version }));
  const references = proposal ? externalLibraryReferences(proposal.content) : [];
  const fields = funnel.pages.filter(page => !page.hidden).flatMap(page => page.elements.filter(element => responseTypes.has(element.type)).map(field => ({ field, label: `${page.title} · ${fieldLabel(field)}` })));
  let previewPages: FunnelPage[] | null = null, importError = "";
  if (proposal) {
    try { previewPages = insertLibraryTemplate(proposal, funnel, sourcePage.id, design, assignments); }
    catch (error) { importError = error instanceof Error ? error.message : "Bitte die Zuordnungen prüfen."; }
  }
  const previewPage = proposal && previewPages ? previewPages[proposal.kind === "page" ? pageIndex + 1 : pageIndex] : null;
  return <section className="space-y-4" aria-label="Eigene Inhaltsvorlagen">
    <p className="text-sm text-muted-foreground">Speichere die ausgewählte Seite oder einen Abschnitt. Beim Einfügen entsteht eine unabhängige Kopie. Änderungen an der Vorlage verändern keine verwendeten Inhalte.</p>
    <fieldset disabled={busy} className="border rounded-lg p-3 space-y-2">
      <label className="block text-sm">Inhalt für Vorlage<select aria-label="Inhalt für Vorlage" className="ml-2 border rounded p-2 bg-background" value={selection} onChange={event => setSelection(event.target.value)}><option value="page">Ganze Seite: {sourcePage.title}</option>{sourcePage.layout?.sections.map((section, index) => <option key={section.id} value={section.id}>Abschnitt: {section.name || index + 1}</option>)}</select></label>
      <div className="flex gap-2"><Input aria-label="Name der Inhaltsvorlage" placeholder="z. B. Kontakt mit Vorteilen" maxLength={100} value={name} onChange={event => setName(event.target.value)} /><Button disabled={!name.trim()} onClick={() => void run(async () => { await apiRequest("POST", "/api/library/templates", { name: name.trim(), kind: selection === "page" ? "page" : "section", content: capture() }); setName(""); setArchived(false); setSearch(""); setCursors([]); })}>Als Vorlage speichern</Button></div>
    </fieldset>
    <div className="flex gap-4 items-center"><Input aria-label="Vorlagen suchen" placeholder="Eigene Vorlagen suchen …" value={search} maxLength={100} onChange={event => { setSearch(event.target.value); setCursors([]); }} /><label className="flex gap-2 items-center text-sm whitespace-nowrap"><input type="checkbox" checked={archived} onChange={event => { setArchived(event.target.checked); setCursors([]); }} />Archiv anzeigen</label></div>
    {library.isLoading && <p role="status">Vorlagen werden geladen …</p>}
    {library.isError && <Button variant="outline" onClick={() => void refresh()}>Vorlagen erneut laden</Button>}
    {library.isSuccess && !library.data.items.length && <p className="py-6 text-center text-muted-foreground">Keine eigenen Vorlagen gefunden.</p>}
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {library.data?.items.map(item => <article key={item.id} className="border rounded-lg overflow-hidden" data-testid={`content-template-${item.id}`}>
        <div className="h-32 overflow-hidden p-3 space-y-1 text-center" aria-hidden="true" style={{ color: item.content.theme.textColor, backgroundColor: item.content.page.backgroundColor || item.content.theme.backgroundColor }}>
          <strong className="block text-sm truncate">{item.content.page.title}</strong>
          {item.content.page.elements.filter(element => ["heading", "text", "image", "button"].includes(element.type)).slice(0, 3).map(element => element.type === "image" ? <img key={element.id} src={element.imageUrl} alt="" className="h-12 mx-auto object-contain" loading="lazy" /> : <p key={element.id} className={`text-xs truncate ${element.type === "heading" ? "font-bold" : ""}`} style={element.type === "button" ? { backgroundColor: item.content.theme.primaryColor, color: "white", borderRadius: 4, padding: 4 } : undefined}>{element.content}</p>)}
        </div>
        <div className="p-3 space-y-2"><h3 className="font-semibold truncate" title={item.name}>{item.name}</h3><p className="text-xs text-muted-foreground">{item.kind === "page" ? "Seite" : "Abschnitt"} · {item.content.page.elements.length} Elemente</p>
          {!item.archivedAt && <Button size="sm" className="w-full" onClick={() => { setProposal(item); setAssignments(initialLibraryAssignments(item.content, funnel)); setDesign("source"); }}>Prüfen und einfügen</Button>}
          <select aria-label={`Vorlage ${item.name} verwalten`} className="border rounded bg-background p-1 text-xs w-full" disabled={busy} value="" onChange={event => {
            if (event.target.value === "rename") { const name = window.prompt("Vorlage umbenennen", item.name); if (name?.trim()) void update(item, { name: name.trim() }); }
            if (event.target.value === "archive") void update(item, { archived: !item.archivedAt });
            if (event.target.value === "replace" && window.confirm(`„${item.name}“ durch die ausgewählten Inhalte ersetzen? Bereits eingefügte Kopien bleiben erhalten.`)) void run(async () => {
              if (item.kind !== (selection === "page" ? "page" : "section")) throw new Error("Wähle für diese Vorlage denselben Inhaltstyp (Seite oder Abschnitt).");
              await apiRequest("PATCH", `/api/library/templates/${item.id}`, { content: capture(), expectedVersion: item.version });
            });
          }}><option value="" disabled>Verwalten</option><option value="rename">Umbenennen</option>{!item.archivedAt && <option value="replace">Durch Auswahl ersetzen</option>}<option value="archive">{item.archivedAt ? "Wiederherstellen" : "Archivieren"}</option></select>
        </div>
      </article>)}
    </div>
    <div className="flex gap-2 justify-end"><Button variant="outline" disabled={busy || !cursors.length} onClick={() => setCursors(cursors.slice(0, -1))}>Vorherige Vorlagen</Button><Button variant="outline" disabled={busy || !library.data?.nextCursor} onClick={() => { if (library.data?.nextCursor) setCursors([...cursors, library.data.nextCursor]); }}>Weitere Vorlagen</Button></div>
    <Dialog open={!!proposal} onOpenChange={open => { if (!open) setProposal(null); }}><DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Vorlage einfügen: {proposal?.name}</DialogTitle><DialogDescription>{proposal?.kind === "page" ? "Die neue Seite wird hinter der aktuellen Seite eingefügt." : "Der Abschnitt wird an die aktuelle Seite angehängt."} Das Einfügen ist ein rückgängig machbarer Schritt und wird erst nach Veröffentlichung live.</DialogDescription></DialogHeader>
      <label className="block text-sm">Design<select aria-label="Design beim Einfügen" className="ml-2 border rounded bg-background p-2" value={design} onChange={event => setDesign(event.target.value as typeof design)}><option value="source">Quelldesign beibehalten</option><option value="target">Design des Zielfunnels übernehmen</option></select></label>
      <p className="text-xs text-muted-foreground">Das Quelldesign bleibt nur in der Kopie erhalten. Das Zieldesign ersetzt individuelle Farben, Schriftgrößen, Rundungen und Button-Stile der kopierten Inhalte.</p>
      {!!references.length && <fieldset className="space-y-3 border rounded p-3"><legend className="text-sm font-semibold">Verknüpfungen zuordnen</legend>
        <p className="text-xs text-muted-foreground">Entfernen verwirft betroffene Regeln, ersetzt Textvariablen durch ihren Ersatztext und setzt Sprungbuttons auf „Weiter“. Standardziele müssen zugeordnet werden.</p>
        {references.map(ref => {
          const fieldRef = references.find(candidate => candidate.kind === "field" && candidate.id === ref.fieldId);
          const field = fields.find(item => item.field.id === (fieldRef ? assignments[fieldRef.key] : ref.fieldId))?.field;
          const options = ref.kind === "page" ? funnel.pages.filter(page => !page.hidden).map(page => ({ id: page.id, label: page.title })) : ref.kind === "field" ? fields.map(item => ({ id: item.field.id, label: item.label })) : field ? elementChoices(field) : [];
          return <label key={ref.key} className="block text-sm space-y-1">{ref.kind === "page" ? "Zielseite" : ref.kind === "field" ? "Antwortfeld" : "Auswahloption"}: {ref.label}<select aria-label={`Zuordnung: ${ref.label}`} className="block w-full border rounded bg-background p-2" value={Object.hasOwn(assignments, ref.key) ? assignments[ref.key] ?? "__remove" : ""} onChange={event => {
            const value = event.target.value === "__remove" ? null : event.target.value;
            setAssignments(current => { const next = { ...current, [ref.key]: value }; for (const choice of references.filter(candidate => candidate.kind === "choice" && candidate.fieldId === ref.id && ref.kind === "field")) { if (value === null) next[choice.key] = null; else delete next[choice.key]; } return next; });
          }}><option value="" disabled>Bitte zuordnen</option>{!ref.required && <option value="__remove">Verweis ausdrücklich entfernen</option>}{options.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>;
        })}
      </fieldset>}
      {proposal && proposal.content.documentVersion > maxDocumentVersion && <p role="alert">Diese Vorlage benötigt die freigeschaltete Gerätebearbeitung.</p>}
      {importError && <p role="status" className="text-sm text-amber-700">{importError}</p>}
      {previewPage && <div className="border rounded max-h-72 overflow-y-auto pointer-events-none" aria-label="Vorschau der Kopie"><FunnelRenderer key={`${proposal?.id}-${design}`} funnel={{ pages: [previewPage], theme: funnel.theme }} mode="preview" className="min-h-0" /></div>}
      <DialogFooter><Button variant="outline" onClick={() => setProposal(null)}>Abbrechen</Button><Button disabled={!previewPages || (proposal?.content.documentVersion ?? 1) > maxDocumentVersion} onClick={() => { if (!proposal || !previewPages || proposal.content.documentVersion > maxDocumentVersion) return; onInsert(previewPages); setProposal(null); }}>Kopie einfügen</Button></DialogFooter>
    </DialogContent></Dialog>
  </section>;
}

export function BuilderLibrary(props: Props) {
  const [open, setOpen] = useState(false), [tab, setTab] = useState<"templates" | "media">("templates");
  return <><Button size="sm" variant="outline" onClick={() => setOpen(true)}><BookOpen className="w-4 h-4 mr-2" />Vorlagen &amp; Medien</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Meine Bibliothek</DialogTitle><DialogDescription>Deine eigenen Inhalte und Bilder für weitere Funnels.</DialogDescription></DialogHeader>
      <div className="flex gap-2 border-b pb-3"><Button variant={tab === "templates" ? "default" : "outline"} onClick={() => setTab("templates")}>Eigene Vorlagen</Button><Button variant={tab === "media" ? "default" : "outline"} onClick={() => setTab("media")}>Mediathek</Button></div>
      {open && (tab === "templates" ? <TemplateLibrary {...props} onInsert={pages => { props.onInsert(pages); setOpen(false); }} /> : <MediaLibrary />)}
    </DialogContent></Dialog></>;
}
