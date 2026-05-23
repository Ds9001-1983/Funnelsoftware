import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useHistory, useAutoSave } from "@/hooks/use-history";
import { useBeforeUnload } from "@/hooks/use-before-unload";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { loadFont } from "@/lib/font-loader";
import type { Funnel, FunnelPage } from "@shared/schema";

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

  // Initialize funnel from query
  useEffect(() => {
    if (funnel && !localFunnel) {
      resetHistory(funnel);
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
      const response = await apiRequest("PATCH", `/api/funnels/${id}`, data);
      return response.json();
    },
    // Exponential backoff: 1s → 2s → 4s, max 3 Versuche.
    // CSRF-/Auth-Fehler werden nicht retried (bringt nichts, gleiche Antwort).
    retry: (failureCount, error) => {
      if (failureCount >= 3) return false;
      const status = (error as { status?: number } | null)?.status;
      if (status === 401 || status === 403 || status === 404) return false;
      return true;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/funnels", id] });
      setHasChanges(false);
      setLastSavedAt(new Date());
    },
    onError: () => {
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
      saveMutation.mutate({
        name: localFunnel.name,
        description: localFunnel.description,
        pages: localFunnel.pages,
        theme: localFunnel.theme,
        status: localFunnel.status,
        abTests: localFunnel.abTests,
      });
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
    // Updaters
    updateLocalFunnel,
    updatePage,
  };
}
