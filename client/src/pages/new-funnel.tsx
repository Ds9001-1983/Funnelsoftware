import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Layers,
  MessageSquare,
  Users,
  Calendar,
  FileQuestion,
  ShoppingCart,
  Sparkles,
  ClipboardList,
  Loader2,
  Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest, ApiError } from "@/lib/queryClient";
import { visibleTemplates, createBlankFunnel, getTemplateBySlug, type ClientTemplate } from "@/lib/templates";
import { TemplatePreviewDialog } from "@/components/template-preview-dialog";
import { SIGNUP_TEMPLATE_STORAGE_KEY } from "@shared/seo-links";
import { remapElementIds } from "@/lib/utils";
import type { InsertFunnel, FunnelPage, Theme } from "@shared/schema";

type Step = "template" | "ai" | "details";

const categoryIcons: Record<ClientTemplate["category"], React.ElementType> = {
  leads: Users,
  sales: ShoppingCart,
  recruiting: Users,
  webinar: Calendar,
  quiz: FileQuestion,
  survey: ClipboardList,
};

const categoryLabels: Record<ClientTemplate["category"], string> = {
  leads: "Lead-Generierung",
  sales: "Verkauf",
  recruiting: "Recruiting",
  webinar: "Webinar",
  quiz: "Quiz",
  survey: "Umfrage",
};

function TemplateCard({
  template,
  selected,
  onClick,
  onPreview,
}: {
  template: ClientTemplate;
  selected: boolean;
  onClick: () => void;
  onPreview: () => void;
}) {
  const Icon = categoryIcons[template.category];

  return (
    <Card
      className={`group cursor-pointer transition-all hover-elevate ${
        selected ? "ring-2 ring-primary ring-offset-2" : ""
      }`}
      onClick={onClick}
      data-testid={`template-${template.id}`}
    >
      <div
        className="h-40 relative rounded-t-md overflow-hidden"
        style={{ backgroundColor: template.theme.primaryColor }}
      >
        {/* Template Thumbnail Image */}
        <picture>
          <source srcSet={template.thumbnail} type="image/webp" />
          <img
            src={template.thumbnail.replace('.webp', '.png')}
            alt={template.name}
            width={600}
            height={400}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-2 left-2">
          <div className="flex items-center gap-1.5 text-white text-xs">
            <Icon className="h-3.5 w-3.5" />
            <span>{categoryLabels[template.category]}</span>
          </div>
        </div>
        {/* Interaktive Vorschau — stopPropagation, damit die Karte nicht ausgewählt wird */}
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-2 right-2 gap-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          data-testid={`preview-${template.id}`}
        >
          <Eye className="h-3.5 w-3.5" />
          Vorschau
        </Button>
      </div>
      <CardContent className="p-3">
        <h3 className="font-medium text-sm mb-1">{template.name}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {template.description}
        </p>
      </CardContent>
    </Card>
  );
}

