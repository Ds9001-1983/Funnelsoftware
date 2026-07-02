import { useEffect } from "react";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/use-document-title";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  MousePointerClick,
  Smartphone,
  Target,
  TrendingUp,
  Server,
  ShieldCheck,
  Sparkles,
  Zap,
  GitCompare,
} from "lucide-react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingCta } from "@/components/marketing/MarketingCta";
// Bewusst NUR das leichte seo-links-Modul — die große Content-Registry
// (shared/seo-content.ts) bleibt dem Vergleichsseiten-Chunk vorbehalten.
import { comparisonLinks, funnelBuilderPage, faqPageJsonLd } from "@shared/seo-links";

const buildingBlocks = [
  {
    icon: MousePointerClick,
    title: "Drag & Drop Editor",
    text: "Seiten, Fragen und Formulare per Maus zusammenstellen — ohne HTML, CSS oder Entwickler. Über 20 Bausteine: Texte, Videos, Formulare, Countdowns, Slider und mehr.",
  },
  {
    icon: Smartphone,
    title: "Mobile-First",
    text: "Über 80 % der Funnel-Besucher kommen vom Smartphone. Ein guter Funnel-Builder optimiert jede Seite automatisch für mobile Geräte — mit Live-Vorschau beim Bauen.",
  },
  {
    icon: Target,
    title: "Conditional Logic",
    text: "Besucher sehen je nach Antwort unterschiedliche Seiten: Der Interessent mit Budget landet beim Kontaktformular, der Rest beim Newsletter. So qualifiziert der Funnel automatisch vor.",
  },
  {
    icon: TrendingUp,
    title: "Analytics & A/B-Tests",
    text: "Views, Conversions und Absprünge pro Seite auf einen Blick — plus A/B-Tests, um Headlines und Angebote gegeneinander zu testen. Ohne Google Analytics, ohne Cookies.",
  },
  {
    icon: Server,
    title: "Eigene Domain & Publishing",
    text: "Ein Klick, und der Funnel ist live — unter deiner eigenen Domain mit automatischem SSL-Zertifikat. Kein Hosting-Setup, keine Server-Administration.",
  },
  {
    icon: ShieldCheck,
    title: "DSGVO & Lead-Verwaltung",
    text: "Leads landen zentral im Dashboard, exportierbar als CSV oder per Webhook ans CRM. Bei einem deutschen Anbieter wie Trichterwerk inklusive EU-Hosting und AVV.",
  },
];

const useCases = [
  {
    title: "Coaches & Berater",
    text: "Qualifizierungs-Funnel statt Kaltakquise: Interessenten beantworten 3–5 Fragen, nur passende Leads buchen ein Erstgespräch.",
  },
  {
    title: "Dienstleister & Agenturen",
    text: "Leistungen präsentieren, Bedarf abfragen, Termin oder Angebot anstoßen — der Funnel arbeitet rund um die Uhr als digitaler Vertriebsassistent.",
  },
  {
    title: "Recruiter & HR-Teams",
    text: "Schnell-Bewerbung per Funnel: Kandidaten beantworten die wichtigsten Fragen mobil in 2 Minuten — das Screening übernimmt die Funnel-Logik.",
  },
];

