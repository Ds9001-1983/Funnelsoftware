import { useState } from "react";
import {
  GitBranch,
  Plus,
  Trash2,
  ArrowRight,
  ChevronDown,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import type { FunnelPage, PageCondition, PageElement } from "@shared/schema";

interface ConditionalLogicEditorProps {
  page: FunnelPage;
  allPages: FunnelPage[];
  onUpdate: (updates: Partial<FunnelPage>) => void;
}

const operatorLabels: Record<PageCondition["operator"], string> = {
  equals: "ist gleich",
  notEquals: "ist ungleich",
  contains: "enthält",
  isEmpty: "ist leer",
};

const operatorDescriptions: Record<PageCondition["operator"], string> = {
  equals: "Exakte Übereinstimmung mit dem Wert",
  notEquals: "Wert stimmt nicht überein",
  contains: "Wert enthält den Text",
  isEmpty: "Feld wurde nicht ausgefüllt",
};

/**
 * Erweiterter Editor für bedingte Weiterleitungen.
 * Unterstützt verschiedene Operatoren und Bedingungen basierend auf Formulareingaben.
 */
export function ConditionalLogicEditor({
  page,
  allPages,
  onUpdate,
}: ConditionalLogicEditorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get elements that can be used for conditions
  const conditionalElements = page.elements.filter(el =>
    ["input", "textarea", "select", "radio", "checkbox"].includes(el.type) ||
    (el.options && el.options.length > 0)
  );

  const hasElements = conditionalElements.length > 0;
  const conditions = page.conditions || [];

  // Simple option-based routing (legacy support)
  const hasOptions = page.elements.some(el => el.options && el.options.length > 0);
  const optionElements = page.elements.filter(el => el.options && el.options.length > 0);

  const getElementLabel = (element: PageElement): string => {
    return element.label || element.placeholder || `Element (${element.type})`;
  };

  const addCondition = () => {
    if (conditionalElements.length === 0) return;

    const newCondition: PageCondition = {
      elementId: conditionalElements[0].id,
      operator: "equals",
      value: "",
      targetPageId: allPages[0]?.id || "",
    };

    onUpdate({
      conditions: [...conditions, newCondition],
    });
  };

  const updateCondition = (index: number, updates: Partial<PageCondition>) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    onUpdate({ conditions: newConditions });
  };

  const deleteCondition = (index: number) => {
    onUpdate({
      conditions: conditions.filter((_, i) => i !== index),
    });
  };

  // Simple routing update (for option-based)
  const updateSimpleRouting = (key: string, value: string) => {
    onUpdate({
      conditionalRouting: {
        ...page.conditionalRouting,
        [key]: value,
      },
    });
  };

  if (!hasElements) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg text-center">
        <GitBranch className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Füge Formularelemente hinzu, um Conditional Logic zu verwenden
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Simple option-based routing */}
      {hasOptions && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground">Einfache Weiterleitung</Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                Leite Besucher direkt basierend auf ihrer Auswahl weiter
              </TooltipContent>
            </Tooltip>
          </div>

          {optionElements.map((element) => (
            <Card key={element.id} className="border-muted">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {element.type === "radio" ? "Auswahl" : "Dropdown"}
                  </Badge>
                  <span className="text-xs text-muted-foreground truncate">
                    {getElementLabel(element)}
                  </span>
                </div>

                {element.options?.map((option, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2 text-sm">
                    <div className="flex-1 flex items-center gap-2 px-2 py-1 bg-muted/50 rounded text-xs">
                      <span className="truncate">{option}</span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    <Select
                      value={page.conditionalRouting?.[`${element.id}-${optIdx}`] || "next"}
                      onValueChange={(value) => updateSimpleRouting(`${element.id}-${optIdx}`, value)}
                    >
                      <SelectTrigger className="w-28 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="next">Nächste</SelectItem>
                        {allPages.map((p, idx) => (
                          <SelectItem key={p.id} value={p.id}>
                            {idx + 1}. {p.title.slice(0, 15)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Advanced conditions */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-md hover:bg-muted/50 transition-colors">
          <span className="text-sm font-medium flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Erweiterte Bedingungen
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-3 pt-2">
          <p className="text-xs text-muted-foreground">
            Erstelle komplexe Bedingungen basierend auf Formularfeldern.
          </p>

          {/* Existing conditions */}
          {conditions.map((condition, index) => {
            const element = conditionalElements.find(el => el.id === condition.elementId);
            const needsValue = condition.operator !== "isEmpty";

            return (
              <Card key={index} className="border-primary/20 bg-primary/5">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className="text-xs">Bedingung {index + 1}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => deleteCondition(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Element selection */}
                  <div className="space-y-1">
                    <Label className="text-xs">Wenn Feld</Label>
                    <Select
                      value={condition.elementId}
                      onValueChange={(value) => updateCondition(index, { elementId: value })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {conditionalElements.map((el) => (
                          <SelectItem key={el.id} value={el.id}>
                            {getElementLabel(el)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Operator selection */}
                  <div className="space-y-1">
                    <Label className="text-xs">Operator</Label>
                    <Select
                      value={condition.operator}
                      onValueChange={(value) => updateCondition(index, { operator: value as PageCondition["operator"] })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(operatorLabels) as PageCondition["operator"][]).map((op) => (
                          <SelectItem key={op} value={op}>
                            <div className="flex flex-col">
                              <span>{operatorLabels[op]}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {operatorDescriptions[condition.operator]}
                    </p>
                  </div>

                  {/* Value input (if needed) */}
                  {needsValue && (
                    <div className="space-y-1">
                      <Label className="text-xs">Wert</Label>
                      {element?.options ? (
                        <Select
                          value={condition.value || ""}
                          onValueChange={(value) => updateCondition(index, { value })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Wert wählen..." />
                          </SelectTrigger>
                          <SelectContent>
                            {element.options.map((opt, idx) => (
                              <SelectItem key={idx} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={condition.value || ""}
                          onChange={(e) => updateCondition(index, { value: e.target.value })}
                          placeholder="Vergleichswert eingeben..."
                          className="h-8 text-xs"
                        />
                      )}
                    </div>
                  )}

                  {/* Target page */}
                  <div className="space-y-1">
                    <Label className="text-xs">Dann gehe zu</Label>
                    <Select
                      value={condition.targetPageId}
                      onValueChange={(value) => updateCondition(index, { targetPageId: value })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {allPages.map((p, idx) => (
                          <SelectItem key={p.id} value={p.id}>
                            {idx + 1}. {p.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Add condition button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={addCondition}
          >
            <Plus className="h-4 w-4 mr-1" />
            Bedingung hinzufügen
          </Button>

          {conditions.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Hinweis:</strong> Bedingungen werden in der Reihenfolge geprüft.
                Die erste zutreffende Bedingung bestimmt die Weiterleitung.
                Wenn keine Bedingung zutrifft, wird zur Standardseite weitergeleitet.
              </p>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Default routing */}
      <div className="space-y-2 pt-2 border-t">
        <Label className="text-xs font-medium text-muted-foreground">
          Standard-Weiterleitung (wenn keine Bedingung zutrifft)
        </Label>
        <Select
          value={page.nextPageId || "auto"}
          onValueChange={(value) => onUpdate({ nextPageId: value === "auto" ? undefined : value })}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Automatisch (nächste Seite)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Automatisch (nächste Seite)</SelectItem>
            {allPages.map((p, idx) => (
              <SelectItem key={p.id} value={p.id}>
                {idx + 1}. {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
