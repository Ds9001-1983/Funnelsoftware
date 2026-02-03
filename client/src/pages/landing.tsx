import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Layers,
  Users,
  BarChart3,
  Sparkles,
  Smartphone,
  Clock,
  Target,
  Check,
  ArrowRight,
  Star,
  ChevronRight,
  MousePointerClick,
  PenTool,
  Palette,
  TrendingUp,
  Cookie,
} from "lucide-react";
import { resetCookieConsent } from "@/components/cookie-consent";

// Template preview data with images
const templatePreviews = [
  {
    name: "Lead-Generierung",
    category: "Leads",
    color: "#7C3AED",
    description: "Qualifizierte Leads sammeln",
    image: "/templates/lead-gen.png",
  },
  {
    name: "Webinar-Anmeldung",
    category: "Webinar",
    color: "#2563EB",
    description: "Anmeldungen maximieren",
    image: "/templates/webinar.png",
  },
  {
    name: "Interaktives Quiz",
    category: "Quiz",
    color: "#10B981",
    description: "Leads unterhaltsam qualifizieren",
    image: "/templates/quiz.png",
  },
  {
    name: "Schnell-Bewerbung",
    category: "Recruiting",
    color: "#F59E0B",
    description: "Top-Talente gewinnen",
    image: "/templates/recruiting.png",
  },
  {
    name: "Produkt-Verkauf",
    category: "Sales",
    color: "#DC2626",
    description: "Produkte direkt verkaufen",
    image: "/templates/sales.png",
  },
];

const features = [
  {
    icon: MousePointerClick,
    title: "Drag & Drop Builder",
    description: "Erstelle beeindruckende Funnels ohne eine einzige Zeile Code. Einfach Elemente ziehen und ablegen.",
    image: "/images/feature-drag-drop.png",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Design",
    description: "Alle Funnels sind automatisch für Smartphones optimiert - dort, wo deine Kunden sind.",
    image: "/images/feature-mobile.png",
  },
  {
    icon: PenTool,
    title: "20+ Elemente",
    description: "Von Texten über Videos bis hin zu Formularen und Countdowns - alles was du brauchst.",
  },
  {
    icon: Palette,
    title: "Vollständig anpassbar",
    description: "Passe Farben, Schriften und Layouts an deine Marke an. Keine Kompromisse.",
  },
  {
    icon: TrendingUp,
    title: "Analytics & Insights",
    description: "Verfolge Views, Conversions und Lead-Qualität in Echtzeit.",
    image: "/images/feature-analytics.png",
  },
  {
    icon: Target,
    title: "Conditional Logic",
    description: "Zeige verschiedene Seiten basierend auf den Antworten deiner Besucher.",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "0",
    description: "Perfekt zum Ausprobieren",
    features: [
      "3 aktive Funnels",
      "100 Leads/Monat",
      "Basis-Templates",
      "E-Mail Support",
    ],
    cta: "Kostenlos starten",
    popular: false,
  },
  {
    name: "Pro",
    price: "49",
    description: "Für wachsende Unternehmen",
    features: [
      "Unbegrenzte Funnels",
      "Unbegrenzte Leads",
      "Alle Templates",
      "Erweiterte Analytics",
      "Eigene Domain",
      "Priority Support",
    ],
    cta: "14 Tage kostenlos testen",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "199",
    description: "Für Teams & Agenturen",
    features: [
      "Alles aus Pro",
      "Team-Accounts",
      "White-Label Option",
      "API-Zugang",
      "Dedicated Account Manager",
      "SLA-Garantie",
    ],
    cta: "Kontakt aufnehmen",
    popular: false,
  },
];

