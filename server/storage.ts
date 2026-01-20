import { type User, type InsertUser, type Funnel, type InsertFunnel, type Lead, type InsertLead, type AnalyticsEvent, type Template, type FunnelPage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Funnels
  getFunnels(): Promise<Funnel[]>;
  getFunnel(id: string): Promise<Funnel | undefined>;
  createFunnel(funnel: InsertFunnel): Promise<Funnel>;
  updateFunnel(id: string, funnel: Partial<Funnel>): Promise<Funnel | undefined>;
  deleteFunnel(id: string): Promise<boolean>;
  
  // Leads
  getLeads(): Promise<Lead[]>;
  getLeadsByFunnel(funnelId: string): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, lead: Partial<Lead>): Promise<Lead | undefined>;
  deleteLead(id: string): Promise<boolean>;
  
  // Analytics
  getAnalytics(funnelId: string): Promise<AnalyticsEvent[]>;
  createAnalyticsEvent(event: Omit<AnalyticsEvent, "id">): Promise<AnalyticsEvent>;
  
  // Templates
  getTemplates(): Promise<Template[]>;
  getTemplate(id: string): Promise<Template | undefined>;
}

// Default templates
const defaultTemplates: Template[] = [
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
    name: "Produkt-Launch",
    description: "Verkaufe dein Produkt mit einem überzeugenden Funnel",
    category: "sales",
    thumbnail: "/templates/sales.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Exklusiver Zugang",
        subtitle: "Sichere dir unser neues Produkt zum Einführungspreis",
        elements: [],
        buttonText: "Mehr erfahren",
        backgroundColor: "#DC2626",
      },
      {
        id: "page-2",
        type: "multiChoice",
        title: "Was interessiert dich am meisten?",
        elements: [
          { id: "el-1", type: "radio", options: ["Zeitersparnis", "Kostensenkung", "Qualitätssteigerung", "Automatisierung"] },
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-3",
        type: "contact",
        title: "Sichere dir deinen Platz",
        elements: [
          { id: "el-1", type: "input", placeholder: "Dein Name", required: true },
          { id: "el-2", type: "input", placeholder: "Deine E-Mail", required: true },
        ],
        buttonText: "Zugang sichern",
      },
      {
        id: "page-4",
        type: "thankyou",
        title: "Perfekt!",
        subtitle: "Prüfe deine E-Mails für exklusive Infos",
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
  {
    id: "template-consultation",
    name: "Beratungstermin",
    description: "Vereinbare Beratungstermine mit qualifizierten Interessenten",
    category: "leads",
    thumbnail: "/templates/consultation.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Kostenlose Beratung",
        subtitle: "30 Minuten, die dein Business verändern können",
        elements: [],
        buttonText: "Termin vereinbaren",
        backgroundColor: "#6366F1",
      },
      {
        id: "page-2",
        type: "multiChoice",
        title: "In welchem Bereich brauchst du Unterstützung?",
        elements: [
          { id: "el-1", type: "radio", options: ["Marketing", "Vertrieb", "Strategie", "Operations"] },
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-3",
        type: "question",
        title: "Was ist dein Jahresumsatz?",
        elements: [
          { id: "el-1", type: "radio", options: ["Unter 100k", "100k - 500k", "500k - 1M", "Über 1M"] },
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-4",
        type: "calendar",
        title: "Wähle deinen Wunschtermin",
        elements: [],
        buttonText: "Termin bestätigen",
      },
      {
        id: "page-5",
        type: "thankyou",
        title: "Termin gebucht!",
        subtitle: "Wir freuen uns auf unser Gespräch",
        elements: [],
        showConfetti: true,
      },
    ],
    theme: {
      primaryColor: "#6366F1",
      backgroundColor: "#ffffff",
      textColor: "#1a1a1a",
      fontFamily: "Inter",
    },
  },
  {
    id: "template-ebook",
    name: "E-Book Download",
    description: "Generiere Leads mit einem kostenlosen E-Book",
    category: "leads",
    thumbnail: "/templates/ebook.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Gratis E-Book",
        subtitle: "Die 10 Geheimnisse erfolgreicher Unternehmer",
        elements: [],
        buttonText: "Jetzt herunterladen",
        backgroundColor: "#8B5CF6",
      },
      {
        id: "page-2",
        type: "contact",
        title: "Wohin sollen wir das E-Book senden?",
        elements: [
          { id: "el-1", type: "input", placeholder: "Dein Name", required: true },
          { id: "el-2", type: "input", placeholder: "Deine E-Mail", required: true },
        ],
        buttonText: "E-Book erhalten",
      },
      {
        id: "page-3",
        type: "thankyou",
        title: "Dein E-Book ist unterwegs!",
        subtitle: "Prüfe deinen Posteingang",
        elements: [],
      },
    ],
    theme: {
      primaryColor: "#8B5CF6",
      backgroundColor: "#ffffff",
      textColor: "#1a1a1a",
      fontFamily: "Inter",
    },
  },
  {
    id: "template-event",
    name: "Event-Anmeldung",
    description: "Maximiere Anmeldungen für dein Live-Event",
    category: "webinar",
    thumbnail: "/templates/event.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Exklusives Live-Event",
        subtitle: "Sei live dabei und lerne von den Besten",
        elements: [],
        buttonText: "Platz sichern",
        backgroundColor: "#059669",
      },
      {
        id: "page-2",
        type: "multiChoice",
        title: "Wie hast du von uns erfahren?",
        elements: [
          { id: "el-1", type: "radio", options: ["Social Media", "Empfehlung", "Google", "Newsletter"] },
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-3",
        type: "contact",
        title: "Deine Anmeldung",
        elements: [
          { id: "el-1", type: "input", placeholder: "Dein Name", required: true },
          { id: "el-2", type: "input", placeholder: "Deine E-Mail", required: true },
          { id: "el-3", type: "input", placeholder: "Firma (optional)" },
        ],
        buttonText: "Jetzt anmelden",
      },
      {
        id: "page-4",
        type: "thankyou",
        title: "Du bist angemeldet!",
        subtitle: "Wir schicken dir alle Details per E-Mail",
        elements: [],
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
    id: "template-feedback",
    name: "Kundenfeedback",
    description: "Sammle wertvolles Feedback von deinen Kunden",
    category: "quiz",
    thumbnail: "/templates/feedback.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Deine Meinung zählt!",
        subtitle: "Hilf uns, noch besser zu werden",
        elements: [],
        buttonText: "Feedback geben",
        backgroundColor: "#0891B2",
      },
      {
        id: "page-2",
        type: "multiChoice",
        title: "Wie zufrieden bist du insgesamt?",
        elements: [
          { id: "el-1", type: "radio", options: ["Sehr zufrieden", "Zufrieden", "Neutral", "Unzufrieden"] },
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-3",
        type: "question",
        title: "Was können wir verbessern?",
        elements: [
          { id: "el-1", type: "textarea", placeholder: "Dein Feedback..." },
        ],
        buttonText: "Absenden",
      },
      {
        id: "page-4",
        type: "thankyou",
        title: "Vielen Dank!",
        subtitle: "Dein Feedback hilft uns, besser zu werden",
        elements: [],
      },
    ],
    theme: {
      primaryColor: "#0891B2",
      backgroundColor: "#ffffff",
      textColor: "#1a1a1a",
      fontFamily: "Inter",
    },
  },
  {
    id: "template-newsletter",
    name: "Newsletter-Anmeldung",
    description: "Baue deine E-Mail-Liste mit einem einfachen Opt-in",
    category: "leads",
    thumbnail: "/templates/newsletter.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Bleib auf dem Laufenden",
        subtitle: "Erhalte exklusive Tipps direkt in dein Postfach",
        elements: [],
        buttonText: "Anmelden",
        backgroundColor: "#EA580C",
      },
      {
        id: "page-2",
        type: "contact",
        title: "Deine E-Mail-Adresse",
        elements: [
          { id: "el-1", type: "input", placeholder: "Deine E-Mail", required: true },
        ],
        buttonText: "Jetzt anmelden",
      },
      {
        id: "page-3",
        type: "thankyou",
        title: "Willkommen an Bord!",
        subtitle: "Prüfe deine E-Mails für die Bestätigung",
        elements: [],
      },
    ],
    theme: {
      primaryColor: "#EA580C",
      backgroundColor: "#ffffff",
      textColor: "#1a1a1a",
      fontFamily: "Inter",
    },
  },
  {
    id: "template-waitlist",
    name: "Warteliste",
    description: "Baue Spannung auf mit einer exklusiven Warteliste",
    category: "leads",
    thumbnail: "/templates/waitlist.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Bald verfügbar!",
        subtitle: "Sichere dir einen Platz auf unserer exklusiven Warteliste",
        elements: [],
        buttonText: "Auf die Liste setzen",
        backgroundColor: "#4F46E5",
      },
      {
        id: "page-2",
        type: "contact",
        title: "Werde als Erster benachrichtigt",
        elements: [
          { id: "el-1", type: "input", placeholder: "Dein Name", required: true },
          { id: "el-2", type: "input", placeholder: "Deine E-Mail", required: true },
        ],
        buttonText: "Platz sichern",
      },
      {
        id: "page-3",
        type: "thankyou",
        title: "Du bist auf der Liste!",
        subtitle: "Wir melden uns, sobald es losgeht",
        elements: [],
        showConfetti: true,
      },
    ],
    theme: {
      primaryColor: "#4F46E5",
      backgroundColor: "#ffffff",
      textColor: "#1a1a1a",
      fontFamily: "Inter",
    },
  },
  {
    id: "template-contest",
    name: "Gewinnspiel",
    description: "Steigere Engagement mit einem viralen Gewinnspiel",
    category: "leads",
    thumbnail: "/templates/contest.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Großes Gewinnspiel!",
        subtitle: "Gewinne fantastische Preise - jetzt teilnehmen!",
        elements: [],
        buttonText: "Jetzt mitmachen",
        backgroundColor: "#D946EF",
      },
      {
        id: "page-2",
        type: "multiChoice",
        title: "Welchen Preis möchtest du gewinnen?",
        elements: [
          { id: "el-1", type: "radio", options: ["Hauptpreis", "Preis 2", "Preis 3", "Überraschung"] },
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-3",
        type: "contact",
        title: "Deine Teilnahme",
        elements: [
          { id: "el-1", type: "input", placeholder: "Dein Name", required: true },
          { id: "el-2", type: "input", placeholder: "Deine E-Mail", required: true },
        ],
        buttonText: "Teilnehmen",
      },
      {
        id: "page-4",
        type: "thankyou",
        title: "Viel Glück!",
        subtitle: "Wir drücken dir die Daumen",
        elements: [],
        showConfetti: true,
      },
    ],
    theme: {
      primaryColor: "#D946EF",
      backgroundColor: "#ffffff",
      textColor: "#1a1a1a",
      fontFamily: "Inter",
    },
  },
  {
    id: "template-coaching",
    name: "Coaching-Programm",
    description: "Verkaufe dein Coaching mit einem qualifizierenden Funnel",
    category: "sales",
    thumbnail: "/templates/coaching.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Erreiche deine Ziele",
        subtitle: "Mit unserem bewährten Coaching-Programm",
        elements: [],
        buttonText: "Mehr erfahren",
        backgroundColor: "#0D9488",
      },
      {
        id: "page-2",
        type: "multiChoice",
        title: "Was ist dein größtes Ziel?",
        elements: [
          { id: "el-1", type: "radio", options: ["Mehr Umsatz", "Work-Life-Balance", "Team aufbauen", "Skalieren"] },
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-3",
        type: "multiChoice",
        title: "Wie viel bist du bereit zu investieren?",
        elements: [
          { id: "el-1", type: "radio", options: ["Zeit & Energie", "Bis 1.000€", "1.000€ - 5.000€", "5.000€+"] },
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-4",
        type: "contact",
        title: "Lass uns sprechen",
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
        title: "Großartig!",
        subtitle: "Wir melden uns innerhalb von 24h bei dir",
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
    id: "template-service",
    name: "Dienstleistungs-Anfrage",
    description: "Qualifiziere Anfragen für deine Dienstleistung",
    category: "leads",
    thumbnail: "/templates/service.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Professionelle Unterstützung",
        subtitle: "Wir helfen dir bei deinem Projekt",
        elements: [],
        buttonText: "Anfrage starten",
        backgroundColor: "#7C3AED",
      },
      {
        id: "page-2",
        type: "multiChoice",
        title: "Welche Leistung benötigst du?",
        elements: [
          { id: "el-1", type: "radio", options: ["Beratung", "Umsetzung", "Komplettpaket", "Individuell"] },
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-3",
        type: "multiChoice",
        title: "Wie ist dein Zeitrahmen?",
        elements: [
          { id: "el-1", type: "radio", options: ["Sofort", "In 1-2 Wochen", "In 1 Monat", "Flexibel"] },
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-4",
        type: "contact",
        title: "Deine Anfrage",
        elements: [
          { id: "el-1", type: "input", placeholder: "Dein Name", required: true },
          { id: "el-2", type: "input", placeholder: "Deine E-Mail", required: true },
          { id: "el-3", type: "input", placeholder: "Firma" },
          { id: "el-4", type: "textarea", placeholder: "Beschreibe dein Projekt..." },
        ],
        buttonText: "Anfrage senden",
      },
      {
        id: "page-5",
        type: "thankyou",
        title: "Anfrage erhalten!",
        subtitle: "Wir melden uns schnellstmöglich bei dir",
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
    id: "template-survey",
    name: "Marktforschung",
    description: "Führe Umfragen durch und verstehe deine Zielgruppe",
    category: "quiz",
    thumbnail: "/templates/survey.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Hilf uns, dich zu verstehen",
        subtitle: "Deine Antworten bleiben anonym",
        elements: [],
        buttonText: "Umfrage starten",
        backgroundColor: "#475569",
      },
      {
        id: "page-2",
        type: "multiChoice",
        title: "Wie alt bist du?",
        elements: [
          { id: "el-1", type: "radio", options: ["18-24", "25-34", "35-44", "45+"] },
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-3",
        type: "multiChoice",
        title: "Wie oft nutzt du unser Produkt?",
        elements: [
          { id: "el-1", type: "radio", options: ["Täglich", "Wöchentlich", "Monatlich", "Selten"] },
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-4",
        type: "question",
        title: "Was würdest du dir wünschen?",
        elements: [
          { id: "el-1", type: "textarea", placeholder: "Deine Ideen und Wünsche..." },
        ],
        buttonText: "Absenden",
      },
      {
        id: "page-5",
        type: "thankyou",
        title: "Vielen Dank!",
        subtitle: "Dein Feedback ist uns sehr wichtig",
        elements: [],
      },
    ],
    theme: {
      primaryColor: "#475569",
      backgroundColor: "#ffffff",
      textColor: "#1a1a1a",
      fontFamily: "Inter",
    },
  },
  {
    id: "template-demo",
    name: "Produkt-Demo",
    description: "Vereinbare Demo-Termine mit interessierten Leads",
    category: "sales",
    thumbnail: "/templates/demo.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Erlebe unser Produkt live",
        subtitle: "In einer persönlichen Demo zeigen wir dir alles",
        elements: [],
        buttonText: "Demo buchen",
        backgroundColor: "#2563EB",
      },
      {
        id: "page-2",
        type: "multiChoice",
        title: "Wie groß ist dein Team?",
        elements: [
          { id: "el-1", type: "radio", options: ["1-10", "11-50", "51-200", "200+"] },
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-3",
        type: "contact",
        title: "Deine Demo-Anfrage",
        elements: [
          { id: "el-1", type: "input", placeholder: "Dein Name", required: true },
          { id: "el-2", type: "input", placeholder: "Deine geschäftliche E-Mail", required: true },
          { id: "el-3", type: "input", placeholder: "Firma", required: true },
          { id: "el-4", type: "input", placeholder: "Deine Rolle" },
        ],
        buttonText: "Demo anfordern",
      },
      {
        id: "page-4",
        type: "thankyou",
        title: "Anfrage erhalten!",
        subtitle: "Unser Team meldet sich innerhalb von 24h",
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
];

// Sample funnels for demo
const sampleFunnels: Funnel[] = [
  {
    id: "funnel-1",
    name: "Lead Magnet Kampagne",
    description: "Sammle qualifizierte Leads für dein Coaching",
    status: "published",
    pages: defaultTemplates[0].pages,
    theme: defaultTemplates[0].theme,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    views: 1247,
    leads: 89,
  },
  {
    id: "funnel-2",
    name: "Webinar März 2025",
    description: "Anmeldungen für das März-Webinar",
    status: "published",
    pages: defaultTemplates[1].pages,
    theme: defaultTemplates[1].theme,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    views: 3421,
    leads: 256,
  },
  {
    id: "funnel-3",
    name: "Persönlichkeitstest",
    description: "Interaktives Quiz für Engagement",
    status: "draft",
    pages: defaultTemplates[2].pages,
    theme: defaultTemplates[2].theme,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    views: 0,
    leads: 0,
  },
];

// Sample leads for demo
const sampleLeads: Lead[] = [
  {
    id: "lead-1",
    funnelId: "funnel-1",
    funnelName: "Lead Magnet Kampagne",
    name: "Max Mustermann",
    email: "max@example.com",
    phone: "+49 171 1234567",
    status: "new",
    source: "Facebook Ads",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lead-2",
    funnelId: "funnel-1",
    funnelName: "Lead Magnet Kampagne",
    name: "Anna Schmidt",
    email: "anna.schmidt@company.de",
    phone: "+49 172 9876543",
    company: "Schmidt GmbH",
    status: "contacted",
    source: "Instagram",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lead-3",
    funnelId: "funnel-2",
    funnelName: "Webinar März 2025",
    name: "Thomas Weber",
    email: "t.weber@startup.io",
    status: "qualified",
    source: "LinkedIn",
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lead-4",
    funnelId: "funnel-2",
    funnelName: "Webinar März 2025",
    name: "Julia Braun",
    email: "julia.b@agency.com",
    phone: "+49 173 5551234",
    company: "Digital Agency",
    status: "converted",
    source: "Google Ads",
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lead-5",
    funnelId: "funnel-1",
    funnelName: "Lead Magnet Kampagne",
    name: "Michael Bauer",
    email: "m.bauer@consultant.de",
    status: "new",
    source: "Facebook Ads",
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
];

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private funnels: Map<string, Funnel>;
  private leads: Map<string, Lead>;
  private analyticsEvents: Map<string, AnalyticsEvent>;
  private templates: Map<string, Template>;

  constructor() {
    this.users = new Map();
    this.funnels = new Map();
    this.leads = new Map();
    this.analyticsEvents = new Map();
    this.templates = new Map();
    
    // Initialize with sample data
    sampleFunnels.forEach(f => this.funnels.set(f.id, f));
    sampleLeads.forEach(l => this.leads.set(l.id, l));
    defaultTemplates.forEach(t => this.templates.set(t.id, t));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Funnels
  async getFunnels(): Promise<Funnel[]> {
    return Array.from(this.funnels.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getFunnel(id: string): Promise<Funnel | undefined> {
    return this.funnels.get(id);
  }

  async createFunnel(insertFunnel: InsertFunnel): Promise<Funnel> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const funnel: Funnel = {
      ...insertFunnel,
      id,
      createdAt: now,
      updatedAt: now,
      views: 0,
      leads: 0,
    };
    this.funnels.set(id, funnel);
    return funnel;
  }

  async updateFunnel(id: string, updates: Partial<Funnel>): Promise<Funnel | undefined> {
    const funnel = this.funnels.get(id);
    if (!funnel) return undefined;
    
    const updated: Funnel = {
      ...funnel,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.funnels.set(id, updated);
    return updated;
  }

  async deleteFunnel(id: string): Promise<boolean> {
    return this.funnels.delete(id);
  }

  // Leads
  async getLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getLeadsByFunnel(funnelId: string): Promise<Lead[]> {
    return Array.from(this.leads.values())
      .filter(l => l.funnelId === funnelId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getLead(id: string): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = randomUUID();
    const lead: Lead = {
      ...insertLead,
      id,
      createdAt: new Date().toISOString(),
    };
    this.leads.set(id, lead);
    
    // Update funnel leads count
    const funnel = this.funnels.get(insertLead.funnelId);
    if (funnel) {
      this.funnels.set(funnel.id, { ...funnel, leads: funnel.leads + 1 });
    }
    
    return lead;
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead | undefined> {
    const lead = this.leads.get(id);
    if (!lead) return undefined;
    
    const updated: Lead = { ...lead, ...updates };
    this.leads.set(id, updated);
    return updated;
  }

  async deleteLead(id: string): Promise<boolean> {
    return this.leads.delete(id);
  }

  // Analytics
  async getAnalytics(funnelId: string): Promise<AnalyticsEvent[]> {
    return Array.from(this.analyticsEvents.values())
      .filter(e => e.funnelId === funnelId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async createAnalyticsEvent(event: Omit<AnalyticsEvent, "id">): Promise<AnalyticsEvent> {
    const id = randomUUID();
    const analyticsEvent: AnalyticsEvent = { ...event, id };
    this.analyticsEvents.set(id, analyticsEvent);
    
    // Update funnel views if it's a view event
    if (event.eventType === "view") {
      const funnel = this.funnels.get(event.funnelId);
      if (funnel) {
        this.funnels.set(funnel.id, { ...funnel, views: funnel.views + 1 });
      }
    }
    
    return analyticsEvent;
  }

  // Templates
  async getTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    return this.templates.get(id);
  }
}

export const storage = new MemStorage();