export default function NewFunnel() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("template");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<ClientTemplate | null>(null);
  const [useBlank, setUseBlank] = useState(false);
  const [useAi, setUseAi] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  // KI-Erstellung
  const [aiDescription, setAiDescription] = useState("");
  const [aiAudience, setAiAudience] = useState("");
  const [aiPageCount, setAiPageCount] = useState(5);
  const [previewTemplate, setPreviewTemplate] = useState<ClientTemplate | null>(null);
  const { toast } = useToast();

  // Vorgewähltes Template übernehmen: ?template=<slug> (Galerie-CTA) oder die
  // bei der Registrierung gemerkte Auswahl (localStorage) — direkt zu den Details.
  useEffect(() => {
    const fromQuery = new URLSearchParams(window.location.search).get("template");
    const stored = localStorage.getItem(SIGNUP_TEMPLATE_STORAGE_KEY);
    const slug = fromQuery || stored;
    if (stored) localStorage.removeItem(SIGNUP_TEMPLATE_STORAGE_KEY);
    if (!slug) return;
    const template = getTemplateBySlug(slug);
    if (template) {
      setSelectedTemplate(template);
      setUseBlank(false);
      setUseAi(false);
      setName(template.name);
      setStep("details");
    }
  }, []);

  const createMutation = useMutation({
    mutationFn: async (data: InsertFunnel) => {
      const response = await apiRequest("POST", "/api/funnels", data);
      return response.json();
    },
    onSuccess: (funnel) => {
      queryClient.invalidateQueries({ queryKey: ["/api/funnels"] });
      toast({
        title: "Funnel erstellt",
        description: "Dein neuer Funnel wurde erfolgreich erstellt.",
      });
      navigate(`/funnels/${funnel.id}`);
    },
    onError: (error) => {
      // Globaler Handler übernimmt bekannte Plan-/Email-Fehler (TRIAL_EXPIRED, EMAIL_NOT_VERIFIED)
      if (error instanceof ApiError && (error.code === "TRIAL_EXPIRED" || error.code === "EMAIL_NOT_VERIFIED")) {
        return;
      }
      toast({
        title: "Fehler",
        description: "Der Funnel konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  const aiGenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/generate-funnel", {
        description: aiDescription.trim(),
        audience: aiAudience.trim() || undefined,
        pageCount: aiPageCount,
      });
      return res.json() as Promise<{ pages: FunnelPage[]; theme: Theme }>;
    },
    onSuccess: (funnel) => {
      // KI liefert feste String-IDs → remapElementIds macht sie funnel-weit eindeutig,
      // dann läuft der Funnel über denselben POST /api/funnels-Pfad wie Templates.
      createMutation.mutate({
        name: name.trim() || "Neuer KI-Funnel",
        description: aiDescription.trim().slice(0, 200) || undefined,
        status: "draft",
        pages: remapElementIds(funnel.pages),
        theme: funnel.theme,
      });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === "AI_NO_KEY") {
        toast({
          title: "Keine KI verbunden",
          description: "Bitte zuerst in den Einstellungen einen KI-Anbieter verbinden.",
        });
        navigate("/settings?tab=ai");
        return;
      }
      if (error instanceof ApiError && (error.code === "TRIAL_EXPIRED" || error.code === "EMAIL_NOT_VERIFIED")) {
        return;
      }
      toast({
        variant: "destructive",
        title: "Generierung fehlgeschlagen",
        description: error instanceof Error ? error.message : "Bitte Beschreibung anpassen und erneut versuchen.",
      });
    },
  });

  const aiBusy = aiGenerateMutation.isPending || createMutation.isPending;

  const handleContinue = () => {
    if (step === "template" && useAi) {
      setStep("ai");
    } else if (step === "template" && (selectedTemplate || useBlank)) {
      setStep("details");
      if (selectedTemplate) {
        setName(selectedTemplate.name);
      }
    } else if (step === "details" && name.trim()) {
      // remapElementIds: Templates nutzen feste Element-IDs ("el-1"), die über
      // Seiten hinweg kollidieren → Antworten überschreiben sich im Funnel.
      const templateData = useBlank
        ? createBlankFunnel()
        : selectedTemplate
          ? { pages: remapElementIds(selectedTemplate.pages), theme: selectedTemplate.theme }
          : createBlankFunnel();

      createMutation.mutate({
        name: name.trim(),
        description: description.trim() || undefined,
        status: "draft",
        pages: templateData.pages,
        theme: templateData.theme,
      });
    }
  };

  const handleBack = () => {
    if (step === "details" || step === "ai") {
      setStep("template");
    } else {
      navigate("/funnels");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Neuen Funnel erstellen</h1>
              <p className="text-sm text-muted-foreground">
                {step === "template"
                  ? "Wähle eine Vorlage, lass die KI bauen oder starte von Grund auf"
                  : step === "ai"
                    ? "Beschreibe dein Angebot — deine KI baut den Funnel"
                    : "Gib deinem Funnel einen Namen"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {step === "template" ? (
          <div className="space-y-8">
            {/* KI-Erstellung — Flaggschiff-Option, prominent oben */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-medium">Mit KI erstellen</h2>
              </div>
              <Card
                className={`cursor-pointer transition-all hover-elevate border-primary/40 bg-primary/5 ${
                  useAi ? "ring-2 ring-primary ring-offset-2" : ""
                }`}
                onClick={() => {
                  setUseAi(true);
                  setSelectedTemplate(null);
                  setUseBlank(false);
                }}
                data-testid="template-ai"
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-md bg-primary/15 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Funnel per KI generieren</h3>
                    <p className="text-sm text-muted-foreground">
                      Beschreibe dein Angebot — deine verbundene KI baut Seiten, Fragen und Kontaktformular.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-medium">Vorlagen</h2>
              </div>

              {/* Kategorie-Filter */}
              <div className="flex flex-wrap gap-2 mb-5">
                {[
                  { key: "all", label: "Alle" },
                  { key: "leads", label: "Leads" },
                  { key: "sales", label: "Sales" },
                  { key: "recruiting", label: "Recruiting" },
                  { key: "webinar", label: "Webinar" },
                  { key: "survey", label: "Umfrage" },
                ].map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setCategoryFilter(cat.key)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      categoryFilter === cat.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleTemplates
                  .filter((t) => categoryFilter === "all" || t.category === categoryFilter)
                  .map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    selected={selectedTemplate?.id === template.id && !useBlank}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setUseBlank(false);
                    }}
                    onPreview={() => setPreviewTemplate(template)}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Layers className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-medium">Oder starte leer</h2>
              </div>
              <Card
                className={`cursor-pointer transition-all hover-elevate ${
                  useBlank ? "ring-2 ring-primary ring-offset-2" : ""
                }`}
                onClick={() => {
                  setUseBlank(true);
                  setSelectedTemplate(null);
                }}
                data-testid="template-blank"
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium">Leerer Funnel</h3>
                    <p className="text-sm text-muted-foreground">
                      Erstelle deinen Funnel komplett selbst
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleContinue}
                disabled={!selectedTemplate && !useBlank && !useAi}
                className="min-w-[120px]"
                data-testid="button-continue"
              >
                Weiter
              </Button>
            </div>
          </div>
        ) : step === "ai" ? (
          <div className="max-w-lg mx-auto space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ai-desc">Beschreibe dein Angebot / Ziel *</Label>
                  <Textarea
                    id="ai-desc"
                    placeholder="z.B. Ich verkaufe Online-Kurse für Webdesign und möchte qualifizierte Leads für ein Erstgespräch sammeln."
                    value={aiDescription}
                    onChange={(e) => setAiDescription(e.target.value)}
                    rows={4}
                    data-testid="input-ai-description"
                  />
                  <p className="text-xs text-muted-foreground">Mindestens 10 Zeichen. Je konkreter, desto besser.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-aud">Zielgruppe (optional)</Label>
                  <Input
                    id="ai-aud"
                    placeholder="z.B. Selbstständige & kleine Agenturen"
                    value={aiAudience}
                    onChange={(e) => setAiAudience(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-name">Funnel-Name (optional)</Label>
                  <Input
                    id="ai-name"
                    placeholder="Neuer KI-Funnel"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-pages">Seitenzahl: {aiPageCount}</Label>
                  <input
                    id="ai-pages"
                    type="range"
                    min={3}
                    max={10}
                    value={aiPageCount}
                    onChange={(e) => setAiPageCount(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack} disabled={aiBusy} data-testid="button-back-ai">
                Zurück
              </Button>
              <Button
                onClick={() => aiGenerateMutation.mutate()}
                disabled={aiDescription.trim().length < 10 || aiBusy}
                className="min-w-[170px]"
                data-testid="button-generate-ai"
              >
                {aiBusy ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> KI erstellt deinen Funnel…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" /> Funnel generieren
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-lg mx-auto space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="z.B. Lead Magnet Kampagne"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    data-testid="input-funnel-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Beschreibung (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Kurze Beschreibung des Funnels..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    data-testid="input-funnel-description"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack} data-testid="button-back-details">
                Zurück
              </Button>
              <Button
                onClick={handleContinue}
                disabled={!name.trim() || createMutation.isPending}
                className="min-w-[120px]"
                data-testid="button-create-funnel"
              >
                {createMutation.isPending ? "Erstelle..." : "Funnel erstellen"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <TemplatePreviewDialog
        template={previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
      />
    </div>
  );
}
