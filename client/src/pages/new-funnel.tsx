import { useState } from "react";
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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { defaultTemplates, createBlankFunnel, type ClientTemplate } from "@/lib/templates";
import type { InsertFunnel } from "@shared/schema";

type Step = "template" | "details";

const categoryIcons: Record<ClientTemplate["category"], React.ElementType> = {
  leads: Users,
  sales: ShoppingCart,
  recruiting: Users,
  webinar: Calendar,
  quiz: FileQuestion,
};

const categoryLabels: Record<ClientTemplate["category"], string> = {
  leads: "Lead-Generierung",
  sales: "Verkauf",
  recruiting: "Recruiting",
  webinar: "Webinar",
  quiz: "Quiz",
};

function TemplateCard({
  template,
  selected,
  onClick,
}: {
  template: ClientTemplate;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = categoryIcons[template.category];

  return (
    <Card
      className={`cursor-pointer transition-all hover-elevate ${
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
        <img 
          src={template.thumbnail} 
          alt={template.name}
          className="absolute inset-0 w-full h-full object-cover object-top"
          onError={(e) => {
            // Fallback to color background if image fails to load
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-2 left-2">
          <div className="flex items-center gap-1.5 text-white text-xs">
            <Icon className="h-3.5 w-3.5" />
            <span>{categoryLabels[template.category]}</span>
          </div>
        </div>
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
  const [selectedTemplate, setSelectedTemplate] = useState<ClientTemplate | null>(null);
  const [useBlank, setUseBlank] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

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
    onError: () => {
      toast({
        title: "Fehler",
        description: "Der Funnel konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  const handleContinue = () => {
    if (step === "template" && (selectedTemplate || useBlank)) {
      setStep("details");
      if (selectedTemplate) {
        setName(selectedTemplate.name);
      }
    } else if (step === "details" && name.trim()) {
      const templateData = useBlank 
        ? createBlankFunnel() 
        : selectedTemplate 
          ? { pages: selectedTemplate.pages, theme: selectedTemplate.theme }
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
    if (step === "details") {
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
                  ? "Wähle eine Vorlage oder starte von Grund auf"
                  : "Gib deinem Funnel einen Namen"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {step === "template" ? (
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-medium">Vorlagen</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {defaultTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    selected={selectedTemplate?.id === template.id && !useBlank}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setUseBlank(false);
                    }}
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
                disabled={!selectedTemplate && !useBlank}
                className="min-w-[120px]"
                data-testid="button-continue"
              >
                Weiter
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
    </div>
  );
}
