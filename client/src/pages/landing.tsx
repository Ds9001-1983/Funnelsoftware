import { Link } from "wouter";
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
  Zap,
  Sparkles,
  Smartphone,
  Target,
  Check,
  X as XIcon,
  ArrowRight,
  ChevronRight,
  MousePointerClick,
  PenTool,
  Palette,
  TrendingUp,
  Cookie,
  ShieldCheck,
  Server,
  Lock,
  Briefcase,
  GraduationCap,
  UserSearch,
  Mail,
  Headphones,
  Flag,
  Heart,
  CreditCard,
  BarChart3,
  Webhook,
  Send,
} from "lucide-react";
import { resetCookieConsent } from "@/components/cookie-consent";

const CONTACT_EMAIL = "info@superbrand.marketing";

const templatePreviews = [
  {
    name: "Lead-Generierung",
    category: "Leads",
    color: "#7C3AED",
    description: "Qualifizierte Leads sammeln",
    image: "/templates/lead-gen.webp",
  },
  {
    name: "Webinar-Anmeldung",
    category: "Webinar",
    color: "#2563EB",
    description: "Anmeldungen maximieren",
    image: "/templates/webinar.webp",
  },
  {
    name: "Interaktives Quiz",
    category: "Quiz",
    color: "#10B981",
    description: "Leads unterhaltsam qualifizieren",
    image: "/templates/quiz.webp",
  },
  {
    name: "Schnell-Bewerbung",
    category: "Recruiting",
    color: "#F59E0B",
    description: "Top-Talente gewinnen",
    image: "/templates/recruiting.webp",
  },
  {
    name: "Produkt-Verkauf",
    category: "Sales",
    color: "#DC2626",
    description: "Produkte direkt verkaufen",
    image: "/templates/sales.webp",
  },
];

const features = [
  {
    icon: MousePointerClick,
    title: "Drag & Drop Builder",
    description: "Erstelle komplette Funnels per Maus. Kein HTML, kein CSS, kein Frust.",
    image: "/images/feature-drag-drop.webp",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Design",
    description: "Jeder Funnel ist automatisch für Smartphones optimiert — dort, wo 80 % deiner Besucher landen.",
    image: "/images/feature-mobile.webp",
  },
  {
    icon: PenTool,
    title: "20+ Elemente",
    description: "Texte, Videos, Formulare, Countdowns, Quizze, Slider — alles für hohe Conversion.",
  },
  {
    icon: Palette,
    title: "Vollständig anpassbar",
    description: "Farben, Fonts, Layouts und Corporate Identity — du entscheidest, nicht das Template.",
  },
  {
    icon: TrendingUp,
    title: "Analytics & Insights",
    description: "Views, Conversions, Drop-offs und Lead-Qualität in Echtzeit — ohne Google Analytics.",
    image: "/images/feature-analytics.webp",
  },
  {
    icon: Target,
    title: "Conditional Logic",
    description: "Zeige Besuchern dynamisch verschiedene Seiten — basierend auf ihren Antworten.",
  },
];

const personas = [
  {
    icon: GraduationCap,
    title: "Coaches & Berater",
    description: "Qualifiziere Interessenten mit Quiz-Funnels und verkaufe deine Programme ohne Sales-Call-Marathon.",
  },
  {
    icon: Briefcase,
    title: "Dienstleister & Agenturen",
    description: "Präsentiere deine Leistungen, hole Erstgespräche und stelle Angebote in weniger als 10 Minuten live.",
  },
  {
    icon: UserSearch,
    title: "Recruiter & HR-Teams",
    description: "Filtere Bewerbungen mit klugen Fragen — und spare Stunden beim Screening.",
  },
];

const steps = [
  {
    number: "01",
    title: "Registrieren",
    description: "Account in 30 Sekunden — E-Mail, Passwort, fertig.",
  },
  {
    number: "02",
    title: "Template wählen",
    description: "10 fertige, konversionsstarke Vorlagen — oder leer starten.",
  },
  {
    number: "03",
    title: "Anpassen",
    description: "Texte, Farben, Bilder, Fragen — per Drag & Drop in Minuten.",
  },
  {
    number: "04",
    title: "Launchen & Leads sammeln",
    description: "Eigene Domain, Live-Analytics und Leads automatisch in deinem Dashboard.",
  },
];

