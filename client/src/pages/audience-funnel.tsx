import { useEffect } from "react";
import { Link, useLocation } from "wouter";
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
import { ArrowRight, Check, Play, Target } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingCta } from "@/components/marketing/MarketingCta";
import {
  getAudiencePage,
  faqPageJsonLd,
  type AudiencePageContent,
} from "@shared/seo-content";
import { getTemplateMeta } from "@shared/template-meta";
import { audiencePages, SITE_ORIGIN, TEMPLATE_GALLERY_PATH } from "@shared/seo-links";

/** FAQPage + BreadcrumbList als JSON-LD (Google liest das auch client-gerendert). */
function buildJsonLd(c: AudiencePageContent, label: string): string {
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
            name: label,
            item: `${SITE_ORIGIN}/${c.slug}`,
          },
        ],
      },
    ],
  });
}

/**
 * Zielgruppen-Landingpages (/recruiting-funnel, /lead-funnel) — Content aus
 * shared/seo-content.ts (audiencePagesContent), Meta aus seo-links, damit
 * Sitemap und Server-Meta dieselbe Quelle nutzen. Eine Komponente für beide
 * Routen; der Slug kommt aus der aktuellen Location.
 */
export default function AudienceFunnel() {
  const [location] = useLocation();
  const slug = location.replace(/^\//, "").split(/[/?#]/)[0];
  const content = getAudiencePage(slug);
  const meta = audiencePages.find((p) => p.path === `/${slug}`);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Beide Routen sind fest registriert — fehlender Content wäre ein Registry-Bug.
  if (!content || !meta) return null;

  return <AudienceContent c={content} meta={meta} />;
}

function AudienceContent({
  c,
  meta,
}: {
  c: AudiencePageContent;
  meta: (typeof audiencePages)[number];
}) {
  usePageMeta({
    title: meta.metaTitle,
    description: meta.metaDescription,
    canonical: meta.path,
  });

  const showcase = c.templateShowcase
    .map((slug) => getTemplateMeta(slug))
    .filter((m): m is NonNullable<typeof m> => !!m);

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: buildJsonLd(c, meta.label) }}
      />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <Badge variant="secondary" className="mb-6">
            <Target className="h-3 w-3 mr-1" />
            {c.badge}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">
            {c.h1}
          </h1>
          <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
            {c.intro.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link href="/register">
              <Button size="lg" className="gap-2 text-lg px-8 shadow-lg shadow-primary/25">
                14 Tage kostenlos testen
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href={TEMPLATE_GALLERY_PATH}>
              <Button size="lg" variant="outline" className="gap-2 text-lg px-8">
                <Play className="h-5 w-5" />
                Vorlagen live ansehen
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            14 Tage kostenlos · erste Belastung erst nach der Testphase · monatlich kündbar
          </p>
        </div>
      </section>

      {/* Pain-Points */}
      <section className="py-16 px-4 bg-muted/30 border-y">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-6">
            {c.painPoints.map((p) => (
              <Card key={p.title}>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-2">{p.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Branchen / Use-Cases */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
            Für diese Branchen gebaut
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {c.industries.map((ind) => (
              <div key={ind.title}>
                <h3 className="text-xl font-semibold mb-2 flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-1" />
                  {ind.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed pl-7">{ind.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vorlagen-Showcase mit Live-Vorschau-Links */}
      <section className="py-20 px-4 bg-muted/30 border-y">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
            Fertige Vorlagen — live durchklickbar
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Jede Vorlage kannst du ohne Anmeldung im Smartphone-Format ausprobieren
            und mit einem Klick übernehmen.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {showcase.map((t) => (
              <Link key={t.slug} href={`${TEMPLATE_GALLERY_PATH}/${t.slug}`}>
                <Card className="group h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden">
                  <div className="h-56 relative overflow-hidden bg-muted">
                    <picture>
                      <source srcSet={`/templates/portrait/${t.slug}.webp`} type="image/webp" />
                      <img
                        src={`/templates/portrait/${t.slug}.png`}
                        alt={`Vorschau der Funnel-Vorlage „${t.name}“`}
                        width={375}
                        height={740}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      />
                    </picture>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1">{t.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{t.benefit}</p>
                    <span className="text-sm font-medium text-primary inline-flex items-center gap-1">
                      <Play className="h-3.5 w-3.5" />
                      Live-Vorschau
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Schritte */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
            In 3 Schritten live
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {c.steps.map((step, idx) => (
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
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">Häufige Fragen</h2>
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
        title="Bereit für deinen ersten Funnel?"
        text="Teste Trichterwerk 14 Tage kostenlos mit vollem Funktionsumfang — erste Belastung erst nach der Testphase, Kündigung mit zwei Klicks."
      />
      <MarketingFooter />
    </div>
  );
}
