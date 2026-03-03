import { useState, useCallback, useEffect } from "react";
import {
  Copy,
  Clipboard,
  ClipboardPaste,
  Trash2,
  MoveUp,
  MoveDown,
  Settings,
  Eye,
  Layers,
} from "lucide-react";

interface ContextMenuProps {
  x: number;
  y: number;
  visible: boolean;
  onClose: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onShowProperties?: () => void;
  onJumpToNavigator?: () => void;
  canPaste?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

interface MenuItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
  disabled?: boolean;
  danger?: boolean;
  dividerAfter?: boolean;
}

/**
 * Kontext-Menü für Elemente im Editor.
 * Erscheint bei Rechtsklick auf ein Element.
 */
export function ContextMenu({
  x,
  y,
  visible,
  onClose,
  onCopy,
  onCut,
  onPaste,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onShowProperties,
  onJumpToNavigator,
  canPaste = false,
  canMoveUp = true,
  canMoveDown = true,
}: ContextMenuProps) {
  useEffect(() => {
    if (visible) {
      const handleClickOutside = () => onClose();
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };

      document.addEventListener("click", handleClickOutside);
      document.addEventListener("keydown", handleEscape);

      return () => {
        document.removeEventListener("click", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [visible, onClose]);

  if (!visible) return null;

  const menuItems: MenuItem[] = [
    {
      label: "Kopieren",
      icon: Copy,
      shortcut: "Ctrl+C",
      action: () => {
        onCopy?.();
        onClose();
      },
    },
    {
      label: "Ausschneiden",
      icon: Clipboard,
      shortcut: "Ctrl+X",
      action: () => {
        onCut?.();
        onClose();
      },
    },
    {
      label: "Einfügen",
      icon: ClipboardPaste,
      shortcut: "Ctrl+V",
      action: () => {
        onPaste?.();
        onClose();
      },
      disabled: !canPaste,
      dividerAfter: true,
    },
    {
      label: "Duplizieren",
      icon: Copy,
      shortcut: "Ctrl+D",
      action: () => {
        onDuplicate?.();
        onClose();
      },
      dividerAfter: true,
    },
    {
      label: "Nach oben",
      icon: MoveUp,
      action: () => {
        onMoveUp?.();
        onClose();
      },
      disabled: !canMoveUp,
    },
    {
      label: "Nach unten",
      icon: MoveDown,
      action: () => {
        onMoveDown?.();
        onClose();
      },
      disabled: !canMoveDown,
      dividerAfter: true,
    },
    {
      label: "Eigenschaften",
      icon: Settings,
      action: () => {
        onShowProperties?.();
        onClose();
      },
    },
    {
      label: "Im Navigator zeigen",
      icon: Layers,
      action: () => {
        onJumpToNavigator?.();
        onClose();
      },
      dividerAfter: true,
    },
    {
      label: "Löschen",
      icon: Trash2,
      shortcut: "Del",
      action: () => {
        onDelete?.();
        onClose();
      },
      danger: true,
    },
  ];

  // Adjust position to stay within viewport
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 400);

  return (
    <div
      className="fixed z-[100] min-w-[180px] bg-white rounded-lg shadow-xl border py-1 animate-in fade-in-0 zoom-in-95"
      style={{
        left: adjustedX,
        top: adjustedY,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item, index) => (
        <div key={index}>
          <button
            className={`
              w-full flex items-center gap-3 px-3 py-1.5 text-sm text-left transition-colors
              ${item.disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-muted"}
              ${item.danger ? "text-red-600 hover:bg-red-50" : ""}
            `}
            onClick={item.disabled ? undefined : item.action}
            disabled={item.disabled}
          >
            <item.icon className="h-4 w-4" />
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <span className="text-xs text-muted-foreground">{item.shortcut}</span>
            )}
          </button>
          {item.dividerAfter && <div className="h-px bg-border my-1" />}
        </div>
      ))}
    </div>
  );
}

/**
 * Hook für Kontext-Menü-Logik.
 */
export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    elementId: string | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    elementId: null,
  });

  const showContextMenu = useCallback(
    (e: React.MouseEvent, elementId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        elementId,
      });
    },
    []
  );

  const hideContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false, elementId: null }));
  }, []);

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu,
  };
}
