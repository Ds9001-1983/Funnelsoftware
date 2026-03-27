import type { PageElement } from "@shared/schema";

export interface SectionTemplate {
  id: string;
  name: string;
  category: "content" | "interactive" | "social" | "layout";
  categoryLabel: string;
  description: string;
  elements: Partial<PageElement>[];
}

export const sectionTemplateCategories = [
  { id: "content", label: "Inhalt", description: "Text, Bilder, Videos" },
  { id: "interactive", label: "Interaktiv", description: "Fragen, Formulare, Quiz" },
  { id: "social", label: "Social Proof", description: "Bewertungen, Team, Vertrauen" },
  { id: "layout", label: "Layout", description: "Trenner, Abstände" },
];

export const sectionTemplates: SectionTemplate[] = [
  // Content
  {
    id: "hero-simple",
    name: "Hero einfach",
    category: "content",
    categoryLabel: "Titelbereich",
    description: "Überschrift mit Text und CTA-Button",
    elements: [
      { id: "sh-1", type: "heading", content: "Dein überzeugender Titel hier" },
      { id: "sh-2", type: "text", content: "Beschreibe hier den Mehrwert deines Angebots in 1-2 Sätzen. Was hat der Besucher davon?" },
      { id: "sh-3", type: "button", content: "Jetzt starten", buttonAction: "next", buttonVariant: "primary" },
    ],
  },
  {
    id: "hero-image",
    name: "Hero mit Bild",
    category: "content",
    categoryLabel: "Titelbereich",
    description: "Überschrift, Text, Bild und CTA",
    elements: [
      { id: "si-1", type: "image", imageUrl: "", imageAlt: "Hero Bild" },
      { id: "si-2", type: "heading", content: "Mehr Erfolg mit weniger Aufwand" },
      { id: "si-3", type: "text", content: "Entdecke wie wir dir helfen können, deine Ziele schneller zu erreichen." },
      { id: "si-4", type: "button", content: "Mehr erfahren", buttonAction: "next", buttonVariant: "primary" },
    ],
  },
  {
    id: "features-list",
    name: "Vorteile-Liste",
    category: "content",
    categoryLabel: "Produkt",
    description: "3 Vorteile mit Häkchen",
    elements: [
      { id: "fl-1", type: "heading", content: "Das sind deine Vorteile" },
      { id: "fl-2", type: "list", listStyle: "check", listItems: [
        { id: "li1", text: "Schnelle Ergebnisse in wenigen Tagen" },
        { id: "li2", text: "Persönliche Betreuung durch Experten" },
        { id: "li3", text: "100% Zufriedenheitsgarantie" },
      ]},
    ],
  },
  {
    id: "cta-simple",
    name: "CTA einfach",
    category: "content",
    categoryLabel: "Handlungsaufforderung",
    description: "Überschrift mit Call-to-Action",
    elements: [
      { id: "cs-1", type: "heading", content: "Bereit loszulegen?" },
      { id: "cs-2", type: "text", content: "Starte jetzt und erlebe den Unterschied." },
      { id: "cs-3", type: "button", content: "Jetzt anfragen", buttonAction: "next", buttonVariant: "primary" },
    ],
  },
  {
    id: "cta-urgency",
    name: "CTA mit Countdown",
    category: "content",
    categoryLabel: "Handlungsaufforderung",
    description: "Dringlichkeit mit Timer",
    elements: [
      { id: "cu-1", type: "heading", content: "Nur noch für kurze Zeit!" },
      { id: "cu-2", type: "countdown", countdownDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), countdownStyle: "flip", countdownShowLabels: true },
      { id: "cu-3", type: "button", content: "Jetzt sichern", buttonAction: "next", buttonVariant: "primary" },
    ],
  },

  // Interactive
  {
    id: "quiz-single",
    name: "Single-Select Frage",
    category: "interactive",
    categoryLabel: "Quiz",
    description: "Frage mit Auswahloptionen",
    elements: [
      { id: "qs-1", type: "heading", content: "Was beschreibt dich am besten?" },
      { id: "qs-2", type: "radio", options: ["Option A", "Option B", "Option C", "Option D"], label: "Wähle eine Option" },
    ],
  },
  {
    id: "quiz-multi",
    name: "Multiple-Choice Frage",
    category: "interactive",
    categoryLabel: "Quiz",
    description: "Mehrfachauswahl möglich",
    elements: [
      { id: "qm-1", type: "heading", content: "Was ist dir besonders wichtig?" },
      { id: "qm-2", type: "text", content: "Du kannst gerne mehrere anklicken." },
      { id: "qm-3", type: "checkbox", options: ["Qualität", "Preis", "Service", "Schnelligkeit"], label: "Wähle aus" },
    ],
  },
  {
    id: "contact-form",
    name: "Kontaktformular",
    category: "interactive",
    categoryLabel: "Formular",
    description: "Name, E-Mail, Telefon",
    elements: [
      { id: "cf-1", type: "heading", content: "Deine Kontaktdaten" },
      { id: "cf-2", type: "input", placeholder: "Dein Name", required: true, label: "Name" },
      { id: "cf-3", type: "input", placeholder: "Deine E-Mail", required: true, label: "E-Mail" },
      { id: "cf-4", type: "input", placeholder: "Deine Telefonnummer", label: "Telefon" },
      { id: "cf-5", type: "textarea", placeholder: "Deine Nachricht...", label: "Nachricht" },
    ],
  },

  // Social Proof
  {
    id: "testimonial-single",
    name: "Kundenstimme",
    category: "social",
    categoryLabel: "Kundenstimmen",
    description: "Ein Testimonial mit Bewertung",
    elements: [
      { id: "ts-1", type: "testimonial", slides: [
        { id: "t1", text: "Die Zusammenarbeit war absolut professionell. Das Ergebnis hat unsere Erwartungen übertroffen!", author: "Maria Schmidt", role: "Geschäftsführerin", rating: 5 },
      ]},
    ],
  },
  {
    id: "team-grid",
    name: "Team-Vorstellung",
    category: "social",
    categoryLabel: "Team",
    description: "Team-Mitglieder mit Foto",
    elements: [
      { id: "tg-1", type: "heading", content: "Unser Team" },
      { id: "tg-2", type: "team", teamMembers: [
        { id: "tm1", name: "Max Mustermann", role: "CEO", image: "", bio: "Gründer und Visionär" },
        { id: "tm2", name: "Erika Musterfrau", role: "CTO", image: "", bio: "Technische Leitung" },
      ]},
    ],
  },
  {
    id: "trust-badges",
    name: "Vertrauens-Badges",
    category: "social",
    categoryLabel: "Vertrauen",
    description: "Bewertungen und Statistiken",
    elements: [
      { id: "tb-1", type: "socialProof", socialProofType: "stats", socialProofItems: [
        { id: "sp1", text: "Zufriedene Kunden", value: "500+" },
        { id: "sp2", text: "Jahre Erfahrung", value: "10+" },
        { id: "sp3", text: "Projekte", value: "1.200+" },
      ]},
    ],
  },

  // Layout
  {
    id: "divider-simple",
    name: "Trennlinie",
    category: "layout",
    categoryLabel: "Layout",
    description: "Horizontale Trennlinie",
    elements: [
      { id: "ds-1", type: "divider", dividerStyle: "solid" },
    ],
  },
  {
    id: "spacer-medium",
    name: "Abstand",
    category: "layout",
    categoryLabel: "Layout",
    description: "Vertikaler Abstand",
    elements: [
      { id: "sm-1", type: "spacer", spacerHeight: 40 },
    ],
  },
];
