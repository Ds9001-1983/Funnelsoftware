import { useState, useCallback, useRef } from "react";

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useHistory<T>(initialPresent: T, maxHistory: number = 50) {
  const [state, setState] = useState<HistoryState<T>>({
    past: [],
    present: initialPresent,
    future: [],
  });

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const set = useCallback((newPresent: T | ((prev: T) => T), recordHistory = true) => {
    setState((currentState) => {
      const resolvedPresent = typeof newPresent === "function"
        ? (newPresent as (prev: T) => T)(currentState.present)
        : newPresent;

      if (!recordHistory) {
        return { ...currentState, present: resolvedPresent };
      }

      return {
        past: [...currentState.past, currentState.present].slice(-maxHistory),
        present: resolvedPresent,
        future: [],
      };
    });
  }, [maxHistory]);

  const undo = useCallback(() => {
    setState((currentState) => {
      if (currentState.past.length === 0) return currentState;

      const previous = currentState.past[currentState.past.length - 1];
      const newPast = currentState.past.slice(0, -1);

      return {
        past: newPast,
        present: previous,
        future: [currentState.present, ...currentState.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((currentState) => {
      if (currentState.future.length === 0) return currentState;

      const next = currentState.future[0];
      const newFuture = currentState.future.slice(1);

      return {
        past: [...currentState.past, currentState.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((newPresent: T) => {
    setState({
      past: [],
      present: newPresent,
      future: [],
    });
  }, []);

  return {
    state: state.present,
    set,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
    historyLength: state.past.length,
  };
}

// Debounced auto-save hook
export function useAutoSave<T>(
  data: T,
  onSave: (data: T) => void,
  delay: number = 30000, // 30 seconds default
  enabled: boolean = true
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>(JSON.stringify(data));

  const triggerSave = useCallback(() => {
    const currentData = JSON.stringify(data);
    if (currentData !== lastSavedRef.current) {
      onSave(data);
      lastSavedRef.current = currentData;
    }
  }, [data, onSave]);

  // Clear existing timeout and set new one
  const scheduleAutoSave = useCallback(() => {
    if (!enabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(triggerSave, delay);
  }, [delay, enabled, triggerSave]);

  // Cancel auto-save
  const cancelAutoSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { scheduleAutoSave, cancelAutoSave, triggerSave };
}
