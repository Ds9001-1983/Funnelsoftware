import { privacyProductSummary, privacyComparisonSummary } from "./privacy-copy";
import { comparisonEvidence, comparisonPrices, type ComparisonEvidence } from "./comparison-evidence";
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
import { recruitingCapabilities, recruitingFaqs } from "./recruiting-content";
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
  evidence: ComparisonEvidence;
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

/** Common Trichterwerk scope keeps the paid plan explicit in every table. */
const proScope = "Trichterwerk Pro umfasst unbegrenzte Funnels und Leads, eigene Domains, Conditional Logic, A/B-Tests, Analytics und Webhooks. Pro kostet 49 € pro Monat inklusive Mehrwertsteuer und ist monatlich kündbar. Der Free-Plan bietet einen veröffentlichten Funnel und 100 sichtbare Leads pro Monat; neue Accounts starten mit 14 Tagen Pro-Testphase ohne Kreditkarte.";

interface ComparisonInput {
  slug: string;
  name: string;
  evidence: ComparisonEvidence;
  intro: string;
  consideration: string;
  rows: SeoComparisonRow[];
  pricing: string;
  fit: string;
  relatedSlugs: string[];
}

function comparisonPage(input: ComparisonInput): ComparisonPageContent {
  return {
    slug: input.slug,
    competitorName: input.name,
    evidence: input.evidence,
    metaTitle: `${input.name}-Alternative: Funktionen & Preise vergleichen`,
    metaDescription: `${input.name} und Trichterwerk vergleichen: ausgewählte Tarife, Funktionen und Grenzen mit Anbieterquellen. Trichterwerk Free oder Pro für 49 €/Monat.`,
    h1: `${input.name} und Trichterwerk: Funktionen und Preise im Vergleich`,
    intro: [input.intro, "Mit dem Funnel-Builder von Trichterwerk erstellst du mehrstufige Strecken für Anfragen, Quiz-Ergebnisse oder Bewerbungen. Du bearbeitest Inhalte und Fragen im selben Editor und verwaltest eingehende Leads im Dashboard."],
    verdict: "Trichterwerk kommt für dich infrage, wenn du Leads über eigene Funnels gewinnen und verwalten möchtest. Prüfe deinen konkreten Ablauf in der Testphase: Tarifumfang, Integrationen und Rollen müssen zu deinem Projekt passen.",
    painPoints: [
      { title: "Diese Unterschiede zählen für deine Auswahl", text: input.consideration },
      { title: "Datenverarbeitung und Integrationen prüfen", text: privacyComparisonSummary },
    ],
    comparisonRows: input.rows,
    featureSections: [
      { title: "Das bietet Trichterwerk Pro", text: proScope },
      { title: "Vom ersten Schritt bis zur Anfrage", text: "Kombiniere Informationen, Fragen und Kontaktfelder. Über Verzweigungen steuerst du den weiteren Weg; die Vorschau hilft dir, die Darstellung auf verschiedenen Geräten zu prüfen. Teste den gesamten Ablauf vor der Veröffentlichung mit eigenen Testdaten." },
      { title: "EU-Hosting und Datenschutzfunktionen", text: privacyProductSummary },
      ...(input.slug === "perspective-alternative" ? recruitingCapabilities.map(({ label, summary }) => ({ title: label, text: summary })) : []),
    ],
    pricingComparison: {
      title: `Tarife von ${input.name} und Trichterwerk`,
      text: [input.pricing, proScope, "Vergleiche denselben Abrechnungszeitraum und das benötigte Nutzungsvolumen. Ein Einstiegstarif ist kein funktionsgleiches Angebot; Kosten für zusätzliche Dienste und Werbung gehören in deine eigene Kalkulation."],
    },
    honestSection: { title: `Wann ${input.name} zu deinem Projekt passen kann`, text: input.fit },
    migrationSteps: [
      { title: "Ablauf und Daten prüfen", text: "Liste Seiten, Fragen, Verzweigungen und Integrationen auf. Sichere benötigte Bestandsdaten über die Exportmöglichkeiten deines bisherigen Anbieters. Prüfe vor einem Wechsel, welche Daten und Funktionen du tatsächlich übertragen kannst." },
      { title: "Funnel neu aufbauen und testen", text: "Ein automatischer Import fremder Funnels ist in Trichterwerk nicht enthalten. Übertrage Inhalte und Design manuell und prüfe mobile Darstellung, Formulare, Einwilligungen und Benachrichtigungen mit Testdaten. Der Aufwand hängt vom Umfang ab." },
      { title: "Veröffentlichung vorbereiten", text: "Verbinde bei Bedarf deine eigene Domain im Pro-Plan und aktualisiere Anzeigen und Links erst nach dem Funktionstest. Eine Weiterleitung alter URLs ist nur möglich, soweit du die Domain oder die entsprechenden Einstellungen kontrollierst." },
    ],
    faqs: [
      { q: `Wie vergleiche ich ${input.name} mit Trichterwerk?`, a: input.consideration },
      { q: "Gibt es einen kostenlosen Einstieg bei Trichterwerk?", a: "Ja. Free umfasst einen veröffentlichten Funnel und 100 sichtbare Leads pro Monat mit Trichterwerk-Badge. Pro kostet 49 € pro Monat inklusive Mehrwertsteuer. Die 14-tägige Pro-Testphase benötigt keine Kreditkarte." },
      { q: "Kann ich einen bestehenden Funnel automatisch importieren?", a: "Einen automatischen Import aus anderen Funnel-Systemen gibt es nicht. Inhalte, Gestaltung und Abläufe werden manuell neu aufgebaut. Prüfe Exporte, Integrationen und Weiterleitungen vor dem Wechsel; eine feste Umzugsdauer können wir nicht zusagen." },
      { q: "Worauf kommt es beim Datenschutzvergleich an?", a: privacyComparisonSummary },
    ],
    relatedSlugs: input.relatedSlugs,
  };
}

