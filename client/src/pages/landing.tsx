import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, Check, Flag, Layers, MousePointerClick, Play, Server, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { CONTACT_EMAIL } from "@/components/marketing/constants";
import { usePageMeta } from "@/hooks/use-document-title";
import { trackPlatformEvent } from "@/lib/platform-tracker";
import { faqPageJsonLd, TEMPLATE_GALLERY_PATH } from "@shared/seo-links";
import { freeOffer } from "@shared/marketing-offer";

function trackCtaClick(label: "hero" | "pricing" | "final") {
  trackPlatformEvent("/", "cta_click", label);
}

const templatePreviews = [
  { name: "Anfragen & Termine", slug: "termin-buchen", category: "Kundengewinnung", color: "#7C3AED", description: "Lerne Interessenten kennen, bevor ihr miteinander sprecht.", image: "/templates/lead-gen.webp" },
  { name: "Express-Bewerbung", slug: "express-bewerbung", category: "Recruiting", color: "#D97706", description: "Führe Bewerber mit kurzen Fragen bis zur Kontaktaufnahme.", image: "/templates/express-bewerbung.webp" },
  { name: "Webinar-Anmeldung", slug: "masterclass", category: "Webinare", color: "#2563EB", description: "Stelle dein Thema vor und sammle Anmeldungen für dein Webinar.", image: "/templates/webinar.webp" },
];

const benefits = [
  { icon: MousePointerClick, title: "Deine Idee wird zur Seite", text: "Wähle eine Vorlage und passe Texte, Bilder und Fragen im Editor an. Die Handyvorschau zeigt dir, wie dein Funnel wirkt.", detail: "Alle Vorlagen im Free-Plan" },
  { icon: Layers, title: "Frage, was dir wirklich hilft", text: "Führe Interessenten Schritt für Schritt durch ihr Anliegen. So erhältst du neben Kontaktdaten auch Antworten, mit denen du weiterarbeiten kannst.", detail: "Für Anfragen, Termine und Bewerbungen" },
  { icon: Users, title: "Behalte deine Kontakte im Blick", text: "Sammle Antworten an einem Ort, bearbeite Kontakte und exportiere deine Leads. Pro ergänzt Bewerbermails und freigegebene Kundenbereiche.", detail: "100 Leads pro Monat kostenlos" },
];
const plans = [
  { name: "Free", price: "0 €", period: "dauerhaft", description: "Alles für deinen ersten eigenen Funnel.", features: ["1 veröffentlichter Funnel", "100 sichtbare Leads pro Monat", "Alle Vorlagen und der Editor", "Unbegrenzte Entwürfe", "Lead-Verwaltung und CSV-Export", "Trichterwerk-Adresse und Badge"], note: "Ohne Kreditkarte. Ohne automatische Kosten.", highlighted: true },
  { name: "Pro", price: "49 €", period: "pro Monat, inkl. MwSt.", description: "Wenn du mehr Leads und mehr Möglichkeiten brauchst.", features: ["Unbegrenzte Funnels und Leads", "Eigene Domains und Badge entfernen", "A/B-Tests und KI-Funnel-Generator¹", "Bewerbermails und eigene Board-Spalten", "Freigegebene Kundenbereiche", "Support per E-Mail"], note: "Optional im Konto buchen. Monatlich kündbar.", highlighted: false },
];
const faqs = [
  { q: "Was ist dauerhaft kostenlos?", a: "Ein veröffentlichter Funnel, alle Vorlagen, der Editor und 100 sichtbare Leads pro Monat. Du kannst unbegrenzt Entwürfe anlegen. Dein Funnel läuft unter einer Trichterwerk-Adresse mit Trichterwerk-Badge. Du brauchst keine Kreditkarte und kein kostenpflichtiges Abo." },
  { q: "Was passiert nach 100 Leads?", a: "Weitere Leads werden gespeichert, ihre Kontaktdaten und Antworten bleiben im Free-Plan gesperrt. Mit Pro kannst du sie freischalten. Für neue Leads stehen dir im nächsten Kalendermonat wieder 100 freie Plätze zur Verfügung. Das Kontingent gilt pro Account; es entstehen keine automatischen Kosten." },
  { q: "Kann ich die Beispiele ohne Anmeldung ausprobieren?", a: "Ja. Alle verlinkten Live-Demos lassen sich direkt im Browser durchklicken. Deine Eingaben in einer Demo werden nicht als Leads gespeichert. Wenn dir eine Vorlage gefällt, kannst du sie bei der kostenlosen Anmeldung mitnehmen." },
  { q: "Brauche ich eine eigene Website oder Programmierkenntnisse?", a: "Nein. Du bearbeitest deinen Funnel im visuellen Editor und veröffentlichst ihn auf einer Trichterwerk-Adresse. Eine vorhandene Website ist dafür nicht erforderlich. Eigene Domains kannst du im Pro-Plan verbinden." },
  { q: "Wann bezahle ich für Pro?", a: "Nur wenn du Pro ausdrücklich in deinem Konto buchst. Der Preis beträgt 49 € pro Monat inklusive Mehrwertsteuer. Pro ist monatlich kündbar; dein kostenloser Account bleibt auch ohne Upgrade nutzbar." },
  { q: "Wer steckt hinter Trichterwerk und wo bekomme ich Hilfe?", a: "Trichterwerk wird von SUPERBRAND.marketing in Deutschland entwickelt. Die Anwendung wird in der EU gehostet. Bei Fragen erreichst du uns persönlich per E-Mail; Kontaktdaten, Datenschutzhinweise und Impressum sind unten verlinkt." },
];
const FAQ_JSON_LD = JSON.stringify({ "@context": "https://schema.org", ...faqPageJsonLd(faqs) });

