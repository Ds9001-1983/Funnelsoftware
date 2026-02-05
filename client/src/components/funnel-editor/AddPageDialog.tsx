import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FunnelPage } from "@shared/schema";

type PageType = FunnelPage["type"];

interface AddPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (type: PageType) => void;
}

const pageTypes: { type: PageType; label: string; description: string; icon: string }[] = [
  { type: "welcome", label: "Willkommen", description: "Begrüßungsseite mit Hero", icon: "W" },
  { type: "question", label: "Frage", description: "Einfache Textfrage", icon: "?" },
  { type: "multiChoice", label: "Mehrfachauswahl", description: "Multiple-Choice", icon: "C" },
  { type: "contact", label: "Kontakt", description: "Kontaktformular", icon: "@" },
  { type: "calendar", label: "Kalender", description: "Terminbuchung", icon: "K" },
  { type: "thankyou", label: "Danke", description: "Abschlussseite", icon: "T" },
];

/**
 * Dialog zum Hinzufügen einer neuen Seite zum Funnel.
 * Zeigt alle verfügbaren Seitentypen mit Icon und Beschreibung.
 */
export function AddPageDialog({ open, onOpenChange, onAdd }: AddPageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Neue Seite hinzufügen</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 mt-4">
          {pageTypes.map((pt) => (
            <Card
              key={pt.type}
              className="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all hover:shadow-md"
              onClick={() => {
                onAdd(pt.type);
                onOpenChange(false);
              }}
              data-testid={`add-page-${pt.type}`}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-bold text-lg text-primary">
                  {pt.icon}
                </div>
                <div>
                  <div className="font-medium">{pt.label}</div>
                  <div className="text-xs text-muted-foreground">{pt.description}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
