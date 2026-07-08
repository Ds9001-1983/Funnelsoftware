/**
 * Leichte Meta-Registry der öffentlichen Template-Galerie (/vorlagen) — Slugs,
 * Namen, Nutzenversprechen und SEO-Meta pro Template. Reine Daten ohne React:
 * wird vom Server (SSR-Meta-Injektion, Sitemap via shared/seo-content.ts) UND
 * vom Lazy-Chunk der Galerie genutzt.
 *
 * Die vollständigen Template-Definitionen (Seiten/Elemente) leben client-seitig
 * in client/src/lib/templates.ts — die Konsistenz beider Module (Slug ↔ Template)
 * sichert client/src/lib/templates.test.ts.
 */

import { TEMPLATE_GALLERY_PATH, type SeoStaticPage } from "./seo-links";

export type TemplateCategory =
  | "leads"
  | "sales"
  | "recruiting"
  | "webinar"
  | "quiz"
  | "survey";

export const templateCategoryLabels: Record<TemplateCategory, string> = {
  leads: "Lead-Generierung",
  sales: "Verkauf",
  recruiting: "Recruiting",
  webinar: "Webinar",
  quiz: "Quiz",
  survey: "Umfrage",
};

export interface TemplateMeta {
  /** URL-Slug — muss dem `slug` in client/src/lib/templates.ts entsprechen. */
  slug: string;
  /** Anzeigename — muss dem `name` des Templates entsprechen (Konsistenz-Test). */
  name: string;
  category: TemplateCategory;
  /** 1-Satz-Nutzenversprechen für Galerie-Kachel und Detailseite. */
  benefit: string;
  /** Ohne " | Trichterwerk"-Suffix, ≤ 60 Zeichen (Test erzwingt das). */
  metaTitle: string;
  /** ≤ 160 Zeichen. */
  metaDescription: string;
  /** true, sobald Poster + Hover-Video unter /templates/portrait bzw.
   *  /templates/videos generiert wurden (scripts/record-template-videos.ts). */
  videoAvailable: boolean;
}

