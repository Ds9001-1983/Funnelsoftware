import { useState } from "react";
import {
  FlaskConical,
  Plus,
  Trash2,
  Play,
  Pause,
  Trophy,
  BarChart3,
  ChevronDown,
  Copy,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ABTest, ABTestVariant, FunnelPage } from "@shared/schema";

interface ABTestEditorProps {
  page: FunnelPage;
  abTests: ABTest[];
  onCreateTest: (test: ABTest) => void;
  onUpdateTest: (testId: string, updates: Partial<ABTest>) => void;
  onDeleteTest: (testId: string) => void;
  onStartTest: (testId: string) => void;
  onPauseTest: (testId: string) => void;
  onCompleteTest: (testId: string, winnerId: string) => void;
}

/**
 * Editor für A/B Tests auf Seitenebene.
 * Ermöglicht das Erstellen, Verwalten und Auswerten von A/B Tests.
 */
export function ABTestEditor({
  page,
  abTests,
  onCreateTest,
  onUpdateTest,
  onDeleteTest,
  onStartTest,
  onPauseTest,
  onCompleteTest,
}: ABTestEditorProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTestName, setNewTestName] = useState("");
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

  // Get tests for this page
  const pageTests = abTests.filter((test) => test.pageId === page.id);

  const createNewTest = () => {
    if (!newTestName.trim()) return;

    const newTest: ABTest = {
      id: `abtest-${Date.now()}`,
      name: newTestName,
      pageId: page.id,
      variants: [
        {
          id: `variant-${Date.now()}-a`,
          name: "Variante A (Kontrolle)",
          trafficAllocation: 50,
          views: 0,
          conversions: 0,
        },
        {
          id: `variant-${Date.now()}-b`,
          name: "Variante B",
          title: page.title,
          trafficAllocation: 50,
          views: 0,
          conversions: 0,
        },
      ],
      status: "draft",
      config: {
        minSampleSize: 100,
        significanceThreshold: 0.95,
        goalMetric: "conversion",
      },
      createdAt: new Date().toISOString(),
    };

    onCreateTest(newTest);
    setNewTestName("");
    setShowCreateDialog(false);
    setExpandedTestId(newTest.id);
  };

  const addVariant = (testId: string, test: ABTest) => {
    const variantCount = test.variants.length;
    const newAllocation = Math.floor(100 / (variantCount + 1));

    // Redistribute traffic allocation
    const updatedVariants = test.variants.map(v => ({
      ...v,
      trafficAllocation: newAllocation,
    }));

    const newVariant: ABTestVariant = {
      id: `variant-${Date.now()}`,
      name: `Variante ${String.fromCharCode(65 + variantCount)}`,
      title: page.title,
      trafficAllocation: 100 - (newAllocation * variantCount),
      views: 0,
      conversions: 0,
    };

    onUpdateTest(testId, {
      variants: [...updatedVariants, newVariant],
    });
  };

  const updateVariant = (testId: string, variantId: string, updates: Partial<ABTestVariant>) => {
    const test = abTests.find(t => t.id === testId);
    if (!test) return;

    const updatedVariants = test.variants.map(v =>
      v.id === variantId ? { ...v, ...updates } : v
    );

    onUpdateTest(testId, { variants: updatedVariants });
  };

  const deleteVariant = (testId: string, variantId: string) => {
    const test = abTests.find(t => t.id === testId);
    if (!test || test.variants.length <= 2) return;

    const remainingVariants = test.variants.filter(v => v.id !== variantId);
    const newAllocation = Math.floor(100 / remainingVariants.length);

    const updatedVariants = remainingVariants.map((v, idx) => ({
      ...v,
      trafficAllocation: idx === remainingVariants.length - 1
        ? 100 - (newAllocation * (remainingVariants.length - 1))
        : newAllocation,
    }));

    onUpdateTest(testId, { variants: updatedVariants });
  };

  const calculateConversionRate = (variant: ABTestVariant): string => {
    if (variant.views === 0) return "0%";
    return `${((variant.conversions / variant.views) * 100).toFixed(1)}%`;
  };

  const getStatusBadge = (status: ABTest["status"]) => {
    const statusConfig = {
      draft: { label: "Entwurf", variant: "secondary" as const },
      running: { label: "Aktiv", variant: "default" as const },
      paused: { label: "Pausiert", variant: "outline" as const },
      completed: { label: "Abgeschlossen", variant: "secondary" as const },
    };
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary" />
          <h4 className="font-medium">A/B Tests</h4>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Neuer Test
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen A/B Test erstellen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Testname</Label>
                <Input
                  value={newTestName}
                  onChange={(e) => setNewTestName(e.target.value)}
                  placeholder="z.B. Headline Test Q1"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Der Test startet mit 2 Varianten (Kontrolle + 1 Alternative).
                Du kannst weitere Varianten nach der Erstellung hinzufügen.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Abbrechen
              </Button>
              <Button onClick={createNewTest} disabled={!newTestName.trim()}>
                Test erstellen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty state */}
      {pageTests.length === 0 && (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <FlaskConical className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Keine A/B Tests für diese Seite.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Erstelle einen Test, um verschiedene Varianten zu vergleichen.
          </p>
        </div>
      )}

      {/* Test list */}
      {pageTests.map((test) => (
        <Card key={test.id} className="border-l-4 border-l-primary/50">
          <Collapsible
            open={expandedTestId === test.id}
            onOpenChange={(open) => setExpandedTestId(open ? test.id : null)}
          >
            <CollapsibleTrigger className="w-full">
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        expandedTestId === test.id ? "rotate-180" : ""
                      }`}
                    />
                    <CardTitle className="text-sm font-medium">{test.name}</CardTitle>
                    {getStatusBadge(test.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    {test.status === "draft" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartTest(test.id);
                            }}
                          >
                            <Play className="h-4 w-4 text-green-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Test starten</TooltipContent>
                      </Tooltip>
                    )}
                    {test.status === "running" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPauseTest(test.id);
                            }}
                          >
                            <Pause className="h-4 w-4 text-amber-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Test pausieren</TooltipContent>
                      </Tooltip>
                    )}
                    {test.status === "paused" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartTest(test.id);
                            }}
                          >
                            <Play className="h-4 w-4 text-green-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Test fortsetzen</TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTest(test.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Test löschen</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <CardContent className="pt-0 space-y-4">
                {/* Variants */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground">Varianten</Label>
                    {test.status === "draft" && test.variants.length < 4 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => addVariant(test.id, test)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Variante
                      </Button>
                    )}
                  </div>

                  {test.variants.map((variant, idx) => (
                    <div
                      key={variant.id}
                      className={`p-3 rounded-lg border ${
                        test.winnerId === variant.id
                          ? "border-green-400 bg-green-50 dark:bg-green-950/20"
                          : "border-muted"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {test.winnerId === variant.id && (
                            <Trophy className="h-4 w-4 text-green-600" />
                          )}
                          <span className="text-sm font-medium">{variant.name}</span>
                          {idx === 0 && (
                            <Badge variant="outline" className="text-xs">Kontrolle</Badge>
                          )}
                        </div>
                        {test.status === "draft" && idx > 0 && test.variants.length > 2 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => deleteVariant(test.id, variant.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      {/* Variant name edit (draft only) */}
                      {test.status === "draft" && (
                        <Input
                          value={variant.name}
                          onChange={(e) => updateVariant(test.id, variant.id, { name: e.target.value })}
                          className="h-7 text-xs mb-2"
                          placeholder="Variantenname"
                        />
                      )}

                      {/* Traffic allocation (draft only) */}
                      {test.status === "draft" && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Traffic</span>
                            <span>{variant.trafficAllocation}%</span>
                          </div>
                          <Slider
                            value={[variant.trafficAllocation]}
                            onValueChange={([value]) => {
                              // Simple redistribution to other variants
                              const others = test.variants.filter(v => v.id !== variant.id);
                              const remaining = 100 - value;
                              const perOther = Math.floor(remaining / others.length);

                              const updatedVariants = test.variants.map(v => {
                                if (v.id === variant.id) {
                                  return { ...v, trafficAllocation: value };
                                }
                                return { ...v, trafficAllocation: perOther };
                              });

                              // Adjust last variant to account for rounding
                              const total = updatedVariants.reduce((sum, v) => sum + v.trafficAllocation, 0);
                              if (total !== 100) {
                                updatedVariants[updatedVariants.length - 1].trafficAllocation += (100 - total);
                              }

                              onUpdateTest(test.id, { variants: updatedVariants });
                            }}
                            min={10}
                            max={90}
                            step={5}
                            className="w-full"
                          />
                        </div>
                      )}

                      {/* Variant title override */}
                      {idx > 0 && test.status === "draft" && (
                        <div className="mt-2">
                          <Label className="text-xs text-muted-foreground">Überschrift-Variante</Label>
                          <Input
                            value={variant.title || ""}
                            onChange={(e) => updateVariant(test.id, variant.id, { title: e.target.value })}
                            className="h-7 text-xs mt-1"
                            placeholder={page.title || "Titel eingeben..."}
                          />
                        </div>
                      )}

                      {/* Stats (running/completed) */}
                      {(test.status === "running" || test.status === "paused" || test.status === "completed") && (
                        <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                          <div className="p-2 bg-muted/50 rounded">
                            <div className="text-lg font-semibold">{variant.views}</div>
                            <div className="text-xs text-muted-foreground">Views</div>
                          </div>
                          <div className="p-2 bg-muted/50 rounded">
                            <div className="text-lg font-semibold">{variant.conversions}</div>
                            <div className="text-xs text-muted-foreground">Conversions</div>
                          </div>
                          <div className="p-2 bg-muted/50 rounded">
                            <div className="text-lg font-semibold">{calculateConversionRate(variant)}</div>
                            <div className="text-xs text-muted-foreground">Rate</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Test config (draft only) */}
                {test.status === "draft" && (
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                      <Settings2 className="h-4 w-4" />
                      Erweiterte Einstellungen
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Zielmetrik</Label>
                        <Select
                          value={test.config?.goalMetric || "conversion"}
                          onValueChange={(value) =>
                            onUpdateTest(test.id, {
                              config: {
                                minSampleSize: test.config?.minSampleSize ?? 100,
                                significanceThreshold: test.config?.significanceThreshold ?? 0.95,
                                goalMetric: value as "conversion" | "engagement" | "time_on_page"
                              }
                            })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="conversion">Conversion-Rate</SelectItem>
                            <SelectItem value="engagement">Engagement</SelectItem>
                            <SelectItem value="time_on_page">Verweildauer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Min. Stichprobengröße</Label>
                        <Input
                          type="number"
                          value={test.config?.minSampleSize || 100}
                          onChange={(e) =>
                            onUpdateTest(test.id, {
                              config: {
                                minSampleSize: parseInt(e.target.value, 10) || 100,
                                significanceThreshold: test.config?.significanceThreshold ?? 0.95,
                                goalMetric: test.config?.goalMetric ?? "conversion"
                              }
                            })
                          }
                          min={50}
                          className="h-8"
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Declare winner (running/paused with data) */}
                {(test.status === "running" || test.status === "paused") && (
                  <div className="pt-2 border-t">
                    <Label className="text-xs text-muted-foreground mb-2 block">Gewinner festlegen</Label>
                    <div className="flex gap-2">
                      {test.variants.map((variant) => (
                        <Button
                          key={variant.id}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => onCompleteTest(test.id, variant.id)}
                        >
                          <Trophy className="h-3 w-3 mr-1" />
                          {variant.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
}
