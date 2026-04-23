import { useEffect } from "react";
import {
  Save,
  Globe,
  Eye,
  Undo2,
  Redo2,
  Settings,
  FlaskConical,
  GitBranch,
  FileText,
  Plus,
  Layers,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { pageTypeLabels, pageTypeIcons } from "./constants";
import type { FunnelPage, PageElement } from "@shared/schema";

export interface CommandPaletteActions {
  onSave: () => void;
  canSave: boolean;
  onPublish: () => void;
  onPreview: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onRedo: () => void;
  canRedo: boolean;
  onOpenSettings: () => void;
  onOpenABTests: () => void;
  onOpenLogicFlow: () => void;
  onJumpToPage: (pageIndex: number) => void;
  onAddPage: (type: FunnelPage["type"]) => void;
  onAddElement: (type: PageElement["type"]) => void;
}

interface CommandPaletteProps extends CommandPaletteActions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pages: FunnelPage[];
}

const ELEMENT_SUGGESTIONS: Array<{ type: PageElement["type"]; label: string }> = [
  { type: "heading", label: "Überschrift einfügen" },
  { type: "text", label: "Textblock einfügen" },
  { type: "button", label: "Button einfügen" },
  { type: "image", label: "Bild einfügen" },
  { type: "video", label: "Video einfügen" },
  { type: "input", label: "Eingabefeld einfügen" },
  { type: "radio", label: "Multiple-Choice einfügen" },
  { type: "testimonial", label: "Bewertung einfügen" },
  { type: "faq", label: "FAQ einfügen" },
  { type: "timer", label: "Timer einfügen" },
  { type: "list", label: "Liste einfügen" },
  { type: "divider", label: "Trennlinie einfügen" },
  { type: "spacer", label: "Abstand einfügen" },
];

const PAGE_TYPE_SUGGESTIONS: FunnelPage["type"][] = [
  "welcome",
  "question",
  "multiChoice",
  "contact",
  "calendar",
  "thankyou",
];

export function CommandPalette({
  open,
  onOpenChange,
  pages,
  onSave,
  canSave,
  onPublish,
  onPreview,
  onUndo,
  canUndo,
  onRedo,
  canRedo,
  onOpenSettings,
  onOpenABTests,
  onOpenLogicFlow,
  onJumpToPage,
  onAddPage,
  onAddElement,
}: CommandPaletteProps) {
  // Globales ⌘K / Ctrl+K öffnet/schließt.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  const run = (fn: () => void) => {
    onOpenChange(false);
    // Klein verzögert, damit Dialog zuerst schließt und kein Focus-Konflikt entsteht.
    setTimeout(fn, 0);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Aktion, Seite oder Element suchen…" />
      <CommandList>
        <CommandEmpty>Keine Treffer.</CommandEmpty>

        <CommandGroup heading="Aktionen">
          <CommandItem onSelect={() => run(onSave)} disabled={!canSave}>
            <Save />
            Speichern
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(onPreview)}>
            <Eye />
            Vorschau öffnen
          </CommandItem>
          <CommandItem onSelect={() => run(onPublish)}>
            <Globe />
            Veröffentlichen
          </CommandItem>
          <CommandItem onSelect={() => run(onUndo)} disabled={!canUndo}>
            <Undo2 />
            Rückgängig
            <CommandShortcut>⌘Z</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(onRedo)} disabled={!canRedo}>
            <Redo2 />
            Wiederholen
            <CommandShortcut>⌘⇧Z</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(onOpenSettings)}>
            <Settings />
            Einstellungen
          </CommandItem>
          <CommandItem onSelect={() => run(onOpenLogicFlow)}>
            <GitBranch />
            Flow-Ansicht
          </CommandItem>
          <CommandItem onSelect={() => run(onOpenABTests)}>
            <FlaskConical />
            A/B-Tests
          </CommandItem>
        </CommandGroup>

        {pages.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Seiten">
              {pages.map((page, idx) => (
                <CommandItem
                  key={page.id}
                  value={`page ${idx + 1} ${page.title} ${pageTypeLabels[page.type] ?? page.type}`}
                  onSelect={() => run(() => onJumpToPage(idx))}
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center text-xs">
                    {pageTypeIcons[page.type] ?? idx + 1}
                  </span>
                  <FileText className="!h-3 !w-3 text-muted-foreground -ml-1" />
                  <span className="truncate">
                    {idx + 1}. {page.title}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {pageTypeLabels[page.type] ?? page.type}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Element einfügen">
          {ELEMENT_SUGGESTIONS.map((s) => (
            <CommandItem
              key={s.type}
              value={`element ${s.type} ${s.label}`}
              onSelect={() => run(() => onAddElement(s.type))}
            >
              <Plus />
              {s.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Seite hinzufügen">
          {PAGE_TYPE_SUGGESTIONS.map((type) => (
            <CommandItem
              key={type}
              value={`page ${type} ${pageTypeLabels[type] ?? type}`}
              onSelect={() => run(() => onAddPage(type))}
            >
              <Layers />
              Neue Seite: {pageTypeLabels[type] ?? type}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
