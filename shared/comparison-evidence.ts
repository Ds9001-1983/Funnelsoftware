/** Lightweight source metadata; safe to import from the landing page.
 * Update dates only after checking the linked sources, never from the clock.
 */
export interface ComparisonEvidence {
  reviewedOn: string;
  sources: { label: string; url: string }[];
}

export const comparisonScope = "Ausgewählte Funktionen und Tarife nach Anbieterangaben, kein vollständiger Produkttest. Währung, Steuern, Laufzeit und Nutzungslimits können abweichen. Maßgeblich ist das gewählte Angebot beim Anbieter.";

export const comparisonEvidence = {
  typeform: {
    reviewedOn: "2026-11-09",
    sources: [{ label: "Typeform: Preise und Funktionen", url: "https://www.typeform.com/pricing" }],
  },
  perspective: {
    reviewedOn: "2026-11-10",
    sources: [
      { label: "Perspective: Preise", url: "https://www.perspective.co/pricing" },
      { label: "Perspective: Funktionen je Tarif", url: "https://intercom.help/perspective-funnels/en/articles/15191355-which-features-are-included-in-the-plans" },
    ],
  },
  clickfunnels: {
    reviewedOn: "2026-11-09",
    sources: [{ label: "ClickFunnels: Preise und Funktionen", url: "https://www.clickfunnels.com/pricing" }],
  },
  funnelcockpit: {
    reviewedOn: "2026-11-09",
    sources: [{ label: "FunnelCockpit: Preise und Funktionen", url: "https://funnelcockpit.com/pricing/" }],
  },
  heyflow: {
    reviewedOn: "2026-11-09",
    sources: [{ label: "Heyflow: Preise und Funktionen", url: "https://heyflow.com/pricing/" }],
  },
  meetovo: {
    reviewedOn: "2026-11-09",
    sources: [{ label: "MEETOVO: Preise und Funktionen", url: "https://meetovo.de/preise/" }],
  },
  systeme: {
    reviewedOn: "2026-11-09",
    sources: [{ label: "systeme.io: Preise und Funktionen", url: "https://systeme.io/pricing" }],
  },
  onepage: {
    reviewedOn: "2026-11-09",
    sources: [{ label: "Onepage: Preise und Funktionen", url: "https://onepage.io/de/pricing" }],
  },
  webflow: {
    reviewedOn: "2026-11-09",
    sources: [{ label: "Webflow: Preise und Funktionen", url: "https://webflow.com/pricing" }],
  },
} satisfies Record<string, ComparisonEvidence>;

/** Reused verbatim by the overview and detailed comparisons. */
export const comparisonPrices = {
  trichterwerk: "Pro: 49 € / Monat inkl. MwSt., monatlich kündbar",
  typeform: "Basic: 39 USD / Monat bei Monatszahlung; Steuern im Checkout prüfen",
  perspective: "Base: 59 € / Monat zzgl. MwSt. bei Monatszahlung",
  webflow: "Basic: 15 USD / Monat je Website bei Jahreszahlung, zzgl. Steuern",
};

export function comparisonReviewDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}.${month}.${year}`;
}