const testimonials = [
  {
    name: "Sarah M.",
    role: "Marketing Manager",
    company: "TechStart GmbH",
    text: "Mit Trichterwerk haben wir unsere Lead-Generierung verdreifacht. Der Drag & Drop Builder ist unglaublich intuitiv.",
    rating: 5,
  },
  {
    name: "Thomas K.",
    role: "Geschäftsführer",
    company: "Consulting Plus",
    text: "Endlich ein Tool, das auch auf dem Handy perfekt funktioniert. Unsere Conversion-Rate ist um 40% gestiegen.",
    rating: 5,
  },
  {
    name: "Lisa B.",
    role: "HR Director",
    company: "Future Talents",
    text: "Der Recruiting-Funnel hat unseren Bewerbungsprozess revolutioniert. Schneller, einfacher, besser.",
    rating: 5,
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
              src="/images/logo-icon.png" 
              alt="Trichterwerk Logo" 
              className="h-9 w-9 rounded-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
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
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Anmelden</Button>
            </Link>
            <Link href="/register">
              <Button>Kostenlos starten</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="secondary" className="mb-6">
            <Sparkles className="h-3 w-3 mr-1" />
            Jetzt mit 14 Tagen kostenlos testen
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Erstelle Funnels, die{" "}
            <span className="text-primary">konvertieren</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Mit Trichterwerk erstellst du in Minuten mobile-optimierte Marketing-Funnels,
            die Besucher in Kunden verwandeln. Ohne Programmierkenntnisse.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2 text-lg px-8">
                14 Tage kostenlos testen
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Mehr erfahren
              </Button>
            </a>
          </div>
          <div className="flex flex-col items-center gap-2 mt-4">
            <p className="text-sm text-muted-foreground">Sichere Zahlung mit</p>
            <div className="flex items-center gap-4">
              {/* PayPal */}
              <svg className="h-6" viewBox="0 0 101 32" fill="currentColor" opacity="0.6">
                <path d="M12.237 4.574H4.726a.937.937 0 00-.926.79L.875 26.078a.562.562 0 00.555.65h3.588a.937.937 0 00.926-.79l.79-5.012a.937.937 0 01.926-.79h2.134c4.447 0 7.012-2.153 7.685-6.42.303-1.866.012-3.332-.864-4.358-.963-1.127-2.672-1.784-4.378-1.784zm.78 6.323c-.37 2.424-2.22 2.424-4.012 2.424H7.87l.715-4.527a.562.562 0 01.555-.474h.534c1.22 0 2.373 0 2.967.696.355.415.462 1.032.376 1.881z"/>
                <path d="M35.865 10.78h-3.6a.562.562 0 00-.554.474l-.158 1.005-.252-.365c-.778-1.13-2.512-1.507-4.243-1.507-3.97 0-7.362 3.007-8.022 7.226-.343 2.103.144 4.113 1.337 5.514 1.095 1.287 2.66 1.823 4.524 1.823 3.198 0 4.97-2.055 4.97-2.055l-.16.997a.562.562 0 00.555.65h3.24a.937.937 0 00.926-.79l1.944-12.323a.562.562 0 00-.555-.65zm-5.006 6.993c-.346 2.05-1.97 3.427-4.045 3.427-1.042 0-1.875-.335-2.41-.968-.532-.63-.732-1.527-.563-2.524.322-2.032 1.97-3.456 4.012-3.456 1.02 0 1.848.338 2.395.978.55.645.767 1.548.611 2.543z"/>
                <path d="M55.467 10.78h-3.616a.937.937 0 00-.774.41l-4.47 6.583-1.894-6.328a.937.937 0 00-.898-.665h-3.554a.562.562 0 00-.532.746l3.568 10.47-3.356 4.737a.562.562 0 00.46.886h3.612a.937.937 0 00.77-.402l10.779-15.564a.562.562 0 00-.46-.873z"/>
                <path d="M67.337 4.574h-7.51a.937.937 0 00-.927.79l-2.925 18.537a.562.562 0 00.555.65h3.85a.656.656 0 00.648-.553l.83-5.249a.937.937 0 01.926-.79h2.134c4.447 0 7.012-2.153 7.685-6.42.303-1.866.012-3.332-.864-4.358-.963-1.127-2.672-1.784-4.378-1.784zm.78 6.323c-.37 2.424-2.22 2.424-4.012 2.424h-1.137l.715-4.527a.562.562 0 01.555-.474h.534c1.22 0 2.373 0 2.968.696.354.415.462 1.032.375 1.881z"/>
                <path d="M90.965 10.78h-3.6a.562.562 0 00-.555.474l-.158 1.005-.25-.365c-.78-1.13-2.514-1.507-4.245-1.507-3.97 0-7.362 3.007-8.022 7.226-.343 2.103.144 4.113 1.337 5.514 1.095 1.287 2.66 1.823 4.524 1.823 3.198 0 4.97-2.055 4.97-2.055l-.16.997a.562.562 0 00.555.65h3.24a.937.937 0 00.927-.79l1.943-12.323a.562.562 0 00-.555-.65zm-5.007 6.993c-.345 2.05-1.97 3.427-4.044 3.427-1.042 0-1.876-.335-2.41-.968-.532-.63-.733-1.527-.563-2.524.322-2.032 1.97-3.456 4.012-3.456 1.02 0 1.848.338 2.395.978.55.645.766 1.548.61 2.543z"/>
                <path d="M95.897 5.018l-2.97 18.885a.562.562 0 00.554.65h3.1a.937.937 0 00.926-.79l2.927-18.537a.562.562 0 00-.555-.65h-3.427a.562.562 0 00-.555.442z"/>
              </svg>
              {/* Visa */}
              <svg className="h-5" viewBox="0 0 48 16" fill="currentColor" opacity="0.6">
                <path d="M19.318 0l-3.575 15.33h-3.575L15.743 0h3.575zm14.327 9.892l1.88-5.184.543 2.592.994 2.592h-3.417zm3.977 5.438h3.303L38.17 0h-2.967a1.49 1.49 0 00-1.392.928l-4.903 14.402h3.432l.682-1.888h4.19l.11 1.888zm-8.775-5c.015-3.954-5.468-4.172-5.432-5.938.012-.537.524-1.108 1.644-1.254a7.312 7.312 0 013.83.672l.682-3.186A10.437 10.437 0 0026.078 0c-3.23 0-5.504 1.718-5.523 4.178-.02 1.818 1.622 2.832 2.86 3.436 1.274.618 1.702 1.014 1.696 1.567-.008.846-1.016 1.22-1.957 1.234-1.644.026-2.598-.444-3.358-.8l-.593 2.772c.764.35 2.174.656 3.638.67 3.434 0 5.68-1.696 5.691-4.327zM14.14 0L8.56 15.33H5.01L2.278 2.72C2.118 2.042 1.978 1.79 1.46 1.51 0.612 1.05 0 .77 0 .77l.06-.29h5.556c.71 0 1.347.472 1.51 1.29l1.375 7.306L11.872 0H14.14z"/>
              </svg>
              {/* Mastercard */}
              <svg className="h-5" viewBox="0 0 32 20" fill="currentColor" opacity="0.6">
                <circle cx="10" cy="10" r="10" fillOpacity="0.8"/>
                <circle cx="22" cy="10" r="10" fillOpacity="0.6"/>
              </svg>
              {/* Amex */}
              <span className="text-xs font-bold opacity-60">AMEX</span>
            </div>
          </div>
        </div>

        {/* Hero Image - Dashboard Preview */}
        <div className="container mx-auto mt-16 max-w-6xl">
          <div className="relative rounded-xl border shadow-2xl overflow-hidden">
            <img 
              src="/images/hero-dashboard.png" 
              alt="Trichterwerk Dashboard" 
              className="w-full h-auto"
              onError={(e) => {
                // Fallback to original card layout if image fails
                e.currentTarget.parentElement!.innerHTML = `
                  <div class="p-8 md:p-12 bg-gradient-to-b from-muted/50 to-muted">
                    <div class="grid md:grid-cols-3 gap-6">
                      <div class="bg-background/80 backdrop-blur shadow-lg rounded-lg p-6">
                        <div class="h-3 w-3 rounded-full bg-primary mb-4"></div>
                        <div class="space-y-2">
                          <div class="h-4 bg-muted rounded w-3/4"></div>
                          <div class="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">10k+</div>
              <div className="text-muted-foreground">Erstellte Funnels</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">500k+</div>
              <div className="text-muted-foreground">Gesammelte Leads</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">98%</div>
              <div className="text-muted-foreground">Zufriedene Kunden</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">4.9/5</div>
              <div className="text-muted-foreground">Bewertung</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Alles was du brauchst, um Leads zu gewinnen
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Trichterwerk bietet dir alle Werkzeuge, um professionelle Marketing-Funnels zu erstellen -
              ohne technisches Know-how.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                {feature.image && (
                  <div className="h-40 overflow-hidden bg-muted">
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Templates Section */}
      <section id="templates" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Templates</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Starte mit professionellen Vorlagen
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Wähle aus unseren bewährten Templates und passe sie an deine Marke an.
              Jedes Template ist für maximale Conversion optimiert.
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
                  <img 
                    src={template.image}
                    alt={template.name}
                    className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
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

      {/* Testimonials Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Kundenstimmen</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Was unsere Kunden sagen
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="relative">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-medium">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role}, {testimonial.company}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Preise</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Einfache, transparente Preise
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Starte kostenlos und upgrade wenn du bereit bist.
              Keine versteckten Kosten, keine Überraschungen.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${plan.popular ? "border-primary shadow-lg scale-105" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Beliebteste Wahl</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}€</span>
                    <span className="text-muted-foreground">/Monat</span>
                  </div>
                  <ul className="space-y-3 mb-6 text-left">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/register">
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Bereit, mehr Leads zu generieren?
              </h2>
              <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-6">
                Starte jetzt kostenlos und erstelle deinen ersten Funnel in weniger als 5 Minuten.
              </p>
              <div className="flex items-center justify-center gap-4 mb-6 opacity-80">
                {/* PayPal */}
                <svg className="h-5 text-primary-foreground" viewBox="0 0 101 32" fill="currentColor">
                  <path d="M12.237 4.574H4.726a.937.937 0 00-.926.79L.875 26.078a.562.562 0 00.555.65h3.588a.937.937 0 00.926-.79l.79-5.012a.937.937 0 01.926-.79h2.134c4.447 0 7.012-2.153 7.685-6.42.303-1.866.012-3.332-.864-4.358-.963-1.127-2.672-1.784-4.378-1.784zm.78 6.323c-.37 2.424-2.22 2.424-4.012 2.424H7.87l.715-4.527a.562.562 0 01.555-.474h.534c1.22 0 2.373 0 2.967.696.355.415.462 1.032.376 1.881z"/>
                </svg>
                {/* Visa */}
                <svg className="h-4 text-primary-foreground" viewBox="0 0 48 16" fill="currentColor">
                  <path d="M19.318 0l-3.575 15.33h-3.575L15.743 0h3.575zm14.327 9.892l1.88-5.184.543 2.592.994 2.592h-3.417z"/>
                </svg>
                {/* Mastercard circles */}
                <div className="flex -space-x-2">
                  <div className="w-4 h-4 rounded-full bg-primary-foreground/60"></div>
                  <div className="w-4 h-4 rounded-full bg-primary-foreground/40"></div>
                </div>
                <span className="text-xs font-bold text-primary-foreground">AMEX</span>
              </div>
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

      {/* Footer */}
      <footer className="py-12 px-4 border-t">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <img 
                  src="/images/logo-icon.png" 
                  alt="Trichterwerk Logo" 
                  className="h-8 w-8 rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Zap className="h-4 w-4" />
                </div>
                <span className="text-lg font-bold">Trichterwerk</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Der einfachste Weg, mobile-optimierte Marketing-Funnels zu erstellen.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produkt</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Features</a></li>
                <li><a href="#templates" className="hover:text-foreground">Templates</a></li>
                <li><a href="#pricing" className="hover:text-foreground">Preise</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Unternehmen</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Über uns</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Karriere</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
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
            <p>&copy; {new Date().getFullYear()} Trichterwerk · Ein Produkt von <a href="https://superbrand.marketing" target="_blank" rel="noopener noreferrer" className="hover:text-foreground underline">SUPERBRAND.marketing</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
