import { DragOverlay as DndDragOverlay } from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { GripVertical, Type, Image, Video, MousePointer, FormInput, LayoutGrid } from "lucide-react";
import type { PageElement } from "@shared/schema";

interface ElementDragOverlayProps {
  activeElement: PageElement | null;
}

const elementTypeIcons: Record<string, React.ReactNode> = {
  heading: <Type className="h-4 w-4" />,
  text: <Type className="h-4 w-4" />,
  image: <Image className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  button: <MousePointer className="h-4 w-4" />,
  form: <FormInput className="h-4 w-4" />,
  section: <LayoutGrid className="h-4 w-4" />,
};

const elementTypeLabels: Record<string, string> = {
  heading: "Überschrift",
  text: "Text",
  image: "Bild",
  video: "Video",
  button: "Button",
  form: "Formular",
  section: "Abschnitt",
  divider: "Trennlinie",
  spacer: "Abstand",
  html: "HTML",
  countdown: "Countdown",
  testimonial: "Testimonial",
  faq: "FAQ",
  pricing: "Preistabelle",
};

export function ElementDragOverlay({ activeElement }: ElementDragOverlayProps) {
  return (
    <DndDragOverlay dropAnimation={null}>
      {activeElement ? (
        <Card className="w-64 opacity-80 shadow-xl rotate-2 border-primary/50 bg-background/95 backdrop-blur-sm">
          <CardContent className="flex items-center gap-3 p-3">
            <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex-shrink-0 text-primary">
                {elementTypeIcons[activeElement.type] || <LayoutGrid className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {elementTypeLabels[activeElement.type] || activeElement.type}
                </p>
                {activeElement.content?.text && (
                  <p className="text-xs text-muted-foreground truncate">
                    {activeElement.content.text.substring(0, 30)}
                    {activeElement.content.text.length > 30 ? "..." : ""}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </DndDragOverlay>
  );
}
