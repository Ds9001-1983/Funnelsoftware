import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useHistory } from "@/hooks/use-history";
import { useBeforeUnload } from "@/hooks/use-before-unload";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { loadFont } from "@/lib/font-loader";
import { FunnelWriteQueue, type FunnelWrite } from "@/lib/funnel-write-queue";
import { readRecovery, storeRecovery, clearRecovery } from "@/lib/editor-recovery";
import { canEditFunnelDocument, contentKey, documentFromFunnel, type FunnelDocument } from "@shared/funnel-document";
import type { Funnel, FunnelPage } from "@shared/schema";

/**
 * Persistierbare Funnel-Felder für PATCH-Saves. Gemeinsame Quelle für
 * Autosave und manuelles Speichern — vorher gingen Felder verloren, die
 * nur einer der beiden Pfade kannte (Webhook/GTM wurden NIE gesendet,
 * CAPI nur beim manuellen Save). Bewusst ohne `status` (siehe Autosave)
 * und ohne `webhookSecret` (server-verwaltet).
 */
export function buildSavePayload(funnel: Funnel): Partial<Funnel> {
  return {
    name: funnel.name,
    description: funnel.description,
    pages: funnel.pages,
    theme: funnel.theme,
    abTests: funnel.abTests,
    webhookUrl: funnel.webhookUrl,
    webhookEnabled: funnel.webhookEnabled,
    gtmId: funnel.gtmId,
    metaPixelId: funnel.metaPixelId,
    metaCapiToken: funnel.metaCapiToken,
    capiEnabled: funnel.capiEnabled,
    impressumUrl: funnel.impressumUrl,
    datenschutzUrl: funnel.datenschutzUrl,
    ogImageUrl: funnel.ogImageUrl,
  };
}

