import {
  Type,
  AlignLeft,
  Image,
  Video,
  List,
  HelpCircle,
  MessageSquare,
  ListOrdered,
  CheckSquare,
  Calendar,
  Upload,
  Star,
  Layers,
  Award,
  Minus,
  Space,
  Clock,
  BarChart3,
  LayoutGrid,
  Columns,
  PanelLeft,
  PanelRight,
  Music,
  MapPin,
  Code,
  BarChart2,
  ShoppingBag,
  Timer,
  Link,
  MousePointer2,
  Users,
} from "lucide-react";
import type { FunnelPage, PageElement } from "@shared/schema";

// ============ TYPES ============

export type PageType = FunnelPage["type"];

export interface PersonalizationVariable {
  key: string;
  label: string;
  description: string;
}

export interface SectionTemplate {
  id: string;
  name: string;
  description: string;
  elements: Partial<PageElement>[];
}

export interface ElementCategoryItem {
  type: PageElement["type"];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export interface ElementCategory {
  name: string;
  elements: ElementCategoryItem[];
}

export interface LayoutTemplate {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  columns: number[];
  description: string;
}

// ============ CONSTANTS ============

/**
 * Verfügbare Personalisierungsvariablen für dynamische Inhalte in Funnels.
 * Diese können in Texten verwendet werden und werden zur Laufzeit ersetzt.
 */
export const personalizationVariables: PersonalizationVariable[] = [
  { key: "{{name}}", label: "Name", description: "Name des Besuchers" },
  { key: "{{email}}", label: "E-Mail", description: "E-Mail-Adresse" },
  { key: "{{phone}}", label: "Telefon", description: "Telefonnummer" },
  { key: "{{company}}", label: "Firma", description: "Firmenname" },
  { key: "{{date}}", label: "Datum", description: "Aktuelles Datum" },
  { key: "{{answer_1}}", label: "Antwort 1", description: "Erste Antwort" },
  { key: "{{answer_2}}", label: "Antwort 2", description: "Zweite Antwort" },
];

/**
 * Vorgefertigte Sektions-Templates für schnelles Einfügen.
 * Jedes Template enthält eine Sammlung von Elementen für einen bestimmten Zweck.
 */
export const sectionTemplates: SectionTemplate[] = [
  {
    id: "hero",
    name: "Hero-Sektion",
    description: "Aufmerksamkeitsstarker Einstieg",
    elements: [
      { id: "hero-h", type: "heading" as const, content: "Willkommen bei uns!" },
      { id: "hero-t", type: "text" as const, content: "Entdecke, wie wir dir helfen können." },
    ],
  },
  {
    id: "features",
    name: "Vorteile-Liste",
    description: "3 Vorteile mit Häkchen",
    elements: [
      { id: "feat-l", type: "list" as const, listStyle: "check" as const, listItems: [
        { id: "f1", text: "Schnell und einfach" },
        { id: "f2", text: "100% kostenlos testen" },
        { id: "f3", text: "Keine Kreditkarte nötig" },
      ]},
    ],
  },
  {
    id: "testimonial",
    name: "Kundenstimme",
    description: "Testimonial mit Bewertung",
    elements: [
      { id: "test-t", type: "testimonial" as const, slides: [
        { id: "t1", text: "Absolut begeistert! Hat meine Erwartungen übertroffen.", author: "Maria Schmidt", role: "Geschäftsführerin", rating: 5 },
      ]},
    ],
  },
  {
    id: "cta",
    name: "Call-to-Action",
    description: "Überschrift mit Button",
    elements: [
      { id: "cta-h", type: "heading" as const, content: "Bereit loszulegen?" },
      { id: "cta-t", type: "text" as const, content: "Starte jetzt und erlebe den Unterschied." },
    ],
  },
  {
    id: "contact-form",
    name: "Kontaktformular",
    description: "Name, E-Mail, Nachricht",
    elements: [
      { id: "cf-1", type: "input" as const, placeholder: "Dein Name", required: true },
      { id: "cf-2", type: "input" as const, placeholder: "Deine E-Mail", required: true },
      { id: "cf-3", type: "textarea" as const, placeholder: "Deine Nachricht...", required: false },
    ],
  },
  {
    id: "faq",
    name: "FAQ-Sektion",
    description: "Häufige Fragen",
    elements: [
      { id: "faq-1", type: "faq" as const, faqItems: [
        { id: "fq1", question: "Wie funktioniert das?", answer: "Ganz einfach! Melde dich an und los geht's." },
        { id: "fq2", question: "Ist es wirklich kostenlos?", answer: "Ja, du kannst alles kostenlos testen." },
        { id: "fq3", question: "Wie erreiche ich den Support?", answer: "Per E-Mail oder Chat - wir sind für dich da!" },
      ]},
    ],
  },
  {
    id: "urgency",
    name: "Dringlichkeit",
    description: "Timer mit Text",
    elements: [
      { id: "urg-h", type: "heading" as const, content: "Nur noch für kurze Zeit!" },
      { id: "urg-t", type: "timer" as const, timerEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), timerStyle: "countdown" as const, timerShowDays: true },
    ],
  },
];

