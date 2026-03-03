import { useState } from "react";
import { LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import type { PageElement } from "@shared/schema";
import { sectionTemplates } from "./constants";
import { useEditorStore } from "./store/editor-store";

export function SectionTemplatesPicker() {
  const [open, setOpen] = useState(false);
  const addElement = useEditorStore((s) => s.addElement);
  const currentPage = useEditorStore((s) => s.getCurrentPage());

  const handleInsert = (templateElements: Partial<PageElement>[]) => {
    for (const el of templateElements) {
      if (el.type) {
        // Add each element - addElement generates fresh IDs automatically
        const state = useEditorStore.getState();
        const page = state.pages.find((p) => p.id === state.currentPageId);
        if (!page) break;

        const newElement: PageElement = {
          id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: el.type,
          ...el,
        };

        // Directly update pages to add element
        const elements = [...page.elements, newElement];
        const pages = state.pages.map((p) =>
          p.id === state.currentPageId ? { ...p, elements } : p
        );
        useEditorStore.setState({ pages, saveStatus: "unsaved" });
      }
    }
    setOpen(false);
  };

  if (!currentPage) return null;

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
              onClick={() => handleInsert(template.elements)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                    <LayoutTemplate className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {template.description}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {template.elements.length} Element
                      {template.elements.length > 1 ? "e" : ""}
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