export const comparisonPages: Record<string, ComparisonPageContent> = {
  "typeform-alternative": comparisonPage({
    slug: "typeform-alternative", name: "Typeform", evidence: comparisonEvidence.typeform,
    intro: "Typeform bietet Formulare, Umfragen und Quiz-Funktionen. Die Auswahl hängt davon ab, welche Fragen, Verzweigungen und nachgelagerten Abläufe du benötigst.",
    consideration: "Plane dein monatliches Antwortvolumen und prüfe den passenden Tarif. Teste außerdem den Weg von der ersten Information bis zum Kontakt und die Übergabe an dein CRM.",
    rows: [
      { label: "Antwortbasierte Verzweigungen", trichterwerk: "In Pro enthalten", competitor: "Conditional Logic ab Basic" },
      { label: "Leads / Antworten", trichterwerk: "Pro: unbegrenzt", competitor: "Basic: 100 Antworten / Monat" },
      { label: "Webhooks", trichterwerk: "In Pro enthalten", competitor: "Ab Basic" },
      { label: "Tarifbeispiel", trichterwerk: comparisonPrices.trichterwerk, competitor: comparisonPrices.typeform },
    ],
    pricing: "Typeform nennt für Basic bei monatlicher Zahlung 39 USD pro Monat. Der Preis ist in US-Dollar angegeben; prüfe die Steuerberechnung im Checkout. Weitere Tarife und andere Abrechnungszeiträume stehen auf der verlinkten Preisseite.",
    fit: "Wenn Formulare und Umfragen den Schwerpunkt deines Prozesses bilden, prüfe Typeform mit einem eigenen Musterformular. Vergleiche Fragearten, Auswertung und benötigte Integrationen anhand dieses Beispiels.",
    relatedSlugs: ["perspective-alternative", "heyflow-alternative", "onepage-alternative"],
  }),
  "perspective-alternative": comparisonPage({
    slug: "perspective-alternative", name: "Perspective", evidence: comparisonEvidence.perspective,
    intro: "Perspective verbindet mobile Funnels mit Kontaktverwaltung, Auswertung und E-Mails. Für einen Vergleich sind die Anzahl aktiver Funnels und die Zusammenarbeit mit Kunden besonders relevant.",
    consideration: "Prüfe Funnel- und Lead-Kontingente sowie die Rechte deiner Kunden. Ein Workspace mit Zugriff auf den Editor erfüllt einen anderen Zweck als ein freigegebenes Bewerberboard.",
    rows: [
      { label: "Veröffentlichte Funnels", trichterwerk: "Pro: unbegrenzt", competitor: "Base: 2; Grow: 10" },
      { label: "Leads", trichterwerk: "Pro: unbegrenzt", competitor: "Base: 100 / Monat; Mehrverbrauch wird berechnet" },
      { label: "A/B-Tests", trichterwerk: "In Pro enthalten", competitor: "Erste Seite: ab Grow; Base mit Advanced-Metrics-Add-on" },
      ...recruitingCapabilities.map(({ label, comparison, id }) => ({
        label, trichterwerk: comparison,
        competitor: id === "domains" ? "Unbegrenzte Domains ab Base"
          : id === "kanban" ? "Ab Base, mit eigenen Statusstufen"
          : id === "customer-workspace" ? "Unbegrenzte Workspaces ab Base; Rollen prüfen"
          : "Ab Base enthalten",
      })),
      { label: "Tarifbeispiel", trichterwerk: comparisonPrices.trichterwerk, competitor: comparisonPrices.perspective },
    ],
    pricing: "Perspective Base kostet bei Monatszahlung 59 € pro Monat netto, bei jährlicher Abrechnung rechnerisch 47 € pro Monat netto. Die Mehrwertsteuer kommt hinzu. Höhere Kontingente, optionale Add-ons und Mehrverbrauch können den Gesamtpreis verändern.",
    fit: "Wenn deine Abläufe mehrere Teamrollen oder eine bestimmte Kombination aus Funnel-, Messaging- und Integrationsfunktionen benötigen, teste diese direkt bei Perspective. In Trichterwerk geben Kundenbereiche Zugriff auf zugeordnete Bewerberboards und Statusänderungen; Editor, Mailregeln und Abrechnung verwaltest du als Betreiber.",
    relatedSlugs: ["heyflow-alternative", "meetovo-alternative", "funnelcockpit-alternative"],
  }),
  "clickfunnels-alternative": comparisonPage({
    slug: "clickfunnels-alternative", name: "ClickFunnels", evidence: comparisonEvidence.clickfunnels,
    intro: "ClickFunnels bündelt Funnel-Erstellung mit weiteren Funktionen für den Online-Vertrieb, darunter Kurse und E-Mail-Marketing. Entscheidend ist, welche Teile dieses Pakets du für dein Geschäftsmodell brauchst.",
    consideration: "Trenne Lead-Gewinnung, Verkauf, Kursauslieferung und E-Mail-Kampagnen in deiner Anforderungsliste. Prüfe für jeden Schritt Funktionsumfang und Kontingente des gewählten Plans.",
    rows: [
      { label: "Schwerpunkt", trichterwerk: "Lead- und Bewerbungsfunnels", competitor: "Funnels, Online-Vertrieb und Kurse" },
      { label: "Eigene Domains", trichterwerk: "In Pro enthalten", competitor: "Launch: 5" },
      { label: "Kontaktumfang", trichterwerk: "Pro: unbegrenzte Leads", competitor: "Launch: 10.000 Kontakte" },
      { label: "Tarifbeispiel", trichterwerk: comparisonPrices.trichterwerk, competitor: "Launch: 97 USD / Monat bei Monatszahlung; Steuern im Checkout prüfen" },
    ],
    pricing: "ClickFunnels weist Launch mit 97 USD pro Monat bei monatlicher Zahlung aus. Jahreszahlung und weitere Pläne werden separat angeboten. Prüfe Steuern und die Bedingungen zeitlich begrenzter Aktionen beim Anbieter.",
    fit: "ClickFunnels kann passen, wenn du neben der Lead-Gewinnung auch Kurse oder weitere Verkaufsabläufe im selben System betreiben möchtest. Prüfe diese Funktionen im gewünschten Tarif, bevor du einen reinen Preisvergleich ziehst.",
    relatedSlugs: ["systeme-io-alternative", "funnelcockpit-alternative", "perspective-alternative"],
  }),
  "funnelcockpit-alternative": comparisonPage({
    slug: "funnelcockpit-alternative", name: "FunnelCockpit", evidence: comparisonEvidence.funnelcockpit,
    intro: "FunnelCockpit bietet Websites, Funnels und Mitgliederbereiche in einem Paket. Für deine Auswahl zählen die Anzahl der Projekte und die zusätzlichen Aufgaben, die du damit abdecken möchtest.",
    consideration: "Definiere, ob du Anfragen sammeln, Inhalte für Mitglieder bereitstellen oder mehrere Websites betreiben möchtest. Die Zahl der Projekte ist nicht automatisch mit der Zahl einzelner Funnel-Seiten gleichzusetzen.",
    rows: [
      { label: "Schwerpunkt", trichterwerk: "Lead- und Bewerbungsfunnels", competitor: "Websites, Funnels und Mitgliederbereiche" },
      { label: "Projektumfang", trichterwerk: "Pro: unbegrenzte Funnels", competitor: "Lite: 5 Projekte" },
      { label: "Seiten", trichterwerk: "Mehrstufige Funnels", competitor: "Unbegrenzt laut Tarifübersicht" },
      { label: "Tarifbeispiel", trichterwerk: comparisonPrices.trichterwerk, competitor: "Lite: 47 € / Monat bei Monatszahlung; Steuerstatus im Checkout prüfen" },
    ],
    pricing: "FunnelCockpit nennt für Lite 47 € pro Monat bei monatlicher Abrechnung nach dem Testzeitraum. Auf der ausgewerteten Preisseite ist die steuerliche Einordnung dieses Betrags nicht eindeutig; prüfe den Endpreis im Checkout. Eine Testaktion ist kein regulärer Monatspreis.",
    fit: "Wenn Mitgliederbereiche und Websites zu deinem Vorhaben gehören, beziehe diese Funktionen in den Test von FunnelCockpit ein. Für einen Vergleich mit Trichterwerk solltest du den benötigten Lead-Prozess getrennt bewerten.",
    relatedSlugs: ["clickfunnels-alternative", "systeme-io-alternative", "onepage-alternative"],
  }),
  "heyflow-alternative": comparisonPage({
    slug: "heyflow-alternative", name: "Heyflow", evidence: comparisonEvidence.heyflow,
    intro: "Heyflow bietet interaktive Funnels mit bedingter Logik und CRM-Anbindungen. Die Tarifauswahl unterscheidet unter anderem nach Antwortvolumen, Funnel-Anzahl und Funktionspaketen.",
    consideration: "Lege fest, wie viele Antworten du erwartest und welche Integrationen du benötigst. Prüfe anschließend, welches Paket deine Anforderungen einschließlich Gestaltung und Tests abdeckt.",
    rows: [
      { label: "Verzweigungen", trichterwerk: "In Pro enthalten", competitor: "Advanced Conditional Logic im Starter-Plan" },
      { label: "Antwortumfang", trichterwerk: "Pro: unbegrenzte Leads", competitor: "Starter: 50 Antworten / Monat" },
      { label: "Funnel-Anzahl", trichterwerk: "Pro: unbegrenzt", competitor: "Starter: 5 Funnels" },
      { label: "A/B-Tests", trichterwerk: "In Pro enthalten", competitor: "Im Scale-Plan aufgeführt" },
      { label: "Tarifauswahl", trichterwerk: comparisonPrices.trichterwerk, competitor: "Preis nach Tarif, Laufzeit und Kontingenten; zzgl. MwSt." },
    ],
    pricing: "Heyflow bietet unterschiedliche Tarife für Lead-Generierung und E-Commerce sowie monatliche und jährliche Abrechnung. Wähle auf der verlinkten Preisseite den passenden Bereich und Zeitraum; die dort genannten Preise verstehen sich ohne Mehrwertsteuer. Zusätzliche Kontingente können weitere Kosten auslösen.",
    fit: "Heyflow kann passen, wenn du bestimmte CRM-Verbindungen oder auf deinen Anwendungsfall zugeschnittene Funktionspakete benötigst. Teste deinen Datenfluss bis ins Zielsystem und prüfe die Freischaltung im ausgewählten Tarif.",
    relatedSlugs: ["perspective-alternative", "typeform-alternative", "meetovo-alternative"],
  }),
  "meetovo-alternative": comparisonPage({
    slug: "meetovo-alternative", name: "MEETOVO", evidence: comparisonEvidence.meetovo,
    intro: "MEETOVO richtet sein Angebot auf Recruiting-Kampagnen aus. Der Vergleich mit Trichterwerk sollte deshalb den gesamten Bewerbungsprozess und die Zahl gleichzeitig laufender Stellen berücksichtigen.",
    consideration: "Plane aktive Stellen, erwartete Aufrufe und die Bearbeitung eingehender Bewerbungen. Prüfe auch, ob du zusätzliche Leistungen wie SMS oder Karriere-Widgets brauchst.",
    rows: [
      { label: "Kampagnenumfang", trichterwerk: "Pro: unbegrenzte Funnels", competitor: "Starter: 1 Job-Kampagne" },
      { label: "Aufrufkontingent", trichterwerk: "Kein tarifliches Aufrufkontingent", competitor: "Starter: 1.000 Aufrufe / Monat" },
      { label: "Eigene Domains", trichterwerk: "In Pro enthalten", competitor: "Ab Expert" },
      { label: "Tarifbeispiel", trichterwerk: comparisonPrices.trichterwerk, competitor: "Starter: 79 € / Monat zzgl. 19 % MwSt. bei Monatszahlung" },
    ],
    pricing: "MEETOVO Starter kostet bei monatlicher Zahlung 79 € pro Monat ohne 19 % Mehrwertsteuer. Bei jährlicher Zahlung nennt der Anbieter rechnerisch 65 € pro Monat netto. Werbebudget und optionale Add-ons sind separat zu berücksichtigen.",
    fit: "Wenn Recruiting dein einziger Anwendungsfall ist, teste MEETOVO anhand einer konkreten Stellenkampagne. Vergleiche Bewerbungsverwaltung, benötigte Erweiterungen und Aufrufkontingente mit deinem Arbeitsablauf.",
    relatedSlugs: ["perspective-alternative", "heyflow-alternative", "typeform-alternative"],
  }),
  "systeme-io-alternative": comparisonPage({
    slug: "systeme-io-alternative", name: "systeme.io", evidence: comparisonEvidence.systeme,
    intro: "systeme.io verbindet Sales-Funnels mit E-Mail-Marketing, Automationen und weiteren Funktionen für ein Online-Geschäft. Für deine Entscheidung zählt, welche dieser Aufgaben du gemeinsam abbilden möchtest.",
    consideration: "Prüfe Kontaktlisten, Versand, Automationen und Funnel-Schritte als zusammenhängenden Ablauf. Berücksichtige bei einem Wechsel auch bestehende Inhalte und die Exportmöglichkeiten.",
    rows: [
      { label: "Schwerpunkt", trichterwerk: "Lead- und Bewerbungsfunnels", competitor: "Sales-Funnels, E-Mail-Marketing und Automationen" },
      { label: "Kontaktverwaltung", trichterwerk: "Lead-Liste und Bewerberboards", competitor: "Kontakte und CRM-Pipelines aufgeführt" },
      { label: "Verkaufsfunktionen", trichterwerk: "Fokus auf Anfragen und Qualifizierung", competitor: "Upsells und Order Bumps aufgeführt; Tarifumfang prüfen" },
      { label: "Tarifauswahl", trichterwerk: comparisonPrices.trichterwerk, competitor: "Free und kostenpflichtige Pläne; aktuelle Konditionen beim Anbieter" },
    ],
    pricing: "systeme.io bietet einen kostenlosen Einstieg und kostenpflichtige Tarife mit monatlicher oder jährlicher Abrechnung. Nutze die verlinkte Tarifauswahl für den aktuellen Betrag, die Währung, Steuern und enthaltenen Kontingente.",
    fit: "Wenn E-Mail-Kampagnen und Verkaufsautomationen zu deinem Kernprozess gehören, prüfe systeme.io mit einem vollständigen Beispielablauf. Bei Trichterwerk liegt der Schwerpunkt auf der Erstellung von Funnels und der Verwaltung eingehender Leads.",
    relatedSlugs: ["clickfunnels-alternative", "funnelcockpit-alternative", "onepage-alternative"],
  }),
  "onepage-alternative": comparisonPage({
    slug: "onepage-alternative", name: "Onepage", evidence: comparisonEvidence.onepage,
    intro: "Onepage bietet Website-Erstellung mit Formularen und integriertem CRM. Entscheidend ist, ob du einen allgemeinen Webauftritt, einzelne Kampagnenseiten oder einen mehrstufigen Qualifizierungsprozess aufbauen möchtest.",
    consideration: "Vergleiche die benötigte Zahl an Websites und Seiten, eigene Domains und die Zusammenarbeit im Team. Teste deinen Formularablauf im jeweiligen Editor.",
    rows: [
      { label: "Schwerpunkt", trichterwerk: "Lead- und Bewerbungsfunnels", competitor: "Websites mit Formularen und CRM" },
      { label: "Kostenloser Einstieg", trichterwerk: "Free: 1 veröffentlichter Funnel", competitor: "Free: 1 Website, 5 Seiten" },
      { label: "Eigene Domain", trichterwerk: "In Pro enthalten", competitor: "Ab Essential" },
      { label: "Tarifauswahl", trichterwerk: comparisonPrices.trichterwerk, competitor: "Monatlich, 12 oder 24 Monate; Nettopreise zzgl. MwSt." },
    ],
    pricing: "Onepage unterscheidet zwischen Free und kostenpflichtigen Plänen sowie mehreren Laufzeiten. Die Preise sind netto; Mehrwertsteuer kommt im Checkout hinzu. Eine gewählte Laufzeit wird im Voraus bezahlt. Prüfe deshalb den Gesamtbetrag und die Laufzeit auf der verlinkten Preisseite.",
    fit: "Onepage kann passen, wenn dein Webauftritt mit mehreren Inhaltsseiten im Vordergrund steht. Probiere Formular, CRM und benötigte Seitenstruktur aus und vergleiche den konkreten Ablauf mit einem Trichterwerk-Funnel.",
    relatedSlugs: ["typeform-alternative", "funnelcockpit-alternative", "perspective-alternative"],
  }),
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
      "Mit Trichterwerk baust du so einen Funnel aus einer fertigen Vorlage in unter einer Stunde — mobile-first, mit EU-Hosting, und mit Benachrichtigung in Echtzeit, sobald eine Bewerbung eingeht.",
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
        a: "Der Funnel kann Qualifikation, Verfügbarkeit und Kontakt für die Erstansprache erfassen; Unterlagen kannst du später gezielt anfordern. Lege passende Datenschutzhinweise, Rechtsgrundlagen und Aufbewahrungsfristen für dein Bewerbungsverfahren fest.",
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
      ...recruitingFaqs,
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
        text: "Landingpage-Baukasten plus Formular-Tool plus Analytics plus Kalender — vier Abos, vier Datenschutz-Prüfungen. Trichterwerk liefert den kompletten Funnel aus einem Guss, mit EU-Hosting.",
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
        q: "Welche Datenschutzfunktionen bietet Trichterwerk?",
        a: privacyProductSummary,
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
        text: "Meta- oder Google-Ads auf die Funnel-URL, dazu QR-Codes auf Referenz-Baustellen und im Ort. Die eigene Analytics zeigt dir pro Schritt, wo Interessenten aussteigen; per Webhook laufen die Leads in dein CRM.",
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
        q: "Welche Datenschutzfunktionen bietet Trichterwerk?",
        a: privacyProductSummary,
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
        a: privacyProductSummary,
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
