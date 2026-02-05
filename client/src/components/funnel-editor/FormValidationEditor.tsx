import { useState } from "react";
import { ChevronDown, AlertCircle, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { PageElement } from "@shared/schema";

interface FormValidationEditorProps {
  element: PageElement;
  onUpdate: (updates: Partial<PageElement>) => void;
}

/**
 * Editor für Formular-Validierungsoptionen.
 * Ermöglicht die Konfiguration von Validierungsregeln für Eingabefelder.
 */
export function FormValidationEditor({ element, onUpdate }: FormValidationEditorProps) {
  const [showValidation, setShowValidation] = useState(false);

  // Only show for form elements
  const isFormElement = ["input", "textarea", "select", "checkbox", "radio", "date", "fileUpload"].includes(element.type);

  if (!isFormElement) {
    return null;
  }

  const validation = element.validation || {};

  const updateValidation = (updates: Partial<NonNullable<PageElement["validation"]>>) => {
    onUpdate({
      validation: { ...validation, ...updates },
    });
  };

  // Determine which validation options to show based on element type
  const showTextValidation = element.type === "input" || element.type === "textarea";
  const showTypeValidation = element.type === "input";

  return (
    <div className="space-y-3 border-t pt-3 mt-3">
      {/* Required field toggle - always visible */}
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium flex items-center gap-2">
          <AlertCircle className="h-3 w-3" />
          Pflichtfeld
        </Label>
        <Switch
          checked={element.required || false}
          onCheckedChange={(checked) => onUpdate({ required: checked })}
        />
      </div>

      <Collapsible open={showValidation} onOpenChange={setShowValidation}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-md hover:bg-muted/50 transition-colors">
          <span className="text-sm font-medium flex items-center gap-2">
            <Check className="h-4 w-4" />
            Validierung
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showValidation ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          {/* Validation Type (for input fields) */}
          {showTypeValidation && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Eingabetyp</Label>
              <Select
                value={validation.type || "text"}
                onValueChange={(v) => updateValidation({ type: v as NonNullable<PageElement["validation"]>["type"] })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="email">E-Mail</SelectItem>
                  <SelectItem value="phone">Telefon</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="number">Zahl</SelectItem>
                  <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Min/Max Length (for text fields) */}
          {showTextValidation && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Min. Zeichen</Label>
                <Input
                  type="number"
                  min={0}
                  value={validation.minLength ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                    updateValidation({ minLength: val });
                  }}
                  placeholder="0"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max. Zeichen</Label>
                <Input
                  type="number"
                  min={0}
                  value={validation.maxLength ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                    updateValidation({ maxLength: val });
                  }}
                  placeholder="Keine"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}

          {/* Min/Max Value (for number fields) */}
          {validation.type === "number" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Min. Wert</Label>
                <Input
                  type="number"
                  value={validation.min ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? parseFloat(e.target.value) : undefined;
                    updateValidation({ min: val });
                  }}
                  placeholder="Keine"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max. Wert</Label>
                <Input
                  type="number"
                  value={validation.max ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? parseFloat(e.target.value) : undefined;
                    updateValidation({ max: val });
                  }}
                  placeholder="Keine"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}

          {/* Custom Pattern (for custom type) */}
          {validation.type === "custom" && (
            <div className="space-y-1">
              <Label className="text-xs">Regex-Muster</Label>
              <Input
                value={validation.pattern || ""}
                onChange={(e) => updateValidation({ pattern: e.target.value })}
                placeholder="^[A-Z].*$"
                className="h-8 text-xs font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Regulärer Ausdruck für die Validierung
              </p>
            </div>
          )}

          {/* Custom Error Message */}
          <div className="space-y-1">
            <Label className="text-xs">Fehlermeldung</Label>
            <Input
              value={validation.errorMessage || ""}
              onChange={(e) => updateValidation({ errorMessage: e.target.value })}
              placeholder="Bitte geben Sie einen gültigen Wert ein"
              className="h-8 text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Wird bei ungültiger Eingabe angezeigt
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