const faqs = [
  {
    q: "Was ist ein Funnel-Builder?",
    a: "Ein Funnel-Builder ist eine Software, mit der du mehrstufige Marketing-Funnels ohne Programmierkenntnisse erstellst: Landingpage, Frage-Seiten, Kontaktformular und Danke-Seite — verbunden mit Logik, Tracking und Lead-Verwaltung in einem Tool.",
  },
  {
    q: "Was ist der Unterschied zwischen Funnel, Landingpage und Formular?",
    a: "Eine Landingpage ist eine einzelne Seite, ein Formular ein einzelner Baustein. Ein Funnel verbindet beides zu einer Strecke: Er führt Besucher Schritt für Schritt vom ersten Interesse bis zur Kontaktaufnahme — und qualifiziert sie unterwegs mit Fragen.",
  },
  {
    q: "Brauche ich Programmierkenntnisse für einen Funnel-Builder?",
    a: "Nein. Moderne Funnel-Builder wie Trichterwerk arbeiten mit Drag & Drop und fertigen Templates. Wenn du eine E-Mail schreiben kannst, kannst du einen Funnel bauen.",
  },
  {
    q: "Was kostet ein Funnel-Builder?",
    a: "Die Spanne reicht von ca. 25 $ (reine Formular-Tools wie Typeform) über 49 € (Trichterwerk, alles inklusive) bis 99 €+ pro Monat (Perspective) oder 97 $+ (ClickFunnels). Entscheidend ist, ob Leads, Funnels und Features unbegrenzt sind oder pro Plan limitiert.",
  },
  {
    q: "Gibt es einen DSGVO-konformen Funnel-Builder aus Deutschland?",
    a: "Ja — Trichterwerk wird in Deutschland entwickelt, hostet ausschließlich in der EU, misst cookielos und stellt eine AVV bereit. Damit ist die häufigste Compliance-Hürde von US-Tools gelöst.",
  },
  {
    q: "Wie schnell ist ein Funnel live?",
    a: "Mit Template und Drag & Drop-Editor typischerweise in unter einer Stunde: registrieren, Vorlage wählen, Texte und Farben anpassen, veröffentlichen — fertig.",
  },
];

// Statischer Inhalt → einmal pro Modul-Load statt pro Render.
const JSON_LD = JSON.stringify({ "@context": "https://schema.org", ...faqPageJsonLd(faqs) });

/**
 * Pillar-Page für „Funnel-Builder" — erklärt die Tool-Kategorie und verlinkt
 * auf die /vergleich/-Seiten (interne Verlinkung, SEO).
 */
