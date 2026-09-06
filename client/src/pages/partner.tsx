import { useEffect } from "react";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/use-document-title";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRight, Handshake, Link2, Wallet, TrendingUp } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingCta } from "@/components/marketing/MarketingCta";
import { partnerFaqs } from "@shared/seo-faqs";
import { faqPageJsonLd, partnerPage } from "@shared/seo-links";

// Statischer Inhalt → einmal pro Modul-Load statt pro Render.
const JSON_LD = JSON.stringify({ "@context": "https://schema.org", ...faqPageJsonLd(partnerFaqs) });

const steps = [
  {
    icon: Link2,
    title: "Link holen",
    text: "Registriere dich (kostenloser Free-Plan reicht) und kopiere deinen persönlichen Empfehlungslink aus dem Dashboard.",
  },
  {
    icon: Handshake,
    title: "Empfehlen",
    text: "Teile den Link mit Kunden, Lesern oder deiner Community — jede Registrierung darüber wird dir dauerhaft zugeordnet.",
  },
  {
    icon: Wallet,
    title: "Verdienen",
    text: "Sobald ein Geworbener auf Pro upgradet, bekommst du 25 % jeder Zahlung — Monat für Monat, solange das Abo läuft.",
  },
];

/**
 * Öffentliche Partnerprogramm-Seite: 25 % Lifetime-Provision.
 * Meta aus shared/seo-links (partnerPage), FAQ aus shared/seo-content —
 * dieselben Quellen nutzt die SSR-Meta-Injektion (server/static.ts).
 */
export default function Partner() {
  usePageMeta({
    title: partnerPage.metaTitle,
    description: partnerPage.metaDescription,
    canonical: partnerPage.path,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD }} />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <Badge variant="secondary" className="mb-6">
            <Handshake className="h-3 w-3 mr-1" />
            Partnerprogramm
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">
            Empfiehl Trichterwerk — verdiene 25&nbsp;% an jeder Zahlung. Dauerhaft.
          </h1>
          <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
            <p>
              Du kennst Coaches, Agenturen oder Selbstständige, die Funnels brauchen?
              Dann verdiene mit: Für jeden Pro-Kunden, der über deinen Link kommt,
              bekommst du <strong className="text-foreground">25&nbsp;% wiederkehrende
              Provision</strong> — nicht einmalig, sondern jeden Monat, solange das
              Abo läuft. Ohne Deckelung, ohne Mindestumsatz.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link href="/register">
              <Button size="lg" className="gap-2 text-lg px-8 shadow-lg shadow-primary/25">
                Jetzt Partner werden
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Kostenloser Account reicht · Link sofort verfügbar · monatliche Auszahlung
          </p>
        </div>
      </section>

      {/* Rechenbeispiel */}
      <section className="py-16 px-4 bg-muted/30 border-y">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            Was dabei rauskommt
          </h2>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                <TrendingUp className="h-8 w-8 text-primary shrink-0 mt-1" />
                <div className="space-y-3 text-lg leading-relaxed">
                  <p>
                    Trichterwerk Pro kostet <strong>49&nbsp;€/Monat</strong> — deine
                    Provision: <strong>12,25&nbsp;€ pro Monat und Kunde</strong>.
                  </p>
                  <p className="text-muted-foreground">
                    10 vermittelte Pro-Kunden = <strong className="text-foreground">122,50&nbsp;€
                    jeden Monat</strong>, ohne dass du dafür weiterarbeiten musst. Ein
                    einziger Blogartikel, ein Vergleichsbeitrag oder eine Empfehlung im
                    Kundenprojekt kann jahrelang weiterzahlen.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 3 Schritte */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
            In 3 Schritten zum Partner
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, idx) => (
              <div key={step.title}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-5xl font-bold text-primary/20">
                    {String(idx + 1).padStart(2, "0")}
                  </div>
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Für wen */}
      <section className="py-16 px-4 bg-muted/30 border-y">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ideal für Agenturen, Coaches und Tool-Seiten
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Du baust ohnehin Funnels für Kunden, schreibst über Marketing-Tools oder
            berätst Selbstständige? Dann ist die Empfehlung nur ein Nebensatz — und
            25&nbsp;% Lifetime schlagen die üblichen Einmal-Provisionen deutlich.
            Betreiber von Vergleichs- und Review-Seiten bekommen auf Anfrage
            Testzugang, Screenshots und eine vollständige Feature-/Preistabelle.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
            Häufige Fragen zum Partnerprogramm
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {partnerFaqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`}>
                <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <MarketingCta
        title="Bereit, mit Empfehlungen zu verdienen?"
        text="Registriere dich kostenlos, hol dir deinen Link aus dem Dashboard und verdiene 25 % an jeder Pro-Zahlung deiner Geworbenen — dauerhaft."
      />

      <MarketingFooter />
    </div>
  );
}
