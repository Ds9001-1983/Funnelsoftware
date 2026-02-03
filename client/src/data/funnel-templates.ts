import type { FunnelPage, Theme } from "@shared/schema";

/**
 * Professionelle Funnel-Templates, inspiriert von Perspective.co
 * Kategorisiert nach Anwendungsfällen für schnellen Start.
 */

export interface FunnelTemplate {
  id: string;
  name: string;
  description: string;
  category: "leads" | "sales" | "recruiting" | "webinar" | "quiz" | "survey";
  thumbnail: string;
  pages: FunnelPage[];
  theme: Theme;
}

// ============ LEAD GENERATION TEMPLATES ============

const leadMagnetTemplate: FunnelTemplate = {
  id: "lead-magnet",
  name: "Lead Magnet",
  description: "Präsentiere deinen Lead Magneten und verwandle Besucher in qualifizierte Leads",
  category: "leads",
  thumbnail: "/templates/lead-magnet.png",
  theme: {
    primaryColor: "#7C3AED",
    backgroundColor: "#ffffff",
    textColor: "#1a1a1a",
    fontFamily: "Inter",
  },
  pages: [
    {
      id: "page-1",
      type: "welcome",
      title: "Kostenloser Guide",
      subtitle: "Entdecke die 7 Geheimnisse erfolgreicher Unternehmer",
      elements: [
        { id: "el-1", type: "heading", content: "Kostenloser Guide" },
        { id: "el-2", type: "text", content: "Lerne die bewährten Strategien, die Top-Unternehmer nutzen, um ihr Business auf das nächste Level zu bringen." },
        { id: "el-3", type: "list", listStyle: "check", listItems: [
          { id: "li-1", text: "Sofort umsetzbare Tipps" },
          { id: "li-2", text: "Praxiserprobte Strategien" },
          { id: "li-3", text: "100% kostenlos" },
        ]},
      ],
      buttonText: "Jetzt kostenlos herunterladen",
      backgroundColor: "#7C3AED",
    },
    {
      id: "page-2",
      type: "contact",
      title: "Wohin dürfen wir den Guide senden?",
      elements: [
        { id: "el-4", type: "input", placeholder: "Dein Vorname", required: true },
        { id: "el-5", type: "input", placeholder: "Deine E-Mail-Adresse", required: true },
      ],
      buttonText: "Guide anfordern",
    },
    {
      id: "page-3",
      type: "thankyou",
      title: "Geschafft!",
      subtitle: "Dein Guide ist unterwegs",
      elements: [
        { id: "el-6", type: "heading", content: "Vielen Dank!" },
        { id: "el-7", type: "text", content: "Wir haben dir den Guide an deine E-Mail-Adresse gesendet. Schau auch im Spam-Ordner nach!" },
      ],
      showConfetti: true,
      backgroundColor: "#7C3AED",
    },
  ],
};

const terminTemplate: FunnelTemplate = {
  id: "termin",
  name: "Termin buchen",
  description: "Präsentiere dein Angebot und ermögliche direkte Terminbuchung",
  category: "leads",
  thumbnail: "/templates/termin.png",
  theme: {
    primaryColor: "#2563EB",
    backgroundColor: "#ffffff",
    textColor: "#1a1a1a",
    fontFamily: "Inter",
  },
  pages: [
    {
      id: "page-1",
      type: "welcome",
      title: "Kostenloses Strategiegespräch",
      elements: [
        { id: "el-1", type: "heading", content: "10+ qualifizierte Termine pro Woche" },
        { id: "el-2", type: "text", content: "Erfahre, wie wir dir helfen können, mehr Kunden zu gewinnen – oder wir arbeiten kostenlos." },
        { id: "el-3", type: "testimonial", slides: [
          { id: "t-1", text: "Innerhalb von 4 Wochen haben wir unseren Umsatz verdoppelt!", author: "Max Mustermann", role: "CEO, TechStart GmbH", rating: 5 },
        ]},
      ],
      buttonText: "Ja, ich will mehr erfahren",
      backgroundColor: "#2563EB",
    },
    {
      id: "page-2",
      type: "question",
      title: "Wie groß ist dein Unternehmen?",
      elements: [
        { id: "el-4", type: "radio", options: ["1-5 Mitarbeiter", "6-20 Mitarbeiter", "21-50 Mitarbeiter", "50+ Mitarbeiter"] },
      ],
      buttonText: "Weiter",
    },
    {
      id: "page-3",
      type: "question",
      title: "Was ist deine größte Herausforderung?",
      elements: [
        { id: "el-5", type: "radio", options: ["Mehr Leads generieren", "Leads in Kunden umwandeln", "Bestandskunden halten", "Sonstiges"] },
      ],
      buttonText: "Weiter",
    },
    {
      id: "page-4",
      type: "contact",
      title: "Fast geschafft!",
      subtitle: "Trage deine Daten ein für dein kostenloses Gespräch",
      elements: [
        { id: "el-6", type: "input", placeholder: "Dein Name", required: true },
        { id: "el-7", type: "input", placeholder: "Deine E-Mail", required: true },
        { id: "el-8", type: "input", placeholder: "Deine Telefonnummer", required: true },
        { id: "el-9", type: "input", placeholder: "Dein Unternehmen" },
      ],
      buttonText: "Termin vereinbaren",
    },
    {
      id: "page-5",
      type: "thankyou",
      title: "Perfekt!",
      elements: [
        { id: "el-10", type: "heading", content: "Wir melden uns bei dir!" },
        { id: "el-11", type: "text", content: "Einer unserer Experten wird sich innerhalb von 24 Stunden bei dir melden, um einen passenden Termin zu finden." },
      ],
      showConfetti: true,
      backgroundColor: "#2563EB",
    },
  ],
};

