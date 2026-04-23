import { useState, useEffect, useRef, useCallback, type CSSProperties } from "react";

interface InlineEditableProps {
  value: string;
  onCommit: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  style?: CSSProperties;
  /** Render-Fn für den Read-Modus. Darf den HTML-Tag bestimmen (h3, p, button-label, …). */
  renderDisplay: (value: string) => React.ReactNode;
}

/**
 * Inline-Editor mit Doppelklick-Trigger für Canvas-Elemente.
 *
 * Read-Modus: rendert das übergebene Element (renderDisplay) — Single-Click
 * fällt durch zur Parent-Selektion.
 * Edit-Modus: `<input>` (default) oder `<textarea>` (multiline=true).
 *
 * Commit: Enter (single-line), ⌘/Ctrl+Enter (multi-line), Blur.
 * Cancel: Escape.
 * Stoppt Pointer-Events während Edit, damit DnD nicht triggert.
 */
export function InlineEditable({
  value,
  onCommit,
  multiline = false,
  placeholder,
  className,
  style,
  renderDisplay,
}: InlineEditableProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select?.();
    }
  }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    if (draft !== value) onCommit(draft);
  }, [draft, value, onCommit]);

  const cancel = useCallback(() => {
    setDraft(value);
    setEditing(false);
  }, [value]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cancel();
        return;
      }
      if (e.key === "Enter") {
        if (multiline && !(e.metaKey || e.ctrlKey)) return;
        e.preventDefault();
        commit();
      }
    },
    [commit, cancel, multiline],
  );

  if (editing) {
    const common = {
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: handleKeyDown,
      onClick: (e: React.MouseEvent) => e.stopPropagation(),
      placeholder,
      className: `${className ?? ""} bg-background/80 ring-2 ring-primary rounded px-1 -mx-1 outline-none`,
      style,
      "data-inline-editing": "true",
    };
    return multiline ? (
      <textarea
        {...common}
        ref={(node) => {
          inputRef.current = node;
        }}
        rows={3}
      />
    ) : (
      <input
        {...common}
        ref={(node) => {
          inputRef.current = node;
        }}
      />
    );
  }

  return (
    <span onDoubleClick={handleDoubleClick} className="cursor-text">
      {renderDisplay(value)}
    </span>
  );
}