/**
 * Labels für die verschiedenen Seitentypen (deutsch).
 */
export const pageTypeLabels: Record<PageType, string> = {
  welcome: "Willkommen",
  question: "Frage",
  multiChoice: "Mehrfachauswahl",
  contact: "Kontakt",
  calendar: "Kalender",
  thankyou: "Danke",
};

/**
 * Icons/Buchstaben für die verschiedenen Seitentypen.
 */
export const pageTypeIcons: Record<PageType, string> = {
  welcome: "W",
  question: "?",
  multiChoice: "C",
  contact: "@",
  calendar: "K",
  thankyou: "T",
};

/**
 * Kategorisierte Element-Palette für den Drag-and-Drop-Editor.
 * Elemente sind nach Verwendungszweck gruppiert.
 */
export const elementCategories: ElementCategory[] = [
  {
    name: "Inhalt",
    elements: [
      { type: "heading", label: "Überschrift", icon: Type, description: "Große Überschrift" },
      { type: "text", label: "Text", icon: AlignLeft, description: "Absatztext" },
      { type: "image", label: "Bild", icon: Image, description: "Bild einfügen" },
      { type: "video", label: "Video", icon: Video, description: "YouTube, Vimeo" },
      { type: "audio", label: "Audio", icon: Music, description: "Audio/Podcast" },
      { type: "list", label: "Liste", icon: List, description: "Aufzählungsliste" },
      { type: "faq", label: "FAQ", icon: HelpCircle, description: "Fragen & Antworten" },
    ],
  },
  {
    name: "Formular",
    elements: [
      { type: "input", label: "Textfeld", icon: Type, description: "Einzeiliges Feld" },
      { type: "textarea", label: "Textbereich", icon: MessageSquare, description: "Mehrzeiliges Feld" },
      { type: "select", label: "Dropdown", icon: ListOrdered, description: "Auswahlfeld" },
      { type: "radio", label: "Auswahl", icon: CheckSquare, description: "Single Choice" },
      { type: "checkbox", label: "Checkbox", icon: CheckSquare, description: "Multi Choice" },
      { type: "date", label: "Datum", icon: Calendar, description: "Datumsauswahl" },
      { type: "fileUpload", label: "Datei", icon: Upload, description: "Datei-Upload" },
      { type: "calendar", label: "Kalender", icon: Calendar, description: "Terminbuchung" },
    ],
  },
  {
    name: "Social Proof",
    elements: [
      { type: "testimonial", label: "Bewertung", icon: Star, description: "Kundenbewertung" },
      { type: "slider", label: "Slider", icon: Layers, description: "Bild-Karussell" },
      { type: "socialProof", label: "Logos", icon: Award, description: "Partner-Logos" },
      { type: "team", label: "Team", icon: Users, description: "Team-Mitglieder" },
    ],
  },
  {
    name: "Interaktiv",
    elements: [
      { type: "button", label: "Button", icon: MousePointer2, description: "Klickbarer Button" },
      { type: "timer", label: "Timer", icon: Clock, description: "Countdown Timer" },
      { type: "countdown", label: "Countdown", icon: Timer, description: "Ablauf-Counter" },
      { type: "progressBar", label: "Fortschritt", icon: BarChart3, description: "Fortschrittsbalken" },
    ],
  },
  {
    name: "E-Commerce",
    elements: [
      { type: "product", label: "Produkt", icon: ShoppingBag, description: "Produkt-Karte" },
    ],
  },
  {
    name: "Erweitert",
    elements: [
      { type: "map", label: "Karte", icon: MapPin, description: "Google Maps" },
      { type: "chart", label: "Diagramm", icon: BarChart2, description: "Daten-Visualisierung" },
      { type: "code", label: "Code", icon: Code, description: "Code-Snippet" },
      { type: "embed", label: "Einbetten", icon: Link, description: "Externe Inhalte" },
    ],
  },
  {
    name: "Layout",
    elements: [
      { type: "divider", label: "Trennlinie", icon: Minus, description: "Horizontale Linie" },
      { type: "spacer", label: "Abstand", icon: Space, description: "Vertikaler Abstand" },
    ],
  },
];

/**
 * Layout-Templates für Spalten-Sektionen.
 * Definiert verschiedene Spaltenaufteilungen für responsive Designs.
 */
export const layoutTemplates: LayoutTemplate[] = [
  { id: "single", name: "1 Spalte", icon: LayoutGrid, columns: [100], description: "Volle Breite" },
  { id: "two-equal", name: "2 Spalten", icon: Columns, columns: [50, 50], description: "Gleiche Breite" },
  { id: "two-left", name: "2 Spalten Links", icon: PanelLeft, columns: [66, 34], description: "Links größer" },
  { id: "two-right", name: "2 Spalten Rechts", icon: PanelRight, columns: [34, 66], description: "Rechts größer" },
  { id: "three-equal", name: "3 Spalten", icon: LayoutGrid, columns: [33, 34, 33], description: "Drei gleich" },
  { id: "four-equal", name: "4 Spalten", icon: LayoutGrid, columns: [25, 25, 25, 25], description: "Vier gleich" },
];