// ============ RECRUITING TEMPLATES ============

const recruitingTemplate: FunnelTemplate = {
  id: "recruiting",
  name: "Express Bewerbung",
  description: "Ermögliche schnelle Bewerbungen ohne Lebenslauf",
  category: "recruiting",
  thumbnail: "/templates/recruiting.png",
  theme: {
    primaryColor: "#059669",
    backgroundColor: "#ffffff",
    textColor: "#1a1a1a",
    fontFamily: "Poppins",
  },
  pages: [
    {
      id: "page-1",
      type: "welcome",
      title: "Werde Teil unseres Teams!",
      elements: [
        { id: "el-1", type: "heading", content: "Bewirb dich in nur 2 Minuten" },
        { id: "el-2", type: "text", content: "Kein Lebenslauf nötig. Kein Anschreiben. Einfach ein paar Fragen beantworten und wir melden uns bei dir!" },
        { id: "el-3", type: "list", listStyle: "check", listItems: [
          { id: "li-1", text: "Attraktives Gehalt" },
          { id: "li-2", text: "Flexible Arbeitszeiten" },
          { id: "li-3", text: "Modernes Büro" },
          { id: "li-4", text: "Weiterbildungsmöglichkeiten" },
        ]},
      ],
      buttonText: "Jetzt bewerben",
      backgroundColor: "#059669",
    },
    {
      id: "page-2",
      type: "question",
      title: "Was beschreibt deine aktuelle Situation am besten?",
      elements: [
        { id: "el-4", type: "radio", options: ["Ich suche aktiv nach Jobs", "Ich bin offen für Angebote", "Ich bin nur neugierig"] },
      ],
      buttonText: "Weiter",
    },
    {
      id: "page-3",
      type: "question",
      title: "Wie viel Erfahrung hast du in diesem Bereich?",
      elements: [
        { id: "el-5", type: "radio", options: ["Keine Erfahrung", "1-2 Jahre", "3-5 Jahre", "Mehr als 5 Jahre"] },
      ],
      buttonText: "Weiter",
    },
    {
      id: "page-4",
      type: "question",
      title: "Wann könntest du starten?",
      elements: [
        { id: "el-6", type: "radio", options: ["Sofort", "In 2-4 Wochen", "In 1-3 Monaten", "Später"] },
      ],
      buttonText: "Weiter",
    },
    {
      id: "page-5",
      type: "contact",
      title: "Fast geschafft!",
      subtitle: "Hinterlasse uns deine Kontaktdaten",
      elements: [
        { id: "el-7", type: "input", placeholder: "Dein vollständiger Name", required: true },
        { id: "el-8", type: "input", placeholder: "Deine E-Mail-Adresse", required: true },
        { id: "el-9", type: "input", placeholder: "Deine Telefonnummer", required: true },
      ],
      buttonText: "Bewerbung absenden",
    },
    {
      id: "page-6",
      type: "thankyou",
      title: "Bewerbung eingegangen!",
      elements: [
        { id: "el-10", type: "heading", content: "Vielen Dank für deine Bewerbung!" },
        { id: "el-11", type: "text", content: "Wir werden deine Angaben prüfen und uns innerhalb von 48 Stunden bei dir melden." },
      ],
      showConfetti: true,
      backgroundColor: "#059669",
    },
  ],
};

