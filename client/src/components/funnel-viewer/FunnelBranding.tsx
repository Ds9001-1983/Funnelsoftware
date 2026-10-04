import { SITE_ORIGIN } from "@shared/seo-links";

/** Shared by published funnels and the public Free-plan preview. */
export function FunnelBranding() {
  return <a
    href={`${SITE_ORIGIN}/?utm_source=funnel&utm_medium=badge&utm_campaign=powered-by`}
    target="_blank"
    rel="noopener"
    className="hover:underline underline-offset-2"
  >Erstellt mit Trichterwerk</a>;
}
