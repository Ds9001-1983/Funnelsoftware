/**
 * SEO-Content-Registry für die Marketing-/Keyword-Seiten (/vergleich/:slug,
 * /funnel-builder). Reine Daten ohne React-Imports — wird sowohl vom Client
 * (Lazy-Page client/src/pages/vergleich.tsx) als auch vom Server genutzt
 * (Sitemap in server/routes.ts, SSR-Meta-Injektion in server/static.ts).
 *
 * WICHTIG: Haupt-Bundle-Code (App.tsx, MarketingFooter, Landing) darf diese
 * Datei NICHT importieren, sonst landet der gesamte Content im Haupt-Bundle
 * statt im Lazy-Chunk — dafür gibt es das leichte shared/seo-links.ts.
 */

import { funnelBuilderPage, type SeoFaq, type SeoStaticPage } from "./seo-links";
import { templateSeoPages } from "./template-meta";

export { faqPageJsonLd } from "./seo-links";
export type { SeoFaq, SeoStaticPage } from "./seo-links";

export interface SeoComparisonRow {
  label: string;
  trichterwerk: boolean | string;
  competitor: boolean | string;
}

export interface ComparisonPageContent {
  slug: string;
  competitorName: string;
  /** Ohne " | Trichterwerk"-Suffix (kommt aus usePageMeta), Ziel ≤ 55 Zeichen. */
  metaTitle: string;
  /** Ziel ≤ 155 Zeichen. */
  metaDescription: string;
  h1: string;
  /** Intro-Absätze. */
  intro: string[];
  /** TL;DR-Verdict-Box direkt unter dem Intro. */
  verdict: string;
  painPoints: { title: string; text: string }[];
  comparisonRows: SeoComparisonRow[];
  featureSections: { title: string; text: string }[];
  pricingComparison: { title: string; text: string[] };
  honestSection: { title: string; text: string };
  migrationSteps: { title: string; text: string }[];
  faqs: SeoFaq[];
  /** Slugs der Schwester-Vergleichsseiten für den „Weitere Vergleiche“-Block. */
  relatedSlugs: string[];
}

