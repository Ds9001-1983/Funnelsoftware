import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { MAX_IMAGE_UPLOAD_BYTES } from "@shared/schema";
import type { LibraryList, MediaAsset, MediaFolder } from "@shared/builder-library";

export function MediaLibrary({ onSelect }: { onSelect?: (url: string) => void }) {
  const { user } = useAuth(), { toast } = useToast(), cache = useQueryClient();
  const [search, setSearch] = useState(""), [folder, setFolder] = useState("all"), [archived, setArchived] = useState(false);
  const [cursors, setCursors] = useState<number[]>([]), [name, setName] = useState(""), [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const cursor = cursors[cursors.length - 1];
  const folders = useQuery<MediaFolder[]>({ queryKey: ["library-folders", user?.id], queryFn: async () => (await apiRequest("GET", "/api/library/folders")).json() });
  const media = useQuery<LibraryList<MediaAsset>>({ queryKey: ["library-media", user?.id, search, folder, archived, cursor], queryFn: async () => {
    const params = new URLSearchParams({ q: search, archived: String(archived) });
    if (folder !== "all") params.set("folderId", folder);
    if (cursor) params.set("cursor", String(cursor));
    return (await apiRequest("GET", `/api/library/media?${params}`)).json();
  } });
  const refresh = async () => { await Promise.all([cache.invalidateQueries({ queryKey: ["library-media"] }), cache.invalidateQueries({ queryKey: ["library-folders"] })]); };
  const perform = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try { await action(); await refresh(); }
    catch (error) { toast({ title: "Änderung nicht gespeichert", description: error instanceof Error ? error.message : "Bitte erneut versuchen.", variant: "destructive" }); await refresh(); }
    finally { setBusy(false); }
  };
  const update = (asset: MediaAsset, data: Record<string, unknown>) => perform(() => apiRequest("PATCH", `/api/library/media/${asset.id}`, { ...data, expectedVersion: asset.version }));
  const upload = (file?: File) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type) || file.size > MAX_IMAGE_UPLOAD_BYTES) {
      toast({ title: "Bitte ein JPG, PNG, WebP oder GIF bis 10 MB wählen.", variant: "destructive" }); return;
    }
    void perform(async () => {
      const data = new FormData(); data.append("file", file);
      const result = await (await apiRequest("POST", "/api/uploads", data)).json();
      if (folder !== "all" && folder !== "none") await apiRequest("PATCH", `/api/library/media/${result.media.id}`, { folderId: Number(folder), expectedVersion: result.media.version });
      setArchived(false); setSearch(""); setCursors([]);
    });
  };
  return <section aria-label="Medienbibliothek" className="space-y-4">
    <p className="text-sm text-muted-foreground">Neue Bilder werden hier gesammelt. Ordner und Archivierung ändern keine Bild-URL; bereits verwendete Bilder bleiben verfügbar. Ältere Uploads bleiben an ihren bisherigen Stellen erhalten.</p>
    <fieldset disabled={busy} className="flex flex-wrap gap-2 items-center">
      <Input aria-label="Bilder suchen" placeholder="Bilder suchen …" maxLength={100} className="flex-1 min-w-40" value={search} onChange={event => { setSearch(event.target.value); setCursors([]); }} />
      <select aria-label="Medienordner" className="border rounded p-2 bg-background" value={folder} onChange={event => { setFolder(event.target.value); setCursors([]); }}><option value="all">Alle Ordner</option><option value="none">Ohne Ordner</option>{folders.data?.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select>
      <label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={archived} onChange={event => { setArchived(event.target.checked); setCursors([]); }} />Archiv anzeigen</label>
      <Button variant="outline" onClick={() => input.current?.click()}><Upload className="w-4 h-4 mr-2" />{busy ? "Wird gespeichert …" : "Bild hochladen"}</Button>
      <input ref={input} aria-label="Bild für die Mediathek" className="hidden" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={event => { upload(event.target.files?.[0]); event.target.value = ""; }} />
    </fieldset>
    <fieldset disabled={busy} className="flex gap-2 flex-wrap">
      <Input aria-label="Neuer Medienordner" maxLength={100} placeholder="z. B. Projekt Sommer" className="w-60" value={name} onChange={event => setName(event.target.value)} />
      <Button variant="outline" disabled={!name.trim()} onClick={() => void perform(async () => { await apiRequest("POST", "/api/library/folders", { name: name.trim() }); setName(""); })}>Ordner anlegen</Button>
      {folders.data?.some(item => String(item.id) === folder) && <Button variant="ghost" onClick={() => {
        const current = folders.data!.find(item => String(item.id) === folder)!;
        const name = window.prompt("Neuer Ordnername", current.name);
        if (name?.trim()) void perform(() => apiRequest("PATCH", `/api/library/folders/${current.id}`, { name: name.trim(), expectedVersion: current.version }));
      }}>Ordner umbenennen</Button>}
    </fieldset>
    {(media.isLoading || folders.isLoading) && <p role="status">Mediathek wird geladen …</p>}
    {(media.isError || folders.isError) && <Button variant="outline" onClick={() => void refresh()}>Mediathek erneut laden</Button>}
    {media.isSuccess && !media.data.items.length && <p className="py-8 text-center text-muted-foreground">{archived ? "Keine archivierten Bilder gefunden." : "Keine Bilder gefunden. Lade ein Bild hoch oder ändere die Suche."}</p>}
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {media.data?.items.map(asset => <article key={asset.id} className="border rounded-lg overflow-hidden" data-testid={`media-${asset.id}`}>
        <div className="aspect-video bg-muted flex items-center justify-center"><img src={asset.url} alt={asset.name} loading="lazy" className="h-full w-full object-contain" /></div>
        <div className="p-3 space-y-2">
          <p className="font-medium text-sm truncate" title={asset.originalName}>{asset.name}</p>
          <p className="text-xs text-muted-foreground">{asset.width} × {asset.height} · {Math.ceil(asset.bytes / 1024)} KB</p>
          <select aria-label={`Ordner für ${asset.name}`} disabled={busy} className="w-full border rounded bg-background p-1 text-sm" value={asset.folderId ?? ""} onChange={event => void update(asset, { folderId: event.target.value ? Number(event.target.value) : null })}><option value="">Ohne Ordner</option>{folders.data?.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select>
          <div className="flex gap-2 flex-wrap">
            {onSelect && <Button size="sm" disabled={busy || !!asset.archivedAt} onClick={() => onSelect(asset.url)}>Bild verwenden</Button>}
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => { const name = window.prompt("Bild umbenennen", asset.name); if (name?.trim()) void update(asset, { name: name.trim() }); }}>Umbenennen</Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => void update(asset, { archived: !asset.archivedAt })}>{asset.archivedAt ? "Wiederherstellen" : "Archivieren"}</Button>
          </div>
        </div>
      </article>)}
    </div>
    <div className="flex gap-2 justify-end"><Button variant="outline" disabled={busy || !cursors.length} onClick={() => setCursors(cursors.slice(0, -1))}>Vorherige Bilder</Button><Button variant="outline" disabled={busy || !media.data?.nextCursor} onClick={() => { if (media.data?.nextCursor) setCursors([...cursors, media.data.nextCursor]); }}>Weitere Bilder</Button></div>
  </section>;
}

export function MediaLibraryPicker({ onSelect, disabled }: { onSelect: (url: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const capability = useQuery<{ libraryEditing: boolean }>({ queryKey: ["/api/funnels/editor-capabilities"], queryFn: async () => (await apiRequest("GET", "/api/funnels/editor-capabilities")).json(), staleTime: Infinity, retry: false });
  if (!capability.data?.libraryEditing) return null;
  return <><Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => setOpen(true)}><Image className="h-4 w-4 mr-2" />Aus Mediathek</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Mediathek</DialogTitle><DialogDescription>Ein Bild auswählen oder neue Bilder verwalten.</DialogDescription></DialogHeader>{open && <MediaLibrary onSelect={url => { onSelect(url); setOpen(false); }} />}</DialogContent></Dialog></>;
}
