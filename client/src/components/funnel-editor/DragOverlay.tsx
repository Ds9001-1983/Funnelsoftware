import { DragOverlay as DndDragOverlay } from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import {
  GripVertical, Type, Image, Video, MousePointer, FormInput, LayoutGrid,
  Minus, ArrowUpDown, Timer, Star, Award, AlignLeft, CheckSquare, Radio,
  Calendar, FileUp, Music, MapPin, Code, ShoppingBag, Users, BarChart3,
  MessageSquare, HelpCircle, DollarSign, Smile,
} from "lucide-react";
import type { PageElement } from "@shared/schema";

interface ElementDragOverlayProps {
  activeElement: PageElement | null;
}

const elementTypeIcons: Record<string, React.ReactNode> = {
  heading: <Type className="h-4 w-4" />,
  text: <AlignLeft className="h-4 w-4" />,
  image: <Image className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  button: <MousePointer className="h-4 w-4" />,
  input: <FormInput className="h-4 w-4" />,
  textarea: <AlignLeft className="h-4 w-4" />,
  form: <FormInput className="h-4 w-4" />,
  section: <LayoutGrid className="h-4 w-4" />,
  divider: <Minus className="h-4 w-4" />,
  spacer: <ArrowUpDown className="h-4 w-4" />,
  countdown: <Timer className="h-4 w-4" />,
  quiz: <Award className="h-4 w-4" />,
  icon: <Smile className="h-4 w-4" />,
  select: <CheckSquare className="h-4 w-4" />,
  radio: <Radio className="h-4 w-4" />,
  checkbox: <CheckSquare className="h-4 w-4" />,
  calendar: <Calendar className="h-4 w-4" />,
  fileUpload: <FileUp className="h-4 w-4" />,
  audio: <Music className="h-4 w-4" />,
  map: <MapPin className="h-4 w-4" />,
  code: <Code className="h-4 w-4" />,
  embed: <Code className="h-4 w-4" />,
  product: <ShoppingBag className="h-4 w-4" />,
  team: <Users className="h-4 w-4" />,
  chart: <BarChart3 className="h-4 w-4" />,
  testimonial: <MessageSquare className="h-4 w-4" />,
  faq: <HelpCircle className="h-4 w-4" />,
  pricing: <DollarSign className="h-4 w-4" />,
  socialProof: <Star className="h-4 w-4" />,
  progressBar: <BarChart3 className="h-4 w-4" />,
  slider: <ArrowUpDown className="h-4 w-4" />,
  list: <AlignLeft className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
};

const elementTypeLabels: Record<string, string> = {
  heading: "Überschrift",
  text: "Text",
  image: "Bild",
  video: "Video",
  button: "Button",
  input: "Eingabefeld",
  textarea: "Textbereich",
  form: "Formular",
  section: "Abschnitt",
  divider: "Trennlinie",
  spacer: "Abstand",
  countdown: "Countdown",
  quiz: "Quiz",
  icon: "Icon",
  select: "Auswahl",
  radio: "Radio-Button",
  checkbox: "Checkbox",
  calendar: "Kalender",
  fileUpload: "Datei-Upload",
  audio: "Audio",
  map: "Karte",
  code: "Code",
  embed: "Einbettung",
  product: "Produkt",
  team: "Team",
  chart: "Diagramm",
  testimonial: "Testimonial",
  faq: "FAQ",
  pricing: "Preistabelle",
  socialProof: "Social Proof",
  progressBar: "Fortschrittsbalken",
  slider: "Slider",
  list: "Liste",
  date: "Datum",
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
                {activeElement.content && (
                  <p className="text-xs text-muted-foreground truncate">
                    {String(activeElement.content).substring(0, 30)}
                    {String(activeElement.content).length > 30 ? "..." : ""}
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
