import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useHistory, useAutoSave } from "@/hooks/use-history";
import { useBeforeUnload } from "@/hooks/use-before-unload";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { loadFont } from "@/lib/font-loader";
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
  };
}

/**
 * Daten-/Persistenz-Layer des Funnel-Editors: Funnel-Query, History (Undo/Redo),
 * Auto-Save mit Retry, sowie generische Update-Helfer für Funnel und einzelne
 * Seiten. Aus dem 1800-Zeilen-Monolithen extrahiert (Verhalten 1:1).
 *
 * Bewusst NICHT enthalten: UI-gekoppelte Mutationen (Veröffentlichen, Slug),
 * Clipboard, Tastatur-Shortcuts und alles JSX — die bleiben in der Page.
 */
export function useFunnelEditor(id: string | undefined) {
  const { toast } = useToast();

  // Auto-save toggles
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  // History state for undo/redo
  const {
    state: localFunnel,
    set: setLocalFunnel,
    undo,
    redo,
    reset: resetHistory,
    canUndo,
    canRedo,
    historyLength,
  } = useHistory<Funnel | null>(null);

  const [hasChanges, setHasChanges] = useState(false);

  useBeforeUnload(hasChanges, "Es gibt ungespeicherte Änderungen. Trotzdem schließen?");

  const { data: funnel, isLoading } = useQuery<Funnel>({
    queryKey: ["/api/funnels", id],
    enabled: !!id,
  });

  // Aktueller localFunnel für Mutation-Callbacks (stale-closure-sicher)
  const localFunnelRef = useRef<Funnel | null>(null);
  localFunnelRef.current = localFunnel;

  // Server-Stand für die Konfliktprüfung: Saves schicken das zuletzt bekannte
  // updatedAt mit; weicht es serverseitig ab, hat ein anderer Tab/Gerät
  // zwischenzeitlich gespeichert → 409 statt Last-Write-Wins.
  const expectedUpdatedAtRef = useRef<string | null>(null);

  // Initialize funnel from query
  useEffect(() => {
    if (funnel && !localFunnel) {
      resetHistory(funnel);
      expectedUpdatedAtRef.current = funnel.updatedAt ? String(funnel.updatedAt) : null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [funnel]);

  // Load selected font on funnel load
  useEffect(() => {
    if (localFunnel?.theme?.fontFamily) {
      loadFont(localFunnel.theme.fontFamily);
    }
  }, [localFunnel?.theme?.fontFamily]);

  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Funnel>) => {
      const body = {
        ...data,
        ...(expectedUpdatedAtRef.current
          ? { expectedUpdatedAt: expectedUpdatedAtRef.current }
          : {}),
      };
      const response = await apiRequest("PATCH", `/api/funnels/${id}`, body);
      return response.json() as Promise<Funnel>;
    },
    // Exponential backoff: 1s → 2s → 4s, max 3 Versuche.
    // CSRF-/Auth-/Konflikt-Fehler werden nicht retried (gleiche Antwort).
    retry: (failureCount, error) => {
      if (failureCount >= 3) return false;
      const status = (error as { status?: number } | null)?.status;
      if (status === 401 || status === 403 || status === 404 || status === 409) return false;
      return true;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/funnels", id] });
      if (data?.updatedAt) {
        expectedUpdatedAtRef.current = String(data.updatedAt);
      }

      const current = localFunnelRef.current;

      // Dirty-Flag nur zurücksetzen, wenn seit dem Absenden nichts mehr
      // geändert wurde — sonst gelten Edits während eines laufenden Saves
      // fälschlich als gespeichert und gehen beim Schließen verloren.
      const { status: _status, ...sentPayload } = variables as Partial<Funnel>;
      const stillEqual = current
        ? JSON.stringify(buildSavePayload(current)) === JSON.stringify(sentPayload)
        : true;
      setHasChanges(!stillEqual);
      setLastSavedAt(new Date());

      // Server-generierte Felder übernehmen — das Webhook-Secret entsteht
      // erst beim Speichern und war sonst bis zum Reload unsichtbar.
      if (current && data?.webhookSecret && current.webhookSecret !== data.webhookSecret) {
        setLocalFunnel({ ...current, webhookSecret: data.webhookSecret });
      }
    },
    onError: (error) => {
      const status = (error as { status?: number } | null)?.status;
      if (status === 409) {
        toast({
          title: "Konflikt: Funnel wurde woanders geändert",
          description:
            "Dieser Funnel wurde in einem anderen Tab oder auf einem anderen Gerät gespeichert. Bitte lade die Seite neu, bevor du weiterarbeitest.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Speichern fehlgeschlagen",
        description: "Nach mehreren Versuchen nicht gespeichert. Bitte Speichern-Button erneut drücken.",
        variant: "destructive",
      });
    },
  });

  const saveStatus: "saved" | "dirty" | "saving" | "error" = saveMutation.isPending
    ? "saving"
    : saveMutation.isError
      ? "error"
      : hasChanges
        ? "dirty"
        : "saved";

  // Auto-save functionality
  const performAutoSave = useCallback(() => {
    if (localFunnel && hasChanges && autoSaveEnabled) {
      // KEIN status im Autosave: Ein im Hintergrund laufender Autosave mit
      // lokalem (altem) Status könnte einen frisch veröffentlichten Funnel
      // wieder auf "draft" setzen. Status wird nur explizit gespeichert.
      saveMutation.mutate(buildSavePayload(localFunnel));
      setLastAutoSave(new Date());
    }
    // saveMutation absichtlich nicht in den Deps — sonst läuft der Effekt zu oft;
    // saveMutation ist eine stabile Referenz mit eigenem State.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localFunnel, hasChanges, autoSaveEnabled]);

  const { scheduleAutoSave } = useAutoSave(
    localFunnel,
    performAutoSave,
    5000, // 5 Sekunden nach letzter Änderung
    autoSaveEnabled && hasChanges,
  );

  // Schedule auto-save when changes occur
  useEffect(() => {
    if (hasChanges && autoSaveEnabled) {
      scheduleAutoSave();
    }
  }, [hasChanges, autoSaveEnabled, scheduleAutoSave]);

  // Externe PATCHes (Veröffentlichen, Slug) erhöhen updatedAt am Server —
  // ohne Sync würde der nächste Save fälschlich als Konflikt (409) abgelehnt.
  const noteServerUpdate = useCallback((updated: { updatedAt?: string | Date | null }) => {
    if (updated?.updatedAt) {
      expectedUpdatedAtRef.current = String(updated.updatedAt);
    }
  }, []);

  const updateLocalFunnel = useCallback(
    (updates: Partial<Funnel>) => {
      setLocalFunnel((prev) => {
        if (!prev) return prev;
        return { ...prev, ...updates };
      });
      setHasChanges(true);
    },
    [setLocalFunnel],
  );

  const updatePage = useCallback(
    (index: number, updates: Partial<FunnelPage>) => {
      setLocalFunnel((prev) => {
        if (!prev) return prev;
        const newPages = [...prev.pages];
        newPages[index] = { ...newPages[index], ...updates };
        return { ...prev, pages: newPages };
      });
      setHasChanges(true);
    },
    [setLocalFunnel],
  );

  return {
    // Query
    funnel,
    isLoading,
    // History
    localFunnel,
    setLocalFunnel,
    undo,
    redo,
    resetHistory,
    canUndo,
    canRedo,
    historyLength,
    // Change tracking
    hasChanges,
    setHasChanges,
    // Auto-save
    autoSaveEnabled,
    setAutoSaveEnabled,
    lastAutoSave,
    // Save
    lastSavedAt,
    saveMutation,
    saveStatus,
    noteServerUpdate,
    // Updaters
    updateLocalFunnel,
    updatePage,
  };
}
