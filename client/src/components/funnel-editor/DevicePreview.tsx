import { useState } from "react";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
}

/**
 * Container für die Geräte-Vorschau.
 * Zeigt den Inhalt in einem responsiven Container ohne störende Frames an.
 * Die Breite passt sich dem ausgewählten Gerät an.
 */
export function DeviceFrame({ device, children, className = "" }: DeviceFrameProps) {
  const config = devices.find((d) => d.type === device) || devices[0];

  return (
    <div
      className={`mx-auto bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 ${className}`}
      style={{
        maxWidth: config.maxWidth,
        width: "100%",
      }}
    >
      {/* Simpler Geräte-Indikator am oberen Rand */}
      <div className="h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />

      {/* Inhalt */}
      <div className="w-full h-full overflow-auto">
        {children}
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
