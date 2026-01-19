import type { FunnelPage, Template } from "@shared/schema";

export const defaultTemplates: Template[] = [
  {
    id: "template-lead-gen",
    name: "Lead-Generierung",
    description: "Sammle qualifizierte Leads mit einem mehrstufigen Funnel",
    category: "leads",
    thumbnail: "/templates/lead-gen.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Bereit für mehr Kunden?",
        subtitle: "Entdecke, wie wir dein Business auf das nächste Level bringen",
        elements: [],
        buttonText: "Jetzt starten",
        backgroundColor: "#7C3AED",
      },
      {
        id: "page-2",
        type: "question",
        title: "Was ist deine größte Herausforderung?",
        elements: [],
        buttonText: "Weiter",
      },
      {
        id: "page-3",
        type: "contact",
        title: "Lass uns sprechen!",
        subtitle: "Trage deine Kontaktdaten ein",
        elements: [
          { id: "el-1", type: "input", placeholder: "Dein Name", required: true },
          { id: "el-2", type: "input", placeholder: "Deine E-Mail", required: true },
          { id: "el-3", type: "input", placeholder: "Deine Telefonnummer" },
        ],
        buttonText: "Absenden",
      },
      {
        id: "page-4",
        type: "thankyou",
        title: "Vielen Dank!",
        subtitle: "Wir melden uns innerhalb von 24 Stunden bei dir",
        elements: [],
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
    id: "template-webinar",
    name: "Webinar-Anmeldung",
    description: "Maximiere die Anmeldungen für dein Webinar",
    category: "webinar",
    thumbnail: "/templates/webinar.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Kostenloses Webinar",
        subtitle: "Lerne die Geheimnisse erfolgreicher Unternehmer",
        elements: [],
        buttonText: "Jetzt anmelden",
        backgroundColor: "#2563EB",
      },
      {
        id: "page-2",
        type: "contact",
        title: "Sichere dir deinen Platz",
        elements: [
          { id: "el-1", type: "input", placeholder: "Dein Name", required: true },
          { id: "el-2", type: "input", placeholder: "Deine E-Mail", required: true },
        ],
        buttonText: "Platz reservieren",
      },
      {
        id: "page-3",
        type: "thankyou",
        title: "Du bist dabei!",
        subtitle: "Check deine E-Mails für den Zugangslink",
        elements: [],
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
    id: "template-recruiting",
    name: "Schnell-Bewerbung",
    description: "Finde Top-Talente mit einem mobilen Bewerbungs-Funnel",
    category: "recruiting",
    thumbnail: "/templates/recruiting.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Werde Teil unseres Teams!",
        subtitle: "Bewirb dich in unter 2 Minuten",
        elements: [],
        buttonText: "Jetzt bewerben",
        backgroundColor: "#F59E0B",
      },
      {
        id: "page-2",
        type: "question",
        title: "Welche Position interessiert dich?",
        elements: [
          { id: "el-1", type: "radio", options: ["Vertrieb", "Marketing", "Entwicklung", "Kundenservice"] },
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-3",
        type: "question",
        title: "Wie viel Erfahrung bringst du mit?",
        elements: [
          { id: "el-1", type: "radio", options: ["0-1 Jahre", "2-5 Jahre", "5+ Jahre"] },
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-4",
        type: "contact",
        title: "Deine Kontaktdaten",
        elements: [
          { id: "el-1", type: "input", placeholder: "Dein Name", required: true },
          { id: "el-2", type: "input", placeholder: "Deine E-Mail", required: true },
          { id: "el-3", type: "input", placeholder: "Deine Telefonnummer", required: true },
          { id: "el-4", type: "textarea", placeholder: "Erzähl uns kurz von dir..." },
        ],
        buttonText: "Bewerbung absenden",
      },
      {
        id: "page-5",
        type: "thankyou",
        title: "Bewerbung erhalten!",
        subtitle: "Wir melden uns in den nächsten Tagen bei dir",
        elements: [],
      },
    ],
    theme: {
      primaryColor: "#F59E0B",
      backgroundColor: "#ffffff",
      textColor: "#1a1a1a",
      fontFamily: "Inter",
    },
  },
  {
    id: "template-sales",
    name: "Produkt-Verkauf",
    description: "Verkaufe deine Produkte oder Dienstleistungen direkt",
    category: "sales",
    thumbnail: "/templates/sales.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Exklusives Angebot",
        subtitle: "Nur für kurze Zeit verfügbar",
        elements: [],
        buttonText: "Angebot ansehen",
        backgroundColor: "#DC2626",
      },
      {
        id: "page-2",
        type: "question",
        title: "Welches Paket passt zu dir?",
        elements: [
          { id: "el-1", type: "radio", options: ["Starter - 49€", "Professional - 99€", "Enterprise - 199€"] },
        ],
        buttonText: "Auswählen",
      },
      {
        id: "page-3",
        type: "contact",
        title: "Deine Bestelldaten",
        elements: [
          { id: "el-1", type: "input", placeholder: "Dein Name", required: true },
          { id: "el-2", type: "input", placeholder: "Deine E-Mail", required: true },
        ],
        buttonText: "Jetzt bestellen",
      },
      {
        id: "page-4",
        type: "thankyou",
        title: "Bestellung erfolgreich!",
        subtitle: "Du erhältst gleich eine Bestätigung per E-Mail",
        elements: [],
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

export function getTemplateById(id: string): Template | undefined {
  return defaultTemplates.find(t => t.id === id);
}

export function getTemplatesByCategory(category: Template["category"]): Template[] {
  return defaultTemplates.filter(t => t.category === category);
}

export function createBlankFunnel(): { pages: FunnelPage[], theme: Template["theme"] } {
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
