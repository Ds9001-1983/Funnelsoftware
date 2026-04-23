import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Shortcut {
  keys: string[];
  label: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: Shortcut[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Allgemein",
    shortcuts: [
      { keys: ["⌘", "K"], label: "Command-Palette öffnen" },
      { keys: ["⌘", "S"], label: "Speichern" },
      { keys: ["⌘", "Z"], label: "Rückgängig" },
      { keys: ["⌘", "⇧", "Z"], label: "Wiederholen" },
      { keys: ["?"], label: "Diese Hilfe anzeigen" },
    ],
  },
  {
    title: "Elemente",
    shortcuts: [
      { keys: ["⌘", "C"], label: "Kopieren" },
      { keys: ["⌘", "X"], label: "Ausschneiden" },
      { keys: ["⌘", "V"], label: "Einfügen" },
      { keys: ["⌘", "D"], label: "Duplizieren" },
      { keys: ["⌫"], label: "Löschen" },
      { keys: ["⌘", "↑"], label: "Nach oben verschieben" },
      { keys: ["⌘", "↓"], label: "Nach unten verschieben" },
      { keys: ["Doppelklick"], label: "Inline-Text editieren" },
      { keys: ["Rechtsklick"], label: "Kontextmenü öffnen" },
    ],
  },
];

interface ShortcutOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded border bg-muted text-xs font-medium text-foreground shadow-sm">
      {children}
    </kbd>
  );
}

export function ShortcutOverlay({ open, onOpenChange }: ShortcutOverlayProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tastaturkürzel</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {group.title}
              </h4>
              <div className="space-y-1.5">
                {group.shortcuts.map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{s.label}</span>
                    <div className="flex items-center gap-1">
                      {s.keys.map((key, i) => (
                        <Kbd key={i}>{key}</Kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-2 border-t">
            Auf Windows/Linux: <Kbd>Strg</Kbd> statt <Kbd>⌘</Kbd>.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
