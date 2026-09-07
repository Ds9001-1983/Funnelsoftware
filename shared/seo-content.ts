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

import {
  audiencePages,
  breadcrumbJsonLd,
  faqPageJsonLd,
  funnelBuilderPage,
  partnerPage,
  vergleichIndexPage,
  type SeoFaq,
  type SeoStaticPage,
} from "./seo-links";
import { templateSeoPages } from "./template-meta";
import { funnelBuilderFaqs, partnerFaqs } from "./seo-faqs";
import {
  renderAudienceHtml,
  renderComparisonHtml,
  renderSimplePageHtml,
} from "./seo-html";

export { breadcrumbJsonLd, faqPageJsonLd } from "./seo-links";
export { funnelBuilderFaqs, partnerFaqs } from "./seo-faqs";
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
      "Du suchst eine Typeform-Alternative? Trichterwerk: deutscher Funnel-Builder, DSGVO-konform mit EU-Hosting, Gratis-Plan, Pro 49 €/Monat.",
    h1: "Die Typeform-Alternative aus Deutschland: DSGVO-konform, auf Deutsch, mit Gratis-Plan",
    intro: [
      "Typeform ist ein starkes Tool für schöne Formulare und Umfragen — keine Frage. Aber viele Nutzer aus dem DACH-Raum stoßen an Grenzen: Die Datenverarbeitung läuft teils über US-Dienste (DSGVO-Grauzone), Support und Oberfläche sind englischsprachig, und für einen kompletten Funnel mit Landingpage, Logik und Analytics brauchst du zusätzliche Tools.",
      "Trichterwerk ist der deutsche Funnel-Builder: Formulare, Quiz-Logik und komplette Landingpages in einem Tool — mit Hosting in der EU und deutschem Support. Statt einzelner Formulare baust du mit unserem Funnel-Builder komplette Strecken vom ersten Klick bis zum qualifizierten Lead.",
    ],
    verdict:
      "Kurz gesagt: Wenn du DSGVO-konforme Funnels mit eigener Domain, Conditional Logic und Analytics willst — ohne Tool-Stack aus Typeform + Landingpage-Builder + Analytics — ist Trichterwerk die passende Alternative aus Deutschland. Free-Plan dauerhaft kostenlos, 14 Tage Pro ohne Kreditkarte.",
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
        "Trichterwerk startet bei 0 €: Der Free-Plan ist dauerhaft kostenlos mit 1 veröffentlichten Funnel und 100 sichtbaren Leads pro Monat. Pro kostet 49 € pro Monat inklusive Mehrwertsteuer — unbegrenzte Funnels, unbegrenzte Leads, alle Features. Keine Antwort-Limits, keine Feature-Staffelung, monatlich kündbar. 14 Tage Pro testen, ohne Kreditkarte.",
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
        a: "Ja, dauerhaft: Der Free-Plan von Trichterwerk kostet 0 € — 1 veröffentlichter Funnel, 100 Leads pro Monat sichtbar, alle Editor-Features, keine Kreditkarte. Nur das Trichterwerk-Badge bleibt sichtbar. Zusätzlich kannst du Pro 14 Tage testen; danach kostet Pro 49 € pro Monat und ist monatlich kündbar.",
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
    relatedSlugs: ["perspective-alternative", "heyflow-alternative", "onepage-alternative"],
  },

  "perspective-alternative": {
    slug: "perspective-alternative",
    competitorName: "Perspective",
    metaTitle: "Perspective-Alternative: alles inklusive für 49 €",
    metaDescription:
      "Perspective-Alternative gesucht? Trichterwerk: Mobile-Funnels mit A/B-Tests, Gratis-Plan, Pro 49 €/Monat — ohne Add-ons, ohne Lead-Gebühren.",
    h1: "Die Perspective-Alternative: alles inklusive statt modularer Add-ons",
    intro: [
      "Perspective hat Mobile-Funnels im DACH-Raum populär gemacht — und ist ein gutes Tool. Aber das Preismodell ist modular: Der Base-Plan startet bei 59 € pro Monat (47 € bei Jahreszahlung), enthält aber nur 2 Live-Funnels und 100 Leads pro Monat. Zusatzfunktionen kommen als Add-on-Suiten für 67–84 € monatlich dazu, zusätzliche Leads kosten 0,25 € pro Kontakt — so wird aus dem Einstiegspreis schnell ein dreistelliger Monatsbetrag.",
      "Trichterwerk bietet als deutscher Funnel-Builder dieselbe Kernidee — mobile-optimierte, mehrstufige Funnels per Drag & Drop — für 49 € im Monat: mit unbegrenzten Funnels und Leads, A/B-Tests, eingebauten Analytics und eigener Domain. Ebenfalls DSGVO-konform mit EU-Hosting, ebenfalls auf Deutsch.",
    ],
    verdict:
      "Kurz gesagt: Wer Mobile-First-Funnels wie bei Perspective will, aber einen kalkulierbaren Fixpreis statt Base-Plan plus Add-ons plus Lead-Gebühren, bekommt mit Trichterwerk alle Features — inklusive A/B-Tests und unbegrenzter Funnels — für 49 €. Free-Plan dauerhaft kostenlos, 14 Tage Pro ohne Kreditkarte.",
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
        "Trichterwerk kostet 0 € im Free-Plan (1 veröffentlichter Funnel, 100 Leads pro Monat sichtbar, alle Editor-Features) und 49 € pro Monat inklusive Mehrwertsteuer im Pro-Plan — alles inklusive, monatlich kündbar, 14 Tage Pro ohne Kreditkarte. Keine Add-ons, keine Lead-Gebühren, keine Funnel-Limits: Der Preis, den du siehst, ist der Preis, den du zahlst.",
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
      "ClickFunnels-Alternative für den DACH-Raum: Trichterwerk — deutscher Funnel-Builder, EU-Hosting, Gratis-Plan, Pro 49 €/Monat statt 97 $+.",
    h1: "Die ClickFunnels-Alternative auf Deutsch: DSGVO-konform und ohne Dollar-Abo",
    intro: [
      "ClickFunnels hat den Begriff „Funnel“ geprägt und ist im US-Markt der Platzhirsch. Für Nutzer aus Deutschland, Österreich und der Schweiz gibt es aber handfeste Probleme: englische Oberfläche, Abrechnung in US-Dollar ab rund 97 $ pro Monat, Datenverarbeitung in den USA — und ein Funktionsumfang, der auf US-Infoprodukt-Marketing zugeschnitten ist.",
      "Trichterwerk ist die Alternative für den DACH-Raum: ein deutscher Funnel-Builder mit EU-Hosting, deutscher Oberfläche und deutschem Support — für 49 € im Monat. Fokussiert auf das, was Coaches, Berater, Dienstleister und Recruiter hier wirklich brauchen: Leads sammeln, qualifizieren, konvertieren.",
    ],
    verdict:
      "Kurz gesagt: Wenn du Funnels für den deutschsprachigen Markt baust und Wert auf DSGVO, deutsche Oberfläche und kalkulierbare Euro-Preise legst, ist Trichterwerk die passende ClickFunnels-Alternative — für etwa die Hälfte des Preises. Free-Plan dauerhaft kostenlos, 14 Tage Pro ohne Kreditkarte.",
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
        "Trichterwerk kostet 0 € im Free-Plan (1 veröffentlichter Funnel, 100 Leads pro Monat sichtbar) und 49 € pro Monat inklusive Mehrwertsteuer im Pro-Plan — alle Features, unbegrenzte Funnels und Leads, monatlich kündbar, 14 Tage Pro ohne Kreditkarte. Das ist ungefähr die Hälfte, ohne Wechselkursrisiko und mit deutscher Rechnung.",
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
  "funnelcockpit-alternative": {
    slug: "funnelcockpit-alternative",
    competitorName: "FunnelCockpit",
    metaTitle: "FunnelCockpit-Alternative: schlank statt überladen",
    metaDescription:
      "FunnelCockpit-Alternative gesucht? Trichterwerk: moderner deutscher Funnel-Builder mit Gratis-Plan, Pro 49 €/Monat. 14 Tage Pro testen, ohne Kreditkarte.",
    h1: "Die FunnelCockpit-Alternative: moderner Editor, echter Gratis-Plan, günstigerer Einstieg",
    intro: [
      "FunnelCockpit ist eines der bekanntesten deutschen Funnel-Tools und bringt eine beeindruckende Funktionsliste mit: Funnels, VideoCockpit, SplitTests, Mitgliederbereiche, E-Mail-Marketing. Wer schnell starten will, merkt aber schnell, dass genau das der Haken ist — die Oberfläche wirkt vollgepackt und in Teilen altbacken, und man klickt sich durch viele Menüs, bevor die erste Seite steht.",
      "Trichterwerk geht den umgekehrten Weg: ein moderner, schlanker Drag-&-Drop-Editor, der genau eine Sache richtig gut macht — konvertierende Funnels bauen. Dazu ein dauerhaft kostenloser Plan statt eines Test-Zugangs für 1 €, und ein Pro-Plan für 49 € im Monat inklusive Mehrwertsteuer mit unbegrenzten Funnels und Leads.",
    ],
    verdict:
      "Kurz gesagt: Wenn dich FunnelCockpits Funktionsfülle eher bremst als beflügelt, bekommst du mit Trichterwerk einen aufgeräumten Editor, einen echten Gratis-Plan und Pro für 49 € statt 97 € — deutsch, DSGVO-konform, ohne Kreditkarte startbar.",
    painPoints: [
      {
        title: "Überladene Oberfläche, altbackenes Gefühl",
        text: "VideoCockpit, SplitTests, Mailings, Mitgliederbereiche — FunnelCockpit will alles können und zeigt das auch in der Oberfläche. Viele Nutzer beschreiben den Editor als vollgepackt und in die Jahre gekommen. Trichterwerk setzt auf einen modernen Editor mit Live-Handy-Vorschau: Du siehst beim Bauen, was der Besucher später sieht.",
      },
      {
        title: "Kein Free-Plan — nur ein Testzeitraum für 1 €",
        text: "FunnelCockpit lässt dich 14 Tage für 1 € testen, danach beginnt das Abo. Einen dauerhaft kostenlosen Plan gibt es nicht. Bei Trichterwerk bleibt der Free-Plan dauerhaft kostenlos: 1 veröffentlichter Funnel, 100 Leads pro Monat sichtbar, alle Editor-Features — ohne Kreditkarte, ohne Ablaufdatum.",
      },
      {
        title: "Einstieg ab 47 €, echte Nutzung schnell teurer",
        text: "Lite kostet 47 € pro Monat, Standard 97 €, Business 297 €. Wer mehrere Funnels, Teamzugänge oder die volle Funktionsbreite braucht, landet also schnell im dreistelligen Bereich. Trichterwerk Pro kostet 49 € inklusive MwSt. — mit unbegrenzten Funnels, unbegrenzten Leads und allen Features.",
      },
      {
        title: "Viel Funktion, die du gar nicht brauchst",
        text: "Ein Funnel-Tool, das gleichzeitig Videoplattform, Mailsystem und Kursbereich sein will, bezahlst du mit — auch wenn du nur Leads sammeln willst. Trichterwerk fokussiert sich auf den Funnel und verbindet den Rest per Webhook mit deinem CRM oder E-Mail-Tool (Zapier- und Make-kompatibel).",
      },
    ],
    comparisonRows: [
      { label: "Deutsche Oberfläche & Support", trichterwerk: true, competitor: true },
      { label: "Hosting in der EU / DSGVO-konform", trichterwerk: true, competitor: true },
      { label: "Dauerhaft kostenloser Plan", trichterwerk: "1 Funnel, 100 Leads/Monat", competitor: "nur 14 Tage für 1 €" },
      { label: "Moderner, aufgeräumter Editor", trichterwerk: true, competitor: "sehr funktionsreich, unübersichtlich" },
      { label: "Live-Handy-Vorschau im Editor", trichterwerk: true, competitor: "eingeschränkt" },
      { label: "A/B-Tests", trichterwerk: true, competitor: true },
      { label: "Conditional Logic & Quiz", trichterwerk: true, competitor: true },
      { label: "KI-Funnel-Generator", trichterwerk: true, competitor: false },
      { label: "Video-Hosting & Mitgliederbereiche", trichterwerk: false, competitor: true },
      { label: "Monatspreis", trichterwerk: "0 € oder 49 € inkl. MwSt.", competitor: "47 € / 97 € / 297 €" },
    ],
    featureSections: [
      {
        title: "Ein Editor, der nicht im Weg steht",
        text: "Blöcke per Drag & Drop setzen, Text direkt auf der Seite bearbeiten, Handy-Vorschau live daneben. Kein Wechsel zwischen einem Dutzend Modulen, kein Suchen nach der richtigen Einstellung — die erste Seite steht in Minuten, nicht in einem Nachmittag.",
      },
      {
        title: "Free-Plan, der wirklich frei ist",
        text: "Alle Editor-Features, 1 veröffentlichter Funnel, 100 Leads pro Monat sichtbar — dauerhaft und ohne Kreditkarte. Einzige Einschränkung: Das Trichterwerk-Badge bleibt sichtbar. Damit kannst du deinen Funnel echt live testen, bevor du dich für Pro entscheidest.",
      },
      {
        title: "13 deutsche Vorlagen statt Baukasten von Null",
        text: "Recruiting, Beratung, Handwerk, Coaching, Immobilien und mehr: Die Vorlagen sind auf Deutsch geschrieben und für den DACH-Markt gedacht — inklusive sinnvoller Qualifizierungsfragen. Anpassen, Logo tauschen, live gehen.",
      },
      {
        title: "A/B-Tests und Analytics ohne Cookie-Banner",
        text: "SplitTests kennst du von FunnelCockpit — Trichterwerk kann das ebenfalls, im Pro-Plan ohne Aufpreis. Dazu eigene, cookielose Analytics: Views, Conversions und Drop-offs pro Seite, ganz ohne Google Analytics.",
      },
      {
        title: "Leads dorthin, wo du sie brauchst",
        text: "CSV-Export mit einem Klick, Webhooks für jedes CRM, kompatibel mit Zapier und Make. Statt alles in einem Tool zu halten, verbindest du deine bestehende Software — und behältst die Kontrolle über deine Daten.",
      },
    ],
    pricingComparison: {
      title: "Preisvergleich: FunnelCockpit vs. Trichterwerk",
      text: [
        "FunnelCockpit bietet drei Stufen: Lite für 47 €, Standard für 97 € und Business für 297 € pro Monat. Testen kannst du 14 Tage für 1 € — einen dauerhaft kostenlosen Plan gibt es nicht, das Abo läuft nach dem Test weiter.",
        "Trichterwerk startet bei 0 €: Der Free-Plan ist dauerhaft kostenlos mit 1 veröffentlichten Funnel und 100 sichtbaren Leads pro Monat. Pro kostet 49 € pro Monat inklusive Mehrwertsteuer — unbegrenzte Funnels und Leads, eigene Domain mit SSL, Teams, KI-Generator, A/B-Tests, Badge entfernbar. 14 Tage Pro testen, ohne Kreditkarte.",
      ],
    },
    honestSection: {
      title: "Wann FunnelCockpit trotzdem die bessere Wahl ist",
      text: "Ehrlich verglichen: FunnelCockpit ist eine echte All-in-One-Suite. Wer Video-Hosting, E-Mail-Marketing, Mitgliederbereiche und Funnels bewusst unter einem Dach haben will und bereit ist, sich in ein umfangreiches System einzuarbeiten, bekommt dort sehr viel Funktion für sein Geld. Auch das Unternehmen sitzt in Deutschland — beim Thema DSGVO nehmen sich beide Tools nichts. Wenn du aber vor allem schnell konvertierende Funnels bauen willst, ist Trichterwerk der direktere Weg.",
    },
    migrationSteps: [
      {
        title: "Funnel-Struktur übernehmen",
        text: "Seiten, Fragen und Formularfelder deines FunnelCockpit-Funnels in eine passende Trichterwerk-Vorlage übertragen. Wahlweise beschreibst du dein Angebot dem KI-Generator und bekommst einen Entwurf, den du nur noch schärfst.",
      },
      {
        title: "Design & Domain umziehen",
        text: "Farben, Logo und Schriften hinterlegen, dann deine Domain per CNAME verbinden — SSL wird automatisch eingerichtet. Im Pro-Plan verschwindet das Trichterwerk-Badge.",
      },
      {
        title: "Leads sichern & live gehen",
        text: "Bestehende Kontakte bei FunnelCockpit exportieren, Webhook zu deinem CRM einrichten, neuen Funnel veröffentlichen und Ads bzw. Links umstellen. Danach kannst du das alte Abo kündigen.",
      },
    ],
    faqs: [
      {
        q: "Was kostet FunnelCockpit im Vergleich zu Trichterwerk?",
        a: "FunnelCockpit kostet 47 € (Lite), 97 € (Standard) oder 297 € (Business) pro Monat, testbar für 14 Tage à 1 €. Trichterwerk hat einen dauerhaft kostenlosen Free-Plan und Pro für 49 € pro Monat inklusive Mehrwertsteuer — mit unbegrenzten Funnels und Leads.",
      },
      {
        q: "Gibt es eine kostenlose FunnelCockpit-Alternative?",
        a: "Ja. Der Free-Plan von Trichterwerk ist dauerhaft kostenlos: 1 veröffentlichter Funnel, 100 Leads pro Monat sichtbar, alle Editor-Features, keine Kreditkarte nötig. Nur das Trichterwerk-Badge bleibt sichtbar.",
      },
      {
        q: "Kann Trichterwerk auch SplitTests wie FunnelCockpit?",
        a: "Ja. A/B-Tests sind im Pro-Plan enthalten: Du testest zwei Varianten einer Seite gegeneinander und siehst in den eingebauten Analytics, welche mehr Leads bringt — cookielos und ohne Google Analytics.",
      },
      {
        q: "Kann ich meinen FunnelCockpit-Funnel importieren?",
        a: "Einen automatischen Import gibt es nicht. Mit den 13 deutschen Vorlagen und dem KI-Generator ist ein typischer Funnel aber meist in unter einer Stunde nachgebaut. Deine Leads exportierst du vorher als CSV.",
      },
      {
        q: "Hat Trichterwerk auch Video-Hosting und Mitgliederbereiche?",
        a: "Nein — das ist bewusst so. Trichterwerk konzentriert sich auf Funnels zur Lead-Generierung und Qualifizierung. Kurse, Mailings oder Videoplattformen verbindest du per Webhook, Zapier oder Make mit deinen bestehenden Tools.",
      },
      {
        q: "Ist Trichterwerk genauso DSGVO-konform wie ein deutsches Tool?",
        a: "Trichterwerk ist ein deutsches Produkt mit Hosting in der EU, cookielosen Analytics, AVV und deutschem Support per E-Mail. Beim Datenschutz musst du gegenüber FunnelCockpit keine Abstriche machen.",
      },
    ],
    relatedSlugs: ["heyflow-alternative", "perspective-alternative", "onepage-alternative"],
  },

  "heyflow-alternative": {
    slug: "heyflow-alternative",
    competitorName: "Heyflow",
    metaTitle: "Heyflow-Alternative: unbegrenzte Leads für 49 €",
    metaDescription:
      "Heyflow-Alternative ohne Lead-Staffel: Trichterwerk bietet unbegrenzte Leads für 49 €/Monat, deutschen Support und einen dauerhaften Gratis-Plan.",
    h1: "Die Heyflow-Alternative: unbegrenzte Leads zum Festpreis statt Bezahlen pro Erfolg",
    intro: [
      "Heyflow aus Hamburg baut sehr saubere, interaktive Flows und ist bei Performance-Marketing-Teams beliebt. Der Haken für kleinere Unternehmen: Das Preismodell skaliert mit den generierten Leads. Die Pläne liegen etwa zwischen 45 und 359 USD pro Monat, ein dauerhaft kostenloser Plan fehlt — es gibt nur einen Testzeitraum. Wer erfolgreich Kampagnen fährt, zahlt also mit jedem zusätzlichen Lead mehr.",
      "Trichterwerk dreht das um: Im Pro-Plan für 49 € im Monat inklusive Mehrwertsteuer sind Funnels und Leads unbegrenzt. Dazu ein dauerhaft kostenloser Free-Plan zum Ausprobieren, deutsche Oberfläche, deutscher Support und Preise in Euro statt Dollar.",
    ],
    verdict:
      "Kurz gesagt: Wenn dein Funnel funktioniert, willst du nicht dafür bestraft werden. Trichterwerk kostet 49 € pro Monat mit unbegrenzten Leads — egal ob 100 oder 10.000. Free-Plan dauerhaft kostenlos, 14 Tage Pro ohne Kreditkarte.",
    painPoints: [
      {
        title: "Lead-basierte Bepreisung — Erfolg macht teuer",
        text: "Heyflows Pläne staffeln sich nach den über die Flows generierten Leads. Genau dann, wenn eine Kampagne läuft, steigt die Rechnung — planbar ist das kaum. Bei Trichterwerk sind Leads im Pro-Plan unbegrenzt: 49 € pro Monat, unabhängig vom Volumen.",
      },
      {
        title: "Kein Free-Plan, nur ein Trial",
        text: "Heyflow bietet einen Testzeitraum, aber keinen dauerhaft kostenlosen Plan. Wer nur einen Funnel dauerhaft laufen lassen will, muss zahlen. Trichterwerk hat einen echten Free-Plan: 1 veröffentlichter Funnel, 100 Leads pro Monat sichtbar, alle Editor-Features, ohne Kreditkarte.",
      },
      {
        title: "Preise in Dollar, Ausrichtung Richtung Enterprise",
        text: "Die Pläne bewegen sich etwa zwischen 45 und 359 USD pro Monat, das Pricing ist englisch geprägt und auf größere Ads- und Enterprise-Teams zugeschnitten. Für Selbstständige, Handwerksbetriebe oder kleine Agenturen ist das oft mehrere Nummern zu groß. Trichterwerk rechnet in Euro ab, mit deutscher Rechnung und ausgewiesener MwSt.",
      },
      {
        title: "Volle Stärke erst mit Marketing-Team",
        text: "Heyflow spielt seine Stärken in Setups mit Tracking-Spezialisten, großen Ads-Budgets und tiefen CRM-Integrationen aus. Wer diese Struktur nicht hat, nutzt einen Bruchteil der Plattform — zahlt aber den vollen Preis. Trichterwerk ist so gebaut, dass eine Person allein den kompletten Funnel aufsetzen kann.",
      },
    ],
    comparisonRows: [
      { label: "Deutsche Oberfläche & Support", trichterwerk: true, competitor: "Team in Hamburg, Produkt englisch geprägt" },
      { label: "Hosting in der EU / DSGVO-konform", trichterwerk: true, competitor: true },
      { label: "Dauerhaft kostenloser Plan", trichterwerk: "1 Funnel, 100 Leads/Monat", competitor: false },
      { label: "Unbegrenzte Leads ohne Aufpreis", trichterwerk: true, competitor: "Preis skaliert mit Leads" },
      { label: "Abrechnung in Euro (inkl. MwSt.-Ausweis)", trichterwerk: true, competitor: "Pricing in USD" },
      { label: "Conditional Logic & Quiz", trichterwerk: true, competitor: true },
      { label: "A/B-Tests", trichterwerk: true, competitor: true },
      { label: "Eigene Domain inklusive SSL", trichterwerk: true, competitor: true },
      { label: "Tiefe Enterprise-Integrationen", trichterwerk: "Webhooks, Zapier/Make", competitor: true },
      { label: "Monatspreis", trichterwerk: "0 € oder 49 € inkl. MwSt.", competitor: "ca. 45–359 USD, lead-abhängig" },
    ],
    featureSections: [
      {
        title: "Festpreis statt Lead-Staffel",
        text: "49 € pro Monat, unbegrenzte Funnels, unbegrenzte Leads. Du kannst eine Kampagne skalieren, ohne vorher im Preisrechner nachzusehen — und du weißt am Monatsanfang, was am Monatsende auf der Rechnung steht.",
      },
      {
        title: "Mobile-First-Funnels für Social Ads",
        text: "Der Großteil deines Traffics kommt vom Smartphone. Jeder Trichterwerk-Funnel ist automatisch mobil optimiert, im Editor siehst du die Handy-Vorschau live. Kurze Ladezeiten, klare Schritte, wenig Absprung.",
      },
      {
        title: "Qualifizieren mit Conditional Logic",
        text: "Fragen verzweigen je nach Antwort, unpassende Interessenten steigen früh aus, passende landen mit vollständigen Angaben in deinem Dashboard. Genau die Logik, für die du bei anderen Tools in einen höheren Plan wechselst.",
      },
      {
        title: "Eigene Analytics ohne Cookie-Banner",
        text: "Views, Conversions und Drop-offs pro Seite direkt im Dashboard — cookielos und ohne Google Analytics. Für A/B-Tests siehst du sofort, welche Variante gewinnt, ohne ein externes Tracking-Setup aufzubauen.",
      },
      {
        title: "Deutsch von der Oberfläche bis zur Support-Mail",
        text: "Editor, 13 Vorlagen, Rechtstexte und Support sind auf Deutsch. Dazu EU-Hosting und AVV — und ein Partnerprogramm mit 25 % Provision, wenn du Trichterwerk in Kundenprojekten einsetzt.",
      },
    ],
    pricingComparison: {
      title: "Preisvergleich: Heyflow vs. Trichterwerk",
      text: [
        "Heyflow bewegt sich je nach Plan etwa zwischen 45 und 359 USD pro Monat, wobei die Stufen an die Zahl der generierten Leads gekoppelt sind. Einen dauerhaft kostenlosen Plan gibt es nicht, nur einen Testzeitraum. Für wachsende Kampagnen bedeutet das: steigender Erfolg, steigende Kosten.",
        "Trichterwerk kostet 0 € im Free-Plan (1 veröffentlichter Funnel, 100 Leads pro Monat sichtbar, alle Editor-Features) und 49 € pro Monat inklusive Mehrwertsteuer im Pro-Plan — mit unbegrenzten Funnels und Leads, eigener Domain samt SSL, Teams, A/B-Tests, KI-Generator und entfernbarem Badge. 14 Tage Pro testen, ohne Kreditkarte.",
      ],
    },
    honestSection: {
      title: "Wann Heyflow trotzdem die bessere Wahl ist",
      text: "Ehrlich verglichen: Heyflow ist ein sehr ausgereiftes Produkt mit starkem Designanspruch, umfangreichen nativen Integrationen und Funktionen, die auf große Performance-Marketing-Teams und Enterprise-Anforderungen zugeschnitten sind. Wer mit mehreren Agenturen, komplexen Tracking-Setups und Sechsstellig-Budgets arbeitet, findet dort viel Passendes. Für alle, die planbare Kosten und einen schnellen, unkomplizierten Weg zum Funnel wollen, ist Trichterwerk die pragmatischere Wahl.",
    },
    migrationSteps: [
      {
        title: "Flow-Struktur nachbauen",
        text: "Screens, Fragen und Bedingungen deines Heyflows in einer Trichterwerk-Vorlage abbilden — die Elementtypen (Auswahl, Slider, Text, Upload-freie Formulare) sind vergleichbar, die Logik ebenfalls.",
      },
      {
        title: "Domain, Design und Tracking übernehmen",
        text: "Farben und Logo hinterlegen, Domain per CNAME verbinden (SSL automatisch), Conversion-Ziele in den eingebauten Analytics prüfen. Webhook zu deinem CRM einrichten — Zapier und Make funktionieren genauso.",
      },
      {
        title: "Traffic umleiten und skalieren",
        text: "Ads auf die neue Funnel-URL zeigen lassen, Bestandsleads bei Heyflow als CSV exportieren, altes Abo kündigen. Ab jetzt kostet der nächste Lead nichts extra.",
      },
    ],
    faqs: [
      {
        q: "Was kostet Heyflow im Vergleich zu Trichterwerk?",
        a: "Heyflow liegt je nach Plan etwa zwischen 45 und 359 USD pro Monat, wobei der Preis mit der Zahl der generierten Leads steigt. Trichterwerk kostet 49 € pro Monat inklusive Mehrwertsteuer mit unbegrenzten Leads — plus einen dauerhaft kostenlosen Free-Plan.",
      },
      {
        q: "Gibt es bei Heyflow einen kostenlosen Plan?",
        a: "Nein, Heyflow bietet einen Testzeitraum, aber keinen dauerhaft kostenlosen Plan. Trichterwerk hat einen echten Free-Plan mit 1 veröffentlichten Funnel und 100 sichtbaren Leads pro Monat, ohne Kreditkarte.",
      },
      {
        q: "Werden meine Leads bei Trichterwerk begrenzt?",
        a: "Im Pro-Plan nicht: Funnels und Leads sind unbegrenzt, unabhängig von deinem Kampagnenvolumen. Im kostenlosen Free-Plan siehst du 100 Leads pro Monat.",
      },
      {
        q: "Ist Trichterwerk DSGVO-konform?",
        a: "Ja. Hosting ausschließlich in der EU, cookielose eigene Analytics, AVV und deutscher Support per E-Mail. Beim Datenschutz nehmen sich Heyflow und Trichterwerk als europäische Anbieter wenig.",
      },
      {
        q: "Kann ich meinen Heyflow-Flow importieren?",
        a: "Einen automatischen Import gibt es nicht. Mit den 13 deutschen Vorlagen und dem KI-Generator ist ein typischer Flow aber meist in unter einer Stunde nachgebaut; bestehende Leads exportierst du bei Heyflow als CSV.",
      },
      {
        q: "Für wen lohnt sich der Wechsel von Heyflow?",
        a: "Vor allem für Selbstständige, kleine Teams, Handwerks- und Dienstleistungsbetriebe sowie Agenturen mit mehreren Kundenprojekten: Sie bekommen dieselbe Funnel-Idee auf Deutsch, zum Festpreis und ohne Lead-Staffel.",
      },
    ],
    relatedSlugs: ["perspective-alternative", "typeform-alternative", "meetovo-alternative"],
  },

  "meetovo-alternative": {
    slug: "meetovo-alternative",
    competitorName: "MEETOVO",
    metaTitle: "MEETOVO-Alternative: Recruiting-Funnels und mehr",
    metaDescription:
      "MEETOVO-Alternative mit transparentem Preis: Trichterwerk baut Recruiting-Funnels und alle anderen Funnel-Typen — Gratis-Plan, Pro 49 €/Monat.",
    h1: "Die MEETOVO-Alternative: Recruiting-Funnels — und alles andere gleich mit",
    intro: [
      "MEETOVO ist ein deutscher Spezialist für Recruiting-Funnels und macht diese Sache gut: Bewerber ohne Lebenslauf abholen, per Smartphone qualifizieren, Termine buchen. 14 Tage lässt sich das kostenlos und ohne Zahlungsdaten testen. Zwei Punkte stören viele Interessenten trotzdem: Die Preise sind wenig transparent kommuniziert — man erfährt sie oft erst im Gespräch — und das Produkt ist stark auf Recruiting verengt.",
      "Trichterwerk bringt dieselben Recruiting-Vorlagen mit — Express-Bewerbung, Pflege, Handwerk — und daneben alle anderen Funnel-Typen: Lead-Funnels für Beratung, Anfrage-Funnels für Dienstleister, Quiz-Funnels für Coaches. Mit einem Preis, der auf der Website steht: 0 € im Free-Plan, 49 € im Monat inklusive Mehrwertsteuer für Pro.",
    ],
    verdict:
      "Kurz gesagt: Wenn du Recruiting-Funnels brauchst, aber nicht sicher bist, ob es dabei bleibt, deckt Trichterwerk beides ab — Bewerberstrecken und jeden anderen Funnel-Typ, zum offen ausgewiesenen Preis. Free-Plan dauerhaft, 14 Tage Pro ohne Kreditkarte.",
    painPoints: [
      {
        title: "Preise kaum transparent",
        text: "Wer bei MEETOVO wissen will, was es am Ende kostet, findet nur schwer klare Zahlen und landet oft in einem Beratungsgespräch. Planung wird so zur Schätzung. Trichterwerk nennt die Preise offen: Free-Plan 0 €, Pro 49 € pro Monat inklusive Mehrwertsteuer, monatlich kündbar.",
      },
      {
        title: "Stark auf Recruiting verengt",
        text: "MEETOVO ist auf Bewerber-Funnels spezialisiert. Sobald du auch Kundenanfragen, Beratungstermine oder ein Quiz für dein Angebot brauchst, brauchst du ein zweites Tool. Trichterwerk deckt Recruiting- und Lead-Funnels in einem Account ab.",
      },
      {
        title: "Kostenlos testen — aber kein dauerhafter Free-Plan",
        text: "14 Tage ohne Zahlungsdaten testen ist fair, danach ist Schluss. Trichterwerk hat zusätzlich einen dauerhaft kostenlosen Plan: 1 veröffentlichter Funnel, 100 Leads pro Monat sichtbar, alle Editor-Features — du kannst eine Stelle also dauerhaft kostenlos ausschreiben.",
      },
      {
        title: "Ein Spezialtool für ein wachsendes Unternehmen",
        text: "Viele Betriebe starten mit Recruiting und merken nach ein paar Monaten, dass derselbe Funnel-Mechanismus auch im Vertrieb funktioniert. Mit einem reinen Recruiting-Tool bedeutet das: neuer Anbieter, neues Abo, neues Einarbeiten. Mit Trichterwerk baust du den nächsten Funnel im selben Editor.",
      },
    ],
    comparisonRows: [
      { label: "Deutsche Oberfläche & Support", trichterwerk: true, competitor: true },
      { label: "Hosting in der EU / DSGVO-konform", trichterwerk: true, competitor: true },
      { label: "Recruiting-Vorlagen (Express-Bewerbung, Pflege, Handwerk)", trichterwerk: true, competitor: true },
      { label: "Auch Lead-, Anfrage- & Quiz-Funnels", trichterwerk: true, competitor: "Fokus Recruiting" },
      { label: "Preise offen auf der Website", trichterwerk: "0 € / 49 €", competitor: "wenig transparent" },
      { label: "Dauerhaft kostenloser Plan", trichterwerk: "1 Funnel, 100 Leads/Monat", competitor: "14 Tage Test" },
      { label: "Test ohne Zahlungsdaten", trichterwerk: true, competitor: true },
      { label: "A/B-Tests", trichterwerk: true, competitor: "nicht klar ausgewiesen" },
      { label: "KI-Funnel-Generator", trichterwerk: true, competitor: "nicht klar ausgewiesen" },
      { label: "Monatspreis", trichterwerk: "0 € oder 49 € inkl. MwSt.", competitor: "auf Anfrage" },
    ],
    featureSections: [
      {
        title: "Recruiting-Funnels, die Bewerber wirklich ausfüllen",
        text: "Express-Bewerbung ohne Lebenslauf, Vorlagen für Pflege und Handwerk, kurze Qualifizierungsfragen statt PDF-Upload. Der Bewerber tippt am Handy drei Antworten und hinterlässt Kontaktdaten — genau der Mechanismus, für den du sonst ein Spezialtool buchst.",
      },
      {
        title: "Ein Account für jeden Funnel-Typ",
        text: "Neben Recruiting findest du unter den 13 deutschen Vorlagen auch Beratung, Dienstleistung, Immobilien und Coaching. Wenn dein Vertrieb morgen ebenfalls Funnels will, brauchst du keinen zweiten Anbieter — im Pro-Plan sind Funnels unbegrenzt.",
      },
      {
        title: "Transparenter Preis ohne Verkaufsgespräch",
        text: "Kein Demo-Termin, um den Preis zu erfahren: Free-Plan 0 €, Pro 49 € pro Monat inklusive Mehrwertsteuer, monatlich kündbar. Vorher 14 Tage Pro testen — ohne Kreditkarte.",
      },
      {
        title: "A/B-Tests und Analytics für Stellenanzeigen",
        text: "Welche Headline bringt mehr Bewerbungen, „Jetzt in 60 Sekunden bewerben“ oder „Ohne Lebenslauf bewerben“? Teste beide Varianten gegeneinander und sieh in den cookielosen Analytics, wo Bewerber abspringen.",
      },
      {
        title: "Bewerber direkt ins System",
        text: "Neue Bewerbungen landen im Dashboard, gehen per Webhook an dein Bewerbermanagement oder CRM (Zapier- und Make-kompatibel) und lassen sich jederzeit als CSV exportieren. DSGVO-konform mit EU-Hosting und AVV.",
      },
    ],
    pricingComparison: {
      title: "Preisvergleich: MEETOVO vs. Trichterwerk",
      text: [
        "MEETOVO lässt sich 14 Tage kostenlos und ohne Zahlungsdaten testen — das ist ein fairer Einstieg. Was danach kommt, ist allerdings wenig transparent kommuniziert: Konkrete Preise erfährst du in der Regel erst im direkten Kontakt, eine Planung im Voraus ist damit schwierig.",
        "Trichterwerk legt beide Zahlen offen: Der Free-Plan ist dauerhaft kostenlos mit 1 veröffentlichten Funnel und 100 sichtbaren Leads pro Monat. Pro kostet 49 € pro Monat inklusive Mehrwertsteuer — unbegrenzte Funnels und Leads, eigene Domain mit SSL, Teams, A/B-Tests, KI-Generator, Badge entfernbar. Testphase: 14 Tage Pro ohne Kreditkarte.",
      ],
    },
    honestSection: {
      title: "Wann MEETOVO trotzdem die bessere Wahl ist",
      text: "Ehrlich verglichen: MEETOVO ist ein echter Recruiting-Spezialist mit viel Erfahrung genau in diesem Feld — von Bewerberansprache über Terminierung bis zu Prozessen, die auf Personalabteilungen zugeschnitten sind. Wer ausschließlich Recruiting macht, ein größeres Team im Personalmarketing hat und Begleitung im Prozess sucht, ist dort gut aufgehoben. Wer Recruiting-Funnels braucht, aber auch Vertriebs- und Anfrage-Funnels bauen will — und einen klar ausgewiesenen Preis erwartet —, fährt mit Trichterwerk besser.",
    },
    migrationSteps: [
      {
        title: "Bewerberstrecke übernehmen",
        text: "Starte mit der Vorlage Express-Bewerbung oder der Branchenvorlage für Pflege bzw. Handwerk und übertrage deine Fragen. Die Struktur — Anzeige, Qualifizierung, Kontakt, Danke-Seite — ist dieselbe, die du schon kennst.",
      },
      {
        title: "Design, Domain und Anbindung",
        text: "Arbeitgeber-Branding hinterlegen, Domain per CNAME verbinden (SSL automatisch), Webhook zu deinem Bewerbermanagement einrichten. Im Pro-Plan verschwindet das Trichterwerk-Badge.",
      },
      {
        title: "Kampagne umstellen & erweitern",
        text: "Stellenanzeigen und Ads auf die neue URL zeigen lassen, laufende Bewerbungen als CSV sichern. Danach direkt den zweiten Funnel bauen — etwa für Kundenanfragen, im selben Account ohne Aufpreis.",
      },
    ],
    faqs: [
      {
        q: "Was kostet MEETOVO im Vergleich zu Trichterwerk?",
        a: "MEETOVO kommuniziert seine Preise wenig transparent; du kannst 14 Tage kostenlos und ohne Zahlungsdaten testen, erfährst konkrete Konditionen aber meist erst im Gespräch. Trichterwerk nennt sie offen: Free-Plan 0 €, Pro 49 € pro Monat inklusive Mehrwertsteuer.",
      },
      {
        q: "Kann Trichterwerk auch Recruiting-Funnels?",
        a: "Ja. Zu den 13 deutschen Vorlagen gehören Express-Bewerbung ohne Lebenslauf sowie Branchenvorlagen für Pflege und Handwerk — mobil optimiert und mit Qualifizierungsfragen statt PDF-Upload.",
      },
      {
        q: "Gibt es eine kostenlose MEETOVO-Alternative?",
        a: "Der Free-Plan von Trichterwerk ist dauerhaft kostenlos: 1 veröffentlichter Funnel, 100 Leads pro Monat sichtbar, alle Editor-Features, keine Kreditkarte. Damit kannst du eine Stelle dauerhaft kostenlos ausschreiben.",
      },
      {
        q: "Was kann Trichterwerk, das ein Recruiting-Spezialtool nicht kann?",
        a: "Alle anderen Funnel-Typen: Lead-Funnels für Beratung, Anfrage-Funnels für Dienstleister, Quiz-Funnels für Coaches. Im Pro-Plan sind Funnels unbegrenzt — Recruiting und Vertrieb laufen im selben Account.",
      },
      {
        q: "Sind Bewerberdaten bei Trichterwerk DSGVO-konform gespeichert?",
        a: "Ja: Hosting ausschließlich in der EU, cookielose eigene Analytics, AVV und deutscher Support per E-Mail. Bewerberdaten kannst du jederzeit als CSV exportieren oder per Webhook an dein Bewerbermanagement geben.",
      },
      {
        q: "Wie schnell steht mein erster Recruiting-Funnel?",
        a: "Mit einer Vorlage meist in unter einer Stunde. Alternativ beschreibst du die Stelle dem KI-Generator und bekommst einen fertigen Entwurf, den du nur noch anpasst und veröffentlichst.",
      },
    ],
    relatedSlugs: ["perspective-alternative", "heyflow-alternative", "funnelcockpit-alternative"],
  },

  "systeme-io-alternative": {
    slug: "systeme-io-alternative",
    competitorName: "systeme.io",
    metaTitle: "systeme.io-Alternative aus Deutschland – EU-Hosting",
    metaDescription:
      "systeme.io-Alternative aus Deutschland: Trichterwerk ist ein fokussierter Funnel-Builder mit EU-Hosting, deutschem Support und dauerhaftem Gratis-Plan.",
    h1: "Die systeme.io-Alternative aus Deutschland: fokussierter Funnel-Builder statt All-in-One-Baustelle",
    intro: [
      "systeme.io aus Frankreich ist eine der großzügigsten All-in-One-Plattformen am Markt: Der Free-Plan enthält dauerhaft 3 Funnels, 1 Blog, 1 Onlinekurs und unbegrenzte E-Mails, die bezahlten Pläne liegen etwa zwischen 17 und 97 USD pro Monat. Das ist ein starkes Angebot — und trotzdem passt es nicht für jeden im DACH-Raum.",
      "Denn die Oberfläche ist übersetzt, aber nicht auf Deutsch gedacht: Formulierungen wirken sperrig, Hilfeartikel und Support laufen per E-Mail und teils auf Englisch. Wie und wo Daten verarbeitet werden, ist weniger klar kommuniziert, als es Datenschutzbeauftragte hierzulande erwarten. Trichterwerk ist ein deutsches Produkt mit EU-Hosting, deutschem Support und einem Editor, der sich auf Funnels konzentriert statt auf zehn Disziplinen gleichzeitig.",
    ],
    verdict:
      "Kurz gesagt: systeme.io ist stark, wenn du eine günstige All-in-One-Plattform suchst und mit Englisch kein Problem hast. Willst du dagegen ein deutsches Produkt mit klarem EU-Hosting und einem fokussierten Funnel-Editor, ist Trichterwerk die passende Alternative — Free-Plan dauerhaft, Pro 49 €/Monat.",
    painPoints: [
      {
        title: "Übersetzt, aber nicht deutsch gedacht",
        text: "Die Oberfläche gibt es auf Deutsch, wirkt aber wie eine Übersetzung: Begriffe sind ungewohnt, Vorlagen und Beispieltexte stammen aus dem englisch- bzw. französischsprachigen Markt. Trichterwerk ist von Anfang an auf Deutsch geschrieben — inklusive 13 Vorlagen, die für den DACH-Markt gedacht sind.",
      },
      {
        title: "Support nur per E-Mail und teils auf Englisch",
        text: "Bei systeme.io läuft der Support über E-Mail-Tickets, Antworten kommen abhängig vom Thema auf Englisch. Wer eine Rückfrage zu Rechnung, DSGVO oder Domain hat, formuliert sie zweisprachig. Trichterwerk antwortet auf Deutsch per E-Mail — inklusive deutscher Rechnung mit MwSt.-Ausweis.",
      },
      {
        title: "Server- und DSGVO-Setup weniger klar kommuniziert",
        text: "Als europäischer Anbieter unterliegt systeme.io der DSGVO, aber wo genau die Daten liegen und welche Subdienstleister eingesetzt werden, ist weniger transparent kommuniziert. Trichterwerk hostet ausschließlich in der EU, nutzt cookielose eigene Analytics und stellt einen AVV bereit.",
      },
      {
        title: "All-in-One heißt auch: viele halbfertige Baustellen",
        text: "Funnels, Blog, Kurse, E-Mail-Marketing, Affiliate-Programm, Webinare — je breiter eine Plattform, desto weniger Tiefe hat der einzelne Bereich. Wenn Funnels dein Kerngeschäft sind, willst du dort keine Kompromisse. Trichterwerk macht genau eine Sache und macht sie gründlich.",
      },
    ],
    comparisonRows: [
      { label: "Deutsches Produkt & deutscher Support", trichterwerk: true, competitor: "übersetzt, Support teils englisch" },
      { label: "EU-Hosting klar ausgewiesen", trichterwerk: true, competitor: "weniger klar kommuniziert" },
      { label: "Dauerhaft kostenloser Plan", trichterwerk: "1 Funnel, 100 Leads/Monat", competitor: "3 Funnels, 1 Blog, 1 Kurs" },
      { label: "Deutsche Vorlagen für den DACH-Markt", trichterwerk: "13 Vorlagen", competitor: false },
      { label: "Fokussierter Funnel-Editor", trichterwerk: true, competitor: "All-in-One" },
      { label: "E-Mail-Marketing & Onlinekurse", trichterwerk: false, competitor: true },
      { label: "Conditional Logic & Quiz", trichterwerk: true, competitor: "eingeschränkt" },
      { label: "A/B-Tests", trichterwerk: true, competitor: "je nach Plan" },
      { label: "Cookielose eigene Analytics", trichterwerk: true, competitor: "Basis-Statistiken" },
      { label: "Monatspreis", trichterwerk: "0 € oder 49 € inkl. MwSt.", competitor: "0 $ oder ca. 17–97 USD" },
    ],
    featureSections: [
      {
        title: "Ein Werkzeug für eine Aufgabe",
        text: "Trichterwerk baut Funnels: Landingpage, Qualifizierungsfragen mit Logik, Kontaktformular, Danke-Seite — in einem Editor, unter einer Domain. Kein Umschalten zwischen Kursmodul, Mailtool und Blog, um eine Kampagne zu starten.",
      },
      {
        title: "Deutsch geschrieben, nicht übersetzt",
        text: "Oberfläche, Hilfetexte, Rechtstexte und die 13 Vorlagen sind auf Deutsch verfasst und auf deutsche Zielgruppen zugeschnitten — von der Express-Bewerbung im Handwerk bis zum Beratungs-Funnel. Support beantwortet Fragen auf Deutsch per E-Mail.",
      },
      {
        title: "EU-Hosting, AVV und Analytics ohne Cookies",
        text: "Deine Lead-Daten liegen in der EU, die eingebauten Analytics arbeiten cookielos — kein Cookie-Banner nur wegen deines Funnels, kein Google Analytics im Datenschutzkonzept. Den AVV bekommst du direkt aus dem Account.",
      },
      {
        title: "Free-Plan mit allen Editor-Features",
        text: "Der kostenlose Plan schneidet keine Funktionen ab: Du baust mit demselben Editor, denselben Elementen und derselben Logik wie im Pro-Plan. Begrenzt sind nur 1 veröffentlichter Funnel und 100 sichtbare Leads pro Monat — und das Badge bleibt sichtbar.",
      },
      {
        title: "Offene Schnittstellen statt geschlossenem Ökosystem",
        text: "Webhooks für jedes CRM, kompatibel mit Zapier und Make, CSV-Export mit einem Klick. So bleibt deine E-Mail-Software oder Kursplattform genau die, die du schon nutzt.",
      },
    ],
    pricingComparison: {
      title: "Preisvergleich: systeme.io vs. Trichterwerk",
      text: [
        "systeme.io hat einen der großzügigsten Free-Pläne am Markt: dauerhaft 3 Funnels, 1 Blog, 1 Onlinekurs und unbegrenzte E-Mails, ohne Zeitlimit. Die bezahlten Stufen liegen etwa zwischen 17 und 97 USD pro Monat und heben vor allem Kontakt- und Funnel-Limits an. Rein preislich ist das schwer zu schlagen.",
        "Trichterwerk kostet 0 € im Free-Plan (1 veröffentlichter Funnel, 100 Leads pro Monat sichtbar, alle Editor-Features) und 49 € pro Monat inklusive Mehrwertsteuer im Pro-Plan: unbegrenzte Funnels und Leads, eigene Domain mit SSL, Teams, A/B-Tests, Conditional Logic, KI-Generator, Badge entfernbar. Der Unterschied liegt weniger im Preis als in Sprache, Fokus und klar ausgewiesenem EU-Hosting.",
      ],
    },
    honestSection: {
      title: "Wann systeme.io trotzdem die bessere Wahl ist",
      text: "Ehrlich verglichen: Der Free-Plan von systeme.io ist wirklich großzügig — 3 Funnels, ein Blog, ein Onlinekurs und unbegrenzte E-Mails auf Dauer bietet sonst kaum jemand. Wenn du E-Mail-Marketing, Kurse, Affiliate-Programm und Funnels bewusst in einem einzigen günstigen Abo bündeln willst und mit englischsprachigem Support leben kannst, ist systeme.io eine hervorragende Wahl. Trichterwerk lohnt sich, wenn Funnels dein Kerngeschäft sind und du ein deutsches Produkt mit klarem EU-Hosting und deutschem Support möchtest.",
    },
    migrationSteps: [
      {
        title: "Funnel-Seiten übertragen",
        text: "Die Seitenfolge deines systeme.io-Funnels in einer deutschen Trichterwerk-Vorlage nachbauen und Texte übernehmen. Wer schnell sein will, lässt den KI-Generator einen Entwurf aus der Angebotsbeschreibung erzeugen.",
      },
      {
        title: "Domain & Tool-Anbindung",
        text: "Eigene Domain per CNAME verbinden, SSL läuft automatisch. Dein bestehendes E-Mail-Tool bindest du per Webhook an — Zapier und Make funktionieren ebenso, sodass Kurse oder Newsletter weiterlaufen wie bisher.",
      },
      {
        title: "Live gehen & Datenschutz nachziehen",
        text: "Alte Funnel-Links auf die neue URL weiterleiten, Kontakte bei systeme.io als CSV exportieren, AVV im Trichterwerk-Account herunterladen und in dein Verarbeitungsverzeichnis aufnehmen.",
      },
    ],
    faqs: [
      {
        q: "Was kostet systeme.io im Vergleich zu Trichterwerk?",
        a: "systeme.io hat einen dauerhaft kostenlosen Plan mit 3 Funnels, 1 Blog, 1 Kurs und unbegrenzten E-Mails; bezahlte Pläne liegen etwa zwischen 17 und 97 USD pro Monat. Trichterwerk hat ebenfalls einen dauerhaften Free-Plan und kostet im Pro-Plan 49 € pro Monat inklusive Mehrwertsteuer mit unbegrenzten Funnels und Leads.",
      },
      {
        q: "Ist systeme.io DSGVO-konform?",
        a: "systeme.io ist ein französisches Unternehmen und unterliegt damit der DSGVO. Wo genau die Daten liegen und welche Subdienstleister eingesetzt werden, ist allerdings weniger klar kommuniziert. Trichterwerk hostet ausschließlich in der EU, arbeitet mit cookielosen eigenen Analytics und stellt einen AVV bereit.",
      },
      {
        q: "Gibt es systeme.io auf Deutsch?",
        a: "Die Oberfläche ist ins Deutsche übersetzt, wirkt aber nicht deutsch gedacht — Vorlagen und Beispieltexte stammen aus anderen Märkten, der Support antwortet per E-Mail und teils auf Englisch. Trichterwerk ist durchgehend auf Deutsch, inklusive Support und Rechnung.",
      },
      {
        q: "Kann Trichterwerk auch E-Mail-Marketing und Onlinekurse?",
        a: "Nein, und das ist Absicht: Trichterwerk konzentriert sich auf Funnels. Newsletter, Kurse oder Mitgliederbereiche verbindest du per Webhook, Zapier oder Make mit den Tools, die du bereits nutzt.",
      },
      {
        q: "Gibt es bei Trichterwerk auch einen kostenlosen Plan?",
        a: "Ja, dauerhaft: 1 veröffentlichter Funnel, 100 Leads pro Monat sichtbar, alle Editor-Features, keine Kreditkarte. Nur das Trichterwerk-Badge bleibt sichtbar; im Pro-Plan lässt es sich entfernen.",
      },
      {
        q: "Lohnt sich der Wechsel von systeme.io?",
        a: "Wenn Funnels dein Kerngeschäft sind, du deutschsprachigen Support brauchst und klar ausgewiesenes EU-Hosting gegenüber Kunden oder Datenschutzbeauftragten belegen willst — ja. Nutzt du dagegen aktiv Kurse, Blog und E-Mail-Marketing in einem Abo, bleib bei systeme.io.",
      },
    ],
    relatedSlugs: ["clickfunnels-alternative", "onepage-alternative", "typeform-alternative"],
  },

  "onepage-alternative": {
    slug: "onepage-alternative",
    competitorName: "Onepage",
    metaTitle: "Onepage-Alternative: Funnels ohne teures Add-on",
    metaDescription:
      "Onepage-Alternative ohne Funnel-Add-on: Bei Trichterwerk sind Funnels der Kern — gratis starten, Pro 49 €/Monat mit unbegrenzten Leads und Domain.",
    h1: "Die Onepage-Alternative: Funnels sind der Kern, nicht das kostenpflichtige Add-on",
    intro: [
      "Onepage ist ein sympathischer Website-Baukasten mit einem fairen Free-Plan: 1 Website, 3 Seiten, 20 KI-Credits, keine Kreditkarte nötig. Die bezahlten Pläne liegen zwischen 19,99 € und 179,99 € pro Monat. Der Haken zeigt sich erst, wenn du Leads sammeln willst: Formulare und Funnels gibt es nur als kostenpflichtiges Add-on „Formulare & Funnels“ — also genau die Funktion, wegen der die meisten überhaupt ein Tool suchen.",
      "Bei Trichterwerk ist es andersherum: Der Funnel ist das Produkt. Mehrstufige Strecken, Conditional Logic, Formulare und Lead-Verwaltung sind schon im dauerhaft kostenlosen Free-Plan enthalten — 1 veröffentlichter Funnel, 100 Leads pro Monat sichtbar, alle Editor-Features. Pro kostet 49 € im Monat inklusive Mehrwertsteuer mit unbegrenzten Funnels und Leads.",
    ],
    verdict:
      "Kurz gesagt: Wer bei Onepage Leads sammeln will, bucht das Funnel-Add-on dazu. Bei Trichterwerk sind Funnels der Kern und im Gratis-Plan enthalten — Pro für 49 € pro Monat mit unbegrenzten Leads, eigener Domain und A/B-Tests.",
    painPoints: [
      {
        title: "Funnels und Formulare nur als Add-on",
        text: "Der Free-Plan und die Einstiegspläne von Onepage bringen dir eine Website — Formulare und Funnels stecken im kostenpflichtigen Add-on „Formulare & Funnels“. Ausgerechnet die Lead-Funktion kostet also extra. Bei Trichterwerk ist sie im Free-Plan enthalten.",
      },
      {
        title: "Website-Denke statt Funnel-Denke",
        text: "Ein Baukasten ist auf Seiten ausgelegt: Startseite, Über uns, Kontakt. Ein Funnel führt dagegen Schritt für Schritt zu einer Entscheidung — mit Verzweigungen, Fortschrittsanzeige und Qualifizierung. Trichterwerk ist genau dafür gebaut.",
      },
      {
        title: "Kosten steigen mit jedem Baustein",
        text: "19,99 € bis 179,99 € pro Monat je nach Plan, dazu das Funnel-Add-on und je nach Bedarf weitere Bausteine — die Endsumme steht erst am Schluss fest. Trichterwerk hat zwei Zahlen: 0 € oder 49 € inklusive Mehrwertsteuer, alles inklusive.",
      },
      {
        title: "KI nach Credits statt nach Bedarf",
        text: "Der Onepage-Free-Plan enthält 20 KI-Credits; ist das Kontingent aufgebraucht, wird nachgebucht. Der KI-Funnel-Generator von Trichterwerk gehört zum Pro-Plan — du beschreibst dein Angebot und bekommst einen kompletten Funnel-Entwurf.",
      },
    ],
    comparisonRows: [
      { label: "Deutsche Oberfläche", trichterwerk: true, competitor: true },
      { label: "Telefonsupport auf Deutsch", trichterwerk: false, competitor: true },
      { label: "Deutscher Support per E-Mail", trichterwerk: true, competitor: true },
      { label: "Funnels im kostenlosen Plan enthalten", trichterwerk: true, competitor: "nur mit Add-on" },
      { label: "Formulare & Lead-Verwaltung inklusive", trichterwerk: true, competitor: "Add-on „Formulare & Funnels“" },
      { label: "Conditional Logic & Quiz", trichterwerk: true, competitor: "eingeschränkt" },
      { label: "A/B-Tests", trichterwerk: true, competitor: false },
      { label: "Klassische Mehrseiten-Website", trichterwerk: false, competitor: true },
      { label: "Unbegrenzte Leads im Pro-Plan", trichterwerk: true, competitor: "je nach Plan & Add-on" },
      { label: "Monatspreis", trichterwerk: "0 € oder 49 € inkl. MwSt.", competitor: "0 € oder 19,99–179,99 € + Add-on" },
    ],
    featureSections: [
      {
        title: "Funnels im Free-Plan statt hinter der Paywall",
        text: "Mehrstufige Strecke, Qualifizierungsfragen, Formular, Danke-Seite und Lead-Übersicht — alles im dauerhaft kostenlosen Plan. Begrenzt sind nur der eine veröffentlichte Funnel und 100 sichtbare Leads pro Monat; das Badge bleibt sichtbar.",
      },
      {
        title: "Conditional Logic, die aus Besuchern Anfragen macht",
        text: "Antwortbasierte Verzweigungen führen jeden Besucher auf den passenden Pfad. Unpassende Interessenten steigen früh aus, passende kommen mit vollständigen Angaben an — das schafft ein Kontaktformular auf einer Website nicht.",
      },
      {
        title: "A/B-Tests und cookielose Analytics",
        text: "Zwei Varianten gegeneinander testen, Views, Conversions und Drop-offs pro Seite sehen — ohne Google Analytics und ohne Cookie-Banner nur wegen deines Funnels. Im Pro-Plan ohne Aufpreis enthalten.",
      },
      {
        title: "Eigene Domain mit SSL und Team-Zugänge",
        text: "Im Pro-Plan verbindest du deine Domain per CNAME, SSL wird automatisch eingerichtet, und Kollegen bekommen eigene Zugänge. Für Agenturen: unbegrenzte Funnels für unbegrenzt viele Kundenprojekte plus 25 % Provision im Partnerprogramm.",
      },
      {
        title: "Leads gehören dir",
        text: "CSV-Export mit einem Klick, Webhooks für jedes CRM, kompatibel mit Zapier und Make. Gespeichert wird ausschließlich in der EU, mit AVV und cookielosen Analytics.",
      },
    ],
    pricingComparison: {
      title: "Preisvergleich: Onepage vs. Trichterwerk",
      text: [
        "Onepage startet bei 0 €: 1 Website, 3 Seiten, 20 KI-Credits, ohne Kreditkarte. Die bezahlten Pläne liegen zwischen 19,99 € und 179,99 € pro Monat. Wichtig: Formulare und Funnels sind nicht Teil der Basis, sondern kommen als kostenpflichtiges Add-on „Formulare & Funnels“ dazu — die reine Planzahl sagt also wenig über deine Endkosten aus.",
        "Trichterwerk kostet 0 € im Free-Plan mit 1 veröffentlichten Funnel, 100 sichtbaren Leads pro Monat und allen Editor-Features. Pro kostet 49 € pro Monat inklusive Mehrwertsteuer: unbegrenzte Funnels und Leads, eigene Domain mit SSL, Teams, A/B-Tests, Conditional Logic, KI-Generator, Badge entfernbar. Keine Add-ons, keine Nachbuchungen.",
      ],
    },
    honestSection: {
      title: "Wann Onepage trotzdem die bessere Wahl ist",
      text: "Ehrlich verglichen: Onepage hat einen echten Vorteil, den wir nicht bieten — deutschsprachigen Telefonsupport. Wenn du bei einer Frage lieber zum Hörer greifst als eine E-Mail zu schreiben, ist das viel wert. Auch als klassischer Website-Baukasten mit mehreren Unterseiten, Blog und Impressum ist Onepage die richtige Wahl; Trichterwerk baut bewusst keine Mehrseiten-Websites. Geht es dir dagegen um Lead-Generierung mit mehrstufigen Funnels, bekommst du bei uns genau das als Kernprodukt statt als Add-on. Viele nutzen beides parallel: Website bei Onepage, Funnels bei Trichterwerk.",
    },
    migrationSteps: [
      {
        title: "Zielsetzung klären",
        text: "Website bleibt Website — umziehen musst du nur die Lead-Strecke. Nimm die Fragen aus deinem Onepage-Formular und übertrage sie in eine der 13 deutschen Vorlagen oder lass den KI-Generator einen Entwurf bauen.",
      },
      {
        title: "Funnel verlinken oder Subdomain nutzen",
        text: "Buttons auf deiner Website („Jetzt Anfrage starten“) auf den Trichterwerk-Funnel zeigen lassen — im Pro-Plan unter deiner eigenen Subdomain, etwa anfrage.deine-firma.de, mit automatischem SSL.",
      },
      {
        title: "Add-on kündigen & Leads anbinden",
        text: "Bestehende Einträge aus Onepage exportieren, Webhook zu deinem CRM einrichten, Funnel veröffentlichen. Danach kannst du das Add-on „Formulare & Funnels“ abbestellen.",
      },
    ],
    faqs: [
      {
        q: "Was kostet Onepage im Vergleich zu Trichterwerk?",
        a: "Onepage hat einen kostenlosen Plan mit 1 Website, 3 Seiten und 20 KI-Credits; bezahlte Pläne kosten 19,99 € bis 179,99 € pro Monat, Formulare und Funnels kommen als kostenpflichtiges Add-on dazu. Trichterwerk ist im Free-Plan kostenlos inklusive Funnel und kostet im Pro-Plan 49 € pro Monat inklusive Mehrwertsteuer.",
      },
      {
        q: "Sind Funnels bei Onepage inklusive?",
        a: "Nein. Funnels und Formulare gibt es bei Onepage nur über das kostenpflichtige Add-on „Formulare & Funnels“. Bei Trichterwerk sind Funnels das Kernprodukt und bereits im dauerhaft kostenlosen Plan enthalten.",
      },
      {
        q: "Kann Trichterwerk auch eine normale Website bauen?",
        a: "Nein — Trichterwerk baut Funnels, keine Mehrseiten-Websites mit Blog und Unterseiten. Viele Kunden kombinieren deshalb beides: Website beim Baukasten, Lead-Funnels bei Trichterwerk, verbunden über einen Button.",
      },
      {
        q: "Bietet Trichterwerk Telefonsupport?",
        a: "Nein, unser deutscher Support läuft per E-Mail. Telefonsupport ist eine echte Stärke von Onepage — wenn dir das wichtig ist, ist das ein klarer Punkt für den Baukasten.",
      },
      {
        q: "Was ist der Unterschied zwischen einer Landingpage und einem Funnel?",
        a: "Eine Landingpage ist eine einzelne Seite. Ein Funnel führt Besucher über mehrere Schritte — Einstieg, Qualifizierungsfragen mit Logik, Kontaktdaten, Danke-Seite — und misst dabei, wo Leute abspringen. Genau dafür ist Trichterwerk gebaut.",
      },
      {
        q: "Kann ich Trichterwerk kostenlos ausprobieren?",
        a: "Ja, zweifach: Der Free-Plan ist dauerhaft kostenlos (1 veröffentlichter Funnel, 100 Leads pro Monat sichtbar, alle Editor-Features), und zusätzlich kannst du 14 Tage lang Pro testen — ohne Kreditkarte.",
      },
    ],
    relatedSlugs: ["systeme-io-alternative", "typeform-alternative", "funnelcockpit-alternative"],
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
        a: "Starten kannst du dauerhaft kostenlos: ein veröffentlichter Funnel, 100 sichtbare Bewerbungen pro Monat, alle Editor-Features. Pro kostet 49 € pro Monat inklusive MwSt. — unbegrenzte Funnels und Bewerbungen, alle Vorlagen, A/B-Tests und eigene Domain inklusive. 14 Tage Pro ohne Kreditkarte, monatlich kündbar.",
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
        a: "Starten kannst du dauerhaft kostenlos: ein veröffentlichter Funnel, 100 sichtbare Leads pro Monat, alle Editor-Features. Pro kostet 49 € pro Monat inklusive MwSt. — unbegrenzte Funnels und Leads, alle Vorlagen, A/B-Tests, Analytics und eigene Domain inklusive. 14 Tage Pro ohne Kreditkarte, monatlich kündbar.",
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
  "photovoltaik-funnel": {
    slug: "photovoltaik-funnel",
    badge: "Für Solarteure, Energieberater & Elektro",
    h1: "Photovoltaik-Funnel: Solar-Leads selbst gewinnen statt einkaufen",
    intro: [
      "Auf Lead-Portalen kostet ein PV-Lead je nach Region und Qualität 35 bis 120 € — und du teilst ihn oft mit drei Mitbewerbern, die zeitgleich anrufen. Ein eigener Photovoltaik-Funnel dreht das um: Du erzeugst die Anfrage selbst, sie gehört nur dir, und das Tool dahinter hat sich rechnerisch schon ab dem ersten eigenen Lead amortisiert.",
      "Der Schlüssel liegt in der Mechanik: Ein Funnel, der deine Firma bewirbt, interessiert niemanden. Ein Funnel, der die Frage „Lohnt sich PV für MICH?“ beantwortet, schon. Genau dafür baust du mit Trichterwerk einen Solar-Check: Dachausrichtung, Stromverbrauch, Speicher-Interesse — Schritt für Schritt abgefragt, am Ende eine ehrliche Ersparnis-Einschätzung gegen Kontaktdaten.",
    ],
    painPoints: [
      {
        title: "Eingekaufte Leads sind teuer und geteilt",
        text: "35–120 € pro Lead sind der Marktpreis auf Portalen — plus das Risiko, dass derselbe Kontakt parallel an mehrere Betriebe geht. Ein eigener Funnel produziert exklusive Anfragen zum Preis deiner Werbung, nicht zum Preis der Plattform.",
      },
      {
        title: "Die Website spricht über dich, nicht über den Kunden",
        text: "„Ihr Partner für Photovoltaik seit 2011“ beantwortet keine einzige Frage, die ein Eigentümer wirklich hat. Der Funnel dreht die Perspektive: Erst die Einschätzung für sein Dach, dann dein Angebot.",
      },
      {
        title: "Zu viele Anfragen ohne eigenes Dach",
        text: "Mieter, Neugierige, Fensterfront nach Norden: Qualifizierungsfragen zu Eigentum, Dachfläche, Ausrichtung und Zeithorizont filtern vor, bevor jemand einen Termin blockiert. Mit Conditional Logic bekommt jede Antwort den passenden nächsten Schritt.",
      },
    ],
    industries: [
      {
        title: "Solarteure & Montagebetriebe",
        text: "Der klassische Solar-Check: Dachform, Ausrichtung, Verbrauch in kWh, Speicher ja/nein. Wer qualifiziert ist, landet direkt im Terminkalender für die Vor-Ort-Aufnahme.",
      },
      {
        title: "Energieberater",
        text: "Sanierungsfahrplan, Förderberatung, Wärmepumpe plus PV: Ein Funnel mit getrennten Wegen je Anliegen liefert dir das Beratungsthema schon vor dem Erstkontakt mit.",
      },
      {
        title: "Elektro & SHK mit PV-Sparte",
        text: "Wallbox, Speicher-Nachrüstung, Zählerschrank: Für jede Sparte ein eigener Funnel unter derselben Domain — im Pro-Plan ohne Limit bei Funnels und Leads.",
      },
    ],
    templateShowcase: ["immobilien-bewertung", "lead-magnet", "termin-buchen"],
    steps: [
      {
        title: "Solar-Check aufbauen",
        text: "Bewertungs- oder Lead-Magnet-Vorlage übernehmen und in deinen Solar-Check verwandeln: Dachdaten, Verbrauch, Interesse an Speicher und Wallbox — eine Frage pro Schritt.",
      },
      {
        title: "Ergebnis als Gegenwert liefern",
        text: "Am Ende steht kein „Wir melden uns“, sondern eine nachvollziehbare Einschätzung. Wichtig: Rechne ehrlich mit Spannen und kennzeichne die Schätzung als solche — sonst zahlst du im Erstgespräch drauf.",
      },
      {
        title: "Traffic schicken & messen",
        text: "Meta- oder Google-Ads auf die Funnel-URL, dazu QR-Codes auf Referenz-Baustellen und im Ort. Die cookielose Analytics zeigt dir pro Schritt, wo Interessenten aussteigen; per Webhook laufen die Leads in dein CRM.",
      },
    ],
    faqs: [
      {
        q: "Was ist ein Photovoltaik-Funnel?",
        a: "Eine mehrstufige Strecke, die aus anonymem Werbe-Traffic eine konkrete Anfrage macht: Solar-Check mit Fragen zu Dach, Verbrauch und Zeithorizont, am Ende Ersparnis-Einschätzung gegen Kontaktdaten. Statt „Angebot anfordern“ bekommt der Eigentümer erst einen Nutzen.",
      },
      {
        q: "Lohnt sich das gegenüber gekauften Solar-Leads?",
        a: "Rechne selbst: Auf Portalen kostet ein PV-Lead 35–120 € und ist oft mehrfach verkauft. Trichterwerk Pro kostet 49 € pro Monat inklusive MwSt. — ab dem ersten eigenen Lead ist das Tool bezahlt. Was bleibt, sind deine Werbekosten, dafür gehört die Anfrage exklusiv dir.",
      },
      {
        q: "Welche Fragen gehören in den Solar-Check?",
        a: "Eigentümer oder Mieter, Dachausrichtung und ungefähre Fläche, Jahresverbrauch in kWh oder Stromkosten pro Monat, Interesse an Speicher und Wallbox, Zeithorizont, Postleitzahl. Mehr als sechs bis sieben Fragen kosten Abschlussquote.",
      },
      {
        q: "Darf ich eine Ersparnis ausrechnen und anzeigen?",
        a: "Eine Einschätzung mit klar benannten Annahmen und Spannen ist üblich und sinnvoll — als verbindliche Zusage darfst du sie nicht darstellen. Formuliere sie als unverbindliche Orientierung, die im Vor-Ort-Termin präzisiert wird.",
      },
      {
        q: "Kann ich das kostenlos ausprobieren?",
        a: "Ja. Der Free-Plan ist dauerhaft kostenlos: ein veröffentlichter Funnel, 100 sichtbare Leads pro Monat, alle Editor-Features — nur das Trichterwerk-Badge bleibt. Zusätzlich kannst du Pro 14 Tage ohne Kreditkarte testen.",
      },
    ],
  },

  "handwerk-recruiting-funnel": {
    slug: "handwerk-recruiting-funnel",
    badge: "Für Handwerksbetriebe, SHK & Elektro",
    h1: "Handwerk-Recruiting-Funnel: Monteure erreichen, wo sie sind",
    intro: [
      "Rund 107.000 Fachkräfte fehlen im deutschen Handwerk — und der Betrieb, der zuerst reagiert, bekommt den Gesellen. Das Problem ist selten die Anzeige, sondern der Weg dahinter: Monteure bewerben sich nicht mit Anschreiben und Lebenslauf-PDF. Sie schauen abends aufs Handy, und dort entscheidet sich in wenigen Sekunden, ob sie sich melden oder weiterscrollen.",
      "Ein Recruiting-Funnel fürs Handwerk ist deshalb kurz, ehrlich und mobil: Gewerk, Qualifikation, Führerschein, Gehaltsvorstellung — Express-Bewerbung in 60 Sekunden vom Handy. Mit Trichterwerk baust du ihn aus einer fertigen deutschen Vorlage und hängst den QR-Code an den Firmenwagen, statt auf das nächste Anzeigen-Paket zu warten.",
    ],
    painPoints: [
      {
        title: "Die Anzeige läuft, es kommt nichts",
        text: "Klassische Stellenportale und PDF-Bewerbungen filtern genau die Leute weg, die du suchst: die, die gerade auf der Baustelle stehen und keine Mappe bauen. Wer den Bewerbungsweg auf drei Fragen kürzt, bekommt Kontakte statt Klicks.",
      },
      {
        title: "Bewerber springen beim Upload ab",
        text: "Lebenslauf, Zeugnisse, Anschreiben — jede Datei-Anforderung auf dem Smartphone kostet dich Bewerber. Sammle zuerst Kontakt und Qualifikation, die Unterlagen holst du im Telefonat oder beim Probearbeiten nach.",
      },
      {
        title: "Reichweite verpufft ohne Landepunkt",
        text: "Firmenwagen, Bauzaun, Aushang beim Großhändler, Instagram-Story vom Team: All das erzeugt Aufmerksamkeit, die auf einer Karriereseite mit PDF-Formular verendet. Ein QR-Code auf den Funnel macht daraus messbare Bewerbungen.",
      },
    ],
    industries: [
      {
        title: "SHK & Heizungsbau",
        text: "Anlagenmechaniker, Kundendienst-Monteure, Azubis: Ein Funnel je Gewerk mit passenden Fragen zu Erfahrung, Führerschein und Wunsch-Einsatzgebiet — Bewerbung ohne Papierkram.",
      },
      {
        title: "Elektro & Photovoltaik",
        text: "Elektroniker für Energie- und Gebäudetechnik oder PV-Monteure findest du selten über Jobbörsen. Social Ads plus 60-Sekunden-Bewerbung erreichen auch die, die nicht aktiv suchen.",
      },
      {
        title: "Bau, Dach & Metall",
        text: "Kolonnenführer, Dachdecker, Schlosser: Wenige, klare Fragen — Qualifikation, Berufsjahre, Region, Verfügbarkeit ab wann. Der Rest gehört ins Gespräch, nicht ins Formular.",
      },
    ],
    templateShowcase: ["handwerk-recruiting", "express-bewerbung", "recruiting"],
    steps: [
      {
        title: "Vorlage übernehmen",
        text: "Handwerk-Recruiting- oder Express-Bewerbungs-Vorlage laden, Gewerk, Benefits und Fragen anpassen — Firmenfarben und Logo in wenigen Minuten dazu.",
      },
      {
        title: "QR-Code verteilen",
        text: "Funnel veröffentlichen, eigene Domain verbinden (SSL inklusive) und den Link als QR-Code auf Firmenwagen, Bauzaun, Aushang und Visitenkarte bringen. Ein Code, ein Ziel, messbare Herkunft.",
      },
      {
        title: "Schnell zurückrufen",
        text: "Jede Bewerbung landet sofort per E-Mail und im Dashboard, inklusive aller Antworten. Im Handwerk gewinnt fast immer der Betrieb, der am selben Tag anruft — nicht der mit der schöneren Anzeige.",
      },
    ],
    faqs: [
      {
        q: "Warum funktionieren klassische Stellenanzeigen im Handwerk so schlecht?",
        a: "Weil sie einen Bewerbungsweg voraussetzen, den die Zielgruppe nicht geht: Desktop, PDF, Anschreiben. Monteure sind mobil unterwegs und entscheiden spontan. Ein Funnel, der auf dem Handy in 60 Sekunden durchläuft, senkt genau diese Hürde.",
      },
      {
        q: "Reichen drei Fragen wirklich für eine Bewerbung?",
        a: "Für den Erstkontakt ja. Gewerk, Berufserfahrung, Führerschein und Verfügbarkeit sagen dir, ob sich ein Telefonat lohnt. Zeugnisse, Details und Referenzen holst du im Gespräch — die Reihenfolge entscheidet, ob du überhaupt eins bekommst.",
      },
      {
        q: "Wie bringe ich Bewerber auf den Funnel?",
        a: "Meta-Ads mit echten Baustellen- und Team-Fotos funktionieren am besten, dazu QR-Codes auf Firmenfahrzeugen, Bauzäunen und Aushängen, der Link in der Stellenanzeige und die Weiterempfehlung durch die eigene Belegschaft.",
      },
      {
        q: "Ist das DSGVO-konform, auch bei Bewerberdaten?",
        a: "Ja: Hosting ausschließlich in der EU, Cookie-Consent auf jedem veröffentlichten Funnel, AV-Vertrag inklusive und dokumentierte Einwilligung pro Bewerbung. Der Export nach CSV oder per Webhook in dein System liegt in deiner Hand.",
      },
      {
        q: "Was kostet ein Recruiting-Funnel fürs Handwerk?",
        a: "Starten kannst du dauerhaft kostenlos: ein veröffentlichter Funnel, 100 sichtbare Bewerbungen pro Monat, alle Editor-Features, Badge bleibt sichtbar. Pro kostet 49 € pro Monat inklusive MwSt. mit unbegrenzten Funnels, eigener Domain und Team-Zugängen — 14 Tage ohne Kreditkarte testbar.",
      },
    ],
  },

  "pflege-recruiting-funnel": {
    slug: "pflege-recruiting-funnel",
    badge: "Für Pflegedienste, Heime & Kliniken",
    h1: "Pflege-Recruiting-Funnel: mit den Argumenten werben, die zählen",
    intro: [
      "„Werden Sie Teil unseres motivierten Teams“ liest jede Pflegekraft zehnmal am Tag — und glaubt es kein einziges Mal. Was Pflegekräfte tatsächlich bewegt, ist konkret: Dienstplansicherheit, faire Bezahlung und die Zusage, nicht aus dem Frei einspringen zu müssen. Wer diese drei Punkte im ersten Schritt beantwortet, hat den Vorsprung — unabhängig vom Werbebudget.",
      "Ein Pflege-Recruiting-Funnel bringt genau diese Reihenfolge: erst deine Antwort auf Dienstplan, Gehalt und Einspringen, dann drei kurze Fragen zu Qualifikation, Umfang und Wunschbereich, am Ende Name und Telefonnummer. Mobile Bewerbung in 2 Minuten, ohne Lebenslauf-Upload — mit Trichterwerk aus einer fertigen deutschen Vorlage aufgebaut.",
    ],
    painPoints: [
      {
        title: "Austauschbare Anzeigen ohne Substanz",
        text: "Wenn in der Anzeige nur Floskeln stehen, vergleichen Bewerber nur noch das Gehalt. Benenne stattdessen konkret, wie der Dienstplan läuft, wie lange er im Voraus steht und was passiert, wenn jemand ausfällt.",
      },
      {
        title: "Die Bewerbung ist zu aufwendig",
        text: "Pflegekräfte bewerben sich zwischen Spätdienst und Feierabend vom Handy. Bewerbungsportale mit Registrierung und Datei-Upload verlieren genau diese Leute. Zwei Minuten, keine Anmeldung, keine Mappe — das ist die Messlatte.",
      },
      {
        title: "Zu langsame Rückmeldung",
        text: "Wer sich in der Pflege bewirbt, bewirbt sich meist bei mehreren Häusern. Vergehen Tage bis zum ersten Kontakt, ist die Stelle woanders vergeben. Der Funnel meldet jede Bewerbung sofort per E-Mail ins Team.",
      },
    ],
    industries: [
      {
        title: "Ambulante Pflegedienste",
        text: "Tourenplanung, Dienstwagen, feste Bezugskunden: Für ambulante Teams zählen andere Argumente als in der Klinik. Fragen nach Führerschein, Region und gewünschtem Stundenumfang sortieren früh.",
      },
      {
        title: "Stationäre Pflege & Heime",
        text: "Wohnbereich, Schichtmodell, Springerpool: Mach transparent, wie viele Wochenenden frei sind und wie der Dienstplan zustande kommt — das ist der Unterschied zur Anzeige nebenan.",
      },
      {
        title: "Kliniken & Fachbereiche",
        text: "Intensiv, OP, Anästhesie, Notaufnahme: Ein Funnel je Fachbereich mit passenden Qualifizierungsfragen — im Pro-Plan ohne Limit bei Funnels, mit Team-Zugängen für die Personalabteilung.",
      },
    ],
    templateShowcase: ["pflege-recruiting", "express-bewerbung", "recruiting"],
    steps: [
      {
        title: "Deine echten Benefits sammeln",
        text: "Bevor du baust: Wie weit im Voraus steht der Dienstplan? Was zahlst du über Tarif? Wie ist die Einspring-Regel? Nur was du wirklich halten kannst, gehört in den Funnel — alles andere fliegt spätestens in der Probezeit auf.",
      },
      {
        title: "Vorlage anpassen",
        text: "Pflege-Recruiting-Vorlage übernehmen, Benefits in den ersten Schritt setzen, drei Qualifizierungsfragen definieren (Qualifikation, Stundenumfang, Wunschbereich) und Farben sowie Logo anpassen.",
      },
      {
        title: "Live schalten & nachfassen",
        text: "Über Meta-Ads, den Link in der Stellenanzeige oder QR-Codes im Haus verbreiten. Jede Bewerbung kommt mit allen Antworten ins Dashboard — am selben Tag zurückrufen ist der größte Hebel.",
      },
    ],
    faqs: [
      {
        q: "Welche Argumente überzeugen Pflegekräfte wirklich?",
        a: "Drei Punkte dominieren: ein Dienstplan, der verlässlich steht, faire und transparente Bezahlung, und die klare Zusage, nicht aus dem Frei einspringen zu müssen. Alles andere — Obstkorb, Teamevents — entscheidet keine Bewerbung.",
      },
      {
        q: "Wie kurz darf eine Pflege-Bewerbung sein?",
        a: "Zwei Minuten auf dem Handy sind ein guter Zielwert: Qualifikation, gewünschter Stundenumfang, Bereich, Verfügbarkeit, Name und Telefonnummer. Zeugnisse und Urkunden forderst du an, wenn ihr euch beide für ein Gespräch entschieden habt.",
      },
      {
        q: "Wie erreiche ich Pflegekräfte, die gar nicht aktiv suchen?",
        a: "Über Social Ads statt Jobbörsen. Wer zufrieden ist, sucht nicht — aber schaut sich ein Angebot an, das im Feed konkret Dienstplansicherheit und Bezahlung anspricht. Genau dafür ist ein mobiler Funnel als Landepunkt gebaut.",
      },
      {
        q: "Wie ist der Datenschutz bei Bewerberdaten geregelt?",
        a: "Hosting ausschließlich in der EU, Cookie-Consent auf jedem veröffentlichten Funnel, AV-Vertrag inklusive und dokumentierte Einwilligung pro Bewerbung. Daten exportierst du per CSV oder gibst sie per signiertem Webhook an dein Bewerbermanagement weiter.",
      },
      {
        q: "Wie schnell ist so ein Funnel einsatzbereit?",
        a: "Mit der fertigen Pflege-Vorlage in unter einer Stunde: übernehmen, Benefits und Fragen anpassen, veröffentlichen. Die Vorlage kannst du vorher ohne Anmeldung live durchklicken; Pro testest du 14 Tage ohne Kreditkarte.",
      },
    ],
  },

  "immobilien-funnel": {
    slug: "immobilien-funnel",
    badge: "Für Makler & Immobilienunternehmen",
    h1: "Immobilien-Funnel: Wertermittlung als Einstieg, Maklervertrag als Ziel",
    intro: [
      "Eigentümer suchen selten einen Makler — sie suchen eine Zahl. „Was ist meine Immobilie wert?“ ist der Moment, in dem sie sich zum ersten Mal mit dem Verkauf beschäftigen. Genau hier setzt ein Immobilien-Funnel an: kostenlose Wertermittlung als Einstieg, daraus ein Verkäufer-Lead, aus dem Beratungsgespräch der Maklervertrag.",
      "Die Mechanik funktioniert, weil du zuerst lieferst: Objektdaten werden Schritt für Schritt abgefragt — Objektart, Wohnfläche, Baujahr, Zustand, Lage — und der Eigentümer bekommt als Gegenwert eine erste Einschätzung. Mit Trichterwerk baust du diesen Funnel aus einer fertigen Vorlage, mit Conditional Logic für getrennte Wege für Verkäufer und Kaufinteressenten.",
    ],
    painPoints: [
      {
        title: "„Kontakt aufnehmen“ ist kein Angebot",
        text: "Ein Kontaktformular verlangt Vertrauen, bevor du etwas gegeben hast. Die Wertermittlung dreht das um: Der Eigentümer investiert zwei Minuten und bekommt eine Einschätzung — der Kontakt ist die Folge, nicht die Vorleistung.",
      },
      {
        title: "Verkäufer und Käufer im selben Formular",
        text: "Beide Gruppen brauchen völlig unterschiedliche Fragen und Folgeschritte. Ein Funnel mit Conditional Logic trennt sie im ersten Schritt: Verkäufer gehen in die Wertermittlung, Suchende in den Suchauftrag mit Budget und Kriterien.",
      },
      {
        title: "Leads ohne Verkaufsabsicht",
        text: "Neugierige Nachbarn und Eigentümer ohne Zeithorizont kosten Beratungszeit. Fragen nach Verkaufsabsicht, Zeitrahmen und Eigentümerstatus sortieren vor — und du siehst im Dashboard sofort, mit wem sich ein Termin lohnt.",
      },
    ],
    industries: [
      {
        title: "Wohnimmobilien-Makler",
        text: "Der Klassiker: Haus oder Wohnung, Wohnfläche, Baujahr, Zustand, Postleitzahl — dann die Einschätzung und der Vorschlag für den Vor-Ort-Termin zur genauen Bewertung.",
      },
      {
        title: "Käufer- & Suchauftrags-Funnel",
        text: "Für Interessenten ein eigener Weg: Budget, Zimmerzahl, Region, Finanzierung geklärt ja/nein. So baust du einen Verteiler auf, der bei der nächsten Objektaufnahme schon wartet.",
      },
      {
        title: "Hausverwaltung & Kapitalanlage",
        text: "Vermietete Objekte, Renditefragen, Portfolio-Anfragen: Ein separater Funnel je Anliegen unter derselben Domain — Pro bringt unbegrenzte Funnels und Team-Zugänge für mehrere Standorte mit.",
      },
    ],
    templateShowcase: ["immobilien-bewertung", "termin-buchen", "lead-magnet"],
    steps: [
      {
        title: "Bewertungs-Funnel aufsetzen",
        text: "Immobilien-Bewertungs-Vorlage übernehmen und die Objektfragen an dein Marktgebiet anpassen: Objektart, Fläche, Baujahr, Zustand, Grundstück, Lage — eine Frage pro Schritt.",
      },
      {
        title: "Wege trennen",
        text: "Mit Conditional Logic im ersten Schritt fragen: verkaufen, kaufen oder nur informieren? Jede Antwort bekommt ihre eigene Strecke und ihren eigenen Abschluss — Termin, Suchauftrag oder Newsletter.",
      },
      {
        title: "Vom Lead zum Maklervertrag",
        text: "Die Online-Einschätzung ist der Aufhänger für den Anruf: Die genaue Bewertung gibt es vor Ort. Leads landen per Webhook in deinem CRM oder als CSV-Export — inklusive aller Objektdaten für die Vorbereitung.",
      },
    ],
    faqs: [
      {
        q: "Warum funktioniert die kostenlose Wertermittlung so gut?",
        a: "Weil sie am tatsächlichen Interesse ansetzt: Eigentümer wollen eine Zahl, keinen Makler. Du lieferst zuerst einen Nutzen und bekommst dafür Objektdaten und Kontakt — eine der stärksten Lead-Mechaniken im Immobilienmarkt.",
      },
      {
        q: "Welche Objektdaten sollte ich abfragen?",
        a: "Objektart, Wohn- und Grundstücksfläche, Baujahr, Zustand, Zimmerzahl und Postleitzahl reichen für eine erste Einordnung. Dazu Eigentümerstatus und Verkaufszeitpunkt zur Qualifizierung — mehr Fragen kosten Abschlussquote.",
      },
      {
        q: "Darf ich eine Bewertung online ausgeben?",
        a: "Eine unverbindliche Spanne mit klar benannten Annahmen ist üblich, eine verbindliche Wertaussage ohne Besichtigung nicht. Formuliere die Online-Einschätzung als Orientierung und mach die genaue Bewertung zum Anlass für den Vor-Ort-Termin.",
      },
      {
        q: "Wie trenne ich Verkäufer- und Käufer-Leads?",
        a: "Über eine Auswahl im ersten Schritt und Conditional Logic dahinter: Verkäufer durchlaufen die Objektaufnahme, Suchende geben Budget und Kriterien an. Beide Gruppen kommen getrennt markiert ins Dashboard und ins CRM.",
      },
      {
        q: "Was kostet ein Immobilien-Funnel?",
        a: "Der Free-Plan ist dauerhaft kostenlos mit einem veröffentlichten Funnel und 100 sichtbaren Leads pro Monat. Pro kostet 49 € pro Monat inklusive MwSt. — unbegrenzte Funnels und Leads, eigene Domain mit SSL, A/B-Tests und Team-Zugänge. 14 Tage ohne Kreditkarte testbar.",
      },
    ],
  },

  "quiz-funnel": {
    slug: "quiz-funnel",
    badge: "Für Shops, Coaches & Berater",
    h1: "Quiz-Funnel: qualifizieren, unterhalten und Leads gewinnen",
    intro: [
      "Ein Formular fragt ab, ein Quiz macht neugierig. Genau darin liegt der Unterschied: Wer „Welcher Typ bist du?“ oder „Welches Produkt passt zu mir?“ startet, will das Ergebnis sehen — und beantwortet dafür bereitwillig Fragen, die er in einem Kontaktformular nie ausgefüllt hätte. Interaktive Formate erreichen deshalb in der Regel deutlich höhere Abschlussquoten als ein statisches Formular mit denselben Feldern.",
      "Der Kern ist das Ergebnis-Mapping: Antworten werden ausgewertet und führen zu einem von mehreren Ergebnistypen — mit passender Empfehlung, passendem Angebot und passendem nächsten Schritt. Mit Trichterwerk baust du das per Conditional Logic aus einer fertigen Quiz- oder Umfrage-Vorlage, ohne eine Zeile Code.",
    ],
    painPoints: [
      {
        title: "Formulare fühlen sich nach Arbeit an",
        text: "Zehn Felder auf einer Seite sind eine Bringschuld ohne Belohnung. Ein Quiz gibt bei jedem Schritt Feedback und stellt am Ende ein Ergebnis in Aussicht — die gleichen Daten, ein völlig anderes Gefühl.",
      },
      {
        title: "Besucher wissen nicht, was sie brauchen",
        text: "Bei erklärungsbedürftigen Produkten scheitert der Kauf oft an der Auswahl, nicht am Preis. Ein Produktfinder übernimmt die Beratung: drei bis fünf Fragen, dann eine begründete Empfehlung.",
      },
      {
        title: "Leads ohne Kontext",
        text: "Eine E-Mail-Adresse allein sagt nichts. Aus einem Quiz kommt sie mit allen Antworten und dem Ergebnistyp — die Grundlage für Segmentierung, passende Follow-ups und ein Erstgespräch, das nicht bei null anfängt.",
      },
    ],
    industries: [
      {
        title: "Produktfinder für Shops & Hersteller",
        text: "Matratze, Hautpflege, Software-Tarif, Heizsystem: Bedarf abfragen, Ergebnis mit Begründung ausspielen, Kontakt oder Kauf anschließen. Jede Antwort verrät dir zusätzlich etwas über deine Zielgruppe.",
      },
      {
        title: "Selbsttest für Coaches & Berater",
        text: "Standortbestimmung, Reifegrad-Check, Typtest: Der Ergebnistyp ist der perfekte Einstieg ins Strategiegespräch — und macht sofort sichtbar, wo du helfen kannst.",
      },
      {
        title: "Umfragen & Feedback",
        text: "Kundenzufriedenheit, Marktforschung, Bedarfsabfrage im Bestand: Die Umfrage-Vorlage sammelt strukturierte Antworten, die per CSV-Export oder Webhook direkt weiterverarbeitet werden.",
      },
    ],
    templateShowcase: ["quiz", "umfrage", "lead-magnet"],
    steps: [
      {
        title: "Ergebnistypen zuerst definieren",
        text: "Beginne am Ende: Welche drei bis fünf Ergebnisse soll es geben, und welches Angebot gehört zu jedem? Erst danach schreibst du die Fragen, die dorthin führen — andersherum wird das Mapping beliebig.",
      },
      {
        title: "Quiz bauen & Logik verdrahten",
        text: "Quiz- oder Umfrage-Vorlage übernehmen, Fragen anpassen und mit Conditional Logic die Wege zu den Ergebnisseiten legen. Der KI-Generator im Pro-Plan liefert dir dafür einen ersten Entwurf.",
      },
      {
        title: "Ergebnis liefern, dann fragen",
        text: "Zeig das Ergebnis als echten Gegenwert und platziere die Kontaktabfrage ehrlich davor oder danach — wer erst nach der E-Mail-Adresse ein Ergebnis verspricht und dann enttäuscht, verbrennt den Lead. Analytics und A/B-Tests zeigen dir, welche Variante besser läuft.",
      },
    ],
    faqs: [
      {
        q: "Was ist ein Quiz-Funnel?",
        a: "Ein interaktiver Funnel, der Besucher durch mehrere Fragen führt und die Antworten auf ein Ergebnis abbildet — Typ, Empfehlung oder Score. Das Ergebnis ist der Gegenwert für die Kontaktdaten und liefert dir gleichzeitig die Qualifizierung.",
      },
      {
        q: "Warum konvertiert ein Quiz besser als ein Formular?",
        a: "Weil Neugier zieht: Eine Frage pro Schritt, sichtbarer Fortschritt und ein Ergebnis in Aussicht senken die gefühlte Hürde. Interaktive Formate erreichen dadurch in der Praxis meist höhere Abschlussquoten als statische Formulare — belastbar wird es aber erst mit deinen eigenen Zahlen aus dem A/B-Test.",
      },
      {
        q: "Wie funktioniert das Ergebnis-Mapping?",
        a: "Über Conditional Logic: Antworten steuern, welche Ergebnisseite ausgespielt wird. Du legst die Ergebnistypen fest, ordnest ihnen Antwortkombinationen zu und hinterlegst je Typ Empfehlung, Text und Call-to-Action.",
      },
      {
        q: "Wie viele Fragen sollte ein Quiz haben?",
        a: "Fünf bis acht sind ein guter Rahmen: genug für ein glaubwürdiges Ergebnis, kurz genug fürs Handy. Jede Frage sollte entweder das Ergebnis beeinflussen oder dich qualifizieren — alles andere streichen.",
      },
      {
        q: "Was kostet ein Quiz-Funnel und kann ich ihn testen?",
        a: "Der Free-Plan ist dauerhaft kostenlos: ein veröffentlichter Funnel, 100 sichtbare Leads pro Monat, alle Editor-Features inklusive Logik — mit Trichterwerk-Badge. Pro kostet 49 € pro Monat inklusive MwSt. und bringt unbegrenzte Funnels, A/B-Tests, eigene Domain und KI-Generator; 14 Tage ohne Kreditkarte testbar.",
      },
    ],
  },
};

/** Registry-Lookup, gehärtet gegen Prototype-Keys. */
export function getAudiencePage(slug: string | undefined): AudiencePageContent | undefined {
  if (!slug || !Object.hasOwn(audiencePagesContent, slug)) return undefined;
  return audiencePagesContent[slug];
}



/** FAQPage + BreadcrumbList einer Vergleichsseite — genutzt von der
 *  Page-Komponente (client-gerendert) UND der SSR-Meta-Injektion. */
export function comparisonJsonLd(c: ComparisonPageContent): object {
  return {
    "@context": "https://schema.org",
    "@graph": [
      faqPageJsonLd(c.faqs),
      breadcrumbJsonLd([
        { name: "Start", path: "/" },
        { name: `${c.competitorName}-Alternative`, path: `/vergleich/${c.slug}` },
      ]),
    ],
  };
}

/** FAQPage + BreadcrumbList einer Zielgruppen-Seite (analog comparisonJsonLd). */
export function audienceJsonLd(c: AudiencePageContent, label: string): object {
  return {
    "@context": "https://schema.org",
    "@graph": [
      faqPageJsonLd(c.faqs),
      breadcrumbJsonLd([
        { name: "Start", path: "/" },
        { name: label, path: `/${c.slug}` },
      ]),
    ],
  };
}

/**
 * Alle statischen SEO-Seiten (für Sitemap + SSR-Meta-Injektion).
 * Vergleichsseiten werden aus comparisonPages abgeleitet, die Galerie-Seiten
 * aus shared/template-meta.ts, die Zielgruppen-Seiten aus seo-links, damit
 * Routen, Sitemap und Server-Meta nicht auseinanderlaufen.
 */
export const seoStaticPages: SeoStaticPage[] = [
  {
    ...funnelBuilderPage,
    jsonLd: { "@context": "https://schema.org", ...faqPageJsonLd(funnelBuilderFaqs) },
    bodyHtml: renderSimplePageHtml(funnelBuilderPage.metaTitle, [], funnelBuilderFaqs),
  },
  vergleichIndexPage,
  {
    ...partnerPage,
    jsonLd: { "@context": "https://schema.org", ...faqPageJsonLd(partnerFaqs) },
    bodyHtml: renderSimplePageHtml(partnerPage.metaTitle, [], partnerFaqs),
  },
  ...Object.values(comparisonPages).map((c) => ({
    path: `/vergleich/${c.slug}`,
    metaTitle: c.metaTitle,
    metaDescription: c.metaDescription,
    jsonLd: comparisonJsonLd(c),
    bodyHtml: renderComparisonHtml(c),
  })),
  ...audiencePages.map((p) => {
    const content = audiencePagesContent[p.path.slice(1)];
    return content
      ? { ...p, jsonLd: audienceJsonLd(content, p.label), bodyHtml: renderAudienceHtml(content) }
      : { ...p };
  }),
  ...templateSeoPages,
];

/** Registry-Lookup, gehärtet gegen Prototype-Keys ("constructor", "__proto__", …). */
export function getComparisonPage(slug: string | undefined): ComparisonPageContent | undefined {
  if (!slug || !Object.hasOwn(comparisonPages, slug)) return undefined;
  return comparisonPages[slug];
}
