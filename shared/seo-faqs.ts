/**
 * Leichte FAQ-Registry für Marketing-Seiten, die NICHT die große Content-
 * Registry (shared/seo-content.ts) in ihren Lazy-Chunk ziehen sollen —
 * partner.tsx und funnel-builder.tsx importieren von HIER, die
 * seoStaticPages-Assembly (SSR-JSON-LD) ebenfalls.
 */

import type { SeoFaq } from "./seo-links";

/**
 * FAQ der Pillar-Seite /funnel-builder — hier statt in der Page-Komponente,
 * damit der Server das FAQPage-JSON-LD ohne JS-Rendering injizieren kann
 * (client/src/pages/funnel-builder.tsx importiert dieselbe Liste).
 */
export const funnelBuilderFaqs: SeoFaq[] = [
  {
    q: "Was ist ein Funnel-Builder?",
    a: "Ein Funnel-Builder ist eine Software, mit der du mehrstufige Marketing-Funnels ohne Programmierkenntnisse erstellst: Landingpage, Frage-Seiten, Kontaktformular und Danke-Seite — verbunden mit Logik, Tracking und Lead-Verwaltung in einem Tool.",
  },
  {
    q: "Was ist der Unterschied zwischen Funnel, Landingpage und Formular?",
    a: "Eine Landingpage ist eine einzelne Seite, ein Formular ein einzelner Baustein. Ein Funnel verbindet beides zu einer Strecke: Er führt Besucher Schritt für Schritt vom ersten Interesse bis zur Kontaktaufnahme — und qualifiziert sie unterwegs mit Fragen.",
  },
  {
    q: "Brauche ich Programmierkenntnisse für einen Funnel-Builder?",
    a: "Nein. Moderne Funnel-Builder wie Trichterwerk arbeiten mit Drag & Drop und fertigen Templates. Wenn du eine E-Mail schreiben kannst, kannst du einen Funnel bauen.",
  },
  {
    q: "Was kostet ein Funnel-Builder?",
    a: "Die Spanne reicht von ca. 25 $ (reine Formular-Tools wie Typeform) über 49 € (Trichterwerk, alles inklusive) bis 59–369 € pro Monat plus kostenpflichtiger Add-ons (Perspective) oder 97 $+ (ClickFunnels). Entscheidend ist, ob Leads, Funnels und Features unbegrenzt sind oder pro Plan limitiert.",
  },
  {
    q: "Gibt es einen DSGVO-konformen Funnel-Builder aus Deutschland?",
    a: "Ja — Trichterwerk wird in Deutschland entwickelt, hostet ausschließlich in der EU, misst cookielos und stellt eine AVV bereit. Damit ist die häufigste Compliance-Hürde von US-Tools gelöst.",
  },
  {
    q: "Wie schnell ist ein Funnel live?",
    a: "Mit Template und Drag & Drop-Editor typischerweise in unter einer Stunde: registrieren, Vorlage wählen, Texte und Farben anpassen, veröffentlichen — fertig.",
  },
];

/** FAQ der Partnerprogramm-Seite (/partner) — geteilt zwischen Page-Komponente
 *  und SSR-JSON-LD, analog funnelBuilderFaqs. */
export const partnerFaqs: SeoFaq[] = [
  {
    q: "Wie hoch ist die Provision im Trichterwerk-Partnerprogramm?",
    a: "25 % auf jede Pro-Zahlung deiner Geworbenen — wiederkehrend und dauerhaft (Lifetime). Bei 49 € pro Monat sind das 12,25 € pro Monat und Kunde, solange das Abo läuft.",
  },
  {
    q: "Wie funktioniert die Vermittlung?",
    a: "Du bekommst im Dashboard einen persönlichen Empfehlungslink (trichterwerk.de/register?ref=DEINCODE). Registriert sich jemand darüber, wird er dauerhaft dir zugeordnet — auch wenn er erst Wochen später auf Pro upgradet.",
  },
  {
    q: "Wann und wie wird ausgezahlt?",
    a: "Monatlich per Überweisung oder PayPal, sobald mindestens 25 € Provision aufgelaufen sind. Du bekommst eine Übersicht deiner Geworbenen und ihrer Abo-Status — volle Transparenz.",
  },
  {
    q: "Wer kann Partner werden?",
    a: "Jeder mit einem Trichterwerk-Account — auch im kostenlosen Free-Plan. Besonders geeignet für Agenturen, Coaches, Berater und Betreiber von Vergleichs- oder Tool-Seiten, deren Publikum Funnels braucht.",
  },
  {
    q: "Gibt es Werbematerial?",
    a: "Ja — auf Anfrage stellen wir Logos, Screenshots, Produktvideos und eine Feature-/Preistabelle bereit. Schreib uns nach der Registrierung einfach eine E-Mail.",
  },
];