// ============ QUIZ TEMPLATES ============

const quizTemplate: FunnelTemplate = {
  id: "quiz",
  name: "Quiz Funnel",
  description: "Interaktives Quiz mit personalisierten Ergebnissen",
  category: "quiz",
  thumbnail: "/templates/quiz.png",
  theme: {
    primaryColor: "#F59E0B",
    backgroundColor: "#ffffff",
    textColor: "#1a1a1a",
    fontFamily: "Montserrat",
  },
  pages: [
    {
      id: "page-1",
      type: "welcome",
      title: "Finde heraus, welcher Typ du bist!",
      elements: [
        { id: "el-1", type: "heading", content: "Das große Persönlichkeits-Quiz" },
        { id: "el-2", type: "text", content: "Beantworte 5 kurze Fragen und erfahre mehr über dich selbst. Dauert nur 2 Minuten!" },
        { id: "el-3", type: "timer", timerEndDate: new Date(Date.now() + 5 * 60 * 1000).toISOString(), timerStyle: "countdown", timerShowDays: false },
      ],
      buttonText: "Quiz starten",
      backgroundColor: "#F59E0B",
    },
    {
      id: "page-2",
      type: "question",
      title: "Frage 1 von 5",
      subtitle: "Wie verbringst du am liebsten dein Wochenende?",
      elements: [
        { id: "el-4", type: "radio", options: ["Mit Freunden unterwegs", "Zu Hause entspannen", "Sport und Aktivitäten", "Neue Dinge lernen"] },
      ],
      buttonText: "Weiter",
    },
    {
      id: "page-3",
      type: "question",
      title: "Frage 2 von 5",
      subtitle: "Was motiviert dich am meisten?",
      elements: [
        { id: "el-5", type: "radio", options: ["Anerkennung", "Geld", "Persönliches Wachstum", "Anderen helfen"] },
      ],
      buttonText: "Weiter",
    },
    {
      id: "page-4",
      type: "question",
      title: "Frage 3 von 5",
      subtitle: "Wie gehst du mit Stress um?",
      elements: [
        { id: "el-6", type: "radio", options: ["Ich rede darüber", "Ich mache Sport", "Ich ziehe mich zurück", "Ich arbeite härter"] },
      ],
      buttonText: "Weiter",
    },
    {
      id: "page-5",
      type: "question",
      title: "Frage 4 von 5",
      subtitle: "Was ist dir bei der Arbeit am wichtigsten?",
      elements: [
        { id: "el-7", type: "radio", options: ["Teamarbeit", "Unabhängigkeit", "Kreativität", "Struktur"] },
      ],
      buttonText: "Weiter",
    },
    {
      id: "page-6",
      type: "question",
      title: "Frage 5 von 5",
      subtitle: "Wie triffst du Entscheidungen?",
      elements: [
        { id: "el-8", type: "radio", options: ["Mit dem Kopf", "Mit dem Bauch", "Ich frage andere", "Ich warte ab"] },
      ],
      buttonText: "Ergebnis anzeigen",
    },
    {
      id: "page-7",
      type: "contact",
      title: "Dein Ergebnis ist bereit!",
      subtitle: "Wohin dürfen wir es senden?",
      elements: [
        { id: "el-9", type: "input", placeholder: "Dein Vorname", required: true },
        { id: "el-10", type: "input", placeholder: "Deine E-Mail", required: true },
      ],
      buttonText: "Ergebnis erhalten",
    },
    {
      id: "page-8",
      type: "thankyou",
      title: "Du bist ein Macher!",
      elements: [
        { id: "el-11", type: "heading", content: "Dein Ergebnis: Der Macher" },
        { id: "el-12", type: "text", content: "Du bist zielstrebig, entschlossen und lässt dich nicht so leicht aufhalten. Deine Stärke liegt darin, Dinge in die Tat umzusetzen." },
        { id: "el-13", type: "text", content: "Wir haben dir eine ausführliche Analyse per E-Mail gesendet!" },
      ],
      showConfetti: true,
      backgroundColor: "#F59E0B",
    },
  ],
};

// ============ WEBINAR TEMPLATES ============

