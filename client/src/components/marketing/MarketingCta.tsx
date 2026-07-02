import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Sparkles } from "lucide-react";

interface MarketingCtaProps {
  /** Überschrift der CTA-Karte. */
  title: string;
  /** Fließtext unter der Überschrift. */
  text: string;
  /** Badge-Text über der Überschrift (optional). */
  badge?: string;
}

/**
 * Primäre CTA-Karte der SEO-Marketing-Seiten (Vergleiche, Funnel-Builder-Guide)
 * — eine gemeinsame Komponente statt Copy-Paste pro Seite.
 */
export function MarketingCta({ title, text, badge = "14 Tage gratis · Monatlich kündbar" }: MarketingCtaProps) {
  return (
    <section className="py-20 px-4 bg-muted/30 border-t">
      <div className="container mx-auto max-w-4xl">
        <Card className="bg-primary text-primary-foreground overflow-hidden">
          <CardContent className="p-12 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-sm font-medium mb-5">
              <Sparkles className="h-3.5 w-3.5" />
              {badge}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
            <p className="text-primary-foreground/85 max-w-2xl mx-auto mb-8">{text}</p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="gap-2 text-lg px-8">
                14 Tage kostenlos testen
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
