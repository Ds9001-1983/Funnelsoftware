import { comparisonLinks, funnelBuilderPage, TEMPLATE_GALLERY_PATH } from "./seo-links";

// Stable public demo routes; consistency with the template registry is tested.
export const publicDemoSlugs = [
  "termin-buchen", "vsl", "recruiting", "express-bewerbung", "pflege-recruiting",
  "handwerk-recruiting", "lead-magnet", "masterclass", "immobilien-bewertung",
  "agentur-onboarding", "quiz", "coaching-angebot", "umfrage",
] as const;

const paths = new Set([
  "/", "/impressum", "/datenschutz", "/agb", "/avv", "/nutzungsbedingungen",
  "/login", "/register", funnelBuilderPage.path, "/vergleich",
  ...comparisonLinks.map(link => link.path), TEMPLATE_GALLERY_PATH,
  ...publicDemoSlugs.map(slug => `${TEMPLATE_GALLERY_PATH}/${slug}`),
]);

export function cleanMarketingPath(path: string) {
  return (path.split(/[?#]/)[0] || "/").replace(/\/+$/, "") || "/";
}

export function isMarketingPath(path: string) {
  return paths.has(cleanMarketingPath(path));
}

export function demoSlugForPath(path: string): string | undefined {
  const clean = cleanMarketingPath(path);
  const slug = clean.slice(TEMPLATE_GALLERY_PATH.length + 1);
  return clean.startsWith(`${TEMPLATE_GALLERY_PATH}/`) && (publicDemoSlugs as readonly string[]).includes(slug) ? slug : undefined;
}
