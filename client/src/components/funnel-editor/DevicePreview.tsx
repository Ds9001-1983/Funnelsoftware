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
  height: number;
}

const devices: DeviceConfig[] = [
  { type: "desktop", label: "Desktop", icon: Monitor, width: 1200, height: 800 },
  { type: "tablet", label: "Tablet", icon: Tablet, width: 768, height: 1024 },
  { type: "mobile", label: "Mobile", icon: Smartphone, width: 375, height: 812 },
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
                className={`h-8 w-8 p-0 ${isSelected ? "bg-background shadow-sm" : ""}`}
                onClick={() => onDeviceChange(device.type)}
              >
                <Icon className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
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
  scale?: number;
}

/**
 * Geräte-Rahmen für die Vorschau.
 * Zeigt den Inhalt in einem simulierten Geräte-Rahmen an.
 */
export function DeviceFrame({ device, children, scale = 1 }: DeviceFrameProps) {
  const config = devices.find((d) => d.type === device) || devices[0];
  
  // Berechne die skalierte Größe
  const scaledWidth = config.width * scale;
  const scaledHeight = config.height * scale;
  
  if (device === "desktop") {
    return (
      <div 
        className="bg-white rounded-lg shadow-lg overflow-hidden"
        style={{ width: "100%", height: "100%" }}
      >
        {children}
      </div>
    );
  }
  
  // Mobile und Tablet bekommen einen Geräte-Rahmen
  return (
    <div className="flex items-center justify-center p-4 h-full">
      <div
        className="relative bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl"
        style={{
          width: scaledWidth + 16,
          maxHeight: "100%",
        }}
      >
        {/* Notch für Mobile */}
        {device === "mobile" && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-b-2xl z-10" />
        )}
        
        {/* Screen */}
        <div
          className="bg-white rounded-[2rem] overflow-hidden relative"
          style={{
            width: scaledWidth,
            height: scaledHeight,
            maxHeight: "calc(100vh - 200px)",
          }}
        >
          <div className="w-full h-full overflow-auto">
            {children}
          </div>
        </div>
        
        {/* Home-Button für Tablet */}
        {device === "tablet" && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-10 bg-gray-800 rounded-full" />
        )}
      </div>
    </div>
  );
}

/**
 * Hook für die Geräte-Vorschau.
 * Verwaltet den aktuellen Gerätetyp und gibt die entsprechenden Dimensionen zurück.
 */
export function useDevicePreview(initialDevice: DeviceType = "mobile") {
  const [device, setDevice] = useState<DeviceType>(initialDevice);
  
  const config = devices.find((d) => d.type === device) || devices[2]; // Default: Mobile
  
  return {
    device,
    setDevice,
    width: config.width,
    height: config.height,
    isMobile: device === "mobile",
    isTablet: device === "tablet",
    isDesktop: device === "desktop",
  };
}

export { devices };
