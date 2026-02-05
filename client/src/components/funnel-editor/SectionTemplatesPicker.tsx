import { useState } from "react";
import { LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { sectionTemplates } from "./constants";
import type { PageElement } from "@shared/schema";

interface SectionTemplatesPickerProps {
  onInsert: (elements: PageElement[]) => void;
}

/**
 * Dialog zur Auswahl von vordefinierten Sektions-Templates.
 * Templates enthalten mehrere Elemente für bestimmte Anwendungsfälle.
 */
export function SectionTemplatesPicker({ onInsert }: SectionTemplatesPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() => setOpen(true)}
      >
        <LayoutTemplate className="h-4 w-4" />
        Section-Vorlage einfügen
      </Button>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Section-Vorlage wählen</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 mt-4 max-h-[60vh] overflow-y-auto">
          {sectionTemplates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
              onClick={() => {
                const elementsWithNewIds = template.elements.map(el => ({
                  ...el,
                  id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                }));
                onInsert(elementsWithNewIds as PageElement[]);
                setOpen(false);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <LayoutTemplate className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-muted-foreground">{template.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {template.elements.length} Element{template.elements.length > 1 ? "e" : ""}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
