/**
 * Leichte Link-/Meta-Daten der SEO-Marketing-Seiten — bewusst getrennt von der
 * großen Content-Registry (shared/seo-content.ts), damit Haupt-Bundle-Konsumenten
 * (MarketingFooter, Landing) nur diese paar Strings ziehen. seo-content.ts
 * importiert von HIER (nie umgekehrt); die Konsistenz beider Module sichert
 * shared/seo-content.test.ts.
 */

export const SITE_ORIGIN = "https://trichterwerk.de";

/** Pfad der öffentlichen Template-Galerie — einziger Koordinationspunkt für
 *  Header/Footer/Landing-Links (Detailseiten: `${TEMPLATE_GALLERY_PATH}/<slug>`). */
export const TEMPLATE_GALLERY_PATH = "/vorlagen";

/** localStorage-Key für die in der Galerie gewählte Vorlage: /register?template=<slug>
 *  merkt sie sich hier, /funnels/new liest und löscht sie — überlebt so
 *  Stripe-Checkout-Redirect und E-Mail-Verifizierung. */
export const SIGNUP_TEMPLATE_STORAGE_KEY = "tw-signup-template";

export interface SeoStaticPage {
  path: string;
  /** Ohne Suffix — Server/Hook hängen " | Trichterwerk" an. */
  metaTitle: string;
  metaDescription: string;
}

export const funnelBuilderPage: SeoStaticPage = {
  path: "/funnel-builder",
  metaTitle: "Funnel-Builder: Marketing-Funnels ohne Code erstellen",
  metaDescription:
    "Was ist ein Funnel-Builder und wie erstellst du damit Funnels ohne Code? Der Guide aus Deutschland — DSGVO-konform, ab 49 €/Monat, 14 Tage kostenlos testen.",
};

export const comparisonLinks = [
  { path: "/vergleich/typeform-alternative", competitor: "Typeform" },
  { path: "/vergleich/perspective-alternative", competitor: "Perspective" },
  { path: "/vergleich/clickfunnels-alternative", competitor: "ClickFunnels" },
] as const;

/** Zielgruppen-Landingpages — Meta hier (Server-Injektion + Footer-Links),
 *  Inhalte in shared/seo-content.ts (audiencePagesContent, Lazy-Chunk). */
export const audiencePages = [
  {
    path: "/recruiting-funnel",
    label: "Recruiting-Funnel",
    metaTitle: "Recruiting-Funnel: Bewerber gewinnen ohne Lebenslauf",
    metaDescription:
      "Recruiting-Funnel für Pflege, Handwerk, SHK und Gastro: mobile Express-Bewerbung ohne Lebenslauf, DSGVO-konform aus Deutschland. 14 Tage kostenlos testen.",
  },
  {
    path: "/lead-funnel",
    label: "Lead-Funnel",
    metaTitle: "Lead-Funnel erstellen: mehr qualifizierte Anfragen",
    metaDescription:
      "Lead-Funnel statt Kontaktformular: Besucher Schritt für Schritt qualifizieren und konvertieren — DSGVO-konform ab 49 €/Monat. 14 Tage kostenlos testen.",
  },
] as const satisfies readonly (SeoStaticPage & { label: string })[];

export interface SeoFaq {
  q: string;
  a: string;
}

/** FAQPage-Knoten für JSON-LD (schema.org) — von beiden SEO-Seiten genutzt. */
export function faqPageJsonLd(faqs: SeoFaq[]): object {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
