import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, ArrowRight, Check, ShieldCheck, Smartphone } from "lucide-react";
import { usePageMeta } from "@/hooks/use-document-title";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingCta } from "@/components/marketing/MarketingCta";
import { PhoneFrame } from "@/components/marketing/PhoneFrame";
import { TemplateTile } from "@/components/marketing/TemplateTile";
import { FunnelRenderer } from "@/components/funnel-viewer/FunnelRenderer";
import { getTemplateBySlug, type ClientTemplate } from "@/lib/templates";
import {
  templateMetas,
  templateCategoryLabels,
  getTemplateMeta,
  vorlagenIndexPage,
  type TemplateMeta,
  type TemplateCategory,
} from "@shared/template-meta";
import { TEMPLATE_GALLERY_PATH } from "@shared/seo-links";

/**
 * Öffentliche Template-Galerie (/vorlagen) + Detailseiten mit interaktiver
 * Live-Vorschau (/vorlagen/:slug). Die Vorschau rendert die Template-Daten
 * direkt client-seitig durch den FunnelRenderer — ohne Login, ohne Leads,
 * ohne Analytics (mode="preview", keine Callbacks).
 *
 * ?video=1 auf der Detailseite rendert nur den Funnel (ohne Header/Frame) —
 * Aufnahmemodus für scripts/record-template-videos.ts.
 */
export default function Vorlagen() {
  const [matchesSlug, params] = useRoute(`${TEMPLATE_GALLERY_PATH}/:slug`);

  // Interne wouter-Navigation ersetzt das Dokument nicht — ohne Reset startet
  // die Detailseite dort, wo der Besucher in der Galerie stand.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params?.slug]);

  if (!matchesSlug) {
    return <TemplateGallery />;
  }

  const meta = getTemplateMeta(params?.slug);
  const template = getTemplateBySlug(params?.slug);
  if (!meta || !template) {
    return <TemplatesNotFound />;
  }

  // Aufnahmemodus für die Hover-Videos: nur der nackte Funnel im Viewport.
  if (new URLSearchParams(window.location.search).get("video") === "1") {
    return <FunnelRenderer key={template.slug} funnel={template} mode="preview" />;
  }

  return <TemplateDetail meta={meta} template={template} />;
}

/** Galerie-Übersicht mit Kategoriefilter. */
function TemplateGallery() {
  usePageMeta({
    title: vorlagenIndexPage.metaTitle,
    description: vorlagenIndexPage.metaDescription,
    canonical: TEMPLATE_GALLERY_PATH,
  });

  const [category, setCategory] = useState<"all" | TemplateCategory>("all");

  // Filter-Chips nur für Kategorien mit mindestens einem Template.
  const categories: Array<{ key: "all" | TemplateCategory; label: string }> = [
    { key: "all", label: "Alle" },
    ...(
      Object.entries(templateCategoryLabels) as Array<[TemplateCategory, string]>
    )
      .filter(([key]) => templateMetas.some((t) => t.category === key))
      .map(([key, label]) => ({ key, label })),
  ];

  const visible = templateMetas.filter(
    (t) => category === "all" || t.category === category,
  );

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />

      <section className="pt-32 pb-12 px-4 text-center">
        <div className="container mx-auto max-w-3xl">
          <Badge variant="secondary" className="mb-6">
            <Smartphone className="h-3 w-3 mr-1" />
            Jede Vorlage live durchklickbar
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Funnel-Vorlagen zum Live-Ausprobieren
          </h1>
          <p className="text-lg text-muted-foreground">
            Fertige Funnels für Recruiting, Lead-Generierung und Verkauf — teste
            jede Vorlage direkt im Smartphone-Format, ohne Anmeldung. Gefällt sie
            dir, übernimmst du sie mit einem Klick und passt Farben, Texte und
            Logik an.
          </p>
        </div>
      </section>

      <section className="pb-24 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Kategorie-Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  category === cat.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 justify-items-center">
            {visible.map((meta) => (
              <TemplateTile key={meta.slug} meta={meta} />
            ))}
          </div>
        </div>
      </section>

      <MarketingCta
        title="Keine passende Vorlage dabei?"
        text="Starte mit einem leeren Funnel oder lass deine KI einen bauen — beschreibe dein Angebot, der Rest entsteht in Minuten. 14 Tage kostenlos, monatlich kündbar."
      />
      <MarketingFooter />
    </div>
  );
}

