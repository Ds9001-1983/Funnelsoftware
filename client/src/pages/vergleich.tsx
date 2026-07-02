import { useEffect } from "react";
import { Link, useRoute } from "wouter";
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
import { Check, X as XIcon, ArrowRight, Zap } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingCta } from "@/components/marketing/MarketingCta";
import {
  getComparisonPage,
  faqPageJsonLd,
  type ComparisonPageContent,
} from "@shared/seo-content";
import { SITE_ORIGIN, comparisonLinks, funnelBuilderPage } from "@shared/seo-links";

// Einmal pro Seiten-Load statt pro Render (Disclaimer unter der Tabelle).
const COMPETITOR_DATA_DATE = new Date().toLocaleDateString("de-DE", {
  month: "long",
  year: "numeric",
});

/** FAQPage + BreadcrumbList als JSON-LD (Google liest das auch client-gerendert). */
function buildJsonLd(c: ComparisonPageContent): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      faqPageJsonLd(c.faqs),
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Start", item: SITE_ORIGIN },
          {
            "@type": "ListItem",
            position: 2,
            name: `${c.competitorName}-Alternative`,
            item: `${SITE_ORIGIN}/vergleich/${c.slug}`,
          },
        ],
      },
    ],
  });
}

/** Zelle der 2-Spalten-Vergleichstabelle (Boolean → Icon, String → Text). */
function ComparisonCell({ value, highlight }: { value: boolean | string; highlight: boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className={`h-5 w-5 mx-auto ${highlight ? "text-primary" : "text-muted-foreground"}`} />
    ) : (
      <XIcon className={`h-5 w-5 mx-auto ${highlight ? "text-muted-foreground/60" : "text-muted-foreground/40"}`} />
    );
  }
  return highlight ? (
    <span className="font-semibold text-primary">{value}</span>
  ) : (
    <span className="text-muted-foreground">{value}</span>
  );
}

/**
 * Intro-Absatz mit interner Verlinkung: das erste Vorkommen von
 * „Funnel-Builder" wird zur Pillar-Seite verlinkt (falls vorhanden).
 */
function IntroParagraph({ text }: { text: string }) {
  const term = "Funnel-Builder";
  const idx = text.indexOf(term);
  if (idx === -1) return <p>{text}</p>;
  return (
    <p>
      {text.slice(0, idx)}
      <Link
        href={funnelBuilderPage.path}
        className="text-foreground underline underline-offset-4 decoration-primary/40 hover:decoration-primary"
      >
        {term}
      </Link>
      {text.slice(idx + term.length)}
    </p>
  );
}

/** Buttons zu allen Vergleichsseiten (Übersicht + 404-Vorschläge). */
function ComparisonLinkButtons() {
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      {comparisonLinks.map((link) => (
        <Link key={link.path} href={link.path}>
          <Button variant="outline">{link.competitor}-Alternative</Button>
        </Link>
      ))}
    </div>
  );
}

/** Übersichtsseite für /vergleich ohne Slug. */
function ComparisonIndex() {
  usePageMeta({
    title: "Trichterwerk im Vergleich",
    description:
      "Trichterwerk ehrlich verglichen mit Typeform, Perspective und ClickFunnels — Features, Preise, DSGVO. Finde heraus, welcher Funnel-Builder zu dir passt.",
    canonical: "/vergleich",
  });

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <section className="pt-32 pb-24 px-4 text-center">
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Trichterwerk im Vergleich</h1>
          <p className="text-lg text-muted-foreground mb-10">
            Ehrlich verglichen mit den bekanntesten Alternativen — Features,
            Preise und DSGVO im Detail:
          </p>
          <ComparisonLinkButtons />
          <div className="mt-10">
            <Link href={funnelBuilderPage.path}>
              <Button variant="ghost" className="gap-2">
                Was ist ein Funnel-Builder?
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}

/** Öffentliche 404 für unbekannte Vergleichs-Slugs — darf NICHT in den auth-Catch-all fallen. */
function PublicNotFound() {
  // Soft-404-Hygiene: Crawler sollen diese URL nicht indexieren (der Server
  // antwortet in Prod zusätzlich mit echtem 404-Status, siehe server/static.ts).
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "robots");
    meta.setAttribute("content", "noindex");
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  usePageMeta({ title: "Seite nicht gefunden" });

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <section className="pt-40 pb-24 px-4 text-center">
        <div className="container mx-auto max-w-xl">
          <h1 className="text-4xl font-bold mb-4">Seite nicht gefunden</h1>
          <p className="text-muted-foreground mb-8">
            Diesen Vergleich gibt es (noch) nicht. Vielleicht interessiert dich einer davon:
          </p>
          <div className="mb-10">
            <ComparisonLinkButtons />
          </div>
          <Link href="/">
            <Button className="gap-2">
              Zur Startseite
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}

/**
 * Daten-getriebene Vergleichsseite (/vergleich/:slug) — Content kommt aus
 * shared/seo-content.ts, damit Sitemap und Server-Meta dieselbe Quelle nutzen.
 * Ohne Slug (/vergleich) wird eine Übersicht gerendert; usePageMeta lebt in
 * den Blatt-Komponenten (Parent-Effekte liefen sonst NACH den Kind-Effekten
 * und würden deren Meta überschreiben).
 */
