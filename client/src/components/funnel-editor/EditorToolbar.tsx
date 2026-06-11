import {
  ArrowLeft,
  Save,
  Eye,
  Settings,
  Smartphone,
  Globe,
  Layers,
  GitBranch,
  Monitor,
  Tablet,
  Cloud,
  CloudOff,
  FlaskConical,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HistoryIndicator } from "./HistoryIndicator";
import { SaveStatusIndicator } from "./SaveStatusIndicator";
import type { Funnel, FunnelPage } from "@shared/schema";

interface EditorToolbarProps {
  localFunnel: Funnel;
  selectedPage: FunnelPage | undefined;
  saveStatus: "saved" | "dirty" | "saving" | "error";
  lastSavedAt: Date | null;
  hasChanges: boolean;
  isSavePending: boolean;
  isPublishPending: boolean;

  previewMode: "phone" | "tablet" | "desktop";
  setPreviewMode: (mode: "phone" | "tablet" | "desktop") => void;

  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  historyLength: number;

  autoSaveEnabled: boolean;
  setAutoSaveEnabled: (v: boolean) => void;
  lastAutoSave: Date | null;

  isMobile: boolean;
  showLeftSidebar: boolean;
  setShowLeftSidebar: (v: boolean) => void;

  onBack: () => void;
  onSave: () => void;
  onOpenLogicFlow: () => void;
  /** Optional — ohne Handler wird der A/B-Test-Button nicht gerendert (Feature deaktiviert). */
  onOpenABTests?: () => void;
  onOpenSettings: () => void;
  onOpenPublish: () => void;
  onOpenPreview: () => void;
}

/**
 * Top-Toolbar des Funnel-Editors. Aus dem funnel-editor.tsx-Monolithen
 * extrahiert (Stufe 3.1). Rein präsentational — gesamter State + Handler kommen
 * als Props rein.
 */
export function EditorToolbar({
  localFunnel,
  selectedPage,
  saveStatus,
  lastSavedAt,
  hasChanges,
  isSavePending,
  isPublishPending,
  previewMode,
  setPreviewMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  historyLength,
  autoSaveEnabled,
  setAutoSaveEnabled,
  lastAutoSave,
  isMobile,
  showLeftSidebar,
  setShowLeftSidebar,
  onBack,
  onSave,
  onOpenLogicFlow,
  onOpenABTests,
  onOpenSettings,
  onOpenPublish,
  onOpenPreview,
}: EditorToolbarProps) {
  const hasRunningABTest = (localFunnel.abTests || []).some(
    (t) => t.pageId === selectedPage?.id && t.status === "running",
  );

  return (
    <div className="h-12 border-b border-border bg-card flex items-center justify-between px-3 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          onClick={onBack}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {isMobile && (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 md:hidden"
            onClick={() => setShowLeftSidebar(!showLeftSidebar)}
          >
            <Layers className="h-4 w-4" />
          </Button>
        )}
        <span className="font-medium text-sm truncate">{localFunnel.name}</span>
        <Badge
          variant={localFunnel.status === "published" ? "default" : "secondary"}
          className="shrink-0 text-[10px]"
        >
          {localFunnel.status === "published" ? "Live" : "Entwurf"}
        </Badge>
        <SaveStatusIndicator status={saveStatus} lastSavedAt={lastSavedAt} onRetry={onSave} />
      </div>

      {/* Center - Device Toggle */}
      <div className="flex items-center bg-muted rounded-lg p-0.5">
        <Button
          size="icon"
          variant={previewMode === "phone" ? "secondary" : "ghost"}
          className="h-7 w-7"
          onClick={() => setPreviewMode("phone")}
        >
          <Smartphone className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant={previewMode === "tablet" ? "secondary" : "ghost"}
          className="h-7 w-7"
          onClick={() => setPreviewMode("tablet")}
        >
          <Tablet className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant={previewMode === "desktop" ? "secondary" : "ghost"}
          className="h-7 w-7"
          onClick={() => setPreviewMode("desktop")}
        >
          <Monitor className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-1">
        <HistoryIndicator
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={onUndo}
          onRedo={onRedo}
          historyLength={historyLength}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={autoSaveEnabled ? "Auto-Save deaktivieren" : "Auto-Save aktivieren"}
              onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
            >
              {autoSaveEnabled ? (
                <Cloud className="h-4 w-4 text-green-500" />
              ) : (
                <CloudOff className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {autoSaveEnabled
              ? `Auto-Save aktiv${lastAutoSave ? ` (${lastAutoSave.toLocaleTimeString()})` : ""}`
              : "Auto-Save deaktiviert"}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Flow-Ansicht öffnen"
              onClick={onOpenLogicFlow}
              data-testid="button-logic-flow"
            >
              <GitBranch className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Flow-Ansicht</TooltipContent>
        </Tooltip>
        {onOpenABTests && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 relative"
                aria-label="A/B-Tests öffnen"
                onClick={onOpenABTests}
                data-testid="button-abtests"
              >
                <FlaskConical className="h-4 w-4" />
                {hasRunningABTest && (
                  <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-green-500" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>A/B-Tests</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Einstellungen"
              onClick={onOpenSettings}
              data-testid="button-settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Einstellungen</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Vorschau in neuem Tab öffnen"
              onClick={onOpenPreview}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {localFunnel.status === "published" ? "Vorschau" : "Vorschau (Entwurf)"}
          </TooltipContent>
        </Tooltip>
        <div className="h-5 w-px bg-border mx-1 hidden sm:block" />
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-8"
          onClick={onSave}
          disabled={!hasChanges || isSavePending}
          data-testid="button-save"
        >
          <Save className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Speichern</span>
        </Button>
        <Button
          size="sm"
          className="gap-1.5 h-8"
          onClick={onOpenPublish}
          disabled={isPublishPending}
          data-testid="button-publish"
        >
          <Globe className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            {localFunnel.status === "published" ? "URL verwalten" : "Veröffentlichen"}
          </span>
        </Button>
      </div>
    </div>
  );
}