interface PricingPlan {
  name: string;
  price: string;
  priceSuffix?: string;
  description: string;
  features: string[];
  cta: string;
  ctaHref: string;
  popular: boolean;
  note?: string;
  comingSoon?: boolean;
  comingSoonLabel?: string;
}

const pricingPlans: PricingPlan[] = [
  {
    name: "Pro",
    price: "49",
    priceSuffix: "€ / Monat",
    description: "Alles, was du zum Launch brauchst",
    features: [
      "Unbegrenzte Funnels",
      "Unbegrenzte Leads",
      "Alle Templates & Elemente",
      "Eigene Domain",
      "Live-Analytics & Conversion-Tracking",
      "A/B-Tests & Conditional Logic",
      "E-Mail-Benachrichtigungen",
      "Support per E-Mail",
    ],
    cta: "14 Tage kostenlos testen",
    ctaHref: "/register",
    popular: true,
    note: "14 Tage gratis · Erste Belastung nach Trial · Monatlich kündbar",
  },
  {
    name: "Agency",
    price: "ab 149",
    priceSuffix: "€ / Monat",
    description: "Für Teams, White-Label und API",
    features: [
      "Alles aus Pro",
      "Team-Seats (bis 10 Nutzer)",
      "White-Label Branding",
      "API-Zugang",
      "Mehrere Domains",
      "Priority Support",
    ],
    cta: "Auf Warteliste setzen",
    ctaHref: `mailto:${CONTACT_EMAIL}?subject=Agency-Plan%20Warteliste%20(2026)`,
    popular: false,
    comingSoon: true,
    comingSoonLabel: "Kommt 2026",
    note: "Frühen Zugang sichern — wir melden uns zum Launch",
  },
  {
    name: "Enterprise",
    price: "Individuell",
    description: "SLA, Integrationen, dedizierter Manager",
    features: [
      "Alles aus Agency",
      "SLA-Garantie",
      "Custom Integrationen",
      "Dedizierter Account Manager",
      "Onboarding-Workshop",
      "Compliance auf Anfrage (AVV, SOC2)",
    ],
    cta: "Kontakt aufnehmen",
    ctaHref: `mailto:${CONTACT_EMAIL}?subject=Enterprise-Anfrage`,
    popular: false,
  },
];

const integrations = [
  { icon: CreditCard, label: "Stripe", note: "Zahlungen & Trial-Abo" },
  { icon: Webhook, label: "Webhooks", note: "Beliebige Endpoints" },
  { icon: Zap, label: "Zapier & Make", note: "5 000+ Apps via Webhook" },
  { icon: Send, label: "SMTP / E-Mail", note: "Auto-Benachrichtigungen" },
  { icon: Server, label: "Eigene Domain", note: "Mit SSL inklusive" },
  { icon: BarChart3, label: "CSV-Export", note: "Deine Leads, deine Daten" },
];

interface ComparisonRow {
  label: string;
  trichterwerk: boolean | string;
  typeform: boolean | string;
  perspective: boolean | string;
  webflow: boolean | string;
}

const comparisonRows: ComparisonRow[] = [
  { label: "Deutsche Oberfläche & Support", trichterwerk: true, typeform: false, perspective: true, webflow: false },
  { label: "Hosting in der EU / DSGVO-konform", trichterwerk: true, typeform: false, perspective: true, webflow: "teilweise" },
  { label: "Mobile-First Editor", trichterwerk: true, typeform: true, perspective: true, webflow: false },
  { label: "Conditional Logic & Quiz", trichterwerk: true, typeform: true, perspective: true, webflow: false },
  { label: "Eigene Domain inklusive", trichterwerk: true, typeform: false, perspective: true, webflow: true },
  { label: "A/B-Tests", trichterwerk: true, typeform: false, perspective: false, webflow: "mit Add-on" },
  { label: "Setup-Zeit bis Launch", trichterwerk: "< 1 h", typeform: "1–2 h", perspective: "2–4 h", webflow: "Tage" },
  { label: "Monatspreis", trichterwerk: "49 €", typeform: "ab 25 $", perspective: "ab 99 €", webflow: "ab 29 $ + Design" },
];

