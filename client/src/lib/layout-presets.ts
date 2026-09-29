import type { PageElement } from "@shared/schema";

export interface LayoutPreset { id: string; name: string; columns: PageElement[][] }
const heading = (id: string, content: string): PageElement => ({ id, type: "heading", content });
const text = (id: string, content: string): PageElement => ({ id, type: "text", content });
const button = (id: string, content: string): PageElement => ({ id, type: "button", content, buttonAction: "next" });

/** Fresh IDs are assigned on insertion, including nested FAQ/testimonial IDs. */
export const layoutPresets: LayoutPreset[] = [
  { id: "empty-1", name: "Leer · 1 Spalte", columns: [[]] },
  { id: "empty-2", name: "Leer · 2 Spalten", columns: [[], []] },
  { id: "empty-3", name: "Leer · 3 Spalten", columns: [[], [], []] },
  { id: "intro", name: "Einstieg", columns: [[heading("h", "Dein Angebot auf einen Blick"), text("t", "Zeige deinen Besuchern, welchen Unterschied dein Angebot für sie macht."), button("b", "Mehr erfahren")]] },
  { id: "image-text", name: "Bild neben Text", columns: [[{ id: "image", type: "image", imageAlt: "Dein Bild" }], [heading("h", "Das macht uns besonders"), text("t", "Ergänze dein Bild mit einer kurzen, verständlichen Beschreibung.")]] },
  { id: "benefits", name: "Vorteile", columns: [1, 2, 3].map(index => [heading(`h${index}`, `Vorteil ${index}`), text(`t${index}`, "Beschreibe einen konkreten Nutzen für deine Besucher.")]) },
  { id: "testimonials", name: "Kundenstimmen", columns: [[heading("h", "Das sagen unsere Kunden")], [{ id: "review", type: "testimonial", slides: [{ id: "review-1", text: "Ergänze hier eine freigegebene Kundenstimme.", author: "Name", role: "Unternehmen" }] }]] },
  { id: "faq", name: "Häufige Fragen", columns: [[heading("h", "Häufige Fragen"), { id: "faq", type: "faq", faqItems: [{ id: "faq-1", question: "Wie geht es weiter?", answer: "Beschreibe hier den nächsten Schritt." }, { id: "faq-2", question: "Für wen ist das Angebot geeignet?", answer: "Beschreibe, wem dein Angebot hilft." }] }]] },
  { id: "contact", name: "Kontakt", columns: [[heading("h", "Lass uns sprechen"), text("t", "Hinterlasse deine Kontaktdaten. Wir melden uns bei dir.")], [
    { id: "name", type: "input", label: "Name", placeholder: "Dein Name", required: true, mapToLeadField: "name" },
    { id: "email", type: "input", label: "E-Mail", placeholder: "Deine E-Mail", required: true, mapToLeadField: "email", validation: { type: "email" } },
  ]] },
];
