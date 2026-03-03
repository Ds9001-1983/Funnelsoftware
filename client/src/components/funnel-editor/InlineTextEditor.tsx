import { useState, useRef, useEffect, useCallback } from "react";
import { Bold, Italic, Underline, Link, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface InlineTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onStyleChange?: (styles: TextStyles) => void;
  styles?: TextStyles;
  placeholder?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  editable?: boolean;
}

interface TextStyles {
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  textAlign?: "left" | "center" | "right";
  color?: string;
  fontSize?: string;
}

interface ToolbarPosition {
  top: number;
  left: number;
}

/**
 * Inline-Toolbar für Textformatierung.
 * Erscheint über dem ausgewählten Text.
 */
function InlineToolbar({
  position,
  styles,
  onStyleChange,
  onAddLink,
  visible,
}: {
  position: ToolbarPosition;
  styles: TextStyles;
  onStyleChange: (styles: Partial<TextStyles>) => void;
  onAddLink: () => void;
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <div
      className="fixed z-50 flex items-center gap-0.5 p-1 bg-white rounded-lg shadow-lg border animate-in fade-in-0 zoom-in-95"
      style={{
        top: position.top - 48,
        left: position.left,
        transform: "translateX(-50%)",
      }}
    >
      <Button
        size="sm"
        variant={styles.fontWeight === "bold" ? "secondary" : "ghost"}
        className="h-7 w-7 p-0"
        onClick={() =>
          onStyleChange({ fontWeight: styles.fontWeight === "bold" ? "normal" : "bold" })
        }
      >
        <Bold className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="sm"
        variant={styles.fontStyle === "italic" ? "secondary" : "ghost"}
        className="h-7 w-7 p-0"
        onClick={() =>
          onStyleChange({ fontStyle: styles.fontStyle === "italic" ? "normal" : "italic" })
        }
      >
        <Italic className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="sm"
        variant={styles.textDecoration === "underline" ? "secondary" : "ghost"}
        className="h-7 w-7 p-0"
        onClick={() =>
          onStyleChange({
            textDecoration: styles.textDecoration === "underline" ? "none" : "underline",
          })
        }
      >
        <Underline className="h-3.5 w-3.5" />
      </Button>

      <div className="w-px h-4 bg-border mx-1" />

      <Button
        size="sm"
        variant={styles.textAlign === "left" ? "secondary" : "ghost"}
        className="h-7 w-7 p-0"
        onClick={() => onStyleChange({ textAlign: "left" })}
      >
        <AlignLeft className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="sm"
        variant={!styles.textAlign || styles.textAlign === "center" ? "secondary" : "ghost"}
        className="h-7 w-7 p-0"
        onClick={() => onStyleChange({ textAlign: "center" })}
      >
        <AlignCenter className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="sm"
        variant={styles.textAlign === "right" ? "secondary" : "ghost"}
        className="h-7 w-7 p-0"
        onClick={() => onStyleChange({ textAlign: "right" })}
      >
        <AlignRight className="h-3.5 w-3.5" />
      </Button>

      <div className="w-px h-4 bg-border mx-1" />

      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
            <Link className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2">
          <Input placeholder="URL eingeben..." className="h-8 text-sm" />
          <Button size="sm" className="w-full mt-2 h-7">
            Link einfügen
          </Button>
        </PopoverContent>
      </Popover>

      <div className="w-px h-4 bg-border mx-1" />

      <input
        type="color"
        value={styles.color || "#1a1a1a"}
        onChange={(e) => onStyleChange({ color: e.target.value })}
        className="w-6 h-6 rounded cursor-pointer border-0"
        title="Textfarbe"
      />
    </div>
  );
}

/**
 * Inline-Editor für Textelemente.
 * Ermöglicht direktes Bearbeiten von Text im Preview.
 */
export function InlineTextEditor({
  content,
  onChange,
  onStyleChange,
  styles = {},
  placeholder = "Text eingeben...",
  as: Component = "p",
  className = "",
  editable = true,
}: InlineTextEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(content);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition>({ top: 0, left: 0 });
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    setShowToolbar(false);
    if (localContent !== content) {
      onChange(localContent);
    }
  }, [localContent, content, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsEditing(false);
        setShowToolbar(false);
        setLocalContent(content);
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleBlur();
      }
    },
    [content, handleBlur]
  );

  const handleSelect = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0 && editorRef.current) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setToolbarPosition({
        top: rect.top + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX,
      });
      setShowToolbar(true);
    } else {
      setShowToolbar(false);
    }
  }, []);

  const handleStyleChange = useCallback(
    (newStyles: Partial<TextStyles>) => {
      const updatedStyles = { ...styles, ...newStyles };
      onStyleChange?.(updatedStyles);
    },
    [styles, onStyleChange]
  );

  if (!editable) {
    return (
      <Component
        className={className}
        style={{
          fontWeight: styles.fontWeight,
          fontStyle: styles.fontStyle,
          textDecoration: styles.textDecoration,
          textAlign: styles.textAlign,
          color: styles.color,
          fontSize: styles.fontSize,
        }}
      >
        {content || placeholder}
      </Component>
    );
  }

  return (
    <>
      <InlineToolbar
        position={toolbarPosition}
        styles={styles}
        onStyleChange={handleStyleChange}
        onAddLink={() => {}}
        visible={showToolbar && isEditing}
      />

      <div
        ref={editorRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        className={`
          outline-none cursor-text transition-all rounded
          ${isEditing ? "ring-2 ring-primary/50 bg-primary/5 p-1 -m-1" : "hover:bg-primary/5"}
          ${!localContent && !isEditing ? "text-muted-foreground/50" : ""}
          ${className}
        `}
        style={{
          fontWeight: styles.fontWeight,
          fontStyle: styles.fontStyle,
          textDecoration: styles.textDecoration,
          textAlign: styles.textAlign,
          color: styles.color,
          fontSize: styles.fontSize,
        }}
        onClick={() => setIsEditing(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        onInput={(e) => setLocalContent(e.currentTarget.textContent || "")}
      >
        {localContent || placeholder}
      </div>
    </>
  );
}

/**
 * Wrapper für Heading-Elemente mit Inline-Editing.
 */
export function InlineHeadingEditor({
  content,
  onChange,
  onStyleChange,
  styles,
  level = 2,
  ...props
}: InlineTextEditorProps & { level?: 1 | 2 | 3 }) {
  const tags: Record<number, "h1" | "h2" | "h3"> = { 1: "h1", 2: "h2", 3: "h3" };
  return (
    <InlineTextEditor
      content={content}
      onChange={onChange}
      onStyleChange={onStyleChange}
      styles={styles}
      as={tags[level]}
      className="font-bold"
      placeholder="Überschrift..."
      {...props}
    />
  );
}
