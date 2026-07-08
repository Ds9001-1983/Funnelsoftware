import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PhoneFrame } from "@/components/marketing/PhoneFrame";
import { FunnelRenderer } from "@/components/funnel-viewer/FunnelRenderer";
import type { ClientTemplate } from "@/lib/templates";

interface TemplatePreviewDialogProps {
  template: ClientTemplate | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Interaktive Template-Vorschau im Phone-Mockup als Dialog — genutzt in der
 * eingeloggten Template-Auswahl (/funnels/new). Gleicher Renderer wie die
 * öffentliche Galerie: komplett offline durchspielbar, keine Leads/Analytics.
 */
export function TemplatePreviewDialog({ template, onOpenChange }: TemplatePreviewDialogProps) {
  return (
    <Dialog open={!!template} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        {template && (
          <>
            <DialogHeader>
              <DialogTitle>{template.name}</DialogTitle>
              <DialogDescription>
                Voll interaktive Vorschau — klick dich durch, es wird nichts gespeichert.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center pt-2">
              <PhoneFrame className="w-[320px]" screenClassName="h-[min(560px,60vh)]">
                <FunnelRenderer
                  key={template.slug}
                  funnel={template}
                  mode="preview"
                  className="h-full"
                />
              </PhoneFrame>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
