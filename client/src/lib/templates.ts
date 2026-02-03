import type { FunnelPage, Theme } from "@shared/schema";

// Client-side template type (uses string IDs since these are local, not from DB)
export interface ClientTemplate {
  id: string;
  name: string;
  description: string;
  category: "leads" | "sales" | "recruiting" | "webinar" | "quiz";
  thumbnail: string;
  pages: FunnelPage[];
  theme: Theme;
}

export const defaultTemplates: ClientTemplate[] = [
  // ============ TERMINE GENERIEREN ============
  {
    id: "template-termin",
    name: "Termin buchen",
    description: "Präsentiere dein Angebot, filtere qualifizierte Anfragen und ermögliche direkte Terminbuchungen",
    category: "leads",
    thumbnail: "/templates/termin.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Bereit für dein kostenloses Strategiegespräch?",
        subtitle: "In 30 Minuten zeigen wir dir, wie du deine Ziele erreichst",
        elements: [
          { id: "el-1", type: "list", listStyle: "check", listItems: [
            { id: "li-1", text: "Individuelle Analyse deiner Situation" },
            { id: "li-2", text: "Konkrete Handlungsempfehlungen" },
            { id: "li-3", text: "100% kostenlos und unverbindlich" },
          ]},
        ],
        buttonText: "Termin sichern",
        backgroundColor: "#7C3AED",
      },
      {
        id: "page-2",
        type: "question",
        title: "Was beschreibt deine Situation am besten?",
        elements: [
          { id: "el-1", type: "radio", options: [
            "Ich starte gerade erst",
            "Ich möchte wachsen",
            "Ich möchte skalieren",
            "Ich suche neue Strategien"
          ]},
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-3",
        type: "question",
        title: "Was ist dein monatliches Budget?",
        elements: [
          { id: "el-1", type: "radio", options: [
            "Unter 1.000€",
            "1.000€ - 5.000€",
            "5.000€ - 10.000€",
            "Über 10.000€"
          ]},
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-4",
        type: "calendar",
        title: "Wähle deinen Wunschtermin",
        subtitle: "Alle Zeiten in deiner lokalen Zeitzone",
        elements: [],
        buttonText: "Termin bestätigen",
      },
      {
        id: "page-5",
        type: "contact",
        title: "Fast geschafft!",
        subtitle: "Trage deine Kontaktdaten ein",
        elements: [
          { id: "el-1", type: "input", placeholder: "Dein Vorname", required: true },
          { id: "el-2", type: "input", placeholder: "Dein Nachname", required: true },
          { id: "el-3", type: "input", placeholder: "Deine E-Mail", required: true },
          { id: "el-4", type: "input", placeholder: "Deine Telefonnummer", required: true },
          { id: "el-5", type: "input", placeholder: "Dein Unternehmen" },
        ],
        buttonText: "Termin buchen",
      },
      {
        id: "page-6",
        type: "thankyou",
        title: "Dein Termin ist gebucht!",
        subtitle: "Du erhältst in Kürze eine Bestätigung per E-Mail mit allen Details",
        elements: [
          { id: "el-1", type: "text", content: "Wir freuen uns auf das Gespräch mit dir!" },
        ],
        showConfetti: true,
      },
    ],
    theme: {
      primaryColor: "#7C3AED",
      backgroundColor: "#ffffff",
      textColor: "#1a1a1a",
      fontFamily: "Inter",
    },
  },
  {
    id: "template-vsl-demo",
    name: "VSL Demo",
    description: "Nutze überzeugende Videos um Conversions zu steigern",
    category: "sales",
    thumbnail: "/templates/vsl.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Entdecke das Geheimnis erfolgreicher Unternehmer",
        subtitle: "Schau dir jetzt das kurze Video an",
        elements: [
          { id: "el-1", type: "video", videoUrl: "", videoType: "youtube" },
        ],
        buttonText: "Video ansehen",
        backgroundColor: "#1F2937",
      },
      {
        id: "page-2",
        type: "question",
        title: "Wie hat dir das Video gefallen?",
        elements: [
          { id: "el-1", type: "radio", options: [
            "Sehr interessant, ich will mehr erfahren",
            "Gut, aber ich habe noch Fragen",
            "Ich brauche mehr Informationen"
          ]},
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-3",
        type: "question",
        title: "Wo stehst du gerade?",
        elements: [
          { id: "el-1", type: "radio", options: [
            "Ich bin Anfänger",
            "Ich habe erste Erfahrungen",
            "Ich bin fortgeschritten",
            "Ich bin Experte"
          ]},
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-4",
        type: "contact",
        title: "Sichere dir jetzt den Zugang",
        subtitle: "Erhalte sofortigen Zugriff auf alle Inhalte",
        elements: [
          { id: "el-1", type: "input", placeholder: "Dein Vorname", required: true },
          { id: "el-2", type: "input", placeholder: "Deine E-Mail", required: true },
        ],
        buttonText: "Jetzt freischalten",
      },
      {
        id: "page-5",
        type: "thankyou",
        title: "Willkommen an Bord!",
        subtitle: "Check deine E-Mails für den Zugangslink",
        elements: [],
        showConfetti: true,
      },
    ],
    theme: {
      primaryColor: "#EF4444",
      backgroundColor: "#1F2937",
      textColor: "#ffffff",
      fontFamily: "Inter",
    },
  },
  {
    id: "template-recruiting",
    name: "Recruiting Experience",
    description: "Präsentiere deine Unternehmenskultur und vereinfache den Bewerbungsprozess",
    category: "recruiting",
    thumbnail: "/templates/recruiting.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Erlebe Arbeit in einem völlig neuen Gefühl",
        subtitle: "Werde Teil eines Teams, das Großes bewegt",
        elements: [
          { id: "el-1", type: "list", listStyle: "check", listItems: [
            { id: "li-1", text: "Flexible Arbeitszeiten" },
            { id: "li-2", text: "Remote Work möglich" },
            { id: "li-3", text: "Attraktives Gehalt + Benefits" },
            { id: "li-4", text: "Persönliche Weiterentwicklung" },
          ]},
        ],
        buttonText: "Jetzt bewerben",
        backgroundColor: "#059669",
      },
      {
        id: "page-2",
        type: "question",
        title: "In welchem Bereich möchtest du arbeiten?",
        elements: [
          { id: "el-1", type: "radio", options: [
            "Marketing & Vertrieb",
            "Entwicklung & IT",
            "Design & Kreativ",
            "Operations & Support",
            "Management & Führung"
          ]},
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-3",
        type: "question",
        title: "Wie viel Berufserfahrung hast du?",
        elements: [
          { id: "el-1", type: "radio", options: [
            "Berufseinsteiger / Student",
            "1-3 Jahre",
            "3-5 Jahre",
            "5-10 Jahre",
            "Mehr als 10 Jahre"
          ]},
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-4",
        type: "question",
        title: "Was ist dir bei einem Arbeitgeber am wichtigsten?",
        elements: [
          { id: "el-1", type: "radio", options: [
            "Work-Life-Balance",
            "Karrieremöglichkeiten",
            "Gehalt & Benefits",
            "Teamkultur",
            "Sinnvolle Aufgaben"
          ]},
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-5",
        type: "contact",
        title: "Erzähl uns von dir",
        subtitle: "Wir melden uns innerhalb von 48 Stunden",
        elements: [
          { id: "el-1", type: "input", placeholder: "Dein Vorname", required: true },
          { id: "el-2", type: "input", placeholder: "Dein Nachname", required: true },
          { id: "el-3", type: "input", placeholder: "Deine E-Mail", required: true },
          { id: "el-4", type: "input", placeholder: "Deine Telefonnummer", required: true },
          { id: "el-5", type: "input", placeholder: "Link zu LinkedIn/Xing (optional)" },
          { id: "el-6", type: "textarea", placeholder: "Warum möchtest du bei uns arbeiten?" },
        ],
        buttonText: "Bewerbung absenden",
      },
      {
        id: "page-6",
        type: "thankyou",
        title: "Danke für deine Bewerbung!",
        subtitle: "Wir haben deine Unterlagen erhalten und melden uns in Kürze bei dir",
        elements: [
          { id: "el-1", type: "text", content: "In der Zwischenzeit kannst du uns auf LinkedIn folgen." },
        ],
        showConfetti: true,
      },
    ],
    theme: {
      primaryColor: "#059669",
      backgroundColor: "#ffffff",
      textColor: "#1a1a1a",
      fontFamily: "Inter",
    },
  },
  {
    id: "template-leadmagnet",
    name: "Lead Magnet",
    description: "Präsentiere deinen Lead Magnet und konvertiere Besucher zu qualifizierten Leads",
    category: "leads",
    thumbnail: "/templates/leadmagnet.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Erhalte kostenlosen Zugang zu unserem exklusiven Agentur-Bundle!",
        subtitle: "Bewährte Vorlagen, Checklisten und Strategien für dein Wachstum",
        elements: [
          { id: "el-1", type: "list", listStyle: "check", listItems: [
            { id: "li-1", text: "10+ bewährte Vorlagen" },
            { id: "li-2", text: "Schritt-für-Schritt Anleitungen" },
            { id: "li-3", text: "Bonus: Exklusive Video-Tutorials" },
          ]},
        ],
        buttonText: "Jetzt kostenlos herunterladen",
        backgroundColor: "#2563EB",
      },
      {
        id: "page-2",
        type: "question",
        title: "Was trifft auf dich zu?",
        elements: [
          { id: "el-1", type: "radio", options: [
            "Ich bin Freelancer",
            "Ich habe eine kleine Agentur (1-5 MA)",
            "Ich habe eine mittlere Agentur (6-20 MA)",
            "Ich habe eine große Agentur (20+ MA)"
          ]},
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-3",
        type: "question",
        title: "Was ist deine größte Herausforderung?",
        elements: [
          { id: "el-1", type: "radio", options: [
            "Kundengewinnung",
            "Projektmanagement",
            "Team-Aufbau",
            "Skalierung",
            "Preisgestaltung"
          ]},
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-4",
        type: "contact",
        title: "Wohin dürfen wir das Bundle senden?",
        elements: [
          { id: "el-1", type: "input", placeholder: "Dein Vorname", required: true },
          { id: "el-2", type: "input", placeholder: "Deine E-Mail", required: true },
        ],
        buttonText: "Jetzt herunterladen",
      },
      {
        id: "page-5",
        type: "thankyou",
        title: "Check deine E-Mails!",
        subtitle: "Das Bundle ist auf dem Weg zu dir. Schau auch im Spam-Ordner nach.",
        elements: [],
        showConfetti: true,
      },
    ],
    theme: {
      primaryColor: "#2563EB",
      backgroundColor: "#ffffff",
      textColor: "#1a1a1a",
      fontFamily: "Inter",
    },
  },
  {
    id: "template-masterclass",
    name: "Live Masterclass",
    description: "Sammle Anmeldungen für dein Webinar oder deine Masterclass",
    category: "webinar",
    thumbnail: "/templates/masterclass.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Kostenlose Live Masterclass",
        subtitle: "Lerne in 60 Minuten, wie du dein Business auf das nächste Level bringst",
        elements: [
          { id: "el-1", type: "timer", timerStyle: "countdown", timerShowDays: true },
          { id: "el-2", type: "list", listStyle: "check", listItems: [
            { id: "li-1", text: "Live Q&A Session" },
            { id: "li-2", text: "Exklusive Strategien" },
            { id: "li-3", text: "Bonus-Material für alle Teilnehmer" },
          ]},
        ],
        buttonText: "Jetzt Platz sichern",
        backgroundColor: "#7C3AED",
      },
      {
        id: "page-2",
        type: "question",
        title: "Wie weit bist du mit deinem Business?",
        elements: [
          { id: "el-1", type: "radio", options: [
            "Ich starte gerade erst",
            "Ich mache erste Umsätze",
            "Ich bin etabliert und will wachsen",
            "Ich will skalieren"
          ]},
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-3",
        type: "contact",
        title: "Sichere dir deinen Platz",
        subtitle: "Die Plätze sind begrenzt",
        elements: [
          { id: "el-1", type: "input", placeholder: "Dein Vorname", required: true },
          { id: "el-2", type: "input", placeholder: "Deine E-Mail", required: true },
          { id: "el-3", type: "input", placeholder: "Deine Telefonnummer (für SMS-Reminder)" },
        ],
        buttonText: "Platz reservieren",
      },
      {
        id: "page-4",
        type: "thankyou",
        title: "Du bist dabei!",
        subtitle: "Check deine E-Mails für den Zugangslink und trage dir den Termin im Kalender ein",
        elements: [
          { id: "el-1", type: "text", content: "Wir sehen uns bei der Masterclass!" },
        ],
        showConfetti: true,
      },
    ],
    theme: {
      primaryColor: "#7C3AED",
      backgroundColor: "#ffffff",
      textColor: "#1a1a1a",
      fontFamily: "Inter",
    },
  },
  {
    id: "template-immobilien",
    name: "Immobilien Bewertung",
    description: "Generiere qualifizierte Immobilien-Leads mit einer kostenlosen Bewertung",
    category: "leads",
    thumbnail: "/templates/immobilien.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Was ist Ihre Immobilie wert?",
        subtitle: "Kostenlose Bewertung in nur 2 Minuten",
        elements: [
          { id: "el-1", type: "list", listStyle: "check", listItems: [
            { id: "li-1", text: "Professionelle Marktanalyse" },
            { id: "li-2", text: "Aktuelle Vergleichspreise" },
            { id: "li-3", text: "100% kostenlos & unverbindlich" },
          ]},
        ],
        buttonText: "Bewertung starten",
        backgroundColor: "#0D9488",
      },
      {
        id: "page-2",
        type: "question",
        title: "Um welche Art von Immobilie handelt es sich?",
        elements: [
          { id: "el-1", type: "radio", options: [
            "Wohnung",
            "Einfamilienhaus",
            "Mehrfamilienhaus",
            "Grundstück",
            "Gewerbeimmobilie"
          ]},
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-3",
        type: "question",
        title: "Wie groß ist die Wohnfläche?",
        elements: [
          { id: "el-1", type: "radio", options: [
            "Unter 50 m²",
            "50 - 100 m²",
            "100 - 150 m²",
            "150 - 200 m²",
            "Über 200 m²"
          ]},
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-4",
        type: "question",
        title: "Wann wurde die Immobilie gebaut?",
        elements: [
          { id: "el-1", type: "radio", options: [
            "Vor 1950",
            "1950 - 1980",
            "1980 - 2000",
            "2000 - 2015",
            "Nach 2015"
          ]},
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-5",
        type: "question",
        title: "Planen Sie einen Verkauf?",
        elements: [
          { id: "el-1", type: "radio", options: [
            "Ja, so schnell wie möglich",
            "Ja, in den nächsten 6 Monaten",
            "Ja, in den nächsten 12 Monaten",
            "Nur zur Orientierung"
          ]},
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-6",
        type: "contact",
        title: "Wohin dürfen wir Ihre Bewertung senden?",
        elements: [
          { id: "el-1", type: "input", placeholder: "Ihr Vorname", required: true },
          { id: "el-2", type: "input", placeholder: "Ihr Nachname", required: true },
          { id: "el-3", type: "input", placeholder: "Ihre E-Mail", required: true },
          { id: "el-4", type: "input", placeholder: "Ihre Telefonnummer", required: true },
          { id: "el-5", type: "input", placeholder: "PLZ der Immobilie", required: true },
        ],
        buttonText: "Bewertung anfordern",
      },
      {
        id: "page-7",
        type: "thankyou",
        title: "Vielen Dank!",
        subtitle: "Ihre Bewertung wird innerhalb von 24 Stunden erstellt und Ihnen per E-Mail zugesendet",
        elements: [],
        showConfetti: true,
      },
    ],
    theme: {
      primaryColor: "#0D9488",
      backgroundColor: "#ffffff",
      textColor: "#1a1a1a",
      fontFamily: "Inter",
    },
  },
  {
    id: "template-onboarding",
    name: "Agentur Onboarding",
    description: "Beschleunige den Start mit neuen Kunden und Projekten",
    category: "leads",
    thumbnail: "/templates/onboarding.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Willkommen zu deinem Agentur Onboarding!",
        subtitle: "Beantworte ein paar kurze Fragen, damit wir optimal für dich vorbereitet sind",
        elements: [],
        buttonText: "Los geht's",
        backgroundColor: "#8B5CF6",
      },
      {
        id: "page-2",
        type: "question",
        title: "In welcher Branche bist du tätig?",
        elements: [
          { id: "el-1", type: "radio", options: [
            "E-Commerce / Online-Shop",
            "Dienstleistung / Beratung",
            "SaaS / Software",
            "Lokales Geschäft",
            "Sonstiges"
          ]},
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-3",
        type: "question",
        title: "Was sind deine Hauptziele?",
        elements: [
          { id: "el-1", type: "radio", options: [
            "Mehr Leads generieren",
            "Mehr Umsatz erzielen",
            "Markenbekanntheit steigern",
            "Neue Mitarbeiter gewinnen",
            "Prozesse optimieren"
          ]},
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-4",
        type: "question",
        title: "Welches Budget steht monatlich zur Verfügung?",
        elements: [
          { id: "el-1", type: "radio", options: [
            "Unter 1.000€",
            "1.000€ - 3.000€",
            "3.000€ - 5.000€",
            "5.000€ - 10.000€",
            "Über 10.000€"
          ]},
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-5",
        type: "contact",
        title: "Deine Projektdetails",
        subtitle: "Je mehr wir wissen, desto besser können wir dich unterstützen",
        elements: [
          { id: "el-1", type: "input", placeholder: "Dein Unternehmen", required: true },
          { id: "el-2", type: "input", placeholder: "Deine Website (falls vorhanden)" },
          { id: "el-3", type: "input", placeholder: "Dein Name", required: true },
          { id: "el-4", type: "input", placeholder: "Deine E-Mail", required: true },
          { id: "el-5", type: "textarea", placeholder: "Gibt es etwas, das wir noch wissen sollten?" },
        ],
        buttonText: "Onboarding abschließen",
      },
      {
        id: "page-6",
        type: "thankyou",
        title: "Perfekt!",
        subtitle: "Wir haben alle Informationen erhalten und melden uns in Kürze mit den nächsten Schritten",
        elements: [],
        showConfetti: true,
      },
    ],
    theme: {
      primaryColor: "#8B5CF6",
      backgroundColor: "#ffffff",
      textColor: "#1a1a1a",
      fontFamily: "Inter",
    },
  },
  // ============ WEITERE VORLAGEN ============
  {
    id: "template-quiz",
    name: "Interaktives Quiz",
    description: "Qualifiziere Leads mit einem unterhaltsamen Quiz",
    category: "quiz",
    thumbnail: "/templates/quiz.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Finde heraus, welcher Typ du bist!",
        subtitle: "Beantworte 3 kurze Fragen",
        elements: [],
        buttonText: "Quiz starten",
        backgroundColor: "#10B981",
      },
      {
        id: "page-2",
        type: "multiChoice",
        title: "Was beschreibt dich am besten?",
        elements: [
          { id: "el-1", type: "radio", options: ["Kreativ", "Analytisch", "Teamplayer", "Führungspersönlichkeit"] },
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-3",
        type: "multiChoice",
        title: "Wie triffst du Entscheidungen?",
        elements: [
          { id: "el-1", type: "radio", options: ["Mit dem Bauch", "Datenbasiert", "Im Team", "Spontan"] },
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-4",
        type: "contact",
        title: "Fast geschafft!",
        subtitle: "Wohin sollen wir dein Ergebnis senden?",
        elements: [
          { id: "el-1", type: "input", placeholder: "Deine E-Mail", required: true },
        ],
        buttonText: "Ergebnis anzeigen",
      },
      {
        id: "page-5",
        type: "thankyou",
        title: "Du bist ein Innovator!",
        subtitle: "Check deine E-Mail für mehr Details",
        elements: [],
        showConfetti: true,
      },
    ],
    theme: {
      primaryColor: "#10B981",
      backgroundColor: "#ffffff",
      textColor: "#1a1a1a",
      fontFamily: "Inter",
    },
  },
  {
    id: "template-sales",
    name: "Coaching Angebot",
    description: "Präsentiere dein Coaching klar und konvertiere zu Kunden",
    category: "sales",
    thumbnail: "/templates/sales.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Erreiche deine Ziele mit persönlichem Coaching",
        subtitle: "1:1 Begleitung für deinen Erfolg",
        elements: [
          { id: "el-1", type: "list", listStyle: "check", listItems: [
            { id: "li-1", text: "Individuelle Strategien" },
            { id: "li-2", text: "Persönliche Betreuung" },
            { id: "li-3", text: "Nachweisbare Ergebnisse" },
          ]},
        ],
        buttonText: "Mehr erfahren",
        backgroundColor: "#DC2626",
      },
      {
        id: "page-2",
        type: "question",
        title: "Was möchtest du erreichen?",
        elements: [
          { id: "el-1", type: "radio", options: [
            "Mehr Umsatz & Kunden",
            "Bessere Work-Life-Balance",
            "Team aufbauen & führen",
            "Persönliche Entwicklung"
          ]},
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-3",
        type: "question",
        title: "Welches Paket passt zu dir?",
        elements: [
          { id: "el-1", type: "radio", options: [
            "Starter - 497€/Monat",
            "Professional - 997€/Monat",
            "VIP - 1.997€/Monat"
          ]},
        ],
        buttonText: "Auswählen",
      },
      {
        id: "page-4",
        type: "contact",
        title: "Lass uns starten",
        subtitle: "Buche jetzt dein kostenloses Erstgespräch",
        elements: [
          { id: "el-1", type: "input", placeholder: "Dein Name", required: true },
          { id: "el-2", type: "input", placeholder: "Deine E-Mail", required: true },
          { id: "el-3", type: "input", placeholder: "Deine Telefonnummer", required: true },
        ],
        buttonText: "Erstgespräch buchen",
      },
      {
        id: "page-5",
        type: "thankyou",
        title: "Ausgezeichnet!",
        subtitle: "Wir melden uns innerhalb von 24 Stunden bei dir",
        elements: [],
        showConfetti: true,
      },
    ],
    theme: {
      primaryColor: "#DC2626",
      backgroundColor: "#ffffff",
      textColor: "#1a1a1a",
      fontFamily: "Inter",
    },
  },
];

export function getTemplateById(id: string): ClientTemplate | undefined {
  return defaultTemplates.find(t => t.id === id);
}

export function getTemplatesByCategory(category: ClientTemplate["category"]): ClientTemplate[] {
  return defaultTemplates.filter(t => t.category === category);
}

export function createBlankFunnel(): { pages: FunnelPage[], theme: ClientTemplate["theme"] } {
  return {
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Willkommen",
        subtitle: "Füge hier deinen Untertitel ein",
        elements: [],
        buttonText: "Weiter",
        backgroundColor: "#7C3AED",
      },
    ],
    theme: {
      primaryColor: "#7C3AED",
      backgroundColor: "#ffffff",
      textColor: "#1a1a1a",
      fontFamily: "Inter",
    },
  };
}