const webinarTemplate: FunnelTemplate = {
  id: "webinar",
  name: "Webinar Anmeldung",
  description: "Sammle Anmeldungen für dein Live-Webinar",
  category: "webinar",
  thumbnail: "/templates/webinar.png",
  theme: {
    primaryColor: "#DC2626",
    backgroundColor: "#ffffff",
    textColor: "#1a1a1a",
    fontFamily: "Inter",
  },
  pages: [
    {
      id: "page-1",
      type: "welcome",
      title: "Kostenloses Live-Webinar",
      elements: [
        { id: "el-1", type: "heading", content: "Die 3 größten Fehler im Online-Marketing" },
        { id: "el-2", type: "text", content: "Und wie du sie vermeidest, um endlich die Ergebnisse zu erzielen, die du verdienst." },
        { id: "el-3", type: "timer", timerEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), timerStyle: "countdown", timerShowDays: true },
        { id: "el-4", type: "list", listStyle: "check", listItems: [
          { id: "li-1", text: "Live am Donnerstag, 19:00 Uhr" },
          { id: "li-2", text: "Kostenlos & unverbindlich" },
          { id: "li-3", text: "Aufzeichnung für alle Teilnehmer" },
        ]},
      ],
      buttonText: "Jetzt Platz sichern",
      backgroundColor: "#DC2626",
    },
    {
      id: "page-2",
      type: "contact",
      title: "Sichere dir deinen Platz",
      elements: [
        { id: "el-5", type: "input", placeholder: "Dein Vorname", required: true },
        { id: "el-6", type: "input", placeholder: "Deine E-Mail-Adresse", required: true },
      ],
      buttonText: "Kostenlos anmelden",
    },
    {
      id: "page-3",
      type: "thankyou",
      title: "Du bist angemeldet!",
      elements: [
        { id: "el-7", type: "heading", content: "Perfekt, du bist dabei!" },
        { id: "el-8", type: "text", content: "Wir haben dir eine Bestätigung mit allen Details per E-Mail gesendet. Trage dir den Termin gleich in deinen Kalender ein!" },
      ],
      showConfetti: true,
      backgroundColor: "#DC2626",
    },
  ],
};

// ============ SALES TEMPLATES ============

const salesTemplate: FunnelTemplate = {
  id: "sales",
  name: "Produkt Verkauf",
  description: "Verkaufe dein Produkt oder deine Dienstleistung direkt",
  category: "sales",
  thumbnail: "/templates/sales.png",
  theme: {
    primaryColor: "#8B5CF6",
    backgroundColor: "#ffffff",
    textColor: "#1a1a1a",
    fontFamily: "Poppins",
  },
  pages: [
    {
      id: "page-1",
      type: "welcome",
      title: "Das ultimative Toolkit",
      elements: [
        { id: "el-1", type: "heading", content: "Verdopple deine Produktivität" },
        { id: "el-2", type: "text", content: "Mit unserem bewährten System, das bereits über 10.000 Unternehmer nutzen." },
        { id: "el-3", type: "testimonial", slides: [
          { id: "t-1", text: "Seit ich das Toolkit nutze, spare ich jeden Tag 2 Stunden!", author: "Lisa M.", role: "Freelancerin", rating: 5 },
          { id: "t-2", text: "Beste Investition, die ich je gemacht habe.", author: "Thomas K.", role: "Agenturinhaber", rating: 5 },
        ]},
        { id: "el-4", type: "socialProof", socialProofType: "stats", socialProofItems: [
          { id: "sp-1", text: "Nutzer", value: "10.000+" },
          { id: "sp-2", text: "Bewertung", value: "4.9/5" },
          { id: "sp-3", text: "Ersparnis", value: "2h/Tag" },
        ]},
      ],
      buttonText: "Jetzt entdecken",
      backgroundColor: "#8B5CF6",
    },
    {
      id: "page-2",
      type: "question",
      title: "Was trifft auf dich zu?",
      elements: [
        { id: "el-5", type: "radio", options: ["Ich bin Selbstständig", "Ich bin Angestellter", "Ich bin Student", "Sonstiges"] },
      ],
      buttonText: "Weiter",
    },
    {
      id: "page-3",
      type: "contact",
      title: "Sichere dir 20% Rabatt",
      subtitle: "Nur für kurze Zeit verfügbar",
      elements: [
        { id: "el-6", type: "timer", timerEndDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), timerStyle: "countdown", timerShowDays: false },
        { id: "el-7", type: "input", placeholder: "Dein Name", required: true },
        { id: "el-8", type: "input", placeholder: "Deine E-Mail", required: true },
      ],
      buttonText: "Rabatt sichern",
    },
    {
      id: "page-4",
      type: "thankyou",
      title: "Dein Rabattcode ist unterwegs!",
      elements: [
        { id: "el-9", type: "heading", content: "Check deine E-Mails!" },
        { id: "el-10", type: "text", content: "Wir haben dir deinen persönlichen 20% Rabattcode gesendet. Der Code ist 48 Stunden gültig." },
      ],
      showConfetti: true,
      backgroundColor: "#8B5CF6",
    },
  ],
};

