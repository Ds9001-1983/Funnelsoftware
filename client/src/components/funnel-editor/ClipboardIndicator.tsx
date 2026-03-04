import { Clipboard, Copy, FileText, Type, Image, Video, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ClipboardIndicatorProps {
  copiedElement: {
    type: string;
    content?: string;
    [key: string]: unknown;
  } | null;
  onClear: () => void;
}

const elementTypeIcons: Record<string, React.ReactNode> = {
  text: <Type className="h-3 w-3" />,
  heading: <Type className="h-3 w-3" />,
  image: <Image className="h-3 w-3" />,
  video: <Video className="h-3 w-3" />,
  button: <Copy className="h-3 w-3" />,
};

const elementTypeLabels: Record<string, string> = {
  text: "Text",
  heading: "Überschrift",
  image: "Bild",
  video: "Video",
  button: "Button",
  divider: "Trenner",
  spacer: "Abstand",
  form: "Formular",
  countdown: "Countdown",
  testimonial: "Testimonial",
  faq: "FAQ",
  pricing: "Preistabelle",
};

export function ClipboardIndicator({ copiedElement, onClear }: ClipboardIndicatorProps) {
  if (!copiedElement) return null;

  const icon = elementTypeIcons[copiedElement.type] || <FileText className="h-3 w-3" />;
  const label = elementTypeLabels[copiedElement.type] || copiedElement.type;
  const preview = copiedElement.content
    ? copiedElement.content.substring(0, 50) + (copiedElement.content.length > 50 ? "..." : "")
    : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors text-xs">
          <Clipboard className="h-3.5 w-3.5 text-primary" />
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
            1
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Zwischenablage</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onClear}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
            <div className="flex-shrink-0 text-muted-foreground">
              {icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{label}</p>
              {preview && (
                <p className="text-[10px] text-muted-foreground truncate">
                  {preview}
                </p>
              )}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Strg+V zum Einfügen
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default ClipboardIndicator;
