import { GitBranch } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEditorStore } from "./store/editor-store";

interface ConditionalLogicEditorProps {
  pageId: string;
}

export function ConditionalLogicEditor({ pageId }: ConditionalLogicEditorProps) {
  const pages = useEditorStore((s) => s.pages);
  const updatePage = useEditorStore((s) => s.updatePage);

  const page = pages.find((p) => p.id === pageId);
  if (!page) return null;

  const optionElements = page.elements.filter(
    (el) => el.options && el.options.length > 0
  );

  if (optionElements.length === 0) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg text-center">
        <GitBranch className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Füge Auswahloptionen hinzu, um Conditional Logic zu verwenden
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <GitBranch className="h-4 w-4" />
        <span>Leite Besucher basierend auf ihrer Antwort weiter</span>
      </div>

      {optionElements.map((element) => (
        <div key={element.id} className="space-y-2">
          <Label className="text-xs font-medium">Wenn Antwort ist:</Label>
          {element.options?.map((option, optIdx) => (
            <div
              key={optIdx}
              className="flex items-center gap-2 p-2 bg-muted/30 rounded"
            >
              <span className="text-sm flex-1 truncate">{option}</span>
              <Select
                value={
                  page.conditionalRouting?.[`${element.id}-${optIdx}`] || "next"
                }
                onValueChange={(value) => {
                  updatePage(pageId, {
                    conditionalRouting: {
                      ...page.conditionalRouting,
                      [`${element.id}-${optIdx}`]: value,
                    },
                  });
                }}
              >
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="next">Nächste Seite</SelectItem>
                  {pages.map((p, idx) => (
                    <SelectItem key={p.id} value={p.id}>
                      {idx + 1}. {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
