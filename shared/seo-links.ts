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

/** localStorage-Key für den Empfehlungscode aus /register?ref=<code> —
 *  gleiches Handoff-Muster wie beim template-Param (Partnerprogramm). */
export const SIGNUP_REF_STORAGE_KEY = "tw-signup-ref";

export interface SeoStaticPage {
  path: string;
  /** Ohne Suffix — Server/Hook hängen " | Trichterwerk" an. */
  metaTitle: string;
  metaDescription: string;
  /** Optionales JSON-LD (schema.org) — wird von server/static.ts mit in den
   *  SSR-Meta-Block injiziert, damit Rich Results ohne JS-Rendering greifen.
   *  Befüllt wird das Feld erst in der Assembly in shared/seo-content.ts
   *  (Lazy-Chunk) — hier im leichten Modul bleibt nur der Typ. */
  jsonLd?: object;
}

export const funnelBuilderPage: SeoStaticPage = {
  path: "/funnel-builder",
  metaTitle: "Funnel-Builder: Marketing-Funnels ohne Code erstellen",
  metaDescription:
    "Was ist ein Funnel-Builder und wie erstellst du damit Funnels ohne Code? Der Guide aus Deutschland — DSGVO-konform, ab 49 €/Monat, 14 Tage kostenlos testen.",
};

/** Meta der Vergleichs-Übersicht (/vergleich) — eine Quelle für Client-Hook,
 *  Sitemap und SSR-Meta (der Index fehlte früher in beiden, siehe Test). */
export const vergleichIndexPage: SeoStaticPage = {
  path: "/vergleich",
  metaTitle: "Trichterwerk im Vergleich",
  metaDescription:
    "Trichterwerk ehrlich verglichen mit Typeform, Perspective und ClickFunnels — Features, Preise, DSGVO. Finde heraus, welcher Funnel-Builder zu dir passt.",
};

/** Partnerprogramm-Seite (25 % Lifetime-Provision). */
export const partnerPage: SeoStaticPage = {
  path: "/partner",
  metaTitle: "Partnerprogramm: 25 % Lifetime-Provision",
  metaDescription:
    "Empfiehl Trichterwerk und verdiene 25 % wiederkehrende Provision auf jede Pro-Zahlung — dauerhaft, ohne Deckelung. Ideal für Agenturen, Coaches und Creator.",
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

/**
 * Statische Pfade der Sitemap OHNE die SEO-Registry-Seiten (die kommen aus
 * shared/seo-content.ts:seoStaticPages dazu). Bewusst ohne /login und /register:
 * Auth-Seiten sind Thin Content und werden serverseitig auf noindex gesetzt.
 */
export const sitemapStaticPaths = ["/", "/impressum", "/datenschutz", "/agb", "/avv"] as const;

/**
 * Express-Routen-Patterns der Marketing-Seiten mit SSR-Meta-Injektion
 * (server/static.ts). Muss jede seoStaticPages-Seite abdecken —
 * shared/seo-routes.test.ts erzwingt das.
 */
export const marketingRoutePatterns: string[] = [
  funnelBuilderPage.path,
  vergleichIndexPage.path,
  "/vergleich/:slug",
  partnerPage.path,
  ...audiencePages.map((p) => p.path),
  TEMPLATE_GALLERY_PATH,
  `${TEMPLATE_GALLERY_PATH}/:slug`,
];

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
