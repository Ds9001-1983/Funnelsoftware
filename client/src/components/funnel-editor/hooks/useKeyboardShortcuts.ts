import { useEffect } from "react";
import { useEditorStore } from "../store/editor-store";

/**
 * Globale Keyboard-Shortcuts für den Editor.
 */
export function useKeyboardShortcuts(onSave: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useEditorStore.getState();

      // Skip if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true"
      ) {
        // Only handle Escape in inputs
        if (e.key === "Escape") {
          target.blur();
        }
        return;
      }

      // Ctrl+Z - Undo
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        state.undo();
        return;
      }

      // Ctrl+Shift+Z - Redo
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") {
        e.preventDefault();
        state.redo();
        return;
      }

      // Ctrl+S - Save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        onSave();
        return;
      }

      // Ctrl+D - Duplicate element
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        if (state.selectedElementId) {
          state.duplicateElement(state.selectedElementId);
        }
        return;
      }

      // Delete/Backspace - Delete selected element
      if (e.key === "Delete" || e.key === "Backspace") {
        if (state.selectedElementId) {
          e.preventDefault();
          state.deleteElement(state.selectedElementId);
        }
        return;
      }

      // Escape - Deselect element
      if (e.key === "Escape") {
        if (state.selectedElementId) {
          state.selectElement(null);
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSave]);
}