/** Detailseite: interaktive Live-Vorschau im Phone-Mockup + Template-Infos. */
function TemplateDetail({
  meta,
  template,
}: {
  meta: TemplateMeta;
  template: ClientTemplate;
}) {
  usePageMeta({
    title: meta.metaTitle,
    description: meta.metaDescription,
    canonical: `${TEMPLATE_GALLERY_PATH}/${meta.slug}`,
  });

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />

      <section className="pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <Link
            href={TEMPLATE_GALLERY_PATH}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Alle Vorlagen
          </Link>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Infos + CTA */}
            <div className="order-2 lg:order-1">
              <Badge variant="secondary" className="mb-4">
                {templateCategoryLabels[meta.category]}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                {meta.name}
              </h1>
              <p className="text-lg text-muted-foreground mb-3">{meta.benefit}</p>
              <p className="text-muted-foreground mb-8">{template.description}</p>

              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  {template.pages.length} Seiten — von der Begrüßung bis zur Danke-Seite
                </li>
                <li className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-primary shrink-0" />
                  Mobile-first: für Traffic aus Instagram, TikTok und Meta Ads gebaut
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  DSGVO-konform mit Hosting in der EU
                </li>
              </ul>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={`/register?template=${meta.slug}`}>
                  <Button size="lg" className="gap-2 w-full sm:w-auto shadow-lg shadow-primary/25">
                    Mit diesem Template starten
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href={TEMPLATE_GALLERY_PATH}>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Andere Vorlage wählen
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                14 Tage kostenlos testen · Farben, Texte und Logik frei anpassbar
              </p>
            </div>

            {/* Live-Vorschau */}
            <div className="order-1 lg:order-2 flex flex-col items-center">
              <PhoneFrame>
                <FunnelRenderer
                  key={template.slug}
                  funnel={template}
                  mode="preview"
                  className="h-full"
                />
              </PhoneFrame>
              <p className="text-xs text-muted-foreground mt-4 text-center max-w-[320px]">
                Die Vorschau ist voll interaktiv — klick dich durch. Es werden
                keine Daten gespeichert.
              </p>
            </div>
          </div>
        </div>
      </section>

      <MarketingCta
        title="Gefällt dir die Vorlage?"
        text="Übernimm sie mit einem Klick in deinen Account und passe sie an deine Marke an — in unter einer Stunde live. 14 Tage kostenlos, monatlich kündbar."
      />
      <MarketingFooter />
    </div>
  );
}

/** Öffentliche 404 für unbekannte Template-Slugs (fällt nicht in den Auth-Catch-all). */
function TemplatesNotFound() {
  useEffect(() => {
    const metaEl = document.createElement("meta");
    metaEl.setAttribute("name", "robots");
    metaEl.setAttribute("content", "noindex");
    document.head.appendChild(metaEl);
    return () => metaEl.remove();
  }, []);

  usePageMeta({ title: "Vorlage nicht gefunden" });

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <section className="pt-40 pb-24 px-4 text-center">
        <div className="container mx-auto max-w-xl">
          <h1 className="text-4xl font-bold mb-4">Vorlage nicht gefunden</h1>
          <p className="text-muted-foreground mb-8">
            Diese Vorlage gibt es (noch) nicht — aber in der Galerie warten viele andere:
          </p>
          <Link href={TEMPLATE_GALLERY_PATH}>
            <Button className="gap-2">
              Zur Vorlagen-Galerie
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}