export const templateMetas: TemplateMeta[] = [
  {
    slug: "termin-buchen",
    name: "Termin buchen",
    category: "leads",
    benefit: "Qualifiziert Anfragen vor und führt direkt zur Terminbuchung.",
    metaTitle: "Funnel-Vorlage: Termin buchen & Strategiegespräch",
    metaDescription:
      "Terminbuchungs-Funnel als fertige Vorlage: Qualifizierungsfragen, Kalender und Kontaktseite — mobil optimiert, DSGVO-konform. Jetzt live durchklicken.",
    videoAvailable: true,
  },
  {
    slug: "vsl",
    name: "VSL Demo",
    category: "sales",
    benefit: "Video Sales Letter mit Qualifizierung — ideal für Coaching und Beratung.",
    metaTitle: "Funnel-Vorlage: Video Sales Letter (VSL)",
    metaDescription:
      "VSL-Funnel als fertige Vorlage: Video, Qualifizierungsfragen und Kontaktseite in einem mobilen Funnel. Live ansehen und mit eigenem Video starten.",
    videoAvailable: true,
  },
  {
    slug: "recruiting",
    name: "Recruiting Experience",
    category: "recruiting",
    benefit: "Mehrstufige Bewerber-Qualifizierung statt Bewerbungsmappe.",
    metaTitle: "Funnel-Vorlage: Recruiting-Funnel für Bewerber",
    metaDescription:
      "Recruiting-Funnel als fertige Vorlage: Benefits zeigen, Bewerber in 3 Fragen qualifizieren, Kontakt sichern — mobil und DSGVO-konform. Live ausprobieren.",
    videoAvailable: true,
  },
  {
    slug: "express-bewerbung",
    name: "Express-Bewerbung",
    category: "recruiting",
    benefit: "Schnell-Bewerbung ohne Lebenslauf — 3 Fragen, Kontakt, fertig.",
    metaTitle: "Funnel-Vorlage: Express-Bewerbung ohne Lebenslauf",
    metaDescription:
      "Recruiting-Funnel als Vorlage: Schnell-Bewerbung ohne Lebenslauf — 3 Fragen, Kontakt, fertig. Mobil optimiert für Meta Ads und QR-Codes. Live ausprobieren.",
    videoAvailable: true,
  },
  {
    slug: "pflege-recruiting",
    name: "Pflege-Recruiting",
    category: "recruiting",
    benefit: "Pflegekräfte gewinnen — mit Dienstplansicherheit statt Floskeln.",
    metaTitle: "Funnel-Vorlage: Pflege-Recruiting",
    metaDescription:
      "Pflegekräfte gewinnen: Recruiting-Funnel mit echten Benefits, Qualifizierung und Kennenlern-Telefonat statt Bewerbungsmappe. DSGVO-konform — live ansehen.",
    videoAvailable: true,
  },
  {
    slug: "handwerk-recruiting",
    name: "Handwerk-Recruiting",
    category: "recruiting",
    benefit: "60-Sekunden-Bewerbung für Monteure und Gesellen (SHK & Elektro).",
    metaTitle: "Funnel-Vorlage: Handwerk-Recruiting (SHK/Elektro)",
    metaDescription:
      "Monteure und Gesellen gewinnen: 60-Sekunden-Kurzbewerbung mit Gewerk, Qualifikation und Gehaltsvorstellung — mobil optimiert. Jetzt live durchklicken.",
    videoAvailable: true,
  },
  {
    slug: "lead-magnet",
    name: "Lead Magnet",
    category: "leads",
    benefit: "Checkliste oder Whitepaper gegen Kontaktdaten — in 2 Minuten durchlaufen.",
    metaTitle: "Funnel-Vorlage: Lead-Magnet & Freebie",
    metaDescription:
      "Lead-Magnet-Funnel als fertige Vorlage: Freebie präsentieren, Interesse qualifizieren, E-Mail einsammeln. Mobil optimiert — jetzt live durchklicken.",
    videoAvailable: true,
  },
  {
    slug: "masterclass",
    name: "Live Masterclass",
    category: "webinar",
    benefit: "Webinar-Anmeldung mit Countdown und Qualifizierung.",
    metaTitle: "Funnel-Vorlage: Webinar- & Masterclass-Anmeldung",
    metaDescription:
      "Webinar-Funnel als fertige Vorlage: Countdown, Qualifizierungsfrage und Anmeldung für deine Masterclass — mobil optimiert. Jetzt live ausprobieren.",
    videoAvailable: true,
  },
  {
    slug: "immobilien-bewertung",
    name: "Immobilien Bewertung",
    category: "leads",
    benefit: "Bewertungs-Funnel für Makler: Objekt qualifizieren, Eigentümer-Kontakt sichern.",
    metaTitle: "Funnel-Vorlage: Immobilien-Bewertung für Makler",
    metaDescription:
      "Immobilien-Funnel als fertige Vorlage: Objektdaten abfragen, Eigentümer qualifizieren, Bewertungs-Lead gewinnen — mobil und DSGVO-konform. Live ansehen.",
    videoAvailable: true,
  },
  {
    slug: "agentur-onboarding",
    name: "Agentur Onboarding",
    category: "leads",
    benefit: "Neukunden-Anfragen strukturiert qualifizieren.",
    metaTitle: "Funnel-Vorlage: Agentur-Onboarding & Erstgespräch",
    metaDescription:
      "Onboarding-Funnel als fertige Vorlage: Anfragen von Neukunden strukturiert qualifizieren — Budget, Ziel, Timing. Mobil optimiert, jetzt live durchklicken.",
    videoAvailable: true,
  },
  {
    slug: "quiz",
    name: "Interaktives Quiz",
    category: "quiz",
    benefit: "Quiz mit Ergebnis-Typen — spielerisch Leads gewinnen.",
    metaTitle: "Funnel-Vorlage: Quiz-Funnel mit Ergebnis-Typen",
    metaDescription:
      "Quiz-Funnel als fertige Vorlage: Fragen beantworten, persönliches Ergebnis erhalten, Kontakt hinterlassen — spielerische Lead-Gewinnung. Live ausprobieren.",
    videoAvailable: true,
  },
  {
    slug: "coaching-angebot",
    name: "Coaching Angebot",
    category: "sales",
    benefit: "Verkaufs-Funnel mit Paketauswahl für Coaches und Berater.",
    metaTitle: "Funnel-Vorlage: Coaching-Angebot verkaufen",
    metaDescription:
      "Sales-Funnel als fertige Vorlage: Angebot präsentieren, Paket wählen lassen, Kaufinteressenten qualifizieren — mobil optimiert. Jetzt live durchklicken.",
    videoAvailable: true,
  },
  {
    slug: "umfrage",
    name: "Umfrage",
    category: "survey",
    benefit: "Kundenfeedback strukturiert einsammeln.",
    metaTitle: "Funnel-Vorlage: Kundenumfrage & Feedback",
    metaDescription:
      "Umfrage-Funnel als fertige Vorlage: Feedback Schritt für Schritt abfragen statt Formularwüste — höhere Abschlussquote, mobil optimiert. Live ansehen.",
    videoAvailable: true,
  },
];

/** Index-Seite der Galerie (SSR-Meta + Sitemap). Bewusst ohne Template-Anzahl
 *  im Text — die wächst und soll keine Meta-Pflege erzwingen. */
export const vorlagenIndexPage: SeoStaticPage = {
  path: TEMPLATE_GALLERY_PATH,
  metaTitle: "Funnel-Vorlagen: fertige Templates live ansehen",
  metaDescription:
    "Fertige Funnel-Vorlagen für Recruiting, Leads und Sales — jede Vorlage live im Smartphone-Format durchklickbar. DSGVO-konform, in Minuten übernommen.",
};

/** Alle Galerie-Seiten für Sitemap + SSR-Meta-Injektion (Index + Detailseiten). */
export const templateSeoPages: SeoStaticPage[] = [
  vorlagenIndexPage,
  ...templateMetas.map((t) => ({
    path: `${TEMPLATE_GALLERY_PATH}/${t.slug}`,
    metaTitle: t.metaTitle,
    metaDescription: t.metaDescription,
  })),
];

/** Registry-Lookup, gehärtet gegen Prototype-Keys. */
export function getTemplateMeta(slug: string | undefined): TemplateMeta | undefined {
  if (!slug) return undefined;
  return templateMetas.find((t) => t.slug === slug);
}
