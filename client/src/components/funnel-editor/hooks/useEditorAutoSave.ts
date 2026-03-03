import { useEffect, useRef, useCallback } from "react";
import { useEditorStore } from "../store/editor-store";

const AUTO_SAVE_DELAY = 3000; // 3 seconds

/**
 * Auto-Save Hook: Speichert 3 Sekunden nach der letzten Änderung.
 */
export function useEditorAutoSave(onSave: () => Promise<void>) {
  const saveStatus = useEditorStore((s) => s.saveStatus);
  const setSaveStatus = useEditorStore((s) => s.setSaveStatus);
  const markSaved = useEditorStore((s) => s.markSaved);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  const doSave = useCallback(async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setSaveStatus("saving");

    try {
      await onSave();
      markSaved();
    } catch {
      setSaveStatus("error");
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave, setSaveStatus, markSaved]);

  useEffect(() => {
    if (saveStatus !== "unsaved") return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      doSave();
    }, AUTO_SAVE_DELAY);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [saveStatus, doSave]);

  // Trigger manual save
  const triggerSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    doSave();
  }, [doSave]);

  return { triggerSave };
}
