import React from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Save,
  Eye,
  Globe,
  PanelLeftClose,
  PanelLeftOpen,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DeviceSelector } from "./DevicePreview";
import { useEditorStore } from "./store/editor-store";

interface EditorToolbarProps {
  onSave: () => void;
  onPublish?: () => void;
  onPreview?: () => void;
}

/**
 * Obere Toolbar des Editors mit Navigation, Undo/Redo, Geräte-Auswahl und Aktionen.
 */
export function EditorToolbar({ onSave, onPublish, onPreview }: EditorToolbarProps) {
  const [, navigate] = useLocation();
  const funnelName = useEditorStore((s) => s.funnelName);
  const updateFunnelName = useEditorStore((s) => s.updateFunnelName);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.canUndo());
  const canRedo = useEditorStore((s) => s.canRedo());
  const devicePreview = useEditorStore((s) => s.devicePreview);
  const setDevicePreview = useEditorStore((s) => s.setDevicePreview);
  const leftPanelOpen = useEditorStore((s) => s.leftPanelOpen);
  const toggleLeftPanel = useEditorStore((s) => s.toggleLeftPanel);
  const saveStatus = useEditorStore((s) => s.saveStatus);

  return (
    <div className="h-14 bg-card border-b border-border flex items-center px-4 gap-3 shrink-0">
      {/* Left: Back + Name */}
      <div className="flex items-center gap-3 min-w-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zurück zur Übersicht</TooltipContent>
        </Tooltip>

        <Input
          value={funnelName}
          onChange={(e) => updateFunnelName(e.target.value)}
          className="h-8 text-sm font-medium border-transparent hover:border-border focus:border-primary max-w-[200px]"
        />

        {/* Save status */}
        <div className="flex items-center gap-1.5 text-xs shrink-0">
          {saveStatus === "saved" && (
            <>
              <Check className="h-3 w-3 text-green-500" />
              <span className="text-muted-foreground">Gespeichert</span>
            </>
          )}
          {saveStatus === "saving" && (
            <>
              <Loader2 className="h-3 w-3 text-yellow-500 animate-spin" />
              <span className="text-muted-foreground">Speichert...</span>
            </>
          )}
          {saveStatus === "error" && (
            <>
              <AlertCircle className="h-3 w-3 text-destructive" />
              <span className="text-destructive">Fehler</span>
            </>
          )}
          {saveStatus === "unsaved" && (
            <span className="text-muted-foreground">Ungespeichert</span>
          )}
        </div>
      </div>

      {/* Center: Undo/Redo + Device Preview */}
      <div className="flex-1 flex items-center justify-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={undo}
              disabled={!canUndo}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Rückgängig (Ctrl+Z)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={redo}
              disabled={!canRedo}
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Wiederholen (Ctrl+Shift+Z)</TooltipContent>
        </Tooltip>

        <div className="mx-2 h-6 w-px bg-border" />

        <DeviceSelector
          selectedDevice={devicePreview}
          onDeviceChange={setDevicePreview}
        />
      </div>

      {/* Right: Panel toggle + Actions */}
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleLeftPanel}
            >
              {leftPanelOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{leftPanelOpen ? "Seitenleiste ausblenden" : "Seitenleiste einblenden"}</TooltipContent>
        </Tooltip>

        <div className="mx-1 h-6 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={onSave}
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Speichern
            </Button>
          </TooltipTrigger>
          <TooltipContent>Speichern (Ctrl+S)</TooltipContent>
        </Tooltip>

        {onPreview && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={onPreview}
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Vorschau
              </Button>
            </TooltipTrigger>
            <TooltipContent>Vorschau öffnen</TooltipContent>
          </Tooltip>
        )}

        {onPublish && (
          <Button
            size="sm"
            className="h-8"
            onClick={onPublish}
          >
            <Globe className="h-3.5 w-3.5 mr-1.5" />
            Veröffentlichen
          </Button>
        )}
      </div>
    </div>
  );
}
