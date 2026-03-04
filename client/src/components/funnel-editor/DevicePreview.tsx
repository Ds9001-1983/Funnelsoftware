import { useState } from "react";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CanvasControls } from "@/components/funnel-editor/CanvasControls";

export type DeviceType = "desktop" | "tablet" | "mobile";

interface DeviceConfig {
  type: DeviceType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  width: number;
  maxWidth: string;
}

const devices: DeviceConfig[] = [
  { type: "desktop", label: "Desktop", icon: Monitor, width: 1200, maxWidth: "100%" },
  { type: "tablet", label: "Tablet", icon: Tablet, width: 768, maxWidth: "768px" },
  { type: "mobile", label: "Mobile", icon: Smartphone, width: 375, maxWidth: "375px" },
];

interface DevicePreviewProps {
  selectedDevice: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
}

/**
 * Geräte-Auswahl für die Vorschau im Editor.
 * Ermöglicht das Umschalten zwischen Desktop, Tablet und Mobile-Ansicht.
 */
export function DeviceSelector({ selectedDevice, onDeviceChange }: DevicePreviewProps) {
  return (
    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
      {devices.map((device) => {
        const Icon = device.icon;
        const isSelected = selectedDevice === device.type;

        return (
          <Tooltip key={device.type}>
            <TooltipTrigger asChild>
              <Button
                variant={isSelected ? "secondary" : "ghost"}
                size="sm"
                className={`h-8 w-8 p-0 transition-all ${isSelected ? "bg-background shadow-sm" : ""}`}
                onClick={() => onDeviceChange(device.type)}
              >
                <Icon className={`h-4 w-4 transition-colors ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{device.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

interface DeviceFrameProps {
  device: DeviceType;
  children: React.ReactNode;
  className?: string;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

/**
 * Container für die Geräte-Vorschau.
 * Zeigt den Inhalt in einem responsiven Container ohne störende Frames an.
 * Die Breite passt sich dem ausgewählten Gerät an.
 */
export function DeviceFrame({ device, children, className = "", zoom = 100, onZoomChange }: DeviceFrameProps) {
  const config = devices.find((d) => d.type === device) || devices[0];
  const [localZoom, setLocalZoom] = useState(zoom);
  const effectiveZoom = onZoomChange ? zoom : localZoom;
  const handleZoomChange = onZoomChange || setLocalZoom;

  return (
    <div
      className={`mx-auto bg-white rounded-lg shadow-sm border ${className}`}
      style={{
        maxWidth: config.maxWidth,
        width: "100%",
      }}
    >
      {/* Simpler GeräteIndikator am oberen Rand */}
      <div className="h-1 bg-gradient-to-r from-primary/20 to-primary/5 rounded-t-lg" />

      {/* Canvas Controls */}
      <div className="flex justify-center py-1.5 border-b bg-muted/30">
        <CanvasControls zoom={effectiveZoom} onZoomChange={handleZoomChange} />
      </div>

      {/* Inhalt mit Zoom */}
      <div className="w-full overflow-auto" style={{ maxHeight: "70vh" }}>
        <div
          style={{
            transform: `scale(${effectiveZoom / 100})`,
            transformOrigin: "top center",
            width: `${10000 / effectiveZoom}%`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook für die Geräte-Vorschau.
 * Verwaltet den aktuellen Gerätetyp und gibt die entsprechenden Dimensionen zurück.
 */
export function useDevicePreview(initialDevice: DeviceType = "desktop") {
  const [device, setDevice] = useState<DeviceType>(initialDevice);

  const config = devices.find((d) => d.type === device) || devices[0];

  return {
    device,
    setDevice,
    width: config.width,
    maxWidth: config.maxWidth,
    isMobile: device === "mobile",
    isTablet: device === "tablet",
    isDesktop: device === "desktop",
  };
}

export { devices };