export default function Landing() {
  usePageMeta({ title: "Funnel-Builder: 100 Leads pro Monat kostenlos", description: "Gewinne Kunden und Bewerber mit deinem eigenen Funnel. Ein veröffentlichter Funnel und 100 Leads pro Monat kostenlos. Ohne Kreditkarte, mit Hosting in der EU.", canonical: "/" });
  useEffect(() => {
    if (!window.location.hash) return;
    try { document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView(); } catch { /* Invalid URL fragment has no target. */ }
  }, []);
  return <div className="min-h-screen bg-background">
    <MarketingHeader />
    <main>
      <section className="relative overflow-hidden px-4 pb-14 pt-28 sm:px-6 sm:pb-20 lg:pt-36" data-testid="landing-hero">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
        <div className="container relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          <div className="max-w-xl">
            <Badge variant="secondary" className="mb-5 gap-1.5 px-3 py-1.5"><Check className="h-3.5 w-3.5" />{freeOffer.headline}</Badge>
            <h1 className="text-[2.35rem] font-bold leading-[1.1] tracking-tight sm:text-5xl xl:text-[3.4rem]">
              Gewinne Kunden und Bewerber.
              <span className="mt-1 block text-primary">Mit deinem Funnel.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Erstelle mobile Seiten für Anfragen, Termine und Bewerbungen. Wähle eine Vorlage,
              passe sie an und veröffentliche deinen Funnel – ohne Programmierung.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="min-h-12 gap-2 px-6 text-base shadow-lg shadow-primary/15"><Link href="/register" onClick={() => trackCtaClick("hero")}>Kostenlos starten<ArrowRight className="h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="outline" className="min-h-12 px-6 text-base"><Link href={`${TEMPLATE_GALLERY_PATH}/express-bewerbung`}><Play className="h-4 w-4" />Live-Demo ausprobieren</Link></Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{freeOffer.reassurance}</p>
            <p className="mt-2 text-xs text-muted-foreground">Ein veröffentlichter Funnel inklusive. Pro ist optional.</p>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Server className="h-3.5 w-3.5" />Hosting in der EU</span>
              <span className="flex items-center gap-1.5"><Flag className="h-3.5 w-3.5" />Entwickelt in Deutschland</span>
            </div>
          </div>
          <figure className="min-w-0 pb-5">
            <div className="relative rounded-2xl border border-primary/15 bg-primary/5 p-3 pb-8 shadow-xl shadow-primary/5 sm:p-5 sm:pb-10">
              <div className="mb-3 flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground"><span>Dein Funnel im Editor</span><span className="rounded-full bg-background px-2 py-1">Echte Produktansicht</span></div>
              <img src="/images/landing-editor.webp" alt="Trichterwerk-Editor mit einer Express-Bewerbung: links die Seiten, in der Mitte die Vorschau und Werkzeuge zur Gestaltung" width={1440} height={960} fetchPriority="high" className="w-full rounded-lg border bg-background shadow-sm" />
              <div className="absolute -bottom-5 right-3 w-[25%] min-w-[76px] overflow-hidden rounded-[1.1rem] border-[3px] border-slate-800 bg-slate-800 shadow-xl sm:right-6 sm:rounded-[1.5rem] sm:border-[5px]">
                <img src="/templates/portrait/express-bewerbung.webp" alt="Die Express-Bewerbung als mobile Funnel-Vorschau" width={390} height={844} className="aspect-[390/844] w-full object-cover object-top" />
              </div>
            </div>
            <figcaption className="mt-4 max-w-[70%] text-xs leading-relaxed text-muted-foreground">Produktbeispiel: Express-Bewerbung. Texte und Bilder lassen sich im Editor anpassen.</figcaption>
          </figure>
        </div>
      </section>

      <section id="templates" className="scroll-mt-20 border-t px-4 py-14 sm:px-6 sm:py-20" data-testid="landing-demos">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl"><p className="mb-3 text-sm font-semibold text-primary">Erst ausprobieren, dann entscheiden</p><h2 className="text-3xl font-bold tracking-tight sm:text-4xl">So fühlt sich dein Funnel an.</h2><p className="mt-3 text-muted-foreground">Klicke dich durch ein Beispiel – direkt im Browser, ohne Anmeldung.</p></div>
            <Link href={TEMPLATE_GALLERY_PATH} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary">Alle Vorlagen<ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {templatePreviews.map(template => <Link key={template.slug} href={`${TEMPLATE_GALLERY_PATH}/${template.slug}`} className="group block overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={`${template.name}: Live-Demo öffnen`}>
              <div className="relative h-44 overflow-hidden" style={{ backgroundColor: `${template.color}10` }}>
                <img src={template.image} alt={`Beispiel für ${template.name}`} width={600} height={400} loading="lazy" className="h-full w-full object-cover object-top transition-transform motion-safe:group-hover:scale-105" />
                <span className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-background shadow"><Play className="h-4 w-4 text-primary" /></span>
              </div>
              <div className="p-5"><p className="mb-2 text-xs font-medium text-muted-foreground">{template.category}</p><h3 className="text-lg font-semibold">{template.name}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{template.description}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">Live-Demo öffnen<ArrowRight className="h-4 w-4" /></span></div>
            </Link>)}
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-20 border-t bg-muted/20 px-4 py-14 sm:px-6 sm:py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-9 max-w-2xl"><p className="mb-3 text-sm font-semibold text-primary">Von deiner Idee bis zur Anfrage</p><h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ein Werkzeug für den ganzen Weg.</h2></div>
          <div className="grid gap-6 md:grid-cols-3">{benefits.map(benefit => <article key={benefit.title} className="rounded-xl border bg-background p-6"><benefit.icon className="mb-5 h-7 w-7 text-primary" /><h3 className="text-xl font-semibold">{benefit.title}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{benefit.text}</p><p className="mt-5 text-xs font-medium text-primary">{benefit.detail}</p></article>)}</div>
        </div>
      </section>

      <section className="border-t px-4 py-14 sm:px-6 sm:py-20" aria-labelledby="example-heading">
        <div className="container mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div><Badge variant="secondary">Produktbeispiel · Recruiting</Badge><h2 id="example-heading" className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Die richtigen Fragen. Ein klarer nächster Schritt.</h2><p className="mt-4 leading-relaxed text-muted-foreground">Ein Interessent beantwortet Fragen zu Erfahrung und Verfügbarkeit. Du erhältst die Antworten zusammen mit seinen Kontaktdaten und kannst das Gespräch gezielt vorbereiten.</p>
            <ol className="mt-6 space-y-4 text-sm">{["Vorlage wählen und deine Fragen anpassen", "Link teilen und Antworten einsammeln", "Bewerbungen im Board bearbeiten"].map((text, index) => <li key={text} className="flex items-center gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span>{text}</li>)}</ol>
            <Link href={`${TEMPLATE_GALLERY_PATH}/express-bewerbung`} className="mt-6 inline-flex items-center gap-2 font-medium text-primary underline underline-offset-4">Beispiel selbst durchklicken<ArrowRight className="h-4 w-4" /></Link>
          </div>
          <figure className="rounded-2xl border bg-muted/20 p-5 sm:p-8">
            <div className="mb-5 flex items-center justify-between gap-2"><span className="text-sm font-medium">So helfen dir die Antworten</span><Badge variant="outline">Beispieldaten</Badge></div>
            <dl className="space-y-3">{[["Erfahrung", "Ausgelernt mit Berufserfahrung"], ["Verfügbarkeit", "In 1–3 Monaten"], ["Wichtig im neuen Job", "Gutes Team und planbare Arbeitszeiten"]].map(([label, value]) => <div key={label} className="rounded-lg border bg-background p-4"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>)}</dl>
            <figcaption className="mt-4 text-xs leading-relaxed text-muted-foreground">Illustration mit fiktiven Antworten aus einem Bewerbungsablauf. Die Fragen legst du selbst fest.</figcaption>
          </figure>
        </div>
        <div className="container mx-auto mt-10 flex max-w-6xl flex-col justify-between gap-3 border-t pt-6 text-sm sm:flex-row"><p className="text-muted-foreground">Entwickelt von <a href="https://superbrand.marketing" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline underline-offset-4">SUPERBRAND.marketing</a> in Deutschland.</p><a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-primary underline underline-offset-4">Fragen? Schreib direkt unserem Team.</a></div>
      </section>

      <section id="pricing" className="scroll-mt-20 border-t px-4 py-14 sm:px-6 sm:py-20">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-9 text-center"><p className="mb-3 text-sm font-semibold text-primary">Dein Start kostet 0 €</p><h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Kostenlos loslegen. Bei Bedarf wachsen.</h2><p className="mt-4 text-muted-foreground">100 Leads pro Monat sind inklusive. Du entscheidest, ob du mehr brauchst.</p></div>
          <div className="grid gap-6 md:grid-cols-2">{plans.map(plan => <article key={plan.name} aria-label={`${plan.name}-Plan`} className={`flex flex-col rounded-2xl border p-6 sm:p-8 ${plan.highlighted ? "border-primary/40 bg-primary/5" : "bg-card"}`}>
            <div className="flex items-center justify-between"><h3 className="text-xl font-semibold">{plan.name}</h3>{plan.highlighted && <Badge>Dein kostenloser Start</Badge>}</div>
            <p className="mt-3 min-h-10 text-sm text-muted-foreground">{plan.description}</p>
            <p className="mt-5 text-4xl font-bold tracking-tight">{plan.price}</p><p className="mt-1 text-sm text-muted-foreground">{plan.period}</p>
            <ul className="my-7 flex-1 space-y-3 text-sm">{plan.features.map(feature => <li key={feature} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{feature}</li>)}</ul>
            <Button asChild size="lg" variant={plan.highlighted ? "default" : "outline"} className="min-h-12 w-full"><Link href="/register" onClick={() => trackCtaClick("pricing")}>Kostenlos starten<ArrowRight className="h-4 w-4" /></Link></Button><p className="mt-3 text-center text-xs text-muted-foreground">{plan.note}</p>
          </article>)}</div>
          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">¹ Die KI nutzt deinen eigenen Anbieterschlüssel. Kosten beim KI-Anbieter werden separat abgerechnet.</p>
          <p className="mt-6 text-center text-sm text-muted-foreground">Du hast besondere Anforderungen? <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-primary underline underline-offset-4">Sprich mit uns.</a></p>
        </div>
      </section>

      <section id="faq" className="scroll-mt-20 border-t bg-muted/20 px-4 py-14 sm:px-6 sm:py-20">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: FAQ_JSON_LD }} />
        <div className="container mx-auto max-w-3xl"><h2 className="mb-8 text-3xl font-bold tracking-tight sm:text-4xl">Noch eine Frage?</h2><Accordion type="single" collapsible>{faqs.map((faq, index) => <AccordionItem key={faq.q} value={`faq-${index}`}><AccordionTrigger className="text-left">{faq.q}</AccordionTrigger><AccordionContent className="leading-relaxed text-muted-foreground">{faq.a}</AccordionContent></AccordionItem>)}</Accordion></div>
      </section>

      <section className="border-t px-4 py-14 text-center sm:px-6 sm:py-20">
        <div className="container mx-auto max-w-2xl"><h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Dein nächster Kontakt beginnt hier.</h2><p className="mt-4 text-muted-foreground">{freeOffer.headline}. Wähle eine Vorlage und mach sie zu deiner.</p><Button asChild size="lg" className="mt-7 min-h-12 gap-2 px-6 text-base"><Link href="/register" onClick={() => trackCtaClick("final")}>Kostenlos starten<ArrowRight className="h-4 w-4" /></Link></Button><p className="mt-3 text-xs text-muted-foreground">{freeOffer.reassurance}</p></div>
      </section>
    </main>
    <MarketingFooter />
  </div>;
}
