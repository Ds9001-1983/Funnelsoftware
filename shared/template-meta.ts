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

import {
  breadcrumbJsonLd,
  faqPageJsonLd,
  TEMPLATE_GALLERY_PATH,
  type SeoFaq,
  type SeoStaticPage,
} from "./seo-links";
import { renderTemplateHtml } from "./seo-html";

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

/**
 * Passende Branchen-/Ratgeber-Seite je Template-Kategorie — die Detailseiten
 * verlinken darauf (interne Verlinkung Template ↔ Ratgeber, SEO). Pfade müssen
 * in audiencePages (shared/seo-links.ts) existieren; shared/seo-routes.test.ts
 * sichert die Registry-Abdeckung.
 */
export const audienceLinkByCategory: Partial<
  Record<TemplateCategory, { path: string; label: string }>
> = {
  leads: { path: "/lead-funnel", label: "Ratgeber: Lead-Funnel" },
  sales: { path: "/lead-funnel", label: "Ratgeber: Lead-Funnel" },
  recruiting: { path: "/recruiting-funnel", label: "Ratgeber: Recruiting-Funnel" },
  quiz: { path: "/quiz-funnel", label: "Ratgeber: Quiz-Funnel" },
  survey: { path: "/quiz-funnel", label: "Ratgeber: Quiz-Funnel" },
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
  /** Keyword-tragende H1 der Detailseite (Fallback: name). */
  h1?: string;
  /** 2–3 Absätze Unique Content für die Detailseite (gegen Thin Content). */
  longDescription?: string[];
  /** Konkrete Einsatz-Szenarien (Karten-Grid auf der Detailseite). */
  useCases?: { title: string; text: string }[];
  /** FAQ der Detailseite — landet auch als FAQPage-JSON-LD im SSR-Meta-Block. */
  faqs?: SeoFaq[];
  /** Slugs verwandter Templates für den „Verwandte Vorlagen“-Block. */
  relatedSlugs?: string[];
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
    h1: "Funnel-Vorlage: Termin buchen",
    longDescription: [
      "Die Vorlage führt Interessenten in wenigen Schritten vom Angebot zum festen Termin: Einstiegsseite mit deinem Nutzenversprechen, Qualifizierungsfragen zu Situation und Dringlichkeit, danach Kontaktdaten und Terminwahl. Jeder Schritt zeigt genau eine Frage — das fühlt sich am Handy nach Fortschritt an statt nach Papierkram.",
      "Gedacht ist sie für alle, die Erstgespräche verkaufen: Berater, Coaches, Dienstleister, Kanzleien und Agenturen. Gegenüber dem klassischen „Kontaktformular plus Rückruf“ sparst du die Sortierrunde: Wer den Funnel abschließt, hat schon beantwortet, worum es geht — und du siehst vor dem Gespräch, ob sich der Slot lohnt.",
    ],
    useCases: [
      {
        title: "Strategiegespräch für Berater",
        text: "Erst Ausgangslage und Ziel abfragen, dann den Kalender zeigen — so landen nur vorbereitete Gespräche im Slot.",
      },
      {
        title: "Erstberatung im Handwerk",
        text: "Projektart, Ort und Wunschzeitraum vorab klären, damit der Ortstermin nicht zur Fehlfahrt wird.",
      },
      {
        title: "Praxis- und Kanzlei-Termine",
        text: "Anliegen strukturiert erfassen und Unterlagen-Hinweise ausspielen, bevor der Termin bestätigt wird.",
      },
    ],
    faqs: [
      {
        q: "Was kostet die Terminbuchungs-Vorlage?",
        a: "Nichts. Du kannst sie im dauerhaft kostenlosen Free-Plan nutzen: ein veröffentlichter Funnel und 100 sichtbare Leads pro Monat, alle Editor-Features inklusive. Wenn du mehr Funnels, unbegrenzte Leads und deine eigene Domain brauchst, kostet Pro 49 EUR pro Monat inkl. MwSt. — vorher kannst du Pro 14 Tage ohne Kreditkarte testen.",
      },
      {
        q: "Wie schnell ist der Termin-Funnel live?",
        a: "In der Regel unter einer Stunde: Vorlage übernehmen, Texte auf dein Angebot anpassen, Fragen kürzen oder ergänzen, veröffentlichen. Der Funnel läuft sofort unter einer Trichterwerk-URL, im Pro-Plan zusätzlich unter deiner eigenen Domain inklusive SSL.",
      },
      {
        q: "Kann ich meinen bestehenden Kalender einbinden?",
        a: "Ja. Du kannst dein Buchungstool auf der Terminseite einbetten oder die Anfrage per Webhook (Zapier- und Make-kompatibel) an dein System weitergeben. Alternativ sammelst du Wunschtermine im Funnel ein und bestätigst manuell.",
      },
      {
        q: "Wie viele Qualifizierungsfragen sind sinnvoll?",
        a: "Drei bis fünf reichen meistens. Frag nur, was deine Entscheidung vor dem Gespräch verändert — jede zusätzliche Frage kostet Abschlüsse. Im Pro-Plan kannst du mit Conditional Logic Folgefragen nur den passenden Antwortgruppen zeigen.",
      },
    ],
    relatedSlugs: ["agentur-onboarding", "vsl", "coaching-angebot"],
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
    h1: "VSL-Funnel-Vorlage: Video Sales Letter mit Qualifizierung",
    longDescription: [
      "Im Zentrum steht dein Verkaufsvideo: Die erste Seite bringt Hook und Video, danach folgen Qualifizierungsfragen und die Kontaktseite. Weil das Video allein auf der Seite steht — ohne Menü, Sidebar und Fußzeilen-Links — konkurriert nichts mit deiner Botschaft.",
      "Passend ist die Vorlage für Coaching-, Beratungs- und Agenturangebote, die Erklärung brauchen, bevor jemand einen Preis hört. Statt einer langen Textverkaufsseite, die kaum jemand zu Ende liest, bekommst du eine mobile Schrittfolge: Video schauen, zwei bis drei Fragen beantworten, Kontakt hinterlassen.",
    ],
    useCases: [
      {
        title: "High-Ticket-Coaching",
        text: "Das Angebot im Video erklären und danach Budget und Zeitpunkt abfragen, damit nur passende Anfragen durchkommen.",
      },
      {
        title: "Software-Demo statt Live-Call",
        text: "Aufgezeichnete Produkttour ausspielen und Interessenten direkt nach Teamgröße und Use Case fragen.",
      },
      {
        title: "Ads-Landeseite für Meta und YouTube",
        text: "Kaltem Traffic zuerst das Video zeigen und erst danach die Kontaktfrage stellen — ein Schritt pro Bildschirm.",
      },
    ],
    faqs: [
      {
        q: "Was kostet die VSL-Vorlage?",
        a: "Sie ist im dauerhaft kostenlosen Free-Plan nutzbar — ein veröffentlichter Funnel und 100 sichtbare Leads pro Monat, alle Editor-Features inklusive. Für unbegrenzte Funnels und Leads, eigene Domain und A/B-Tests kostet Pro 49 EUR pro Monat inkl. MwSt., testbar 14 Tage ohne Kreditkarte.",
      },
      {
        q: "Wie schnell ist der VSL-Funnel live?",
        a: "Sobald dein Video hochgeladen oder eingebettet ist — meist in unter einer Stunde. Vorlage übernehmen, Video eintragen, Fragen und Kontakttext anpassen, veröffentlichen.",
      },
      {
        q: "Welche Videoquellen kann ich einbinden?",
        a: "Du kannst gehostete Videos einbetten oder eine Videodatei verwenden. Wichtig ist ein mobil taugliches Format und ein Startbild, das ohne Ton verständlich ist — der Großteil der Zuschauer kommt vom Smartphone.",
      },
      {
        q: "Soll der Button sofort oder erst später sichtbar sein?",
        a: "Beides funktioniert. Bei warmem Publikum darf der Weiter-Button von Anfang an sichtbar sein, bei kaltem Traffic überzeugt oft erst das Video. Mit A/B-Tests im Pro-Plan kannst du beide Varianten gegeneinander laufen lassen.",
      },
    ],
    relatedSlugs: ["coaching-angebot", "termin-buchen", "masterclass"],
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
    h1: "Recruiting-Funnel-Vorlage: Bewerber qualifizieren statt Mappen sammeln",
    longDescription: [
      "Die Vorlage zeigt zuerst, wie bei euch gearbeitet wird — Team, Benefits, Einblick in den Alltag — und stellt danach drei Fragen zu Erfahrung, Verfügbarkeit und Wunschrolle. Am Ende bleiben Name, Telefonnummer und E-Mail, mehr nicht.",
      "Sie richtet sich an Unternehmen, die um Fachkräfte konkurrieren und mit klassischen Stellenanzeigen zu wenige Rückmeldungen bekommen. Der Unterschied zum PDF-Bewerbungsportal: Niemand muss einen Lebenslauf suchen oder ein Konto anlegen — die Bewerbung passiert am Handy in der Pause, und du hast trotzdem die Antworten, die für den ersten Anruf zählen.",
    ],
    useCases: [
      {
        title: "Employer Branding mit Wirkung",
        text: "Kulturseite und Bewerbung in einem Ablauf — Interessierte springen nicht zwischen Karriereseite und Formular hin und her.",
      },
      {
        title: "Social-Recruiting-Kampagnen",
        text: "Als Landeseite für Meta- oder TikTok-Anzeigen, bei denen Menschen aus dem Feed kommen und nicht nach Formularen suchen wollen.",
      },
      {
        title: "Mehrere Rollen, ein Funnel",
        text: "Über eine Auswahlfrage die passende Position abfragen und Bewerbungen sauber getrennt in den Leads sehen.",
      },
    ],
    faqs: [
      {
        q: "Was kostet der Recruiting-Funnel?",
        a: "Er läuft im dauerhaft kostenlosen Free-Plan: ein veröffentlichter Funnel, 100 sichtbare Leads pro Monat und alle Editor-Features. Wer mehrere Stellen parallel bespielt oder unbegrenzte Bewerbungen braucht, nutzt Pro für 49 EUR pro Monat inkl. MwSt. — 14 Tage testbar ohne Kreditkarte.",
      },
      {
        q: "Wie schnell ist der Recruiting-Funnel live?",
        a: "Meist am selben Tag. Vorlage übernehmen, Benefits und Fragen auf eure Stelle anpassen, Bilder tauschen, veröffentlichen — danach kannst du den Link sofort in Anzeigen und Stellenbörsen verwenden.",
      },
      {
        q: "Ist das DSGVO-konform?",
        a: "Die Funnels laufen auf EU-Hosting, die Analytics sind cookielos und ohne Fremd-Tracker. Du bestimmst, welche Daten du abfragst, und ergänzt Einwilligungstext und Datenschutzlink im Editor.",
      },
      {
        q: "Wie kommen die Bewerbungen ins Recruiting-System?",
        a: "Per E-Mail-Benachrichtigung, CSV-Export oder Webhook — letzterer ist Zapier- und Make-kompatibel, sodass Bewerbungen automatisch in ATS, CRM oder ein Team-Postfach laufen.",
      },
    ],
    relatedSlugs: ["express-bewerbung", "pflege-recruiting", "handwerk-recruiting"],
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
    h1: "Recruiting-Funnel-Vorlage: Express-Bewerbung ohne Lebenslauf",
    longDescription: [
      "Diese Vorlage ist bewusst kurz: eine Einstiegsseite mit dem Versprechen „Bewerbung in 60 Sekunden“, drei Fragen und die Kontaktseite. Kein Upload, kein Anschreiben, kein Login — genau das senkt die Hürde für Menschen, die gerade am Handy sind.",
      "Sie eignet sich überall dort, wo Geschwindigkeit über den Bewerbungserfolg entscheidet: Gastronomie, Logistik, Einzelhandel, Produktion und Zeitarbeit. Verglichen mit dem klassischen Bewerbungsportal verlierst du Vorabinformation, gewinnst aber deutlich mehr Erstkontakte — die Details klärst du im Rückruf statt im Formular.",
    ],
    useCases: [
      {
        title: "QR-Code am Point of Sale",
        text: "Aufsteller, Fahrzeugbeschriftung oder Aushang mit QR-Code — der Funnel öffnet direkt die erste Frage.",
      },
      {
        title: "Schichtbesetzung in Gastro und Logistik",
        text: "Verfügbarkeit und Wunschschicht abfragen und noch am selben Tag zurückrufen.",
      },
      {
        title: "Performance-Kampagnen auf Meta",
        text: "Als Landeseite für Anzeigen mit kurzer Aufmerksamkeitsspanne: ein Schritt pro Bildschirm, keine Ablenkung.",
      },
    ],
    faqs: [
      {
        q: "Was kostet die Express-Bewerbungs-Vorlage?",
        a: "Sie ist im dauerhaft kostenlosen Free-Plan nutzbar: ein veröffentlichter Funnel, 100 sichtbare Leads pro Monat, alle Editor-Features. Für unbegrenzte Funnels und Bewerbungen sowie eine eigene Domain kostet Pro 49 EUR pro Monat inkl. MwSt., mit 14 Tagen Testphase ohne Kreditkarte.",
      },
      {
        q: "Wie schnell ist die Express-Bewerbung live?",
        a: "Oft in 20 bis 30 Minuten, weil nur wenige Texte anzupassen sind: Stellentitel, drei Fragen, Kontaktseite, veröffentlichen — fertig.",
      },
      {
        q: "Bekomme ich ohne Lebenslauf genug Informationen?",
        a: "Für den ersten Anruf ja: Erfahrung, Verfügbarkeit und Kontaktdaten reichen, um zu entscheiden, ob ein Gespräch Sinn ergibt. Unterlagen kannst du später anfordern — auf einer Danke-Seite oder in der Bestätigungs-E-Mail.",
      },
      {
        q: "Wie vermeide ich unpassende Bewerbungen?",
        a: "Nenne Ort, Arbeitszeitmodell und Anforderungen schon auf der ersten Seite und stelle eine klare Ausschlussfrage, etwa zum Führerschein oder zur Verfügbarkeit. So filtert der Funnel, bevor jemand seine Nummer hinterlässt.",
      },
    ],
    relatedSlugs: ["recruiting", "handwerk-recruiting", "pflege-recruiting"],
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
    h1: "Pflege-Recruiting-Funnel-Vorlage: Pflegekräfte gewinnen",
    longDescription: [
      "Die Vorlage stellt genau die Punkte nach vorn, auf die Pflegekräfte achten: Dienstplansicherheit, faire Bezahlung, Team und Einarbeitung. Danach folgen Fragen zu Qualifikation, Wunsch-Arbeitszeitmodell und Startzeitpunkt, bevor der Funnel zum Kennenlern-Telefonat führt.",
      "Sie ist für Pflegedienste, Kliniken, Senioreneinrichtungen und Personaldienstleister gedacht, deren Stellenanzeigen zwischen austauschbaren Formulierungen untergehen. Anders als die klassische Anzeige mit „Bewerbung an bewerbung@…“ macht dieser Ablauf den Alltag konkret — und der erste Kontakt ist ein Telefonat, kein Anschreiben.",
    ],
    useCases: [
      {
        title: "Ambulanter Pflegedienst",
        text: "Touren, Fahrzeuggestellung und feste Frei-Wochenenden zeigen und danach nach Qualifikation und Wunschgebiet fragen.",
      },
      {
        title: "Stationäre Einrichtung",
        text: "Schichtmodell, Springerpool und Einarbeitung erklären, bevor der Startzeitpunkt abgefragt wird.",
      },
      {
        title: "Wiedereinstieg und Teilzeit",
        text: "Gezielt Menschen ansprechen, die reduziert einsteigen wollen — mit Frage nach Stundenumfang statt Vollzeit-Standard.",
      },
    ],
    faqs: [
      {
        q: "Was kostet der Pflege-Recruiting-Funnel?",
        a: "Im dauerhaft kostenlosen Free-Plan ist er ohne Kosten nutzbar: ein veröffentlichter Funnel und 100 sichtbare Leads pro Monat mit allen Editor-Features. Für mehrere Standorte oder unbegrenzte Bewerbungen kostet Pro 49 EUR pro Monat inkl. MwSt., 14 Tage kostenlos testbar ohne Kreditkarte.",
      },
      {
        q: "Wie schnell ist der Pflege-Funnel live?",
        a: "Meist innerhalb eines Vormittags. Benefits durch eure echten Konditionen ersetzen, Fragen anpassen, Fotos aus der Einrichtung einsetzen, veröffentlichen.",
      },
      {
        q: "Welche Benefits sollte ich nennen?",
        a: "Nur die, die ihr wirklich einhaltet: verbindliche Dienstpläne, Zuschläge, Anzahl freier Wochenenden, Einarbeitungsdauer. Überversprechen fällt spätestens im Probemonat auf und kostet mehr, als es bringt.",
      },
      {
        q: "Sind die Bewerberdaten datenschutzkonform gespeichert?",
        a: "Ja — EU-Hosting, cookielose eigene Analytics und keine Drittanbieter-Tracker. Bewerbungen kannst du per CSV exportieren oder per Webhook an euer System übergeben und dort nach euren Fristen löschen.",
      },
    ],
    relatedSlugs: ["recruiting", "express-bewerbung", "handwerk-recruiting"],
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
    h1: "Handwerk-Recruiting-Funnel-Vorlage für SHK und Elektro",
    longDescription: [
      "Der Ablauf ist auf die Baustelle zugeschnitten: Gehalt und Region stehen vorn, dann folgen Gewerk, Qualifikation und Gehaltsvorstellung, zum Schluss die Kurzbewerbung mit Telefonnummer. Alles ist mit dicken Fingern am Handy bedienbar — Auswahlkacheln statt Tippfelder.",
      "Gemacht ist die Vorlage für SHK-, Elektro- und Bauhandwerksbetriebe, die Monteure und Gesellen suchen und wissen: Wer eine Bewerbungsmappe verlangt, bekommt keine. Statt Anschreiben und Zeugnissen sammelst du die drei Angaben, die über ein Gespräch entscheiden, und rufst noch am selben Tag zurück.",
    ],
    useCases: [
      {
        title: "Monteure für SHK und Elektro",
        text: "Gewerk und Erfahrungsstufe abfragen, damit Anlagenmechaniker und Elektroniker direkt beim richtigen Meister landen.",
      },
      {
        title: "Fahrzeugwerbung mit QR-Code",
        text: "„Wir suchen dich“ auf dem Transporter, QR-Code darunter — der Funnel öffnet die erste Frage ohne Umweg.",
      },
      {
        title: "Azubis und Quereinsteiger",
        text: "Über eine Einstiegsfrage zwischen Ausbildung, Geselle und Quereinstieg trennen und passende Inhalte zeigen.",
      },
    ],
    faqs: [
      {
        q: "Was kostet die Handwerk-Recruiting-Vorlage?",
        a: "Sie ist im dauerhaft kostenlosen Free-Plan enthalten: ein veröffentlichter Funnel, 100 sichtbare Leads pro Monat, alle Editor-Features. Wer mehrere Gewerke oder Standorte getrennt bespielen will, nutzt Pro für 49 EUR pro Monat inkl. MwSt. — vorher 14 Tage testen, ohne Kreditkarte.",
      },
      {
        q: "Wie schnell ist der Handwerk-Funnel live?",
        a: "Häufig in unter einer Stunde: Gewerke, Region und Gehaltsspanne eintragen, Betriebsfotos hochladen, veröffentlichen. Den Link kannst du danach sofort per WhatsApp weitergeben oder als QR-Code drucken.",
      },
      {
        q: "Soll ich das Gehalt wirklich nennen?",
        a: "Eine Spanne hilft mehr, als sie schadet: Sie sortiert unpassende Erwartungen vorher aus und signalisiert Ehrlichkeit. Wenn du keine Zahl nennen willst, frag stattdessen die Gehaltsvorstellung ab.",
      },
      {
        q: "Wie erreichen mich die Bewerbungen unterwegs?",
        a: "Per E-Mail-Benachrichtigung auf dem Handy und im Dashboard. Über einen Webhook (Zapier- und Make-kompatibel) kannst du sie zusätzlich in ein Team-Postfach oder eine Tabelle spiegeln.",
      },
    ],
    relatedSlugs: ["express-bewerbung", "recruiting", "pflege-recruiting"],
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
    h1: "Funnel-Vorlage: Lead-Magnet für Checkliste und Whitepaper",
    longDescription: [
      "Die Vorlage präsentiert zuerst dein Freebie — Checkliste, Whitepaper, Vorlage oder Mini-Kurs — mit Vorschau und drei Stichpunkten zum Inhalt. Danach kommt eine Qualifizierungsfrage zur Situation des Besuchers und erst zum Schluss das E-Mail-Feld.",
      "Sie passt für Content-Marketing, Newsletter-Aufbau und die erste Stufe längerer Verkaufsprozesse. Der Vorteil gegenüber dem üblichen Popup-Formular: Die Zwischenfrage macht aus einer anonymen E-Mail-Adresse einen Kontakt mit Kontext, den du in der Nachfass-Mail direkt aufgreifen kannst.",
    ],
    useCases: [
      {
        title: "Checkliste im B2B-Marketing",
        text: "Fachcontent gegen Kontaktdaten tauschen und über die Zwischenfrage gleich die Branche erfassen.",
      },
      {
        title: "Newsletter-Aufbau",
        text: "Freebie als Einstieg, Interesse abfragen, Abonnenten segmentiert an dein E-Mail-Tool übergeben.",
      },
      {
        title: "Preisliste oder Musterkatalog",
        text: "Statt PDF-Direktlink erst kurz qualifizieren — so weißt du, wer deine Preise wirklich anschaut.",
      },
    ],
    faqs: [
      {
        q: "Was kostet der Lead-Magnet-Funnel?",
        a: "Im dauerhaft kostenlosen Free-Plan nichts: ein veröffentlichter Funnel, 100 sichtbare Leads pro Monat und alle Editor-Features. Für unbegrenzte Leads, eigene Domain und mehrere Freebies parallel kostet Pro 49 EUR pro Monat inkl. MwSt., 14 Tage testbar ohne Kreditkarte.",
      },
      {
        q: "Wie schnell ist der Lead-Magnet live?",
        a: "In der Regel in unter 30 Minuten, wenn dein Freebie fertig ist: Vorschaubild und Nutzen eintragen, Frage anpassen, Download-Link auf der Danke-Seite hinterlegen, veröffentlichen.",
      },
      {
        q: "Wie wird das Freebie ausgeliefert?",
        a: "Entweder direkt auf der Abschlussseite als Download-Link oder per E-Mail über dein Newsletter-Tool, das den Lead per Webhook erhält. Beides lässt sich kombinieren.",
      },
      {
        q: "Brauche ich Double-Opt-in?",
        a: "Für werbliche Newsletter ja — das übernimmt dein E-Mail-Tool, an das du den Lead übergibst. Der Funnel selbst sammelt die Einwilligung mit Checkbox und Datenschutzlink, die du im Editor formulierst.",
      },
    ],
    relatedSlugs: ["quiz", "masterclass", "termin-buchen"],
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
    h1: "Webinar-Funnel-Vorlage: Anmeldung zur Live-Masterclass",
    longDescription: [
      "Die Vorlage bringt Thema, Termin und Countdown auf die Startseite, listet die drei Lernpunkte des Webinars und führt über eine Qualifizierungsfrage zur Anmeldung mit Name und E-Mail. Der Countdown macht sichtbar, dass es um einen Live-Termin geht und nicht um ein Video von irgendwann.",
      "Gedacht ist sie für Trainer, Software-Anbieter, Verbände und Berater, die regelmäßig Live-Sessions halten. Gegenüber einer Standard-Anmeldeseite mit langem Formular gewinnst du Kontext: Du weißt vor dem Termin, mit welchem Vorwissen die Teilnehmer kommen — und kannst Inhalte und Nachfass danach ausrichten.",
    ],
    useCases: [
      {
        title: "Live-Masterclass für Coaches",
        text: "Termin, Countdown und Lerninhalte zeigen, dann nach der aktuellen Herausforderung fragen.",
      },
      {
        title: "Produkt-Webinar im B2B",
        text: "Anmeldungen mit Rolle und Teamgröße anreichern, damit der Vertrieb weiß, wer im Call sitzt.",
      },
      {
        title: "Info-Abend für Bildungsangebote",
        text: "Anmeldungen für Online-Infoveranstaltungen zu Kursen, Studiengängen oder Weiterbildungen einsammeln.",
      },
    ],
    faqs: [
      {
        q: "Was kostet der Webinar-Funnel?",
        a: "Er läuft im dauerhaft kostenlosen Free-Plan: ein veröffentlichter Funnel, 100 sichtbare Leads pro Monat, alle Editor-Features. Wenn du mehrere Termine parallel bewirbst oder mehr Anmeldungen brauchst, kostet Pro 49 EUR pro Monat inkl. MwSt. — mit 14 Tagen Testphase ohne Kreditkarte.",
      },
      {
        q: "Wie schnell ist die Webinar-Anmeldung live?",
        a: "Meist in unter einer Stunde: Thema, Datum und Uhrzeit eintragen, Countdown auf den Termin setzen, Lernpunkte formulieren, veröffentlichen.",
      },
      {
        q: "Wie kommen die Teilnehmer an den Zugangslink?",
        a: "Über dein Webinar-Tool: Der Funnel übergibt die Anmeldung per Webhook (Zapier- und Make-kompatibel), dein Tool verschickt Zugangslink und Erinnerungen. Alternativ exportierst du die Anmeldungen als CSV.",
      },
      {
        q: "Was passiert nach dem Termin mit dem Funnel?",
        a: "Du kannst ihn auf die Aufzeichnung umstellen: Countdown entfernen, Text auf „Replay ansehen“ ändern — der Link bleibt gleich und gesammelte Backlinks gehen nicht verloren.",
      },
    ],
    relatedSlugs: ["lead-magnet", "vsl", "coaching-angebot"],
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
    h1: "Funnel-Vorlage: Immobilienbewertung für Makler",
    longDescription: [
      "Der Funnel fragt Schritt für Schritt ab, was für eine Einschätzung nötig ist: Objektart, Lage, Wohnfläche, Zustand und Verkaufsabsicht — jede Angabe auf einer eigenen Seite. Erst danach kommen Name, E-Mail und Telefonnummer für die Übermittlung der Bewertung.",
      "Die Vorlage richtet sich an Makler und Maklerbüros, die Eigentümerkontakte aufbauen wollen. Im Vergleich zu gekauften Portal-Leads gehört dir hier der Kontakt exklusiv, und im Vergleich zum reinen Rückrufformular hast du schon die Objektdaten — das erste Telefonat startet mit einer konkreten Einschätzung statt mit Grundfragen.",
    ],
    useCases: [
      {
        title: "Eigentümer-Leads für Makler",
        text: "Objektdaten strukturiert erfassen und den Erstkontakt mit einer belastbaren Preisspanne eröffnen.",
      },
      {
        title: "Kampagne für ein Stadtviertel",
        text: "Anzeigen oder Postwurf mit QR-Code je Quartier, dazu ein Funnel mit passendem Lage-Text.",
      },
      {
        title: "Vermietung und Sondersituationen",
        text: "Über eine Auswahlfrage zwischen Verkauf, Vermietung und Erbfall trennen und entsprechend nachfassen.",
      },
    ],
    faqs: [
      {
        q: "Was kostet der Immobilien-Bewertungs-Funnel?",
        a: "Im dauerhaft kostenlosen Free-Plan ist er kostenlos nutzbar: ein veröffentlichter Funnel, 100 sichtbare Leads pro Monat, alle Editor-Features. Für unbegrenzte Leads, eigene Domain und mehrere Standort-Funnels kostet Pro 49 EUR pro Monat inkl. MwSt. — 14 Tage testbar ohne Kreditkarte.",
      },
      {
        q: "Wie schnell ist der Bewertungs-Funnel live?",
        a: "Meist an einem Vormittag: Fragenkatalog auf dein Marktgebiet anpassen, Logo und Farben setzen, Text zur Bewertung schreiben, veröffentlichen.",
      },
      {
        q: "Berechnet der Funnel den Immobilienwert automatisch?",
        a: "Nein — er sammelt die Objektdaten strukturiert ein. Die Bewertung erstellst du selbst oder mit deinem Bewertungstool und schickst sie an den Eigentümer. Das ist ehrlicher als eine Sofortzahl und liefert dir den Gesprächsanlass.",
      },
      {
        q: "Wie viele Fragen verträgt so ein Funnel?",
        a: "Sechs bis acht sind bei Eigentümern erfahrungsgemäß machbar, weil die Motivation hoch ist. Wichtig ist, dass die Kontaktdaten am Ende stehen und der Fortschritt sichtbar bleibt.",
      },
    ],
    relatedSlugs: ["termin-buchen", "lead-magnet", "quiz"],
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
    h1: "Funnel-Vorlage: Agentur-Onboarding für Neukunden-Anfragen",
    longDescription: [
      "Die Vorlage führt Anfragende durch die Punkte, die jedes Erstgespräch ohnehin klärt: Projektziel, gewünschte Leistung, Budgetrahmen und Zeitplan. Am Ende stehen Firmenname und Ansprechpartner — die Anfrage kommt also fertig sortiert bei dir an.",
      "Sie ist für Agenturen, Freelancer und Studios gedacht, deren Postfach voll unklarer „Können Sie mir ein Angebot machen?“-Mails ist. Der Unterschied zum offenen Kontaktformular: Du erkennst schon vor dem Call, ob Projekt und Budget zusammenpassen, und sparst dir Gespräche, die ohnehin nirgends hinführen.",
    ],
    useCases: [
      {
        title: "Anfragen-Vorqualifizierung",
        text: "Budget und Timing abfragen, bevor ein Kalendertermin vergeben wird — weniger Gespräche, bessere Trefferquote.",
      },
      {
        title: "Briefing vor Projektstart",
        text: "Nach der Zusage als strukturiertes Briefing nutzen, damit Ziele und Zuständigkeiten schriftlich vorliegen.",
      },
      {
        title: "Ausschreibungen und Pitches",
        text: "Anfragen mit vergleichbaren Angaben sammeln, statt jede Mail einzeln zu interpretieren.",
      },
    ],
    faqs: [
      {
        q: "Was kostet der Onboarding-Funnel?",
        a: "Er ist im dauerhaft kostenlosen Free-Plan nutzbar: ein veröffentlichter Funnel, 100 sichtbare Leads pro Monat und alle Editor-Features. Agenturen mit mehreren Funnels, Teamzugängen und eigener Domain nehmen Pro für 49 EUR pro Monat inkl. MwSt., vorab 14 Tage testbar ohne Kreditkarte.",
      },
      {
        q: "Wie schnell ist der Onboarding-Funnel live?",
        a: "Meist in unter einer Stunde. Leistungen und Budgetstufen anpassen, Farben und Logo setzen, veröffentlichen — danach verlinkst du ihn aus Website, Signatur und Angeboten.",
      },
      {
        q: "Soll ich wirklich nach dem Budget fragen?",
        a: "Ja, aber als Spanne zum Auswählen statt als Freitextfeld. Das senkt die Hemmschwelle und trennt trotzdem 2.000-Euro-Anfragen von 20.000-Euro-Projekten.",
      },
      {
        q: "Können mehrere Leute im Team die Anfragen sehen?",
        a: "Im Pro-Plan gibt es Team-Zugänge, sodass Projektleitung und Vertrieb dieselben Leads sehen. Zusätzlich lassen sich Anfragen per Webhook ins CRM oder Projekttool spiegeln.",
      },
    ],
    relatedSlugs: ["termin-buchen", "umfrage", "coaching-angebot"],
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
    h1: "Quiz-Funnel-Vorlage mit persönlichen Ergebnis-Typen",
    longDescription: [
      "Die Vorlage besteht aus mehreren Auswahlfragen, einer Kontaktseite und der Ergebnisausgabe: Je nach Antwortmuster bekommt der Teilnehmer einen Typ mit passender Empfehlung. Die Fragen sind bewusst kurz und klickbar — niemand tippt, jeder sieht seinen Fortschritt.",
      "Eingesetzt wird sie überall dort, wo Menschen sich selbst einordnen wollen, bevor sie kaufen: Beratung, Fitness, Finanzen, Software-Auswahl oder Produktempfehlungen. Gegenüber einem nüchternen Formular gewinnst du Abschlüsse, weil das Ergebnis ein echter Anreiz ist — und du erhältst nebenbei ein Antwortprofil statt nur einer E-Mail-Adresse.",
    ],
    useCases: [
      {
        title: "Typ-Test zur Selbsteinordnung",
        text: "„Welcher Typ bist du?“ als Einstieg in ein Beratungs- oder Coachingangebot, mit Empfehlung im Ergebnis.",
      },
      {
        title: "Produktfinder im Onlinehandel",
        text: "Über drei bis fünf Fragen die passende Variante empfehlen, statt Besucher durch den ganzen Katalog zu schicken.",
      },
      {
        title: "Bedarfs-Check im B2B",
        text: "Reifegrad oder Ist-Zustand abfragen und mit dem Ergebnis den Aufhänger für das Vertriebsgespräch liefern.",
      },
    ],
    faqs: [
      {
        q: "Was kostet der Quiz-Funnel?",
        a: "Der dauerhaft kostenlose Free-Plan reicht für den Start: ein veröffentlichter Funnel, 100 sichtbare Leads pro Monat, alle Editor-Features. Für unbegrenzte Teilnehmer, mehrere Quizze und Conditional Logic in vollem Umfang kostet Pro 49 EUR pro Monat inkl. MwSt. — 14 Tage ohne Kreditkarte testbar.",
      },
      {
        q: "Wie schnell ist das Quiz live?",
        a: "Sobald Fragen und Ergebnistexte stehen, oft in ein bis zwei Stunden. Die Struktur ist fertig — du ersetzt Fragen, Antwortoptionen und die Beschreibung je Ergebnistyp.",
      },
      {
        q: "Wie viele Fragen und Ergebnistypen sind sinnvoll?",
        a: "Fünf bis sieben Fragen und drei bis vier Typen sind ein guter Rahmen: genug für ein glaubwürdiges Ergebnis, kurz genug fürs Handy.",
      },
      {
        q: "Muss man Kontaktdaten hinterlassen, um das Ergebnis zu sehen?",
        a: "Das entscheidest du. Ergebnis erst nach der E-Mail bringt mehr Leads, Ergebnis vorher bringt mehr Abschlüsse und mehr Weiterempfehlungen. Beide Varianten lassen sich im Pro-Plan per A/B-Test vergleichen.",
      },
    ],
    relatedSlugs: ["lead-magnet", "umfrage", "immobilien-bewertung"],
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
    h1: "Funnel-Vorlage: Coaching-Angebot verkaufen",
    longDescription: [
      "Die Vorlage stellt dein Coaching mit Nutzen, Ablauf und Ergebnis vor, lässt danach zwischen Paketen wählen — etwa Einzelcoaching, Gruppenprogramm oder Intensivwoche — und führt die Auswahl in eine Kontaktseite. Die Paketwahl ist dabei kein Kaufabschluss, sondern eine Absichtserklärung, die dein Gespräch vorbereitet.",
      "Sie eignet sich für Coaches, Berater und Trainer mit erklärungsbedürftigen Angeboten oberhalb der Impulskauf-Grenze. Statt einer Verkaufsseite mit drei Preisboxen und einem Formular ganz unten bekommst du einen geführten Ablauf, in dem Interessenten sich Schritt für Schritt festlegen — und du siehst, welches Paket sie im Kopf hatten.",
    ],
    useCases: [
      {
        title: "1:1-Coaching mit Paketstufen",
        text: "Drei Betreuungsstufen zur Wahl stellen und im Gespräch dort ansetzen, wo der Interessent selbst geklickt hat.",
      },
      {
        title: "Gruppenprogramm mit Startdatum",
        text: "Programminhalte zeigen, Kohorte wählen lassen und Interessenten für die Warteliste einsammeln.",
      },
      {
        title: "Beratungsmandat im B2B",
        text: "Leistungsumfang und Laufzeit auswählen lassen, bevor das Angebot geschrieben wird.",
      },
    ],
    faqs: [
      {
        q: "Was kostet der Coaching-Sales-Funnel?",
        a: "Im dauerhaft kostenlosen Free-Plan nichts: ein veröffentlichter Funnel, 100 sichtbare Leads pro Monat und alle Editor-Features. Für mehrere Angebote, eigene Domain und A/B-Tests kostet Pro 49 EUR pro Monat inkl. MwSt. — vorher 14 Tage kostenlos testen, ohne Kreditkarte.",
      },
      {
        q: "Wie schnell ist der Coaching-Funnel live?",
        a: "Wenn deine Pakete definiert sind, meist in unter einer Stunde: Texte einsetzen, Paketkarten anpassen, Kontaktseite formulieren, veröffentlichen.",
      },
      {
        q: "Kann ich damit direkt Zahlungen entgegennehmen?",
        a: "Die Vorlage sammelt Kaufinteresse und Kontaktdaten; den Abschluss machst du im Gespräch oder über deinen Zahlungsanbieter, auf den du von der Abschlussseite aus verlinkst.",
      },
      {
        q: "Soll ich Preise im Funnel nennen?",
        a: "Bei niedrigen bis mittleren Preisen ja — das spart Gespräche mit falschen Erwartungen. Bei individuellen Mandaten reicht eine Spanne oder die Angabe „ab“, damit die Anfrage nicht an einer Zahl scheitert.",
      },
    ],
    relatedSlugs: ["vsl", "termin-buchen", "masterclass"],
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
    h1: "Funnel-Vorlage: Kundenumfrage und Feedback einsammeln",
    longDescription: [
      "Die Vorlage zerlegt die Umfrage in einzelne Schritte: Zufriedenheit, Verbesserungswunsch, Weiterempfehlung und eine offene Frage — jeweils eine Seite, mit Fortschrittsanzeige. Kontaktdaten sind optional, sodass auch anonymes Feedback möglich bleibt.",
      "Gedacht ist sie für Teams, die nach Projekten, Käufen oder Veranstaltungen wissen wollen, was gut lief. Gegenüber dem langen Fragebogen, dessen Scrollbalken schon abschreckt, brechen deutlich weniger Leute ab — und die Antworten liegen als CSV bereit, statt in einzelnen E-Mails zu versanden.",
    ],
    useCases: [
      {
        title: "Feedback nach Projektabschluss",
        text: "Direkt nach Übergabe fragen, solange die Erinnerung frisch ist — und die Antwort als Referenz-Grundlage nutzen.",
      },
      {
        title: "Veranstaltungs-Nachbefragung",
        text: "QR-Code am Ausgang oder Link in der Danke-Mail, drei Fragen, fertig.",
      },
      {
        title: "Interne Mitarbeiterbefragung",
        text: "Stimmung und Verbesserungsideen anonym einsammeln, ohne dass jemand ein Konto braucht.",
      },
    ],
    faqs: [
      {
        q: "Was kostet der Umfrage-Funnel?",
        a: "Er ist im dauerhaft kostenlosen Free-Plan enthalten: ein veröffentlichter Funnel, 100 sichtbare Antworten pro Monat, alle Editor-Features. Bei größeren Befragungen oder mehreren parallelen Umfragen kostet Pro 49 EUR pro Monat inkl. MwSt., 14 Tage testbar ohne Kreditkarte.",
      },
      {
        q: "Wie schnell ist die Umfrage live?",
        a: "Häufig in 20 bis 30 Minuten: Fragen ersetzen, Antwortskalen anpassen, Abschlusstext schreiben, veröffentlichen. Den Link kannst du danach per E-Mail, QR-Code oder Messenger verteilen.",
      },
      {
        q: "Kann ich Antworten anonym erfassen?",
        a: "Ja. Lass die Kontaktfelder weg oder markiere sie als optional. Die Analytics sind cookielos und ohne Fremd-Tracker, das Hosting liegt in der EU.",
      },
      {
        q: "Wie werte ich die Ergebnisse aus?",
        a: "Über die Lead-Ansicht im Dashboard oder per CSV-Export in Tabellen und BI-Tools. Für automatische Weitergabe an dein System gibt es Webhooks, die mit Zapier und Make funktionieren.",
      },
    ],
    relatedSlugs: ["quiz", "agentur-onboarding", "lead-magnet"],
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

/** Alle Galerie-Seiten für Sitemap + SSR-Meta-Injektion (Index + Detailseiten).
 *  jsonLd (FAQPage + BreadcrumbList) und bodyHtml (noscript-Prerender) werden
 *  serverseitig mit injiziert. */
export const templateSeoPages: SeoStaticPage[] = [
  vorlagenIndexPage,
  ...templateMetas.map((t) => ({
    path: `${TEMPLATE_GALLERY_PATH}/${t.slug}`,
    metaTitle: t.metaTitle,
    metaDescription: t.metaDescription,
    bodyHtml: renderTemplateHtml(t),
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        ...(t.faqs?.length ? [faqPageJsonLd(t.faqs)] : []),
        breadcrumbJsonLd([
          { name: "Start", path: "/" },
          { name: "Vorlagen", path: TEMPLATE_GALLERY_PATH },
          { name: t.name, path: `${TEMPLATE_GALLERY_PATH}/${t.slug}` },
        ]),
      ],
    },
  })),
];

/** Registry-Lookup, gehärtet gegen Prototype-Keys. */
export function getTemplateMeta(slug: string | undefined): TemplateMeta | undefined {
  if (!slug) return undefined;
  return templateMetas.find((t) => t.slug === slug);
}
