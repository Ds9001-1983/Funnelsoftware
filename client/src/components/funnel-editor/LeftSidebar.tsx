import React from "react";
import { Layers, LayoutGrid, Settings } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEditorStore } from "./store/editor-store";
import type { LeftPanelView } from "./store/editor-types";
import { PageList } from "./PageList";
import { ElementPanel } from "./ElementPanel";
import { SettingsPanel } from "./SettingsPanel";

const TABS: { view: LeftPanelView; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { view: "pages", icon: Layers, label: "Seiten" },
  { view: "elements", icon: LayoutGrid, label: "Elemente" },
  { view: "settings", icon: Settings, label: "Einstellungen" },
];

/**
 * Linke Sidebar mit Tab-Navigation: Seiten | Elemente | Settings
 */
export function LeftSidebar() {
  const leftPanelView = useEditorStore((s) => s.leftPanelView);
  const setLeftPanelView = useEditorStore((s) => s.setLeftPanelView);

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Tab navigation */}
      <div className="flex border-b border-border shrink-0">
        {TABS.map(({ view, icon: Icon, label }) => (
          <Tooltip key={view}>
            <TooltipTrigger asChild>
              <button
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                  leftPanelView === view
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                onClick={() => setLeftPanelView(view)}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {leftPanelView === "pages" && <PagesView />}
        {leftPanelView === "elements" && <ElementPanel />}
        {leftPanelView === "settings" && <SettingsPanel />}
      </div>
    </div>
  );
}

/**
 * Seiten-View: PageList nimmt den vollen Platz ein.
 */
function PagesView() {
  return (
    <div className="h-full overflow-y-auto">
      <PageList fullHeight />
    </div>
  );
}
