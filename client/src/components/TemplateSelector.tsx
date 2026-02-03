import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Eye, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  funnelTemplates,
  templateCategories,
  getTemplatesByCategory,
  type FunnelTemplate,
} from "@/data/funnel-templates";

interface TemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Template-Auswahl-Dialog für die Erstellung neuer Funnels.
 * Zeigt alle verfügbaren Templates kategorisiert an.
 */
export function TemplateSelector({ open, onOpenChange }: TemplateSelectorProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [previewTemplate, setPreviewTemplate] = useState<FunnelTemplate | null>(null);

  const createFromTemplateMutation = useMutation({
    mutationFn: async (template: FunnelTemplate) => {
      const response = await apiRequest("POST", "/api/funnels", {
        name: `${template.name} - Kopie`,
        description: template.description,
        pages: template.pages.map((page, index) => ({
          ...page,
          id: `page-${Date.now()}-${index}`,
          elements: page.elements.map((el, elIndex) => ({
            ...el,
            id: `el-${Date.now()}-${index}-${elIndex}`,
          })),
        })),
        theme: template.theme,
        status: "draft",
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/funnels"] });
      toast({
        title: "Funnel erstellt",
        description: "Dein neuer Funnel wurde aus der Vorlage erstellt.",
      });
      onOpenChange(false);
      navigate(`/funnels/${data.id}/edit`);
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Der Funnel konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  const filteredTemplates = getTemplatesByCategory(selectedCategory);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      leads: "bg-purple-500",
      recruiting: "bg-green-500",
      quiz: "bg-yellow-500",
      webinar: "bg-red-500",
      sales: "bg-violet-500",
      survey: "bg-blue-500",
    };
    return colors[category] || "bg-gray-500";
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      leads: "Lead-Generierung",
      recruiting: "Recruiting",
      quiz: "Quiz",
      webinar: "Webinar",
      sales: "Verkauf",
      survey: "Umfrage",
    };
    return labels[category] || category;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Vorlage auswählen
            </DialogTitle>
          </DialogHeader>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mt-4">
            <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
              {templateCategories.map((cat) => (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-1.5 text-sm"
                >
                  {cat.name}
                  <span className="ml-1.5 text-xs opacity-70">({cat.count})</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex-1 overflow-y-auto mt-4 pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="group cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all overflow-hidden"
                >
                  <div
                    className="h-32 relative"
                    style={{ backgroundColor: template.theme.primaryColor }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white text-center px-4">
                        <div className="text-lg font-bold">{template.name}</div>
                        <div className="text-sm opacity-80">{template.pages.length} Seiten</div>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge className={`${getCategoryColor(template.category)} text-white border-0`}>
                        {getCategoryLabel(template.category)}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {template.description}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Vorschau
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => createFromTemplateMutation.mutate(template)}
                        disabled={createFromTemplateMutation.isPending}
                      >
                        {createFromTemplateMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Verwenden"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="mt-4">
              <div
                className="rounded-lg p-6 text-white mb-4"
                style={{ backgroundColor: previewTemplate.theme.primaryColor }}
              >
                <div className="text-xl font-bold mb-2">
                  {previewTemplate.pages[0]?.title}
                </div>
                <div className="text-sm opacity-80">
                  {previewTemplate.pages[0]?.subtitle || previewTemplate.description}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-sm font-medium">Seiten in dieser Vorlage:</div>
                {previewTemplate.pages.map((page, index) => (
                  <div
                    key={page.id}
                    className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm"
                  >
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span>{page.title}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {page.type}
                    </Badge>
                  </div>
                ))}
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  createFromTemplateMutation.mutate(previewTemplate);
                  setPreviewTemplate(null);
                }}
                disabled={createFromTemplateMutation.isPending}
              >
                {createFromTemplateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Diese Vorlage verwenden
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