export const comparisonPages: Record<string, ComparisonPageContent> = {
  "typeform-alternative": {
    slug: "typeform-alternative",
    competitorName: "Typeform",
    metaTitle: "Typeform-Alternative aus Deutschland – DSGVO-konform",
    metaDescription:
      "Du suchst eine Typeform-Alternative? Trichterwerk: deutscher Funnel-Builder, DSGVO-konform mit EU-Hosting, ab 49 €/Monat. 14 Tage kostenlos testen.",
    h1: "Die Typeform-Alternative aus Deutschland: DSGVO-konform, auf Deutsch, ab 49 €",
    intro: [
      "Typeform ist ein starkes Tool für schöne Formulare und Umfragen — keine Frage. Aber viele Nutzer aus dem DACH-Raum stoßen an Grenzen: Die Datenverarbeitung läuft teils über US-Dienste (DSGVO-Grauzone), Support und Oberfläche sind englischsprachig, und für einen kompletten Funnel mit Landingpage, Logik und Analytics brauchst du zusätzliche Tools.",
      "Trichterwerk ist der deutsche Funnel-Builder: Formulare, Quiz-Logik und komplette Landingpages in einem Tool — mit Hosting in der EU und deutschem Support. Statt einzelner Formulare baust du mit unserem Funnel-Builder komplette Strecken vom ersten Klick bis zum qualifizierten Lead.",
    ],
    verdict:
      "Kurz gesagt: Wenn du DSGVO-konforme Funnels mit eigener Domain, Conditional Logic und Analytics willst — ohne Tool-Stack aus Typeform + Landingpage-Builder + Analytics — ist Trichterwerk die passende Alternative aus Deutschland. 14 Tage kostenlos testen.",
    painPoints: [
      {
        title: "DSGVO & US-Datentransfer",
        text: "Typeform sitzt zwar in Spanien, setzt aber US-Subdienstleister ein. Für eine rechtssichere Nutzung musst du Auftragsverarbeitung und Drittlandtransfers selbst prüfen und dokumentieren — ein Risiko, das viele Datenschutzbeauftragte nicht mittragen. Trichterwerk hostet ausschließlich in der EU.",
      },
      {
        title: "Antwort-Limits und steigende Preise",
        text: "Typeform rechnet pro Antwort ab: Je mehr Leads du sammelst, desto teurer wird es. Wer erfolgreich Kampagnen fährt, rutscht schnell in die höheren Pläne. Bei Trichterwerk sind Leads unbegrenzt — der Preis bleibt gleich.",
      },
      {
        title: "Nur Formulare — kein kompletter Funnel",
        text: "Ein Typeform ist ein Formular. Landingpage, Danke-Seite, A/B-Tests und Conversion-Tracking musst du mit weiteren Tools zusammenstecken. Trichterwerk liefert den kompletten Funnel aus einem Guss — inklusive eigener Domain.",
      },
      {
        title: "Support und Oberfläche auf Englisch",
        text: "Editor, Hilfeartikel und Support sind bei Typeform primär englisch. Wer im Team oder mit Kunden auf Deutsch arbeitet, verliert Zeit. Trichterwerk ist komplett deutsch — von der Oberfläche bis zur Support-Mail.",
      },
    ],
    comparisonRows: [
      { label: "Deutsche Oberfläche & Support", trichterwerk: true, competitor: false },
      { label: "Hosting in der EU / DSGVO-konform", trichterwerk: true, competitor: "prüfungsbedürftig" },
      { label: "Komplette Landingpages statt nur Formulare", trichterwerk: true, competitor: false },
      { label: "Conditional Logic & Quiz", trichterwerk: true, competitor: true },
      { label: "Eigene Domain inklusive", trichterwerk: true, competitor: false },
      { label: "A/B-Tests", trichterwerk: true, competitor: false },
      { label: "Analytics eingebaut (ohne Google Analytics)", trichterwerk: true, competitor: "nur Basis" },
      { label: "Unbegrenzte Leads / Antworten", trichterwerk: true, competitor: "Limits je Plan" },
      { label: "Setup-Zeit bis Launch", trichterwerk: "< 1 h", competitor: "1–2 h + Zusatztools" },
      { label: "Monatspreis", trichterwerk: "49 €, alles inklusive", competitor: "ab ca. 25 $, Limits pro Antwort" },
    ],
    featureSections: [
      {
        title: "Komplette Funnels statt einzelner Formulare",
        text: "Mit Trichterwerk baust du die ganze Strecke: Landingpage mit Hero und Nutzenargumenten, mehrstufige Frage-Seiten, Kontaktformular, Danke-Seite. Alles in einem Editor, alles unter einer URL — ohne Einbettungs-Snippets oder Drittanbieter-Seiten.",
      },
      {
        title: "Mobile-First-Funnels mit Live-Handy-Vorschau",
        text: "Über 80 % der Funnel-Besucher kommen mobil. Jeder Trichterwerk-Funnel ist automatisch für Smartphones optimiert — du gestaltest per Drag & Drop und siehst live die Handy-Vorschau.",
      },
      {
        title: "Conditional Logic wie bei Typeform — plus A/B-Tests",
        text: "Antwortbasierte Verzweigungen kennst du von Typeform. Trichterwerk kann das auch — und zusätzlich echte A/B-Tests: Teste zwei Varianten einer Seite gegeneinander und lass die Conversion entscheiden.",
      },
      {
        title: "Analytics eingebaut, DSGVO-konform ohne Cookies",
        text: "Views, Conversions und Drop-offs pro Seite siehst du direkt im Dashboard — ohne Google Analytics, ohne Cookie-Banner-Stress. Deine Leads exportierst du jederzeit als CSV oder schickst sie per Webhook an dein CRM.",
      },
      {
        title: "Eigene Domain mit SSL inklusive",
        text: "Statt typeform.com-Links läuft dein Funnel unter deiner Domain (z. B. funnel.deine-firma.de) — CNAME eintragen, SSL wird automatisch eingerichtet. Das schafft Vertrauen und stärkt deine Marke.",
      },
    ],
    pricingComparison: {
      title: "Preisvergleich: Typeform vs. Trichterwerk",
      text: [
        "Typeform startet bei rund 25 $ pro Monat — allerdings mit Antwort-Limits. Relevante Funktionen wie erweiterte Logik oder das Entfernen des Typeform-Brandings stecken in höheren Plänen. Realistisch landest du bei 50–80 € monatlich, plus ein separates Landingpage-Tool, wenn du komplette Funnels willst.",
        "Trichterwerk kostet 49 € pro Monat — mit unbegrenzten Funnels, unbegrenzten Leads und allen Features. Keine Antwort-Limits, keine Feature-Staffelung, monatlich kündbar. Die ersten 14 Tage sind kostenlos.",
      ],
    },
    honestSection: {
      title: "Wann Typeform trotzdem die bessere Wahl ist",
      text: "Ehrlich verglichen: Für sehr lange, klassische Umfragen und Forschungs-Surveys mit hunderten Fragen ist Typeform stark. Auch das native Integrations-Ökosystem ist größer, und englischsprachige Teams fühlen sich dort zu Hause. Wenn du aber Funnels zur Lead-Generierung im DACH-Raum baust, spielt Trichterwerk seine Stärken aus.",
    },
    migrationSteps: [
      {
        title: "Fragen übernehmen",
        text: "Wähle ein passendes Template (z. B. Lead-Generierung oder Umfrage) und übertrage deine Typeform-Fragen per Copy & Paste. Die meisten Formulare sind in unter einer Stunde nachgebaut.",
      },
      {
        title: "Design anpassen",
        text: "Farben, Logo und Schriften an deine Marke anpassen — der Editor zeigt dir live die Mobile-Ansicht. Danach die eigene Domain verbinden.",
      },
      {
        title: "Live gehen & Leads exportieren",
        text: "Funnel veröffentlichen, alten Typeform-Link umleiten, fertig. Neue Leads landen in deinem Dashboard und per Webhook oder Zapier/Make in deinem CRM.",
      },
    ],
    faqs: [
      {
        q: "Ist Typeform DSGVO-konform?",
        a: "Typeform ist ein spanisches Unternehmen, setzt aber US-Subdienstleister ein. Eine rechtssichere Nutzung erfordert einen Auftragsverarbeitungsvertrag und die eigene Prüfung der Drittlandtransfers. Trichterwerk hostet ausschließlich in der EU und ist auf DSGVO-Konformität ausgelegt.",
      },
      {
        q: "Gibt es eine kostenlose Typeform-Alternative?",
        a: "Trichterwerk kannst du 14 Tage kostenlos mit vollem Funktionsumfang testen — unbegrenzte Funnels, alle Templates, Analytics. Danach kostet der Pro-Plan 49 € pro Monat und ist monatlich kündbar.",
      },
      {
        q: "Kann ich meine Typeform-Formulare zu Trichterwerk umziehen?",
        a: "Einen 1-Klick-Import gibt es nicht — aber mit den fertigen Templates ist ein typisches Formular in unter einer Stunde nachgebaut. Deine bestehenden Leads exportierst du bei Typeform als CSV und behältst sie so vollständig.",
      },
      {
        q: "Was unterscheidet einen Funnel von einem Formular?",
        a: "Ein Funnel führt Besucher Schritt für Schritt: Landingpage → Qualifizierungsfragen → Kontaktdaten → Danke-Seite, mit Logik und Tracking dazwischen. Ein Formular ist nur ein Baustein davon. Genau deshalb ersetzt Trichterwerk oft Typeform plus ein Landingpage-Tool.",
      },
      {
        q: "Gibt es eine Typeform-Alternative auf Deutsch?",
        a: "Ja: Trichterwerk ist komplett auf Deutsch — Oberfläche, Templates und Support. Entwickelt und gehostet in Deutschland bzw. der EU.",
      },
      {
        q: "Welche Typeform-Alternativen gibt es noch?",
        a: "Häufig verglichen werden Perspective (Mobile Funnels, ab 99 €/Monat) und ClickFunnels (US-Tool, englischsprachig). Beide haben wir in eigenen Vergleichen gegenübergestellt.",
      },
    ],
    relatedSlugs: ["perspective-alternative", "clickfunnels-alternative"],
  },

  "perspective-alternative": {
    slug: "perspective-alternative",
    competitorName: "Perspective",
    metaTitle: "Perspective-Alternative: Funnels ab 49 € statt 99 €",
    metaDescription:
      "Perspective-Alternative gesucht? Trichterwerk bietet Mobile-First-Funnels mit A/B-Tests und Analytics für 49 €/Monat — die Hälfte. 14 Tage kostenlos testen.",
    h1: "Die Perspective-Alternative: gleiche Funnel-Power, halber Preis",
    intro: [
      "Perspective hat Mobile-Funnels im DACH-Raum populär gemacht — und ist ein gutes Tool. Aber ab 99 € pro Monat ist der Einstieg happig, gerade für Solo-Selbstständige, Coaches und kleine Agenturen, die gerade erst mit Funnels starten.",
      "Trichterwerk bietet als deutscher Funnel-Builder dieselbe Kernidee — mobile-optimierte, mehrstufige Funnels per Drag & Drop — für 49 € im Monat: mit unbegrenzten Funnels und Leads, A/B-Tests, eingebauten Analytics und eigener Domain. Ebenfalls DSGVO-konform mit EU-Hosting, ebenfalls auf Deutsch.",
    ],
    verdict:
      "Kurz gesagt: Wer Mobile-First-Funnels wie bei Perspective will, aber keine 99 €+ im Monat zahlen möchte, bekommt mit Trichterwerk den vollen Funktionsumfang — inklusive A/B-Tests — für 49 €. 14 Tage kostenlos testen.",
    painPoints: [
      {
        title: "Einstiegspreis ab 99 € pro Monat",
        text: "Perspective startet preislich deutlich höher — für viele Selbstständige und kleine Teams schwer zu rechtfertigen, bevor der Funnel überhaupt Leads bringt. Trichterwerk kostet 49 € mit allen Features und ist damit etwa halb so teuer.",
      },
      {
        title: "Funktionen hinter höheren Plänen",
        text: "Wie bei vielen Funnel-Tools sind manche Funktionen und Limits an teurere Pläne gekoppelt. Bei Trichterwerk gibt es genau einen Pro-Plan: alle Features, unbegrenzte Funnels, unbegrenzte Leads — ohne Staffelung.",
      },
      {
        title: "Keine A/B-Tests",
        text: "Wer wissen will, welche Headline oder welches Angebot besser konvertiert, braucht A/B-Tests. Trichterwerk hat sie eingebaut: Zwei Seiten-Varianten gegeneinander testen und datenbasiert entscheiden.",
      },
    ],
    comparisonRows: [
      { label: "Deutsche Oberfläche & Support", trichterwerk: true, competitor: true },
      { label: "Hosting in der EU / DSGVO-konform", trichterwerk: true, competitor: true },
      { label: "Live-Handy-Vorschau im Editor", trichterwerk: true, competitor: true },
      { label: "Conditional Logic & Quiz", trichterwerk: true, competitor: true },
      { label: "A/B-Tests", trichterwerk: true, competitor: false },
      { label: "Eigene Domain inklusive", trichterwerk: true, competitor: true },
      { label: "Unbegrenzte Funnels & Leads", trichterwerk: true, competitor: "je nach Plan" },
      { label: "Analytics eingebaut (cookieless)", trichterwerk: true, competitor: true },
      { label: "Setup-Zeit bis Launch", trichterwerk: "< 1 h", competitor: "1–2 h" },
      { label: "Monatspreis", trichterwerk: "49 €, alles inklusive", competitor: "ab ca. 99 €" },
    ],
    featureSections: [
      {
        title: "Mobile-First — genau wie Perspective",
        text: "Trichterwerk ist von Grund auf für mobile Besucher gebaut: Jeder Funnel wird automatisch fürs Smartphone optimiert, der Editor zeigt dir die Handy-Vorschau live beim Bauen. Perfekt für Traffic aus Instagram, TikTok und Meta Ads.",
      },
      {
        title: "A/B-Tests inklusive — der Unterschied",
        text: "Der größte funktionale Unterschied: Trichterwerk bringt A/B-Tests mit. Teste zwei Varianten einer Seite gegeneinander und finde heraus, welche Headline, welches Bild oder welches Angebot mehr Leads bringt — ohne Zusatztool, ohne Aufpreis.",
      },
      {
        title: "Ein Plan, alle Features",
        text: "49 € pro Monat, Punkt. Unbegrenzte Funnels, unbegrenzte Leads, alle Templates und Elemente, Conditional Logic, Analytics, eigene Domain, Webhooks. Du musst nie überlegen, ob ein Feature „in deinem Plan“ ist.",
      },
      {
        title: "DSGVO-konform aus Deutschland",
        text: "Wie Perspective setzt Trichterwerk auf DSGVO-Konformität — mit Hosting in der EU, cookielosen Analytics und deutschem Support. Hier nehmen sich beide Tools nichts; der Unterschied liegt im Preis und den Features.",
      },
    ],
    pricingComparison: {
      title: "Preisvergleich: Perspective vs. Trichterwerk",
      text: [
        "Perspective startet bei rund 99 € pro Monat. Für Agenturen mit vielen Kundenprojekten mag sich das rechnen — für Solo-Selbstständige und kleine Teams ist es eine hohe Fixkostenhürde, bevor der erste Lead da ist.",
        "Trichterwerk kostet 49 € pro Monat — alles inklusive, monatlich kündbar, 14 Tage kostenlos testbar. Aufs Jahr gerechnet sparst du gegenüber dem Perspective-Einstieg etwa 600 €.",
      ],
    },
    honestSection: {
      title: "Wann Perspective trotzdem die bessere Wahl ist",
      text: "Ehrlich verglichen: Perspective ist länger am Markt, hat ein größeres Template-Ökosystem und Features wie native Terminbuchung tief integriert. Große Agenturen mit hohem Budget und speziellen Workflow-Anforderungen sind dort gut aufgehoben. Wer dagegen schlanke, konvertierende Funnels zum fairen Preis will, fährt mit Trichterwerk besser.",
    },
    migrationSteps: [
      {
        title: "Funnel-Struktur übernehmen",
        text: "Seiten und Fragen deines Perspective-Funnels in einem Trichterwerk-Template nachbauen — die Element-Typen (Text, Bild, Formular, Quiz-Fragen, Slider) sind vergleichbar.",
      },
      {
        title: "Design & Domain anpassen",
        text: "Farben und Logo hinterlegen, eigene Domain per CNAME verbinden — SSL wird automatisch eingerichtet. Die Mobile-Vorschau zeigt dir sofort, wie der Funnel beim Besucher aussieht.",
      },
      {
        title: "Traffic umleiten & testen",
        text: "Ads auf die neue Funnel-URL zeigen lassen, Leads laufen ab sofort in Trichterwerk auf. Tipp: Direkt einen A/B-Test aufsetzen — das kann Perspective nicht.",
      },
    ],
    faqs: [
      {
        q: "Was kostet Perspective im Vergleich zu Trichterwerk?",
        a: "Perspective startet bei rund 99 € pro Monat, Trichterwerk kostet 49 € pro Monat mit allen Features, unbegrenzten Funnels und Leads. Beide sind monatlich kündbar.",
      },
      {
        q: "Ist Trichterwerk wie Perspective DSGVO-konform?",
        a: "Ja. Trichterwerk hostet ausschließlich in der EU, nutzt cookielose Analytics und bietet deutsche Vertragsunterlagen (AVV). In puncto Datenschutz nehmen sich beide Tools nichts.",
      },
      {
        q: "Hat Trichterwerk auch Mobile-Funnels?",
        a: "Ja — Mobile-First ist der Kern: Jeder Funnel wird automatisch für Smartphones optimiert, mit Live-Handy-Vorschau im Editor. Ideal für Traffic aus Social Ads.",
      },
      {
        q: "Kann ich meinen Perspective-Funnel importieren?",
        a: "Einen automatischen Import gibt es nicht, aber die Struktur (Seiten, Fragen, Formulare) ist in unter einer Stunde nachgebaut. Deine Bestands-Leads exportierst du bei Perspective als CSV.",
      },
      {
        q: "Was hat Trichterwerk, das Perspective nicht hat?",
        a: "Vor allem A/B-Tests (bei Perspective nicht verfügbar) und einen einzigen All-inclusive-Plan für 49 € statt gestaffelter Pläne ab 99 €.",
      },
    ],
    relatedSlugs: ["typeform-alternative", "clickfunnels-alternative"],
  },

  "clickfunnels-alternative": {
    slug: "clickfunnels-alternative",
    competitorName: "ClickFunnels",
    metaTitle: "ClickFunnels-Alternative auf Deutsch – DSGVO-konform",
    metaDescription:
      "ClickFunnels-Alternative für den DACH-Raum: Trichterwerk — deutscher Funnel-Builder, EU-Hosting, 49 €/Monat statt 97 $+. 14 Tage kostenlos testen.",
    h1: "Die ClickFunnels-Alternative auf Deutsch: DSGVO-konform und ohne Dollar-Abo",
    intro: [
      "ClickFunnels hat den Begriff „Funnel“ geprägt und ist im US-Markt der Platzhirsch. Für Nutzer aus Deutschland, Österreich und der Schweiz gibt es aber handfeste Probleme: englische Oberfläche, Abrechnung in US-Dollar ab rund 97 $ pro Monat, Datenverarbeitung in den USA — und ein Funktionsumfang, der auf US-Infoprodukt-Marketing zugeschnitten ist.",
      "Trichterwerk ist die Alternative für den DACH-Raum: ein deutscher Funnel-Builder mit EU-Hosting, deutscher Oberfläche und deutschem Support — für 49 € im Monat. Fokussiert auf das, was Coaches, Berater, Dienstleister und Recruiter hier wirklich brauchen: Leads sammeln, qualifizieren, konvertieren.",
    ],
    verdict:
      "Kurz gesagt: Wenn du Funnels für den deutschsprachigen Markt baust und Wert auf DSGVO, deutsche Oberfläche und kalkulierbare Euro-Preise legst, ist Trichterwerk die passende ClickFunnels-Alternative — für etwa die Hälfte des Preises. 14 Tage kostenlos testen.",
    painPoints: [
      {
        title: "DSGVO & Datenverarbeitung in den USA",
        text: "ClickFunnels ist ein US-Unternehmen — Lead-Daten deiner Besucher landen auf US-Servern. Für DSGVO-konforme Lead-Generierung im DACH-Raum ein erhebliches Risiko. Trichterwerk hostet ausschließlich in der EU.",
      },
      {
        title: "Englische Oberfläche, englischer Support",
        text: "Editor, Vorlagen und Support sind bei ClickFunnels englisch, die Templates auf US-Marketing-Sprache getrimmt. Trichterwerk ist komplett deutsch — inklusive Templates, die für den DACH-Markt geschrieben sind.",
      },
      {
        title: "Dollar-Preise ab ca. 97 $ pro Monat",
        text: "ClickFunnels startet bei rund 97 $ monatlich, abgerechnet in US-Dollar mit Wechselkursrisiko. Trichterwerk kostet 49 € — transparent, in Euro, mit deutscher Rechnung und ausgewiesener Mehrwertsteuer.",
      },
      {
        title: "Überladen für den typischen Anwendungsfall",
        text: "Kurse, Communities, E-Mail-Automationen, Affiliate-Center — ClickFunnels will eine All-in-One-Plattform sein. Wer „nur“ konvertierende Lead-Funnels braucht, zahlt für viel Ballast mit. Trichterwerk konzentriert sich auf den Funnel.",
      },
    ],
    comparisonRows: [
      { label: "Deutsche Oberfläche & Support", trichterwerk: true, competitor: false },
      { label: "Hosting in der EU / DSGVO-konform", trichterwerk: true, competitor: false },
      { label: "Abrechnung in Euro (inkl. MwSt.-Ausweis)", trichterwerk: true, competitor: false },
      { label: "Live-Handy-Vorschau im Editor", trichterwerk: true, competitor: "eingeschränkt" },
      { label: "Conditional Logic & Quiz", trichterwerk: true, competitor: "eingeschränkt" },
      { label: "A/B-Tests", trichterwerk: true, competitor: true },
      { label: "Eigene Domain inklusive", trichterwerk: true, competitor: true },
      { label: "Kurs-/Membership-Funktionen", trichterwerk: false, competitor: true },
      { label: "Setup-Zeit bis Launch", trichterwerk: "< 1 h", competitor: "mehrere Stunden" },
      { label: "Monatspreis", trichterwerk: "49 €, alles inklusive", competitor: "ab ca. 97 $" },
    ],
    featureSections: [
      {
        title: "Gebaut für den DACH-Markt",
        text: "Deutsche Oberfläche, deutsche Templates, deutscher Support, Rechnungen in Euro mit MwSt.-Ausweis. Und rechtlich sauber: EU-Hosting, AVV, cookielose Analytics — Punkte, bei denen US-Tools strukturell nicht mithalten können.",
      },
      {
        title: "Mobile-First statt Desktop-Denke",
        text: "ClickFunnels stammt aus der Desktop-Ära der Sales-Letter-Seiten. Trichterwerk ist für den heutigen Traffic gebaut: mobile Besucher aus Instagram, TikTok und Meta Ads, die in mehrstufigen, schnellen Funnels konvertieren.",
      },
      {
        title: "Qualifizierung mit Logik statt langer Salespages",
        text: "Mit Conditional Logic, Quiz-Fragen und mehrstufigen Formularen qualifizierst du Interessenten Schritt für Schritt — die im DACH-Raum bewährte Alternative zur US-typischen Longform-Salespage.",
      },
      {
        title: "A/B-Tests und Analytics eingebaut",
        text: "Wie ClickFunnels kann Trichterwerk A/B-Tests — dazu Live-Analytics mit Views, Conversions und Drop-offs pro Seite, ganz ohne Google Analytics und ohne Cookies. Leads gehen per CSV, Webhook oder Zapier/Make in dein CRM.",
      },
    ],
    pricingComparison: {
      title: "Preisvergleich: ClickFunnels vs. Trichterwerk",
      text: [
        "ClickFunnels startet bei rund 97 $ pro Monat (Jahreszahlung teils günstiger), abgerechnet in US-Dollar. Dazu kommen für viele Nutzer Zusatzkosten für Tools, die die US-Plattform im DACH-Kontext nicht abdeckt (z. B. DSGVO-konformes Tracking).",
        "Trichterwerk kostet 49 € pro Monat — alle Features, unbegrenzte Funnels und Leads, monatlich kündbar, 14 Tage kostenlos. Das ist ungefähr die Hälfte, ohne Wechselkursrisiko und mit deutscher Rechnung.",
      ],
    },
    honestSection: {
      title: "Wann ClickFunnels trotzdem die bessere Wahl ist",
      text: "Ehrlich verglichen: Wer eine All-in-One-Plattform mit Online-Kursen, Membership-Bereichen, E-Mail-Automationen und Affiliate-Programm sucht — und primär den englischsprachigen Markt bedient — bekommt bei ClickFunnels ein riesiges Ökosystem. Für fokussierte Lead- und Verkaufs-Funnels im DACH-Raum ist Trichterwerk die schlankere, günstigere und rechtssichere Wahl.",
    },
    migrationSteps: [
      {
        title: "Funnel-Logik übertragen",
        text: "Die Seitenstruktur deines ClickFunnels-Funnels (Optin → Qualifizierung → Kontakt → Danke) mit einem Trichterwerk-Template nachbauen — Texte übersetzen bzw. übernehmen.",
      },
      {
        title: "Domain & Design umziehen",
        text: "Deine Funnel-Domain per CNAME auf Trichterwerk zeigen lassen, Farben und Logo hinterlegen. SSL wird automatisch eingerichtet — meist in wenigen Minuten.",
      },
      {
        title: "Leads sichern & live gehen",
        text: "Bestehende Kontakte bei ClickFunnels als CSV exportieren, neuen Funnel veröffentlichen, Ads umstellen. Neue Leads laufen DSGVO-konform in deinem Trichterwerk-Dashboard auf.",
      },
    ],
    faqs: [
      {
        q: "Ist ClickFunnels DSGVO-konform nutzbar?",
        a: "ClickFunnels ist ein US-Anbieter mit Datenverarbeitung in den USA. Eine DSGVO-konforme Nutzung ist aufwendig und bleibt rechtlich riskant. Trichterwerk hostet ausschließlich in der EU und ist auf DSGVO-Konformität ausgelegt.",
      },
      {
        q: "Gibt es eine deutsche Alternative zu ClickFunnels?",
        a: "Ja: Trichterwerk ist ein deutscher Funnel-Builder — deutsche Oberfläche, deutsche Templates, deutscher Support, Euro-Preise, EU-Hosting. Für 49 € pro Monat mit allen Features.",
      },
      {
        q: "Was kostet ClickFunnels im Vergleich?",
        a: "ClickFunnels startet bei rund 97 $ pro Monat, Trichterwerk kostet 49 € pro Monat — ungefähr die Hälfte, inklusive unbegrenzter Funnels, Leads und aller Features.",
      },
      {
        q: "Kann Trichterwerk auch Online-Kurse und Memberships?",
        a: "Nein — Trichterwerk konzentriert sich bewusst auf Funnels zur Lead-Generierung und Qualifizierung. Für Kurse kombinierst du es einfach per Webhook/Zapier mit deiner Kursplattform.",
      },
      {
        q: "Für wen lohnt sich der Wechsel von ClickFunnels?",
        a: "Für alle, die im deutschsprachigen Raum Leads generieren: Coaches, Berater, Agenturen, Dienstleister und Recruiter. Sie sparen rund die Hälfte der Kosten und lösen das DSGVO-Problem.",
      },
    ],
    relatedSlugs: ["typeform-alternative", "perspective-alternative"],
  },
};

/**
 * Alle statischen SEO-Seiten (für Sitemap + SSR-Meta-Injektion).
 * Vergleichsseiten werden aus comparisonPages abgeleitet, die Galerie-Seiten
 * aus shared/template-meta.ts, damit Routen, Sitemap und Server-Meta nicht
 * auseinanderlaufen.
 */
export const seoStaticPages: SeoStaticPage[] = [
  funnelBuilderPage,
  ...Object.values(comparisonPages).map((c) => ({
    path: `/vergleich/${c.slug}`,
    metaTitle: c.metaTitle,
    metaDescription: c.metaDescription,
  })),
  ...templateSeoPages,
];

/** Registry-Lookup, gehärtet gegen Prototype-Keys ("constructor", "__proto__", …). */
export function getComparisonPage(slug: string | undefined): ComparisonPageContent | undefined {
  if (!slug || !Object.hasOwn(comparisonPages, slug)) return undefined;
  return comparisonPages[slug];
}
