import express, { type Express, type Request, type Response } from "express";
import fs from "fs";
import path from "path";
import { storage } from "./storage";
import { escapeHtml } from "./email";
import type { Funnel } from "@shared/schema";
import { seoStaticPages } from "@shared/seo-content";
import { marketingRoutePatterns, SITE_ORIGIN } from "@shared/seo-links";
import { isPlatformHost } from "@shared/platform-host";
import { resolveCustomDomainFunnel } from "./custom-domain";

const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/images/og-image.png`;
// Wird im Prod-Build durch server-seitige Injektion für /f/:id ersetzt.
const META_MARKER = /<!--SSR-META-->[\s\S]*?<!--\/SSR-META-->/;
// Statischer Kerninhalt der Marketing-Seiten für Crawler ohne JS-Rendering
// (<noscript data-seo> in client/index.html).
const CONTENT_MARKER = /<!--SSR-CONTENT-->[\s\S]*?<!--\/SSR-CONTENT-->/;

interface MetaBlockInput {
  /** Kompletter Titel inkl. Suffix. */
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  /** Zusätzliche Tags (z. B. noindex für 404-Seiten). */
  extra?: string[];
}

/** Gemeinsamer Meta-Block für Funnel- und Marketing-Seiten (ersetzt <!--SSR-META-->). */
function buildMetaBlock({ title, description, canonical, ogImage = DEFAULT_OG_IMAGE, extra = [] }: MetaBlockInput): string {
  const t = escapeHtml(title);
  const desc = escapeHtml(description);
  const img = escapeHtml(ogImage);
  return [
    `<meta name="description" content="${desc}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:image" content="${img}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
    `<meta name="twitter:image" content="${img}" />`,
    ...extra,
    `<title>${t}</title>`,
  ].join("\n    ");
}

/**
 * Baut den funnel-spezifischen Meta-Block (ersetzt den <!--SSR-META-->-Bereich).
 * canonicalOverride: Hat der Funnel eine verifizierte Custom-Domain, ist DIE
 * die kanonische URL — trichterwerk.de/f/<slug> wird zur Nicht-kanonischen
 * Variante, damit Google die Signale auf der Kundendomain konsolidiert.
 */
function buildFunnelMeta(funnel: Funnel, canonicalOverride?: string): string {
  return buildMetaBlock({
    title: `${funnel.name} | Trichterwerk`,
    description: (funnel.description?.trim() || `${funnel.name} — jetzt starten.`).slice(0, 200),
    canonical: canonicalOverride ?? `${SITE_ORIGIN}/f/${encodeURIComponent(funnel.slug || funnel.uuid)}`,
    ogImage: funnel.ogImageUrl || DEFAULT_OG_IMAGE,
  });
}

/**
 * Request-Pfad für den Marketing-Meta-Lookup normalisieren: Express 5 matcht
 * Routen non-strict, req.path behält aber Trailing-Slash und Percent-Encoding —
 * ohne Normalisierung bekämen /vergleich/typeform-alternative/ oder
 * /vergleich/typeform%2Dalternative die generische Homepage-Meta.
 */
function normalizeMarketingPath(reqPath: string): string {
  let p = reqPath;
  try {
    p = decodeURIComponent(p);
  } catch {
    // ungültiges Encoding → unverändert weiter (führt zum 404-Fallback)
  }
  return p.replace(/\/+$/, "") || "/";
}

/**
 * HTML nie cachen lassen: Ohne Cache-Control cachen Browser heuristisch
 * (Last-Modified) — nach einem Deploy referenziert veraltetes HTML dann
 * gelöschte Hash-Chunks (Chunk-404 → Fehlerseite). no-cache erlaubt Caching,
 * erzwingt aber Revalidierung (ETag/304); die Hash-Assets bleiben unberührt
 * (immutable via nginx bzw. express.static).
 */
