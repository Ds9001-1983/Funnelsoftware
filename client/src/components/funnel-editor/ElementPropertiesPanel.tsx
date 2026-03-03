import {
  Plus,
  Trash2,
  Settings,
  Scissors,
  Maximize2,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Search,
  Upload,
  Music,
  ShoppingBag,
  Info,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PageElement } from "@shared/schema";

interface ElementPropertiesPanelProps {
  element: PageElement;
  onUpdate: (updates: Partial<PageElement>) => void;
  onClose: () => void;
}

/**
 * Panel for editing element properties in the Design tab.
 * Displays different property editors based on element type.
 */
export function ElementPropertiesPanel({
  element,
  onUpdate,
  onClose,
}: ElementPropertiesPanelProps) {
  // Get element type label for header
  const getElementTypeLabel = (): string => {
    const labels: Record<string, string> = {
      heading: "Überschrift",
      text: "Text",
      image: "Bild",
      video: "Video",
      input: "Eingabefeld",
      textarea: "Textbereich",
      select: "Dropdown",
      radio: "Auswahl",
      checkbox: "Checkbox",
      list: "Liste",
      testimonial: "Bewertung",
      faq: "FAQ",
      divider: "Trennlinie",
      spacer: "Abstand",
      timer: "Timer",
      slider: "Slider",
      button: "Button",
      audio: "Audio",
      calendar: "Kalender",
      countdown: "Countdown",
      map: "Karte",
      chart: "Diagramm",
      code: "Code",
      embed: "Embed",
      product: "Produkt",
      team: "Team",
      quiz: "Quiz",
      icon: "Icon",
      progressBar: "Fortschritt",
      socialProof: "Social Proof",
    };
    return labels[element.type] || element.type;
  };

  return (
    <div className="p-4 space-y-6">
      {/* Element type header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">{getElementTypeLabel()}</h4>
        <button className="p-1 rounded hover:bg-muted" onClick={onClose}>
          <Info className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Heading / Text properties */}
      {(element.type === "heading" || element.type === "text") && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Inhalt</Label>
            <Textarea
              value={element.content || ""}
              onChange={(e) => onUpdate({ content: e.target.value })}
              rows={3}
              className="text-sm"
            />
          </div>

          {element.type === "heading" && (
            <div className="space-y-2">
              <Label className="text-xs">Schriftgröße</Label>
              <Select
                value={element.styles?.fontSize || "2xl"}
                onValueChange={(v) =>
                  onUpdate({ styles: { ...element.styles, fontSize: v } })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xl">Klein (XL)</SelectItem>
                  <SelectItem value="2xl">Normal (2XL)</SelectItem>
                  <SelectItem value="3xl">Groß (3XL)</SelectItem>
                  <SelectItem value="4xl">Sehr groß (4XL)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs">Textausrichtung</Label>
            <div className="flex gap-1">
              <Button
                variant={element.styles?.textAlign === "left" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() =>
                  onUpdate({ styles: { ...element.styles, textAlign: "left" } })
                }
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant={
                  !element.styles?.textAlign || element.styles?.textAlign === "center"
                    ? "default"
                    : "outline"
                }
                size="sm"
                className="flex-1"
                onClick={() =>
                  onUpdate({ styles: { ...element.styles, textAlign: "center" } })
                }
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant={element.styles?.textAlign === "right" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() =>
                  onUpdate({ styles: { ...element.styles, textAlign: "right" } })
                }
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Textfarbe</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={element.styles?.color || "#1a1a1a"}
                onChange={(e) =>
                  onUpdate({ styles: { ...element.styles, color: e.target.value } })
                }
                className="w-12 h-9 p-1 cursor-pointer"
              />
              <Input
                value={element.styles?.color || "#1a1a1a"}
                onChange={(e) =>
                  onUpdate({ styles: { ...element.styles, color: e.target.value } })
                }
                className="flex-1 h-9 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={element.styles?.fontWeight === "bold" ? "default" : "outline"}
              size="sm"
              onClick={() =>
                onUpdate({
                  styles: {
                    ...element.styles,
                    fontWeight: element.styles?.fontWeight === "bold" ? "normal" : "bold",
                  },
                })
              }
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant={element.styles?.fontStyle === "italic" ? "default" : "outline"}
              size="sm"
              onClick={() =>
                onUpdate({
                  styles: {
                    ...element.styles,
                    fontStyle: element.styles?.fontStyle === "italic" ? "normal" : "italic",
                  },
                })
              }
            >
              <Italic className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Image properties */}
      {element.type === "image" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex gap-1">
              {["S", "M", "L", "XL"].map((size) => (
                <Button
                  key={size}
                  variant={
                    (element.styles?.imageSize || "L") === size ? "default" : "outline"
                  }
                  size="sm"
                  className="flex-1 text-xs font-medium"
                  onClick={() =>
                    onUpdate({ styles: { ...element.styles, imageSize: size } })
                  }
                >
                  {size}
                </Button>
              ))}
              <Button variant="outline" size="sm" className="px-2">
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="flex-1 text-xs">
              <Scissors className="h-3.5 w-3.5 mr-1" />
              Zuschneiden
            </Button>
            <Button variant="outline" size="sm" className="flex-1 text-xs">
              <Maximize2 className="h-3.5 w-3.5 mr-1" />
              Vollbild
            </Button>
            <Button variant="outline" size="sm" className="px-2">
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Hintergrund</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 justify-start gap-2 h-9"
              >
                <ChevronUp className="h-3.5 w-3.5" />
                <div className="flex-1 h-1 bg-muted rounded" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 justify-start gap-2 h-9"
              >
                <ChevronDown className="h-3.5 w-3.5" />
                <div className="flex-1 h-1 bg-muted rounded" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={element.styles?.backgroundColor || "#ffffff"}
                onChange={(e) =>
                  onUpdate({
                    styles: { ...element.styles, backgroundColor: e.target.value },
                  })
                }
                className="w-10 h-8 p-1 cursor-pointer"
              />
              <span className="text-xs text-muted-foreground">Hintergrundfarbe</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Alle Medien</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Suche" className="pl-8 h-8 text-sm" />
            </div>
          </div>

          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Bild ablegen oder klicken zum Durchsuchen
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              (Max. 10MB; .png .jpg .webp .gif)
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Bild-URL</Label>
            <Input
              value={element.imageUrl || ""}
              onChange={(e) => onUpdate({ imageUrl: e.target.value })}
              placeholder="https://..."
              className="text-sm h-8"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Alt-Text (SEO)</Label>
            <Input
              value={element.imageAlt || ""}
              onChange={(e) => onUpdate({ imageAlt: e.target.value })}
              placeholder="Bildbeschreibung"
              className="text-sm h-8"
            />
          </div>
        </div>
      )}

      {/* Video properties */}
      {element.type === "video" && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Video-URL</Label>
            <Input
              value={element.videoUrl || ""}
              onChange={(e) => onUpdate({ videoUrl: e.target.value })}
              placeholder="YouTube oder Vimeo URL"
              className="text-sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Autoplay</Label>
            <Switch
              checked={element.videoAutoplay || false}
              onCheckedChange={(checked) => onUpdate({ videoAutoplay: checked })}
            />
          </div>
        </div>
      )}

      {/* Input / Textarea properties */}
      {(element.type === "input" || element.type === "textarea") && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Platzhalter</Label>
            <Input
              value={element.placeholder || ""}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Label</Label>
            <Input
              value={element.label || ""}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="text-sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Pflichtfeld</Label>
            <Switch
              checked={element.required || false}
              onCheckedChange={(checked) => onUpdate({ required: checked })}
            />
          </div>
        </div>
      )}

      {/* Spacer properties */}
      {element.type === "spacer" && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Höhe (px)</Label>
            <Slider
              value={[element.spacerHeight || 24]}
              onValueChange={([v]) => onUpdate({ spacerHeight: v })}
              min={8}
              max={120}
              step={8}
            />
            <div className="text-xs text-muted-foreground text-center">
              {element.spacerHeight || 24}px
            </div>
          </div>
        </div>
      )}

      {/* Button properties */}
      {element.type === "button" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Button-Text</Label>
            <Input
              value={element.content || ""}
              onChange={(e) => onUpdate({ content: e.target.value })}
              placeholder="Jetzt starten"
              className="text-sm h-8"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Variante</Label>
            <div className="flex gap-1">
              {(["primary", "secondary", "outline", "ghost"] as const).map((variant) => (
                <Button
                  key={variant}
                  variant={
                    (element.buttonVariant || "primary") === variant ? "default" : "outline"
                  }
                  size="sm"
                  className="flex-1 text-xs capitalize"
                  onClick={() => onUpdate({ buttonVariant: variant })}
                >
                  {variant === "primary"
                    ? "Primär"
                    : variant === "secondary"
                    ? "Sekundär"
                    : variant === "outline"
                    ? "Rahmen"
                    : "Ghost"}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Link-URL</Label>
            <Input
              value={element.buttonUrl || ""}
              onChange={(e) => onUpdate({ buttonUrl: e.target.value })}
              placeholder="https://..."
              className="text-sm h-8"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">In neuem Tab öffnen</Label>
            <Switch
              checked={element.buttonTarget === "_blank"}
              onCheckedChange={(checked) =>
                onUpdate({ buttonTarget: checked ? "_blank" : "_self" })
              }
            />
          </div>
        </div>
      )}

      {/* Audio properties */}
      {element.type === "audio" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Audio-URL</Label>
            <Input
              value={element.audioUrl || ""}
              onChange={(e) => onUpdate({ audioUrl: e.target.value })}
              placeholder="https://example.com/audio.mp3"
              className="text-sm h-8"
            />
          </div>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <Music className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Audio-Datei ablegen oder klicken
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              (Max. 50MB; .mp3 .wav .ogg)
            </p>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Autoplay</Label>
            <Switch
              checked={element.audioAutoplay || false}
              onCheckedChange={(checked) => onUpdate({ audioAutoplay: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Wiederholen</Label>
            <Switch
              checked={element.audioLoop || false}
              onCheckedChange={(checked) => onUpdate({ audioLoop: checked })}
            />
          </div>
        </div>
      )}

      {/* Calendar properties */}
      {element.type === "calendar" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Anbieter</Label>
            <Select
              value={element.calendarProvider || "calendly"}
              onValueChange={(v) =>
                onUpdate({ calendarProvider: v as "calendly" | "cal" | "custom" })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calendly">Calendly</SelectItem>
                <SelectItem value="cal">Cal.com</SelectItem>
                <SelectItem value="custom">Eigene URL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Kalender-URL</Label>
            <Input
              value={element.calendarUrl || ""}
              onChange={(e) => onUpdate({ calendarUrl: e.target.value })}
              placeholder="https://calendly.com/username"
              className="text-sm h-8"
            />
          </div>
          <div className="p-3 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground">
              Füge deine Kalender-Embed-URL ein, um Termine direkt im Funnel buchbar zu
              machen.
            </p>
          </div>
        </div>
      )}

      {/* Countdown properties */}
      {element.type === "countdown" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Zieldatum</Label>
            <Input
              type="datetime-local"
              value={element.countdownDate || ""}
              onChange={(e) => onUpdate({ countdownDate: e.target.value })}
              className="text-sm h-8"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Stil</Label>
            <div className="flex gap-1">
              {(["flip", "simple", "circular"] as const).map((style) => (
                <Button
                  key={style}
                  variant={
                    (element.countdownStyle || "flip") === style ? "default" : "outline"
                  }
                  size="sm"
                  className="flex-1 text-xs capitalize"
                  onClick={() => onUpdate({ countdownStyle: style })}
                >
                  {style === "flip" ? "Flip" : style === "simple" ? "Einfach" : "Kreise"}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Labels anzeigen</Label>
            <Switch
              checked={element.countdownShowLabels !== false}
              onCheckedChange={(checked) => onUpdate({ countdownShowLabels: checked })}
            />
          </div>
        </div>
      )}

      {/* Map properties */}
      {element.type === "map" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Adresse</Label>
            <Textarea
              value={element.mapAddress || ""}
              onChange={(e) => onUpdate({ mapAddress: e.target.value })}
              placeholder="Musterstraße 1, 12345 Berlin"
              rows={2}
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Zoom-Stufe</Label>
            <Slider
              value={[element.mapZoom || 15]}
              onValueChange={([v]) => onUpdate({ mapZoom: v })}
              min={1}
              max={20}
              step={1}
            />
            <div className="text-xs text-muted-foreground text-center">
              Zoom: {element.mapZoom || 15}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Karten-Stil</Label>
            <Select
              value={element.mapStyle || "roadmap"}
              onValueChange={(v) =>
                onUpdate({ mapStyle: v as "roadmap" | "satellite" | "terrain" })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="roadmap">Straßenkarte</SelectItem>
                <SelectItem value="satellite">Satellit</SelectItem>
                <SelectItem value="terrain">Gelände</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Chart properties */}
      {element.type === "chart" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Diagramm-Typ</Label>
            <div className="grid grid-cols-2 gap-1">
              {(["bar", "line", "pie", "doughnut"] as const).map((type) => (
                <Button
                  key={type}
                  variant={(element.chartType || "bar") === type ? "default" : "outline"}
                  size="sm"
                  className="text-xs capitalize"
                  onClick={() => onUpdate({ chartType: type })}
                >
                  {type === "bar"
                    ? "Balken"
                    : type === "line"
                    ? "Linie"
                    : type === "pie"
                    ? "Kreis"
                    : "Donut"}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Titel</Label>
            <Input
              value={element.content || ""}
              onChange={(e) => onUpdate({ content: e.target.value })}
              placeholder="Diagramm-Titel"
              className="text-sm h-8"
            />
          </div>
          <div className="p-3 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground">
              Daten können über die API oder ein verbundenes Spreadsheet eingespielt
              werden.
            </p>
          </div>
        </div>
      )}

      {/* Code properties */}
      {element.type === "code" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Programmiersprache</Label>
            <Select
              value={element.codeLanguage || "javascript"}
              onValueChange={(v) => onUpdate({ codeLanguage: v })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="css">CSS</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="bash">Bash</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Code</Label>
            <Textarea
              value={element.codeContent || ""}
              onChange={(e) => onUpdate({ codeContent: e.target.value })}
              placeholder="// Dein Code hier..."
              rows={8}
              className="text-sm font-mono"
            />
          </div>
        </div>
      )}

      {/* Embed properties */}
      {element.type === "embed" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Embed-URL</Label>
            <Input
              value={element.embedUrl || ""}
              onChange={(e) => onUpdate({ embedUrl: e.target.value })}
              placeholder="https://..."
              className="text-sm h-8"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Oder HTML-Code</Label>
            <Textarea
              value={element.embedCode || ""}
              onChange={(e) => onUpdate({ embedCode: e.target.value })}
              placeholder='<iframe src="..."></iframe>'
              rows={4}
              className="text-sm font-mono"
            />
          </div>
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
            <p className="text-xs text-yellow-600">
              Achte darauf, nur vertrauenswürdige Embed-Codes zu verwenden.
            </p>
          </div>
        </div>
      )}

      {/* Product properties */}
      {element.type === "product" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Produktname</Label>
            <Input
              value={element.productName || ""}
              onChange={(e) => onUpdate({ productName: e.target.value })}
              placeholder="Premium Coaching"
              className="text-sm h-8"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Preis</Label>
            <Input
              value={element.productPrice || ""}
              onChange={(e) => onUpdate({ productPrice: e.target.value })}
              placeholder="€ 997"
              className="text-sm h-8"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Produktbild URL</Label>
            <Input
              value={element.productImage || ""}
              onChange={(e) => onUpdate({ productImage: e.target.value })}
              placeholder="https://..."
              className="text-sm h-8"
            />
          </div>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <ShoppingBag className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Produktbild hochladen</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Beschreibung</Label>
            <Textarea
              value={element.productDescription || ""}
              onChange={(e) => onUpdate({ productDescription: e.target.value })}
              placeholder="Kurze Produktbeschreibung..."
              rows={3}
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Button-Text</Label>
            <Input
              value={element.productButtonText || ""}
              onChange={(e) => onUpdate({ productButtonText: e.target.value })}
              placeholder="Jetzt kaufen"
              className="text-sm h-8"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Button-URL</Label>
            <Input
              value={element.productButtonUrl || ""}
              onChange={(e) => onUpdate({ productButtonUrl: e.target.value })}
              placeholder="https://checkout..."
              className="text-sm h-8"
            />
          </div>
        </div>
      )}

      {/* Team properties */}
      {element.type === "team" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Team-Mitglieder</Label>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                const members = element.teamMembers || [];
                onUpdate({
                  teamMembers: [
                    ...members,
                    {
                      id: `member-${Date.now()}`,
                      name: "Neues Mitglied",
                      role: "Position",
                      image: "",
                    },
                  ],
                });
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Hinzufügen
            </Button>
          </div>
          <div className="space-y-3">
            {(element.teamMembers || []).map((member, idx) => (
              <div key={member.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Mitglied {idx + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive"
                    onClick={() => {
                      const members = [...(element.teamMembers || [])];
                      members.splice(idx, 1);
                      onUpdate({ teamMembers: members });
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <Input
                  value={member.name}
                  onChange={(e) => {
                    const members = [...(element.teamMembers || [])];
                    members[idx] = { ...members[idx], name: e.target.value };
                    onUpdate({ teamMembers: members });
                  }}
                  placeholder="Name"
                  className="text-sm h-8"
                />
                <Input
                  value={member.role || ""}
                  onChange={(e) => {
                    const members = [...(element.teamMembers || [])];
                    members[idx] = { ...members[idx], role: e.target.value };
                    onUpdate({ teamMembers: members });
                  }}
                  placeholder="Position"
                  className="text-sm h-8"
                />
                <Input
                  value={member.image || ""}
                  onChange={(e) => {
                    const members = [...(element.teamMembers || [])];
                    members[idx] = { ...members[idx], image: e.target.value };
                    onUpdate({ teamMembers: members });
                  }}
                  placeholder="Bild-URL"
                  className="text-sm h-8"
                />
              </div>
            ))}
            {(!element.teamMembers || element.teamMembers.length === 0) && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Noch keine Mitglieder. Klicke auf "Hinzufügen".
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quiz properties */}
      {element.type === "quiz" && (
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground">
              Der Quiz-Editor wird separat in einem erweiterten Modal geöffnet.
            </p>
          </div>
          <Button variant="outline" size="sm" className="w-full">
            Quiz bearbeiten
          </Button>
        </div>
      )}

      {/* Select/Dropdown properties */}
      {element.type === "select" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Label</Label>
            <Input
              value={element.label || ""}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Dropdown Label"
              className="text-sm h-8"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Optionen (eine pro Zeile)</Label>
            <Textarea
              value={(element.options || []).join("\n")}
              onChange={(e) =>
                onUpdate({ options: e.target.value.split("\n").filter(Boolean) })
              }
              placeholder="Option 1&#10;Option 2&#10;Option 3"
              rows={4}
              className="text-sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Pflichtfeld</Label>
            <Switch
              checked={element.required || false}
              onCheckedChange={(checked) => onUpdate({ required: checked })}
            />
          </div>
        </div>
      )}

      {/* Radio properties */}
      {element.type === "radio" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Frage / Label</Label>
            <Input
              value={element.label || ""}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Wähle eine Option"
              className="text-sm h-8"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Optionen (eine pro Zeile)</Label>
            <Textarea
              value={(element.options || []).join("\n")}
              onChange={(e) =>
                onUpdate({ options: e.target.value.split("\n").filter(Boolean) })
              }
              placeholder="Option A&#10;Option B&#10;Option C"
              rows={4}
              className="text-sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Pflichtfeld</Label>
            <Switch
              checked={element.required || false}
              onCheckedChange={(checked) => onUpdate({ required: checked })}
            />
          </div>
        </div>
      )}

      {/* Checkbox properties */}
      {element.type === "checkbox" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Label</Label>
            <Input
              value={element.label || ""}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Ich akzeptiere die AGB"
              className="text-sm h-8"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Pflichtfeld</Label>
            <Switch
              checked={element.required || false}
              onCheckedChange={(checked) => onUpdate({ required: checked })}
            />
          </div>
        </div>
      )}

      {/* Divider properties */}
      {element.type === "divider" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Farbe</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={element.styles?.color || "#e5e7eb"}
                onChange={(e) =>
                  onUpdate({ styles: { ...element.styles, color: e.target.value } })
                }
                className="w-12 h-8 p-1 cursor-pointer"
              />
              <Input
                value={element.styles?.color || "#e5e7eb"}
                onChange={(e) =>
                  onUpdate({ styles: { ...element.styles, color: e.target.value } })
                }
                className="flex-1 h-8 text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
