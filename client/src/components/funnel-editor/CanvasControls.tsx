import { ZoomIn, ZoomOut, RotateCcw, Monitor, Tablet, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";

interface CanvasControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

const MIN_ZOOM = 25;
const MAX_ZOOM = 200;
const ZOOM_STEP = 10;

const DEVICE_PRESETS = [
  { label: "Desktop", icon: Monitor, zoom: 100 },
  { label: "Tablet", icon: Tablet, zoom: 75 },
  { label: "Mobil", icon: Smartphone, zoom: 50 },
] as const;

export function CanvasControls({ zoom, onZoomChange }: CanvasControlsProps) {
  const clamp = (val: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, val));

  const handleZoomIn = () => onZoomChange(clamp(zoom + ZOOM_STEP));
  const handleZoomOut = () => onZoomChange(clamp(zoom - ZOOM_STEP));
  const handleReset = () => onZoomChange(100);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      onZoomChange(clamp(val));
    }
  };

  return (
    <div className="flex items-center gap-1 p-1 bg-background/80 backdrop-blur-sm border rounded-lg shadow-sm">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Verkleinern</TooltipContent>
      </Tooltip>

      <Input
        type="number"
        min={MIN_ZOOM}
        max={MAX_ZOOM}
        value={zoom}
        onChange={handleInputChange}
        className="w-14 h-7 text-center text-xs px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span className="text-xs text-muted-foreground mr-0.5">%</span>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Vergrößern</TooltipContent>
      </Tooltip>

      <div className="h-4 w-px bg-border mx-0.5" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleReset}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Zurücksetzenn (100%)</TooltipContent>
      </Tooltip>

      <div className="h-4 w-px bg-border mx-0.5" />

      {DEVICE_PRESETS.map((preset) => (
        <Tooltip key={preset.label}>
          <TooltipTrigger asChild>
            <Button
              variant={zoom === preset.zoom ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => onZoomChange(preset.zoom)}
            >
              <preset.icon className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{preset.label} ({preset.zoom}%)</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

export default CanvasControls;
