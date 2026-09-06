import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { comparisonPages, seoStaticPages } from "./seo-content";
import { marketingRoutePatterns, sitemapStaticPaths } from "./seo-links";

/**
 * Regressionstest gegen Router↔Registry-Drift: /vergleich existierte als Route,
 * fehlte aber in Sitemap UND SSR-Meta — genau diese Lücke fängt dieser Test
 * dauerhaft ab. Er parst die path="..."-Literale aus App.tsx; falls Routen
 * künftig dynamisch definiert werden, muss die Extraktion mitziehen.
 */

const appTsxPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../client/src/App.tsx",
);

/** Alle statischen Router-Pfade aus App.tsx (Param-Routen mit ":" werden übersprungen). */
function staticRouterPaths(): string[] {
  const source = readFileSync(appTsxPath, "utf-8");
  return [...source.matchAll(/path="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((p) => !p.includes(":"));
}

/**
 * Bewusst nicht in Sitemap/SSR-Meta:
 * - Auth-Seiten: noindex (server/static.ts), Thin Content
 * - /nutzungsbedingungen: 301 → /agb (server/static.ts)
 * - App-Seiten: hinter Login, robots.txt Disallow
 */
const ALLOWLIST = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/nutzungsbedingungen",
  "/admin",
  "/dashboard",
  "/funnels",
  "/funnels/new",
  "/leads",
  "/analytics",
  "/settings",
]);

/** Einfaches Express-Pattern-Matching (":param" → ein Pfadsegment). */
function matchesPattern(p: string, pattern: string): boolean {
  const regex = new RegExp(`^${pattern.replace(/:[^/]+/g, "[^/]+")}$`);
  return regex.test(p);
}

describe("Router ↔ SEO-Registry", () => {
  it("jede öffentliche statische Route steht in seoStaticPages oder sitemapStaticPaths", () => {
    const covered = new Set<string>([
      ...sitemapStaticPaths,
      ...seoStaticPages.map((p) => p.path),
    ]);
    const paths = staticRouterPaths();
    // Plausibilitätscheck der Extraktion — App.tsx hat deutlich mehr als 5 Routen.
    expect(paths.length).toBeGreaterThan(5);
    for (const p of paths) {
      if (ALLOWLIST.has(p)) continue;
      expect(
        covered.has(p),
        `Route ${p} fehlt in Sitemap/SSR-Meta — in seoStaticPages bzw. sitemapStaticPaths aufnehmen (oder bewusst in die Test-Allowlist)`,
      ).toBe(true);
    }
  });

  it("jede seoStaticPages-Seite wird von einem SSR-Meta-Routen-Pattern bedient", () => {
    for (const page of seoStaticPages) {
      const served = marketingRoutePatterns.some((pattern) =>
        matchesPattern(page.path, pattern),
      );
      expect(
        served,
        `${page.path} hat keine Server-Route in marketingRoutePatterns (shared/seo-links.ts)`,
      ).toBe(true);
    }
  });

  it("nginx proxied jede seoStaticPages-Seite an Node (SSR-Meta erreicht Produktion)", () => {
    // Genau diese Lücke gab es: /partner und die Branchen-Seiten standen in der
    // Registry, aber nginx servierte sie statisch aus dist/ — Crawler sahen die
    // unersetzten SSR-Marker. Der Test parst die Marketing-Location der
    // Produktions-Config und prüft sie gegen die Registry.
    const conf = readFileSync(
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../deploy/nginx-trichterwerk.conf"),
      "utf-8",
    );
    const locationRegexes = [...conf.matchAll(/location ~ (\^\/[^\s{]+)/g)].map(
      (m) => new RegExp(m[1]),
    );
    expect(locationRegexes.length).toBeGreaterThan(0);
    for (const page of seoStaticPages) {
      const proxied = locationRegexes.some((re) => re.test(page.path));
      expect(
        proxied,
        `${page.path} wird von nginx nicht an Node proxied — Präfix in deploy/nginx-trichterwerk.conf (Marketing-Location) ergänzen`,
      ).toBe(true);
    }
  });

  it("Auth-Seiten stehen nicht in der Sitemap", () => {
    const paths: readonly string[] = sitemapStaticPaths;
    expect(paths).not.toContain("/login");
    expect(paths).not.toContain("/register");
  });

  it("noscript-Prerender (bodyHtml) enthält die Registry-Texte (kein Cloaking-Drift)", () => {
    // Stichprobe: Vergleichs- und Zielgruppen-Seiten müssen h1 + alle
    // FAQ-Fragen im bodyHtml tragen — dieselben Texte rendert auch React.
    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    for (const page of seoStaticPages) {
      if (!page.path.startsWith("/vergleich/") && !page.path.startsWith("/vorlagen/")) continue;
      expect(page.bodyHtml, `bodyHtml fehlt für ${page.path}`).toBeTruthy();
    }
    for (const c of Object.values(comparisonPages)) {
      const page = seoStaticPages.find((p) => p.path === `/vergleich/${c.slug}`);
      expect(page?.bodyHtml).toContain(esc(c.h1));
      for (const faq of c.faqs) {
        expect(page?.bodyHtml, `FAQ fehlt im bodyHtml von ${c.slug}`).toContain(esc(faq.q));
      }
    }
  });
});