const faqs = [
  {
    q: "Was ist im 14-tägigen Trial enthalten?",
    a: "Volle Pro-Features — unbegrenzte Funnels, alle Templates, Analytics, Conditional Logic, eigene Domain. Zwei Wochen lang testen, bevor dir etwas berechnet wird.",
  },
  {
    q: "Brauche ich zum Start eine Kreditkarte?",
    a: "Ja — wir hinterlegen deine Zahlungsmethode direkt zum Start über Stripe (PayPal, Kreditkarte, SEPA), belasten aber erst nach den 14 Tagen. Du kannst jederzeit vorher kündigen, ohne Kosten.",
  },
  {
    q: "Kann ich jederzeit kündigen?",
    a: "Ja. Der Pro-Plan ist monatlich kündbar. Keine Mindestlaufzeit, keine Kündigungsgebühren. Kündigung direkt im Stripe-Kundenportal in deinen Einstellungen.",
  },
  {
    q: "Brauche ich technische Vorkenntnisse?",
    a: "Nein. Wenn du eine E-Mail schreiben kannst, kannst du Trichterwerk bedienen. Drag & Drop, fertige Templates, deutsche Oberfläche. Kein HTML, kein CSS, kein Hosting-Setup.",
  },
  {
    q: "Wo werden meine Daten und Leads gespeichert?",
    a: "Auf Servern in der EU, DSGVO-konform. Deine Leads gehören dir — jederzeit als CSV exportierbar. Kein Weiterverkauf, keine Datenweitergabe.",
  },
  {
    q: "Wie funktioniert „Eigene Domain“?",
    a: "Du hinterlegst deine Domain (z. B. funnel.deine-firma.de) in den Einstellungen, trägst einen CNAME bei deinem Provider ein — fertig. SSL-Zertifikat automatisch.",
  },
  {
    q: "Kann ich meinen Plan später wechseln?",
    a: "Ja — Upgrade jederzeit direkt im Dashboard. Downgrade oder Kündigung über das Stripe-Kundenportal.",
  },
  {
    q: "Welche Zahlungsmethoden werden akzeptiert?",
    a: "Kreditkarte (Visa, Mastercard, Amex), PayPal, SEPA-Lastschrift — alles abgewickelt über Stripe mit SSL-Verschlüsselung.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/images/logo-icon.webp"
              alt="Trichterwerk Logo"
              className="h-9 w-9 rounded-lg"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextElementSibling?.classList.remove("hidden");
              }}
            />
            <div className="hidden flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">Trichterwerk</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#templates" className="text-muted-foreground hover:text-foreground transition-colors">
              Templates
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Preise
            </a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Anmelden</Button>
            </Link>
            <Link href="/register">
              <Button>14 Tage testen</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section mit Gradient-Backdrop */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background glow */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-20 h-[520px] -z-10 opacity-60 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 20%, hsl(var(--primary) / 0.18), transparent 60%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute -z-10 top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{
            background:
              "conic-gradient(from 180deg at 50% 50%, hsl(var(--primary) / 0.3), transparent 40%, hsl(var(--primary) / 0.2))",
          }}
        />

        <div className="container mx-auto text-center max-w-4xl relative">
          <Badge variant="secondary" className="mb-6">
            <Sparkles className="h-3 w-3 mr-1" />
            Made in Germany · DSGVO-konform · Hosting in der EU
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05]">
            Funnels, die{" "}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                verkaufen
              </span>
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-1 h-3 bg-primary/15 -z-0 rounded"
              />
            </span>
            .
            <br className="hidden md:block" />
            Ohne Code. Ohne Agentur.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Der deutsche Funnel-Builder für Coaches, Berater und Agenturen —
            mobile-optimierte Landingpages und Lead-Funnels in Minuten live.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="gap-2 text-lg px-8 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
              >
                14 Tage kostenlos testen
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Features ansehen
              </Button>
            </a>
          </div>

          {/* Trust chips */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-10 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>14 Tage gratis testen</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-primary" />
              <span>Monatlich kündbar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Server className="h-4 w-4 text-primary" />
              <span>Stripe-gesicherte Zahlung</span>
            </div>
          </div>
        </div>

        {/* Hero Image - Dashboard Preview mit Glow-Frame */}
        <div className="container mx-auto mt-16 max-w-6xl relative">
          {/* Accent glow behind screenshot */}
          <div
            aria-hidden="true"
            className="absolute -inset-8 -z-10 rounded-3xl opacity-40 blur-2xl"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--primary) / 0.3), transparent 50%, hsl(var(--primary) / 0.2))",
            }}
          />
          <div className="relative rounded-xl border shadow-2xl overflow-hidden ring-1 ring-primary/20">
            <picture>
              <source srcSet="/images/hero-dashboard.webp" type="image/webp" />
              <img
                src="/images/hero-dashboard.png"
                alt="Trichterwerk Dashboard mit Funnel Performance"
                width={1200}
                height={800}
                className="w-full h-auto"
              />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Integrations Trust-Bar */}
      <section className="py-12 px-4 border-y bg-muted/20">
        <div className="container mx-auto">
          <p className="text-center text-sm uppercase tracking-wider text-muted-foreground mb-8 font-medium">
            Verbindet sich mit den Tools, die du schon nutzt
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-5xl mx-auto">
            {integrations.map((int) => (
              <div
                key={int.label}
                className="flex flex-col items-center text-center gap-2 opacity-70 hover:opacity-100 transition-opacity"
              >
                <div className="h-10 w-10 rounded-lg bg-background border flex items-center justify-center">
                  <int.icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-medium">{int.label}</div>
                <div className="text-xs text-muted-foreground">{int.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Für wen? */}
      <section className="py-20 px-4 border-y bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Für wen?</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Gebaut für Macher, nicht für Entwickler
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Wenn du heute launchen willst statt in zwei Wochen, bist du hier richtig.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {personas.map((p) => (
              <Card key={p.title} className="text-center">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                    <p.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{p.title}</CardTitle>
                  <CardDescription className="text-base">{p.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Alles drin, was moderne Funnels brauchen
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Keine versteckten Limits, keine Add-ons. Was du hier siehst, ist im Pro-Plan enthalten.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                {feature.image && (
                  <div className="h-40 overflow-hidden bg-muted">
                    <picture>
                      <source srcSet={feature.image} type="image/webp" />
                      <img
                        src={feature.image.replace(".webp", ".png")}
                        alt={feature.title}
                        width={800}
                        height={533}
                        loading="lazy"
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      />
                    </picture>
                  </div>
                )}
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* So einfach geht's */}
      <section className="py-20 px-4 bg-muted/30 border-y">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">In 4 Schritten live</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Vom Signup zum ersten Lead in unter einer Stunde
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div className="text-5xl font-bold text-primary/20 mb-2">{step.number}</div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vergleichstabelle */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Warum Trichterwerk?</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Im direkten Vergleich
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ehrlich verglichen: wo Trichterwerk glänzt und was du bei anderen Tools bekommst.
            </p>
          </div>

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
                  <th className="p-4 font-medium text-muted-foreground">Typeform</th>
                  <th className="p-4 font-medium text-muted-foreground">Perspective</th>
                  <th className="p-4 font-medium text-muted-foreground">Webflow</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, idx) => (
                  <tr
                    key={row.label}
                    className={`border-b last:border-0 ${idx % 2 === 1 ? "bg-muted/10" : ""}`}
                  >
                    <td className="p-4 font-medium">{row.label}</td>
                    <td className="p-4 text-center bg-primary/5">
                      {typeof row.trichterwerk === "boolean" ? (
                        row.trichterwerk ? (
                          <Check className="h-5 w-5 text-primary mx-auto" />
                        ) : (
                          <XIcon className="h-5 w-5 text-muted-foreground/60 mx-auto" />
                        )
                      ) : (
                        <span className="font-semibold text-primary">{row.trichterwerk}</span>
                      )}
                    </td>
                    {(["typeform", "perspective", "webflow"] as const).map((col) => {
                      const val = row[col];
                      return (
                        <td key={col} className="p-4 text-center">
                          {typeof val === "boolean" ? (
                            val ? (
                              <Check className="h-5 w-5 text-muted-foreground mx-auto" />
                            ) : (
                              <XIcon className="h-5 w-5 text-muted-foreground/40 mx-auto" />
                            )
                          ) : (
                            <span className="text-muted-foreground">{val}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Preise und Features der Wettbewerber: Stand {new Date().toLocaleDateString("de-DE", { month: "long", year: "numeric" })}.
            Ohne Gewähr — aktuelle Details auf den Anbieter-Websites.
          </p>
        </div>
      </section>

      {/* Templates Section */}
      <section id="templates" className="py-20 px-4 border-t">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Templates</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Starte mit bewährten Vorlagen
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              10 professionell gestaltete Templates — jedes auf Conversion optimiert. Einfach anpassen und launchen.
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            {templatePreviews.map((template) => (
              <Card
                key={template.name}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
              >
                <div
                  className="h-40 relative overflow-hidden"
                  style={{ backgroundColor: `${template.color}15` }}
                >
                  <picture>
                    <source srcSet={template.image} type="image/webp" />
                    <img
                      src={template.image.replace(".webp", ".png")}
                      alt={template.name}
                      width={600}
                      height={400}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    />
                  </picture>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                <CardContent className="p-4">
                  <Badge variant="outline" className="mb-2 text-xs">
                    {template.category}
                  </Badge>
                  <h3 className="font-semibold mb-1">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Alle Templates entdecken
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-muted/30 border-y">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Preise</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Transparente Preise. Keine Überraschungen.
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ein fairer Preis für alle Features. Monatlich kündbar. 14 Tage gratis testen.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative flex flex-col ${
                  plan.popular ? "border-primary shadow-lg md:scale-105" : ""
                } ${plan.comingSoon ? "border-dashed" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Beliebteste Wahl</Badge>
                  </div>
                )}
                {plan.comingSoon && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="secondary" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      {plan.comingSoonLabel ?? "Coming soon"}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className={`text-4xl font-bold ${plan.comingSoon ? "text-muted-foreground" : ""}`}>
                      {plan.price}
                    </span>
                    {plan.priceSuffix && (
                      <span className="text-muted-foreground ml-1">{plan.priceSuffix}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 mb-6 text-left flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check
                          className={`h-4 w-4 shrink-0 mt-0.5 ${
                            plan.comingSoon ? "text-muted-foreground" : "text-primary"
                          }`}
                        />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.ctaHref.startsWith("mailto:") ? (
                    <a href={plan.ctaHref}>
                      <Button
                        className="w-full"
                        variant={plan.popular ? "default" : plan.comingSoon ? "secondary" : "outline"}
                      >
                        {plan.cta}
                      </Button>
                    </a>
                  ) : (
                    <Link href={plan.ctaHref}>
                      <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                        {plan.cta}
                      </Button>
                    </Link>
                  )}
                  {plan.note && (
                    <p className="text-xs text-muted-foreground text-center mt-3">{plan.note}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pricing footer */}
          <div className="max-w-3xl mx-auto mt-10 text-center space-y-2 text-sm text-muted-foreground">
            <p>
              Alle Preise netto zzgl. 19&nbsp;% MwSt. · Monatlich kündbar · Keine Setup-Gebühr
            </p>
            <p>
              Unsicher, welcher Plan passt?{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-foreground">
                Schreib uns
              </a>{" "}
              — wir melden uns innerhalb eines Werktags.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Häufige Fragen</h2>
            <p className="text-muted-foreground">
              Fehlt etwas?{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-foreground">
                Schreib uns eine E-Mail
              </a>
              .
            </p>
          </div>
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

      {/* Mission / Warum wir das gebaut haben */}
      <section className="py-20 px-4 border-t">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-[auto,1fr] gap-8 items-start">
            <div className="flex md:flex-col items-center md:items-start gap-3 shrink-0">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Flag className="h-7 w-7 text-primary" />
              </div>
              <div className="md:mt-2">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Unser Warum
                </div>
                <div className="text-sm font-semibold">Gemacht in Deutschland</div>
              </div>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                Warum wir Trichterwerk gebaut haben
              </h2>
              <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                <p>
                  Wir sind{" "}
                  <a
                    href="https://superbrand.marketing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground font-semibold underline underline-offset-4 decoration-primary/40 hover:decoration-primary"
                  >
                    SUPERBRAND
                  </a>{" "}
                  — eine kleine Agentur aus Deutschland. Jahrelang haben wir für Kunden
                  Funnels mit amerikanischen Tools gebaut: teuer, englischsprachig,
                  Daten in den USA, Support-Tickets tagelang offen.
                </p>
                <p>
                  Irgendwann reichte es. Wir wollten ein Werkzeug, das{" "}
                  <span className="text-foreground font-medium">in unserer Sprache spricht</span>,{" "}
                  <span className="text-foreground font-medium">unsere Regeln respektiert</span>{" "}
                  (DSGVO, Hosting in der EU), und trotzdem so gut ist wie die großen
                  Namen. Also haben wir's selbst gebaut.
                </p>
                <p>
                  Trichterwerk ist kein Riesen-Konzern, keine VC-Bude, keine Massen-SaaS.
                  Wir wachsen mit unseren Kunden, antworten persönlich auf jede Mail,
                  und bauen die Features, die du wirklich brauchst.
                </p>
              </div>
              <div className="flex items-center gap-3 mt-8 pt-6 border-t">
                <Heart className="h-5 w-5 text-primary fill-primary/20" />
                <span className="text-sm text-muted-foreground">
                  Keine Hype-Versprechen. Keine Fake-Stats. Nur ein solides Tool, das den Job macht.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-muted/30 border-t">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-primary text-primary-foreground overflow-hidden">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Bereit für deinen nächsten Funnel?
              </h2>
              <p className="text-primary-foreground/85 max-w-2xl mx-auto mb-8">
                Starte jetzt mit 14 Tagen Pro-Zugang. Keine Mindestlaufzeit. Kündigung mit zwei Klicks.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register">
                  <Button size="lg" variant="secondary" className="gap-2 text-lg px-8">
                    14 Tage kostenlos testen
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <a href={`mailto:${CONTACT_EMAIL}?subject=Demo-Anfrage`}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 text-lg px-8 bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  >
                    <Headphones className="h-5 w-5" />
                    Demo anfragen
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <img
                  src="/images/logo-icon.webp"
                  alt="Trichterwerk Logo"
                  className="h-8 w-8 rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove("hidden");
                  }}
                />
                <div className="hidden flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Zap className="h-4 w-4" />
                </div>
                <span className="text-lg font-bold">Trichterwerk</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Der deutsche Funnel-Builder für Coaches, Berater und Agenturen.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produkt</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Features</a></li>
                <li><a href="#templates" className="hover:text-foreground">Templates</a></li>
                <li><a href="#pricing" className="hover:text-foreground">Preise</a></li>
                <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Account</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/register" className="hover:text-foreground">Kostenlos testen</Link></li>
                <li><Link href="/login" className="hover:text-foreground">Anmelden</Link></li>
                <li>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Kontakt
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Rechtliches</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/impressum" className="hover:text-foreground">Impressum</Link></li>
                <li><Link href="/datenschutz" className="hover:text-foreground">Datenschutz</Link></li>
                <li>
                  <button
                    onClick={resetCookieConsent}
                    className="hover:text-foreground flex items-center gap-1"
                  >
                    <Cookie className="h-3 w-3" />
                    Cookie-Einstellungen
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t text-center text-sm text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} Trichterwerk · Ein Produkt von{" "}
              <a
                href="https://superbrand.marketing"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground underline"
              >
                SUPERBRAND.marketing
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
