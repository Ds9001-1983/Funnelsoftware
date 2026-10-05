import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { trackPlatformEvent } from "@/lib/platform-tracker";
import { TEMPLATE_GALLERY_PATH } from "@shared/seo-links";

export function DemoCompletion({ slug, href, onComplete }: { slug: string; href: string; onComplete: () => void }) {
  useEffect(() => { onComplete(); }, [onComplete]);
  return <div className="shrink-0 space-y-3 border-t bg-background px-4 py-4 text-center text-foreground" data-testid="demo-completion">
    <p className="text-sm font-semibold">Demo abgeschlossen</p>
    <p className="text-xs leading-relaxed text-muted-foreground">Das war eine Vorschau. Es wurde keine Anfrage versendet. Übernimm jetzt die Vorlage und passe sie an dein Angebot an.</p>
    <Button asChild className="h-auto min-h-11 w-full whitespace-normal py-3 text-sm">
      <Link href={href} onClick={() => trackPlatformEvent(`${TEMPLATE_GALLERY_PATH}/${slug}`, "cta_click", `demo-end:${slug}`)}>Diese Vorlage kostenlos übernehmen</Link>
    </Button>
  </div>;
}
