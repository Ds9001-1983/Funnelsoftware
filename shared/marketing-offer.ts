import { FREE_MAX_PUBLISHED_FUNNELS, FREE_MONTHLY_LEAD_LIMIT } from "./schema";

/** The landing page and signup describe the same existing Free entitlement. */
export const freeOffer = {
  headline: `${FREE_MONTHLY_LEAD_LIMIT} Leads pro Monat kostenlos`,
  allowance: `${FREE_MAX_PUBLISHED_FUNNELS} veröffentlichter Funnel · ${FREE_MONTHLY_LEAD_LIMIT} Leads pro Monat`,
  reassurance: "Dauerhaft kostenlos · Keine Kreditkarte nötig",
};