/** All writes share a queue; local edits are never replaced by an older response. */
export function useFunnelEditor(id: string | undefined, layoutEditing = false, routingEditing = false, personalizationEditing = false) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingWrites, setPendingWrites] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [recovery, setRecovery] = useState<FunnelDocument | null>(null);
  const [recoveryUnavailable, setRecoveryUnavailable] = useState(false);
  const history = useHistory<Funnel | null>(null);
  const { state: localFunnel, set: setLocalFunnel, reset: resetHistory } = history;
  const localRef = useRef(localFunnel);
  localRef.current = localFunnel;
  const savedPayload = useRef("");
  const serverMetadata = useRef<Partial<Funnel>>({});
  const queue = useRef<FunnelWriteQueue | null>(null);
  const { data: funnel, isLoading } = useQuery<Funnel>({ queryKey: ["/api/funnels", id], enabled: !!id });

  useBeforeUnload(hasChanges || pendingWrites > 0, "Es gibt ungespeicherte Änderungen. Trotzdem schließen?");

  useEffect(() => {
    if (!funnel || queue.current) return;
    savedPayload.current = contentKey(buildSavePayload(funnel));
    serverMetadata.current = { documentVersion: funnel.documentVersion, status: funnel.status, slug: funnel.slug, editVersion: funnel.editVersion,
      publishedRevisionId: funnel.publishedRevisionId, updatedAt: funnel.updatedAt, webhookSecret: funnel.webhookSecret };
    resetHistory(funnel);
    if (!canEditFunnelDocument(funnel, layoutEditing, routingEditing, personalizationEditing)) return;
    const recovered = readRecovery(funnel);
    if (recovered && contentKey(recovered) !== contentKey(documentFromFunnel(funnel))) setRecovery(recovered);
    else clearRecovery(funnel);
    queue.current = new FunnelWriteQueue(funnel.editVersion ?? 0, async ({ data, control, restoreId }) => {
      const url = `/api/funnels/${funnel.id}`;
      const response = restoreId === undefined
        ? await apiRequest("PATCH", url, { ...data, ...control })
        : await apiRequest("POST", `${url}/revisions/${restoreId}/restore`, control);
      return response.json();
    }, (updated, write) => {
      savedPayload.current = contentKey(buildSavePayload(updated));
      serverMetadata.current = { documentVersion: updated.documentVersion, status: updated.status, slug: updated.slug, editVersion: updated.editVersion,
        publishedRevisionId: updated.publishedRevisionId, updatedAt: updated.updatedAt, webhookSecret: updated.webhookSecret };
      // Metadata always follows the server. Content changed while the request
      // was in flight stays local, including edits made during publication.
      setLocalFunnel(current => {
        if (!current) return current;
        const merged = { ...current, documentVersion: updated.documentVersion, editVersion: updated.editVersion, editorProtocol: updated.editorProtocol,
          updatedAt: updated.updatedAt, publishedRevisionId: updated.publishedRevisionId,
          status: updated.status, slug: updated.slug, webhookSecret: updated.webhookSecret };
        if (write.restoreId !== undefined) return updated;
        return merged;
      }, false);
      setLastSavedAt(new Date());
      setSaveError(null);
      queryClient.setQueryData(["/api/funnels", id], updated);
      void queryClient.invalidateQueries({ queryKey: ["/api/funnels"] });
    });
  }, [funnel, id, resetHistory, setLocalFunnel, queryClient, layoutEditing, routingEditing, personalizationEditing]);

  useEffect(() => {
    if (localFunnel) setHasChanges(contentKey(buildSavePayload(localFunnel)) !== savedPayload.current);
  }, [localFunnel]);
  useEffect(() => {
    if (localFunnel?.theme?.fontFamily) loadFont(localFunnel.theme.fontFamily);
  }, [localFunnel?.theme?.fontFamily]);
  useEffect(() => {
    if (!localFunnel || !canEditFunnelDocument(localFunnel, layoutEditing, routingEditing, personalizationEditing) || recovery) return;
    // Synchronous storage also covers a tab close directly after the last edit.
    if (hasChanges) setRecoveryUnavailable(!storeRecovery(localFunnel));
    else if (!pendingWrites) clearRecovery(localFunnel);
  }, [localFunnel, hasChanges, pendingWrites, recovery, layoutEditing, routingEditing, personalizationEditing]);

  const write = useCallback(async (request: FunnelWrite) => {
    if (localRef.current && !canEditFunnelDocument(localRef.current, layoutEditing, routingEditing, personalizationEditing)) throw new Error("Dieser Funnel kann mit dieser Editorversion nur angesehen werden.");
    if (!queue.current) throw new Error("Funnel wird noch geladen.");
    setPendingWrites(count => count + 1);
    try { return await queue.current.write({ ...request, documentVersion: personalizationEditing ? 4 : routingEditing ? 3 : layoutEditing ? 2 : 1 }); }
    catch (error) {
      const isConflict = (error as { status?: number })?.status === 409;
      if (isConflict) setConflict(true);
      const message = error instanceof Error ? error.message : "Speichern fehlgeschlagen.";
      setSaveError(message);
      toast({ title: isConflict ? "Änderungen aus einer anderen Sitzung" : "Nicht gespeichert",
        description: isConflict ? "Dein lokaler Inhalt bleibt erhalten. Sichere ihn als Kopie, bevor du den aktuellen Stand lädst." : message,
        variant: "destructive" });
      throw error;
    } finally { setPendingWrites(count => count - 1); }
  }, [toast, layoutEditing, routingEditing, personalizationEditing]);

  const saveMutation = useMutation({ mutationFn: (data: Partial<Funnel>) => write({ data }), retry: false });
  const saveCurrent = useCallback(async (extra: Partial<Funnel> = {}, publish = false) => {
    if (!localRef.current) throw new Error("Funnel wird noch geladen.");
    return write({ data: { ...buildSavePayload(localRef.current), ...extra }, publish });
  }, [write]);
  const saveBeforeLeave = useCallback(async () => {
    do { await saveCurrent(); }
    while (localRef.current && contentKey(buildSavePayload(localRef.current)) !== savedPayload.current);
  }, [saveCurrent]);
  const restoreRevision = useCallback(async (revisionId: number) => {
    // The dialog blocks editing while restoration runs; the current draft is
    // saved first so that it too remains recoverable in the version history.
    await saveCurrent();
    return write({ data: {}, restoreId: revisionId });
  }, [saveCurrent, write]);

  useEffect(() => {
    if (!localFunnel || !canEditFunnelDocument(localFunnel, layoutEditing, routingEditing, personalizationEditing) || !autoSaveEnabled || !hasChanges || pendingWrites || saveError || recovery) return;
    const timer = setTimeout(() => {
      void saveCurrent().then(() => setLastAutoSave(new Date())).catch(() => undefined);
    }, 5000);
    return () => clearTimeout(timer);
  }, [localFunnel, autoSaveEnabled, hasChanges, pendingWrites, saveError, recovery, saveCurrent, layoutEditing, routingEditing, personalizationEditing]);

  const updateLocalFunnel = useCallback((updates: Partial<Funnel>) => {
    setLocalFunnel(prev => prev ? { ...prev, ...updates } : prev);
    setHasChanges(true);
  }, [setLocalFunnel]);
  const updatePage = useCallback((index: number, updates: Partial<FunnelPage>) => {
    setLocalFunnel(prev => prev ? { ...prev, pages: prev.pages.map((page, i) => i === index ? { ...page, ...updates } : page) } : prev);
    setHasChanges(true);
  }, [setLocalFunnel]);
  const undo = useCallback(() => {
    history.undo(); setLocalFunnel(current => current ? { ...current, ...serverMetadata.current } : current, false);
  }, [history.undo, setLocalFunnel]);
  const redo = useCallback(() => {
    history.redo(); setLocalFunnel(current => current ? { ...current, ...serverMetadata.current } : current, false);
  }, [history.redo, setLocalFunnel]);
  const discardRecovery = useCallback(() => { if (localRef.current) clearRecovery(localRef.current); setRecovery(null); }, []);
  const saveStatus: "saved" | "dirty" | "saving" | "error" = pendingWrites ? "saving" : saveError ? "error" : hasChanges ? "dirty" : "saved";

  return {
    funnel, isLoading, localFunnel, setLocalFunnel, resetHistory,
    undo, redo, canUndo: history.canUndo, canRedo: history.canRedo, historyLength: history.historyLength,
    hasChanges, setHasChanges, autoSaveEnabled, setAutoSaveEnabled, lastAutoSave, lastSavedAt,
    saveMutation, saveStatus, saveCurrent, saveBeforeLeave, restoreRevision, pendingWrites, conflict, saveError,
    recovery, discardRecovery, recoveryUnavailable, updateLocalFunnel, updatePage,
  };
}