export default function FunnelBuilder() {
  usePageMeta({
    title: funnelBuilderPage.metaTitle,
    description: funnelBuilderPage.metaDescription,
    canonical: funnelBuilderPage.path,
  });

  // Scroll-Reset bei interner wouter-Navigation (Querverweise liegen am Seitenende).
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
            <Sparkles className="h-3 w-3 mr-1" />
            Der Guide aus Deutschland
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">
            Funnel-Builder: Marketing-Funnels ohne Code erstellen
          </h1>
          <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
            <p>
              Ein Funnel-Builder ist eine Software, mit der du mehrstufige
              Marketing-Funnels selbst erstellst — ohne Programmierung, ohne
              Agentur. Landingpage, Qualifizierungsfragen, Kontaktformular und
              Danke-Seite entstehen in einem Editor und gehen mit einem Klick
              live.
            </p>
            <p>
              Auf dieser Seite erfährst du, was ein Funnel-Builder können muss,
              wie er sich von Landingpage-Baukästen und Formular-Tools
              unterscheidet — und worauf du im DACH-Raum (Stichwort DSGVO)
              achten solltest.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link href="/register">
              <Button size="lg" className="gap-2 text-lg px-8 shadow-lg shadow-primary/25">
                Trichterwerk 14 Tage kostenlos testen
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            14 Tage kostenlos · erste Belastung erst nach der Testphase · monatlich kündbar
          </p>
        </div>
      </section>

      {/* Funnel vs. Landingpage vs. Formular */}
      <section className="py-16 px-4 bg-muted/30 border-y">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Funnel, Landingpage oder Formular — was ist der Unterschied?
          </h2>
          <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
            <p>
              Ein <span className="text-foreground font-medium">Formular</span>{" "}
              sammelt Daten — mehr nicht. Eine{" "}
              <span className="text-foreground font-medium">Landingpage</span>{" "}
              präsentiert ein Angebot auf einer einzelnen Seite. Ein{" "}
              <span className="text-foreground font-medium">Funnel</span>{" "}
              verbindet beides zu einer Strecke: Er holt Besucher mit einem
              klaren Versprechen ab, qualifiziert sie mit wenigen Fragen und
              führt sie gezielt zur Kontaktaufnahme.
            </p>
            <p>
              Der Effekt: Statt eines anonymen „Kontaktieren Sie uns"-Formulars
              bekommst du vorqualifizierte Leads mit Kontext — wer sie sind, was
              sie brauchen, wie dringend. Genau dafür ist ein Funnel-Builder
              gemacht.
            </p>
          </div>
        </div>
      </section>

      {/* Was ein Funnel-Builder können muss */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Was ein guter Funnel-Builder können muss
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Sechs Bausteine entscheiden, ob aus Besuchern Leads werden — alle
              sechs sind in Trichterwerk eingebaut.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {buildingBlocks.map((b) => (
              <Card key={b.title}>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <b.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{b.title}</CardTitle>
                  <CardDescription className="text-base">{b.text}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* DSGVO */}
      <section className="py-16 px-4 bg-muted/30 border-y">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            DSGVO: Warum der Standort des Funnel-Builders zählt
          </h2>
          <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
            <p>
              In einem Funnel gibst du Besucherdaten in fremde Hände: Namen,
              E-Mail-Adressen, Antworten auf Qualifizierungsfragen. Liegt der
              Anbieter in den USA (oder nutzt US-Subdienstleister), musst du
              Drittlandtransfers rechtfertigen — ein Dauerthema für
              Datenschutzbeauftragte.
            </p>
            <p>
              Ein deutscher Anbieter mit EU-Hosting löst das strukturell:
              Trichterwerk hostet ausschließlich in der EU, misst Reichweite
              cookielos, stellt eine AVV bereit und gehört keinem US-Konzern.
              Deine Leads bleiben deine Leads — jederzeit als CSV exportierbar.
            </p>
          </div>
        </div>
      </section>

      {/* Use-Cases */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
            Für wen sich ein Funnel-Builder lohnt
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {useCases.map((u) => (
              <Card key={u.title}>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{u.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{u.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Preis-Zusammenfassung */}
      <section className="py-16 px-4 bg-muted/30 border-y">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Was kostet ein Funnel-Builder?</h2>
          <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
            <p>
              Reine Formular-Tools starten bei rund 25 $ pro Monat (mit
              Antwort-Limits), dedizierte Funnel-Plattformen liegen zwischen 49 €
              und 99 €+ — US-Tools wie ClickFunnels bei 97 $+. Achte weniger auf
              den Einstiegspreis als auf die Limits: Wie viele Funnels, wie viele
              Leads, welche Features sind wirklich enthalten?
            </p>
            <p>
              Trichterwerk hat bewusst genau einen Plan:{" "}
              <span className="text-foreground font-medium">
                49 € pro Monat, alles inklusive
              </span>{" "}
              — unbegrenzte Funnels, unbegrenzte Leads, alle Templates,
              Conditional Logic, A/B-Tests, Analytics und eigene Domain.
              Monatlich kündbar, 14 Tage kostenlos.
            </p>
          </div>
        </div>
      </section>

      {/* Vergleichs-Links */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 mx-auto">
            <GitCompare className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Trichterwerk im Vergleich</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Du nutzt schon ein Tool oder schwankst zwischen Anbietern? Wir haben
            die bekanntesten Alternativen ehrlich gegenübergestellt:
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {comparisonLinks.map((link) => (
              <Link key={link.path} href={link.path}>
                <Button variant="outline" className="gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  vs. {link.competitor}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-muted/30 border-y">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
            Häufige Fragen zum Funnel-Builder
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`}>
                <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <MarketingCta
        title="Bau deinen ersten Funnel — heute noch"
        text="Vom Signup zum ersten Lead in unter einer Stunde: Template wählen, anpassen, veröffentlichen. 14 Tage kostenlos, monatlich kündbar."
      />

      <MarketingFooter />
    </div>
  );
}