// ============ SURVEY TEMPLATES ============

const surveyTemplate: FunnelTemplate = {
  id: "survey",
  name: "Umfrage",
  description: "Erhalte wertvolle Einblicke von deiner Zielgruppe",
  category: "survey",
  thumbnail: "/templates/survey.png",
  theme: {
    primaryColor: "#0EA5E9",
    backgroundColor: "#ffffff",
    textColor: "#1a1a1a",
    fontFamily: "Inter",
  },
  pages: [
    {
      id: "page-1",
      type: "welcome",
      title: "Deine Meinung zählt!",
      elements: [
        { id: "el-1", type: "heading", content: "Hilf uns, besser zu werden" },
        { id: "el-2", type: "text", content: "Diese kurze Umfrage dauert nur 2 Minuten und hilft uns, unsere Produkte für dich zu verbessern." },
      ],
      buttonText: "Umfrage starten",
      backgroundColor: "#0EA5E9",
    },
    {
      id: "page-2",
      type: "question",
      title: "Wie zufrieden bist du mit unserem Service?",
      elements: [
        { id: "el-3", type: "radio", options: ["Sehr zufrieden", "Zufrieden", "Neutral", "Unzufrieden", "Sehr unzufrieden"] },
      ],
      buttonText: "Weiter",
    },
    {
      id: "page-3",
      type: "question",
      title: "Was gefällt dir am besten?",
      elements: [
        { id: "el-4", type: "radio", options: ["Qualität", "Preis", "Kundenservice", "Benutzerfreundlichkeit", "Sonstiges"] },
      ],
      buttonText: "Weiter",
    },
    {
      id: "page-4",
      type: "question",
      title: "Was können wir verbessern?",
      elements: [
        { id: "el-5", type: "textarea", placeholder: "Dein Feedback hier...", required: false },
      ],
      buttonText: "Weiter",
    },
    {
      id: "page-5",
      type: "question",
      title: "Würdest du uns weiterempfehlen?",
      elements: [
        { id: "el-6", type: "radio", options: ["Ja, auf jeden Fall", "Wahrscheinlich", "Vielleicht", "Eher nicht", "Nein"] },
      ],
      buttonText: "Abschließen",
    },
    {
      id: "page-6",
      type: "thankyou",
      title: "Vielen Dank!",
      elements: [
        { id: "el-7", type: "heading", content: "Danke für dein Feedback!" },
        { id: "el-8", type: "text", content: "Deine Meinung hilft uns, jeden Tag ein bisschen besser zu werden." },
      ],
      showConfetti: true,
      backgroundColor: "#0EA5E9",
    },
  ],
};

// ============ EXPORT ============

export const funnelTemplates: FunnelTemplate[] = [
  leadMagnetTemplate,
  terminTemplate,
  recruitingTemplate,
  quizTemplate,
  webinarTemplate,
  salesTemplate,
  surveyTemplate,
];

export const templateCategories = [
  { id: "all", name: "Alle", count: funnelTemplates.length },
  { id: "leads", name: "Lead-Generierung", count: funnelTemplates.filter(t => t.category === "leads").length },
  { id: "recruiting", name: "Recruiting", count: funnelTemplates.filter(t => t.category === "recruiting").length },
  { id: "quiz", name: "Quiz", count: funnelTemplates.filter(t => t.category === "quiz").length },
  { id: "webinar", name: "Webinar", count: funnelTemplates.filter(t => t.category === "webinar").length },
  { id: "sales", name: "Verkauf", count: funnelTemplates.filter(t => t.category === "sales").length },
  { id: "survey", name: "Umfrage", count: funnelTemplates.filter(t => t.category === "survey").length },
];

export function getTemplatesByCategory(category: string): FunnelTemplate[] {
  if (category === "all") return funnelTemplates;
  return funnelTemplates.filter(t => t.category === category);
}

export function getTemplateById(id: string): FunnelTemplate | undefined {
  return funnelTemplates.find(t => t.id === id);
}
