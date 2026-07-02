import express, { type Express, type Request, type Response } from "express";
import fs from "fs";
import path from "path";
import { storage } from "./storage";
import { escapeHtml } from "./email";
import type { Funnel } from "@shared/schema";
import { seoStaticPages } from "@shared/seo-content";
import { SITE_ORIGIN } from "@shared/seo-links";

const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/images/og-image.png`;
// Wird im Prod-Build durch server-seitige Injektion für /f/:id ersetzt.
const META_MARKER = /<!--SSR-META-->[\s\S]*?<!--\/SSR-META-->/;

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

/** Baut den funnel-spezifischen Meta-Block (ersetzt den <!--SSR-META-->-Bereich). */
function buildFunnelMeta(funnel: Funnel): string {
  return buildMetaBlock({
    title: `${funnel.name} | Trichterwerk`,
    description: (funnel.description?.trim() || `${funnel.name} — jetzt starten.`).slice(0, 200),
    canonical: `${SITE_ORIGIN}/f/${encodeURIComponent(funnel.slug || funnel.uuid)}`,
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
      setHeaders: (res, filePath) => {
        // Direkter Treffer auf /index.html (z. B. lokaler Prod-Test ohne nginx).
        if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    }),
  );

  // Öffentliche Funnels: funnel-spezifische Meta-Tags server-seitig injizieren,
  // damit Share-Bots (LinkedIn/WhatsApp/Google) korrekte Vorschauen sehen. Die SPA
  // setzt Meta-Tags sonst erst nach JS-Ausführung, was Crawler nicht durchlaufen.
  app.get("/f/:identifier", async (req: Request, res: Response) => {
    try {
      const funnel = await storage.getFunnelBySlugOrUuid(String(req.params.identifier));
      if (funnel && funnel.status === "published" && META_MARKER.test(indexHtml)) {
        const html = indexHtml.replace(META_MARKER, buildFunnelMeta(funnel));
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
    seoStaticPages.map((p) => [
      p.path,
      indexHtml.replace(
        META_MARKER,
        buildMetaBlock({
          title: `${p.metaTitle} | Trichterwerk`,
          description: p.metaDescription,
          canonical: `${SITE_ORIGIN}${p.path}`,
        }),
      ),
    ]),
  );
  // Unbekannte /vergleich/-Slugs: echter 404-Status + noindex, damit Crawler
  // keine Soft-404 mit Homepage-Canonical indexieren (Client rendert seine
  // öffentliche 404-Ansicht).
  const notFoundHtml = indexHtml.replace(
    META_MARKER,
    [
      `<meta name="robots" content="noindex" />`,
      `<title>Seite nicht gefunden | Trichterwerk</title>`,
    ].join("\n    "),
  );

  app.get(["/funnel-builder", "/vergleich/:slug"], (req: Request, res: Response) => {
    const html = marketingHtmlByPath.get(normalizeMarketingPath(req.path));
    if (html) {
      return sendHtml(res, html);
    }
    sendHtml(res, notFoundHtml, 404);
  });

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (_req, res) => {
    res.set("Cache-Control", "no-cache");
    res.sendFile(indexPath);
  });
}