export default function Vergleich() {
  const [matchesSlug, params] = useRoute("/vergleich/:slug");
  const content = getComparisonPage(params?.slug);

  // Interne wouter-Navigation ersetzt das Dokument nicht — ohne Reset landet
  // der Besucher auf der Zielseite dort, wo er auf der Quellseite stand
  // (die Querverweise liegen alle am Seitenende).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params?.slug]);

  if (!matchesSlug) {
    return <ComparisonIndex />;
  }
  if (!content) {
    return <PublicNotFound />;
  }
  return <ComparisonContent c={content} />;
}

/** Ausgerenderte Vergleichsseite für einen bekannten Registry-Eintrag. */
function ComparisonContent({ c }: { c: ComparisonPageContent }) {
  usePageMeta({
    title: c.metaTitle,
    description: c.metaDescription,
    canonical: `/vergleich/${c.slug}`,
  });

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: buildJsonLd(c) }} />

      {/* Hero: H1 + Intro + Verdict + CTA */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <Badge variant="secondary" className="mb-6">
            <Zap className="h-3 w-3 mr-1" />
            Trichterwerk vs. {c.competitorName}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">
            {c.h1}
          </h1>
          <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
            {c.intro.map((p, idx) => (
              <IntroParagraph key={idx} text={p} />
            ))}
          </div>

          <Card className="mt-8 border-primary/30 bg-primary/5">
            <CardContent className="p-6">
              <p className="text-base leading-relaxed">{c.verdict}</p>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link href="/register">
              <Button size="lg" className="gap-2 text-lg px-8 shadow-lg shadow-primary/25">
                14 Tage kostenlos testen
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            14 Tage kostenlos · erste Belastung erst nach der Testphase · monatlich kündbar
          </p>
        </div>
      </section>

      {/* Vergleichstabelle */}
      <section className="py-16 px-4 bg-muted/30 border-y">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
            Trichterwerk vs. {c.competitorName} im direkten Vergleich
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-10">
            Ehrlich verglichen: wo Trichterwerk glänzt und was du bei {c.competitorName} bekommst.
          </p>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 font-medium min-w-[200px]">Feature</th>
                  <th className="p-4 font-semibold">
                    <div className="flex items-center gap-2 justify-center text-primary">
                      <Zap className="h-4 w-4" />
                      Trichterwerk
                    </div>
                  </th>
                  <th className="p-4 font-medium text-muted-foreground">{c.competitorName}</th>
                </tr>
              </thead>
              <tbody>
                {c.comparisonRows.map((row, idx) => (
                  <tr
                    key={row.label}
                    className={`border-b last:border-0 ${idx % 2 === 1 ? "bg-muted/10" : ""}`}
                  >
                    <td className="p-4 font-medium">{row.label}</td>
                    <td className="p-4 text-center bg-primary/5">
                      <ComparisonCell value={row.trichterwerk} highlight />
                    </td>
                    <td className="p-4 text-center">
                      <ComparisonCell value={row.competitor} highlight={false} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Preise und Features von {c.competitorName}: Stand {COMPETITOR_DATA_DATE}.
            Ohne Gewähr — aktuelle Details auf der Anbieter-Website.
          </p>
        </div>
      </section>

      {/* Pain-Points */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
            Warum Nutzer nach einer {c.competitorName}-Alternative suchen
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {c.painPoints.map((p) => (
              <Card key={p.title}>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{p.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{p.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature-Deep-Dive */}
      <section className="py-20 px-4 bg-muted/30 border-y">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
            Was Trichterwerk anders macht
          </h2>
          <div className="space-y-10">
            {c.featureSections.map((f) => (
              <div key={f.title}>
                <h3 className="text-xl font-semibold mb-2 flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-1" />
                  {f.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed pl-7">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preisvergleich */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            {c.pricingComparison.title}
          </h2>
          <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
            {c.pricingComparison.text.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Ehrliche Gegen-Sektion */}
      <section className="py-16 px-4 bg-muted/30 border-y">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{c.honestSection.title}</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">{c.honestSection.text}</p>
        </div>
      </section>

      {/* Wechsel in 3 Schritten */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
            In 3 Schritten von {c.competitorName} zu Trichterwerk wechseln
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {c.migrationSteps.map((step, idx) => (
              <div key={step.title}>
                <div className="text-5xl font-bold text-primary/20 mb-2">
                  {String(idx + 1).padStart(2, "0")}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-muted/30 border-y">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
            Häufige Fragen zur {c.competitorName}-Alternative
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {c.faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`}>
                <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <MarketingCta
        title={`Bereit für die ${c.competitorName}-Alternative aus Deutschland?`}
        text="Teste Trichterwerk 14 Tage kostenlos mit vollem Funktionsumfang — erste Belastung erst nach der Testphase, Kündigung mit zwei Klicks."
      />

      {/* Weitere Vergleiche (interne Verlinkung) */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold mb-6">Weitere Vergleiche</h2>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {c.relatedSlugs
              .map((slug) => getComparisonPage(slug))
              .filter((related): related is ComparisonPageContent => !!related)
              .map((related) => (
                <Link key={related.slug} href={`/vergleich/${related.slug}`}>
                  <Button variant="outline">
                    Trichterwerk vs. {related.competitorName}
                  </Button>
                </Link>
              ))}
            <Link href={funnelBuilderPage.path}>
              <Button variant="outline">Was ist ein Funnel-Builder?</Button>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