function sendHtml(res: Response, html: string, status = 200): void {
  res
    .status(status)
    .set("Content-Type", "text/html; charset=utf-8")
    .set("Cache-Control", "no-cache")
    .send(html);
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  const indexPath = path.resolve(distPath, "index.html");
  // index.html einmal lesen und cachen — der Prod-Build ändert sich zur Laufzeit nicht.
  const indexHtml = fs.readFileSync(indexPath, "utf-8");

  app.use(
    express.static(distPath, {
      // index.html NICHT automatisch für "/" ausliefern — sonst kommt der
      // Root-Request einer Custom-Domain nie beim host-aware Handler unten an
      // (Platform-"/" läuft über den Catch-all, wie jede andere SPA-Route).
      index: false,
      setHeaders: (res, filePath) => {
        // Direkter Treffer auf /index.html (z. B. lokaler Prod-Test ohne nginx).
        if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    }),
  );

  // Unbekannte Slugs/fremde Hosts: echter 404-Status + noindex, damit Crawler
  // keine Soft-404 mit Homepage-Canonical indexieren (Client rendert seine
  // öffentliche 404-Ansicht). Muss VOR den Handlern definiert sein, die es nutzen.
  const notFoundHtml = indexHtml.replace(
    META_MARKER,
    [
      `<meta name="robots" content="noindex" />`,
      `<title>Seite nicht gefunden | Trichterwerk</title>`,
    ].join("\n    "),
  );

  // Custom Domains (CNAME auf einen Kundenfunnel): Das Root-Dokument bekommt
  // funnel-spezifische Meta mit canonical auf DIE KUNDENDOMAIN — vorher lief
  // der Request in den Catch-all und lieferte das Trichterwerk-Canonical aus,
  // womit Google die Kundendomain weggededupliziert hätte. Alle anderen Pfade
  // eines fremden Hosts (Marketing-Seiten, Landing) werden nie unter fremdem
  // Host ausgeliefert (noindex + 404); /f/* und /preview/* laufen weiter in
  // ihre eigenen Handler. Assets bedient express.static bereits davor.
  app.use(async (req: Request, res: Response, next) => {
    if (req.method !== "GET" || isPlatformHost(req.hostname)) return next();
    const p = normalizeMarketingPath(req.path);
    if (p.startsWith("/f/") || p.startsWith("/preview/")) return next();
    try {
      const resolved = await resolveCustomDomainFunnel(req.hostname);
      if (resolved && p === "/") {
        const html = indexHtml.replace(
          META_MARKER,
          buildFunnelMeta(resolved.funnel, `https://${resolved.host}/`),
        );
        return sendHtml(res, html);
      }
    } catch (error) {
      // Transienter DB-Fehler darf eine echte Kundendomain nie als
      // 404+noindex ausliefern (Deindexierungs-Risiko) → normale SPA.
      console.error("Custom-Domain-Meta fehlgeschlagen:", error);
      return next();
    }
    sendHtml(res, notFoundHtml, 404);
  });

  // Öffentliche Funnels: funnel-spezifische Meta-Tags server-seitig injizieren,
  // damit Share-Bots (LinkedIn/WhatsApp/Google) korrekte Vorschauen sehen. Die SPA
  // setzt Meta-Tags sonst erst nach JS-Ausführung, was Crawler nicht durchlaufen.
  app.get("/f/:identifier", async (req: Request, res: Response) => {
    try {
      const funnel = await storage.getFunnelBySlugOrUuid(String(req.params.identifier));
      if (funnel && funnel.status === "published" && META_MARKER.test(indexHtml)) {
        // Verifizierte Custom-Domain → Canonical zeigt auf die Kundendomain.
        // Nur wenn die Domain auch bedient wird (Pro-Owner) — sonst zeigte
        // der Canonical auf eine 404-Seite (resolveCustomDomainFunnel prüft
        // verified + published + Pro und cached das Ergebnis).
        const domain = await storage.getVerifiedDomainByFunnelId(funnel.id);
        let canonicalOverride: string | undefined;
        if (domain) {
          const served = await resolveCustomDomainFunnel(domain.hostname);
          if (served?.funnel.id === funnel.id) {
            canonicalOverride = `https://${domain.hostname}/`;
          }
        }
        const html = indexHtml.replace(META_MARKER, buildFunnelMeta(funnel, canonicalOverride));
        return sendHtml(res, html);
      }
    } catch (error) {
      console.error("SSR-Meta injection failed:", error);
    }
    // Fallback: unveränderte SPA (Client setzt Titel selbst).
    sendHtml(res, indexHtml);
  });

  // SEO-Marketing-Seiten: Title/Description/OG server-seitig injizieren (Share-Bots,
  // Bing, schnellere Indexierung). Die HTML-Varianten sind statisch → einmal beim
  // Start vorberechnen statt pro Request Regex+Replace zu fahren.
  const marketingHtmlByPath = new Map(
    seoStaticPages.map((p) => {
      let html = indexHtml.replace(
        META_MARKER,
        buildMetaBlock({
          title: `${p.metaTitle} | Trichterwerk`,
          description: p.metaDescription,
          canonical: `${SITE_ORIGIN}${p.path}`,
          extra: p.jsonLd
            ? [
                // "<" escapen, damit ein "</script>" im Content den Block nie beendet.
                `<script type="application/ld+json">${JSON.stringify(p.jsonLd).replace(/</g, "\\u003c")}</script>`,
              ]
            : [],
        }),
      );
      // Kerninhalt in den <noscript data-seo>-Block — bereits escaped
      // (shared/seo-html.ts), fehlt der Marker, bleibt das HTML unverändert.
      if (p.bodyHtml) {
        html = html.replace(CONTENT_MARKER, p.bodyHtml);
      }
      return [p.path, html];
    }),
  );
  // Routen-Patterns kommen aus shared/seo-links.ts — dieselbe Quelle, aus der
  // auch seoStaticPages/Sitemap gespeist werden (shared/seo-routes.test.ts
  // erzwingt, dass keine Registry-Seite ohne Server-Route bleibt).
  app.get(marketingRoutePatterns, (req: Request, res: Response) => {
    const html = marketingHtmlByPath.get(normalizeMarketingPath(req.path));
    if (html) {
      return sendHtml(res, html);
    }
    sendHtml(res, notFoundHtml, 404);
  });

  // Auth-Seiten: Thin Content → noindex (stehen bewusst nicht in der Sitemap).
  const noindexHtml = indexHtml.replace(
    META_MARKER,
    [
      `<meta name="robots" content="noindex" />`,
      `<title>Trichterwerk – Funnel-Builder aus Deutschland</title>`,
    ].join("\n    "),
  );
  app.get(
    ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"],
    (_req: Request, res: Response) => {
      sendHtml(res, noindexHtml);
    },
  );

  // Alias-Konsolidierung: /nutzungsbedingungen rendert die AGB — ohne Redirect
  // wäre das Duplicate Content mit Homepage-Meta (Catch-all).
  app.get("/nutzungsbedingungen", (_req: Request, res: Response) => {
    res.redirect(301, "/agb");
  });

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (_req, res) => {
    res.set("Cache-Control", "no-cache");
    res.sendFile(indexPath);
  });
}
