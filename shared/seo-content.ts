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

import { audiencePages, funnelBuilderPage, type SeoFaq, type SeoStaticPage } from "./seo-links";
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
        a: "Häufig verglichen werden Perspective (Mobile Funnels, ab 59 €/Monat plus Add-ons) und ClickFunnels (US-Tool, englischsprachig). Beide haben wir in eigenen Vergleichen gegenübergestellt.",
      },
    ],
    relatedSlugs: ["perspective-alternative", "clickfunnels-alternative"],
  },

  "perspective-alternative": {
    slug: "perspective-alternative",
    competitorName: "Perspective",
    metaTitle: "Perspective-Alternative: alles inklusive für 49 €",
    metaDescription:
      "Perspective-Alternative gesucht? Trichterwerk: Mobile-Funnels mit A/B-Tests für 49 €/Monat — ohne Add-ons, ohne Lead-Gebühren. 14 Tage kostenlos testen.",
    h1: "Die Perspective-Alternative: alles inklusive statt modularer Add-ons",
    intro: [
      "Perspective hat Mobile-Funnels im DACH-Raum populär gemacht — und ist ein gutes Tool. Aber das Preismodell ist modular: Der Base-Plan startet bei 59 € pro Monat (47 € bei Jahreszahlung), enthält aber nur 2 Live-Funnels und 100 Leads pro Monat. Zusatzfunktionen kommen als Add-on-Suiten für 67–84 € monatlich dazu, zusätzliche Leads kosten 0,25 € pro Kontakt — so wird aus dem Einstiegspreis schnell ein dreistelliger Monatsbetrag.",
      "Trichterwerk bietet als deutscher Funnel-Builder dieselbe Kernidee — mobile-optimierte, mehrstufige Funnels per Drag & Drop — für 49 € im Monat: mit unbegrenzten Funnels und Leads, A/B-Tests, eingebauten Analytics und eigener Domain. Ebenfalls DSGVO-konform mit EU-Hosting, ebenfalls auf Deutsch.",
    ],
    verdict:
      "Kurz gesagt: Wer Mobile-First-Funnels wie bei Perspective will, aber einen kalkulierbaren Fixpreis statt Base-Plan plus Add-ons plus Lead-Gebühren, bekommt mit Trichterwerk alle Features — inklusive A/B-Tests und unbegrenzter Funnels — für 49 €. 14 Tage kostenlos testen.",
    painPoints: [
      {
        title: "Modulare Add-ons statt Festpreis",
        text: "Der Base-Plan kostet 59 € pro Monat (47 € bei Jahreszahlung), deckt aber nur die Grundfunktionen ab: Erweiterungen wie Whitelabel oder Personalisierung gibt es als Add-on-Suiten für 67–84 € monatlich. Wer mehr will, landet im Grow-Plan für 184 €. Trichterwerk kostet 49 € — alle Features inklusive.",
      },
      {
        title: "Funnel- und Lead-Limits je Plan",
        text: "Base enthält 2 Live-Funnels und 100 Leads pro Monat; jeder weitere Lead kostet 0,25 €. Wer erfolgreich Kampagnen fährt, zahlt also pro Erfolg mit. Bei Trichterwerk sind Funnels und Leads unbegrenzt — der Preis bleibt gleich.",
      },
      {
        title: "A/B-Tests erst ab dem Grow-Plan",
        text: "Wer wissen will, welche Headline oder welches Angebot besser konvertiert, braucht A/B-Tests — bei Perspective gibt es sie erst ab Grow (184 €/Monat). Trichterwerk hat sie im 49-€-Plan eingebaut: Zwei Seiten-Varianten gegeneinander testen und datenbasiert entscheiden.",
      },
    ],
    comparisonRows: [
      { label: "Deutsche Oberfläche & Support", trichterwerk: true, competitor: true },
      { label: "Hosting in der EU / DSGVO-konform", trichterwerk: true, competitor: true },
      { label: "Live-Handy-Vorschau im Editor", trichterwerk: true, competitor: true },
      { label: "Conditional Logic & Quiz", trichterwerk: true, competitor: true },
      { label: "A/B-Tests", trichterwerk: true, competitor: "erst ab Grow (184 €)" },
      { label: "Eigene Domain inklusive", trichterwerk: true, competitor: true },
      { label: "Unbegrenzte Funnels & Leads", trichterwerk: true, competitor: "2–20 Funnels, dann 0,25 €/Lead" },
      { label: "Analytics eingebaut (cookieless)", trichterwerk: true, competitor: true },
      { label: "Setup-Zeit bis Launch", trichterwerk: "< 1 h", competitor: "1–2 h" },
      { label: "Monatspreis", trichterwerk: "49 €, alles inklusive", competitor: "ab 59 € + Add-ons (67–84 €)" },
    ],
    featureSections: [
      {
        title: "Mobile-First — genau wie Perspective",
        text: "Trichterwerk ist von Grund auf für mobile Besucher gebaut: Jeder Funnel wird automatisch fürs Smartphone optimiert, der Editor zeigt dir die Handy-Vorschau live beim Bauen. Perfekt für Traffic aus Instagram, TikTok und Meta Ads.",
      },
      {
        title: "A/B-Tests inklusive — ohne Plan-Upgrade",
        text: "Bei Perspective gibt es A/B-Testing erst ab dem Grow-Plan für 184 € pro Monat. Trichterwerk bringt A/B-Tests im 49-€-Plan mit: Teste zwei Varianten einer Seite gegeneinander und finde heraus, welche Headline, welches Bild oder welches Angebot mehr Leads bringt — ohne Aufpreis.",
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
        "Perspective startet mit dem Base-Plan bei 59 € pro Monat (47 € bei Jahreszahlung) — bewusst schlank: 2 Live-Funnels und 100 Leads pro Monat sind enthalten, jeder weitere Lead kostet 0,25 €. Erweiterungen gibt es als Add-on-Suiten für 67–84 € monatlich; die größeren Pläne Grow und Expand liegen bei 184 € bzw. 369 € pro Monat.",
        "Trichterwerk kostet 49 € pro Monat — alles inklusive, monatlich kündbar, 14 Tage kostenlos testbar. Keine Add-ons, keine Lead-Gebühren, keine Funnel-Limits: Der Preis, den du siehst, ist der Preis, den du zahlst.",
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
        text: "Ads auf die neue Funnel-URL zeigen lassen, Leads laufen ab sofort in Trichterwerk auf. Tipp: Direkt einen A/B-Test aufsetzen — bei Trichterwerk ohne Plan-Upgrade inklusive.",
      },
    ],
    faqs: [
      {
        q: "Was kostet Perspective im Vergleich zu Trichterwerk?",
        a: "Perspective startet im Base-Plan bei 59 € pro Monat (47 € bei Jahreszahlung) mit 2 Live-Funnels und 100 Leads/Monat; zusätzliche Leads kosten 0,25 €, Add-on-Suiten 67–84 € monatlich, die Pläne Grow und Expand 184 € bzw. 369 €. Trichterwerk kostet 49 € pro Monat mit allen Features, unbegrenzten Funnels und Leads. Beide sind monatlich kündbar.",
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
        a: "Vor allem einen einzigen All-inclusive-Plan für 49 € statt Base-Plan plus kostenpflichtiger Add-ons und Lead-Gebühren — mit unbegrenzten Funnels, unbegrenzten Leads und A/B-Tests, die es bei Perspective erst ab dem Grow-Plan (184 €) gibt.",
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

export interface AudiencePageContent {
  /** = Pfad ohne führenden Slash (Konsistenz mit seo-links.audiencePages). */
  slug: string;
  badge: string;
  h1: string;
  intro: string[];
  painPoints: { title: string; text: string }[];
  /** Branchen-/Use-Case-Grid. */
  industries: { title: string; text: string }[];
  /** Slugs aus shared/template-meta.ts für den Vorlagen-Showcase. */
  templateShowcase: string[];
  steps: { title: string; text: string }[];
  faqs: SeoFaq[];
}

export const audiencePagesContent: Record<string, AudiencePageContent> = {
  "recruiting-funnel": {
    slug: "recruiting-funnel",
    badge: "Für Recruiter & HR-Teams",
    h1: "Recruiting-Funnel: Bewerbungen statt Bewerbungsmappen",
    intro: [
      "Stellenanzeigen auf Jobportalen konvertieren mobil miserabel: Kandidaten scrollen abends auf dem Sofa durch Instagram — und brechen ab, sobald ein Lebenslauf-Upload verlangt wird. Ein Recruiting-Funnel dreht den Prozess um: erst Interesse wecken, dann in drei kurzen Fragen qualifizieren, zum Schluss nur Name und Telefonnummer.",
      "Mit Trichterwerk baust du so einen Funnel aus einer fertigen Vorlage in unter einer Stunde — mobile-first, DSGVO-konform mit EU-Hosting, und mit Benachrichtigung in Echtzeit, sobald eine Bewerbung eingeht.",
    ],
    painPoints: [
      {
        title: "Keine Bewerbungen trotz Anzeigen-Budget",
        text: "Wer Meta- oder Google-Ads auf eine klassische Karriereseite schickt, verliert die Mehrheit der Kandidaten beim ersten Klick. Ein mobiler Funnel mit 4–6 Schritten holt Bewerber dort ab, wo sie sind — auf dem Smartphone.",
      },
      {
        title: "Abbruch beim Lebenslauf-Upload",
        text: "Die Express-Bewerbung ohne Lebenslauf senkt die Hürde radikal: 3 Fragen, Kontaktdaten, fertig. Unterlagen kannst du später im Gespräch nachfordern — erst mal zählt der Kontakt.",
      },
      {
        title: "Screening frisst Stunden",
        text: "Qualifizierungsfragen im Funnel (Qualifikation, Verfügbarkeit, Region, Gehaltsvorstellung) filtern vor, bevor du telefonierst. Jede Bewerbung kommt mit allen Antworten in dein Dashboard und per E-Mail.",
      },
    ],
    industries: [
      {
        title: "Pflege",
        text: "Dienstplansicherheit, faire Bezahlung, kein Einspringen aus dem Frei — die Argumente, die Pflegekräfte wirklich bewegen, gehören in den ersten Schritt. Die Pflege-Recruiting-Vorlage bringt sie mit.",
      },
      {
        title: "Handwerk, SHK & Elektro",
        text: "Monteure bewerben sich nicht mit Anschreiben. Gewerk, Qualifikation, Führerschein, Gehaltsvorstellung — in 60 Sekunden vom Handy, gern auch über einen QR-Code auf dem Firmenwagen.",
      },
      {
        title: "Gastro & Quereinstieg",
        text: "Kurzfristige Starts, Schichtmodelle, keine formalen Hürden: Ein schlanker Funnel mit wenigen Fragen passt zu Jobs, bei denen Motivation mehr zählt als die Mappe.",
      },
    ],
    templateShowcase: ["express-bewerbung", "pflege-recruiting", "handwerk-recruiting"],
    steps: [
      {
        title: "Vorlage wählen",
        text: "Express-Bewerbung, Pflege oder Handwerk — Vorlage übernehmen und Arbeitgeber-Benefits, Fragen und Farben anpassen.",
      },
      {
        title: "Live schalten",
        text: "Eigene Domain verbinden (SSL automatisch) oder den Trichterwerk-Link nutzen — auch als QR-Code auf Aushang, Flyer oder Fahrzeug.",
      },
      {
        title: "Bewerber erreichen",
        text: "Meta- oder Google-Ads auf den Funnel schicken. Jede Bewerbung landet sofort in deinem Postfach und im Dashboard — inklusive aller Qualifizierungs-Antworten.",
      },
    ],
    faqs: [
      {
        q: "Was ist ein Recruiting-Funnel?",
        a: "Ein mehrstufiger, mobiler Bewerbungsprozess: Statt Stellenanzeige plus Bewerbungsmappe führt er Kandidaten Schritt für Schritt — Benefits, 3–4 Qualifizierungsfragen, Kontaktdaten. Das senkt die Hürde und liefert vorqualifizierte Bewerbungen.",
      },
      {
        q: "Funktioniert eine Bewerbung wirklich ohne Lebenslauf?",
        a: "Ja — für die Erstansprache. Der Funnel sammelt Qualifikation, Verfügbarkeit und Kontakt; Unterlagen forderst du im Gespräch nach. Alle Daten werden DSGVO-konform in der EU gespeichert, mit dokumentiertem Consent.",
      },
      {
        q: "Was kostet ein Recruiting-Funnel?",
        a: "Bei Trichterwerk 49 € pro Monat — unbegrenzte Funnels und Bewerbungen, alle Vorlagen, A/B-Tests und eigene Domain inklusive. 14 Tage kostenlos testen, monatlich kündbar.",
      },
      {
        q: "Wie kommen Bewerber in den Funnel?",
        a: "Meist über Meta-Ads (Instagram/Facebook) oder Google-Ads auf die Funnel-URL — außerdem über QR-Codes auf Fahrzeugen, Aushängen und Flyern oder den Link in der Stellenanzeige.",
      },
      {
        q: "Wie schnell ist ein Recruiting-Funnel live?",
        a: "Mit einer fertigen Vorlage in unter einer Stunde: Vorlage übernehmen, Texte und Farben anpassen, veröffentlichen. Die Vorlagen kannst du vorher live durchklicken — ohne Anmeldung.",
      },
    ],
  },

  "lead-funnel": {
    slug: "lead-funnel",
    badge: "Für Dienstleister, Coaches & Agenturen",
    h1: "Lead-Funnel: aus Besuchern qualifizierte Anfragen machen",
    intro: [
      "Ein Kontaktformular stellt alle Fragen auf einmal — und bekommt sie deshalb selten beantwortet. Ein Lead-Funnel zerlegt den Weg in kleine Schritte: eine Frage pro Seite, sichtbarer Fortschritt, am Ende die Kontaktdaten. Das Ergebnis sind mehr Anfragen und — durch die Qualifizierungsfragen — deutlich bessere.",
      "Mit Trichterwerk baust du Lead-Funnels per Drag & Drop aus fertigen Vorlagen: mobile-first, mit Conditional Logic für individuelle Wege, eingebauten Analytics und Webhook-Anbindung an dein CRM.",
    ],
    painPoints: [
      {
        title: "Formulare konvertieren nicht",
        text: "Zehn Felder auf einer Seite schrecken ab. Ein Funnel mit einer Frage pro Schritt fühlt sich leicht an — und mobile Besucher aus Social Ads bleiben dran.",
      },
      {
        title: "Unqualifizierte Anfragen",
        text: "Budget, Bedarf, Timing: Wer im Funnel qualifiziert, telefoniert nur noch mit passenden Interessenten. Mit Conditional Logic bekommen unterschiedliche Antworten unterschiedliche Wege.",
      },
      {
        title: "Tool-Stack-Chaos",
        text: "Landingpage-Baukasten plus Formular-Tool plus Analytics plus Kalender — vier Abos, vier Datenschutz-Prüfungen. Trichterwerk liefert den kompletten Funnel aus einem Guss, DSGVO-konform.",
      },
    ],
    industries: [
      {
        title: "Coaches & Berater",
        text: "Strategiegespräch-Funnel: Situation und Budget abfragen, dann direkt den Termin buchen lassen — die Termin-Vorlage bringt Kalender-Schritt und Qualifizierung mit.",
      },
      {
        title: "Immobilien",
        text: "Bewertungs-Funnel für Eigentümer: Objektdaten Schritt für Schritt abfragen, als Gegenwert gibt es die Einschätzung — eine der stärksten Lead-Mechaniken im Markt.",
      },
      {
        title: "Agenturen & Dienstleister",
        text: "Erstgespräch- und Onboarding-Funnels qualifizieren Neukunden, bevor das erste Meeting stattfindet — Ziel, Budget, Timing inklusive. Leads laufen per Webhook direkt ins CRM.",
      },
    ],
    templateShowcase: ["termin-buchen", "lead-magnet", "immobilien-bewertung"],
    steps: [
      {
        title: "Vorlage wählen",
        text: "Termin-Funnel, Lead-Magnet oder Bewertungs-Funnel — übernehmen und Angebot, Fragen und Branding anpassen.",
      },
      {
        title: "Qualifizierung einbauen",
        text: "Fragen und Conditional Logic definieren: Wer passt, kommt zum Kalender oder Kontaktformular — wer nicht passt, bekommt einen alternativen Weg.",
      },
      {
        title: "Messen & optimieren",
        text: "Eingebaute Analytics zeigen Views, Conversions und Absprünge pro Schritt. Mit A/B-Tests findest du heraus, welche Headline mehr Anfragen bringt.",
      },
    ],
    faqs: [
      {
        q: "Was ist ein Lead-Funnel?",
        a: "Eine mehrstufige Strecke von der Landingpage bis zur qualifizierten Anfrage: Nutzenversprechen, Qualifizierungsfragen, Kontaktdaten, Danke-Seite — mit Logik und Tracking dazwischen. Er ersetzt das klassische Kontaktformular.",
      },
      {
        q: "Warum konvertiert ein Funnel besser als ein Formular?",
        a: "Weil er die Hürde zerlegt: eine Frage pro Schritt, sichtbarer Fortschritt, mobile Bedienung. Besucher investieren sich Schritt für Schritt — die Abschlussquote steigt spürbar gegenüber einem langen Formular.",
      },
      {
        q: "Was kostet ein Lead-Funnel?",
        a: "Bei Trichterwerk 49 € pro Monat — unbegrenzte Funnels und Leads, alle Vorlagen, A/B-Tests, Analytics und eigene Domain inklusive. 14 Tage kostenlos testen, monatlich kündbar.",
      },
      {
        q: "Wie kommen die Leads in mein CRM?",
        a: "Per signiertem Webhook in Echtzeit (kompatibel mit Zapier und Make), per CSV-Export oder direkt im Trichterwerk-Dashboard mit Kanban-Ansicht und E-Mail-Benachrichtigung.",
      },
      {
        q: "Ist das DSGVO-konform?",
        a: "Ja: Hosting ausschließlich in der EU, Cookie-Consent-Banner auf jedem veröffentlichten Funnel, AV-Vertrag inklusive und dokumentierter Marketing-Consent pro Lead.",
      },
    ],
  },
};

/** Registry-Lookup, gehärtet gegen Prototype-Keys. */
export function getAudiencePage(slug: string | undefined): AudiencePageContent | undefined {
  if (!slug || !Object.hasOwn(audiencePagesContent, slug)) return undefined;
  return audiencePagesContent[slug];
}

/**
 * Alle statischen SEO-Seiten (für Sitemap + SSR-Meta-Injektion).
 * Vergleichsseiten werden aus comparisonPages abgeleitet, die Galerie-Seiten
 * aus shared/template-meta.ts, die Zielgruppen-Seiten aus seo-links, damit
 * Routen, Sitemap und Server-Meta nicht auseinanderlaufen.
 */
export const seoStaticPages: SeoStaticPage[] = [
  funnelBuilderPage,
  ...Object.values(comparisonPages).map((c) => ({
    path: `/vergleich/${c.slug}`,
    metaTitle: c.metaTitle,
    metaDescription: c.metaDescription,
  })),
  ...audiencePages,
  ...templateSeoPages,
];

/** Registry-Lookup, gehärtet gegen Prototype-Keys ("constructor", "__proto__", …). */
export function getComparisonPage(slug: string | undefined): ComparisonPageContent | undefined {
  if (!slug || !Object.hasOwn(comparisonPages, slug)) return undefined;
  return comparisonPages[slug];
}
