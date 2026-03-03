import React, { useState, useCallback, useRef, useEffect } from "react";

interface InlineEditableProps {
  value: string;
  onChange: (value: string) => void;
  tag?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
}

/**
 * Inline-editierbares Textelement.
 * Doppelklick aktiviert den Edit-Modus, Blur oder Escape speichert.
 */
export function InlineEditable({
  value,
  onChange,
  tag: Tag = "p",
  className = "",
  style,
  placeholder = "Text eingeben...",
}: InlineEditableProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && ref.current) {
      ref.current.focus();
      // Place cursor at end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    const newValue = ref.current?.textContent || "";
    if (newValue !== value) {
      onChange(newValue);
    }
  }, [value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsEditing(false);
      if (ref.current) {
        ref.current.textContent = value;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
  }, [value, handleBlur]);

  if (isEditing) {
    return (
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className={`outline-none border-b-2 border-primary/50 ${className}`}
        style={style}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      >
        {localValue}
      </div>
    );
  }

  return (
    <Tag
      className={`cursor-text ${className}`}
      style={style}
      onDoubleClick={handleDoubleClick}
    >
      {value || <span className="text-muted-foreground opacity-50">{placeholder}</span>}
    </Tag>
  );
}
