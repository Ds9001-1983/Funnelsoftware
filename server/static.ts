import express, { type Express, type Request, type Response } from "express";
import fs from "fs";
import path from "path";
import { storage } from "./storage";
import { escapeHtml } from "./email";
import type { Funnel } from "@shared/schema";
import { seoStaticPages, type SeoStaticPage } from "@shared/seo-content";

const SITE_ORIGIN = "https://trichterwerk.de";
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/images/og-image.png`;
// Wird im Prod-Build durch server-seitige Injektion für /f/:id ersetzt.
const META_MARKER = /<!--SSR-META-->[\s\S]*?<!--\/SSR-META-->/;

/** Baut den funnel-spezifischen Meta-Block (ersetzt den <!--SSR-META-->-Bereich). */
function buildFunnelMeta(funnel: Funnel): string {
  const desc = escapeHtml(
    (funnel.description?.trim() || `${funnel.name} — jetzt starten.`).slice(0, 200),
  );
  const name = escapeHtml(funnel.name);
  const canonical = `${SITE_ORIGIN}/f/${encodeURIComponent(funnel.slug || funnel.uuid)}`;
  const ogImage = escapeHtml(funnel.ogImageUrl || DEFAULT_OG_IMAGE);
  return [
    `<meta name="description" content="${desc}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${name}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:image" content="${ogImage}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${name}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
    `<meta name="twitter:image" content="${ogImage}" />`,
    `<title>${name} | Trichterwerk</title>`,
  ].join("\n    ");
}

/** Meta-Block für die statischen SEO-Marketing-Seiten (/funnel-builder, /vergleich/…). */
function buildMarketingMeta(page: SeoStaticPage): string {
  const title = escapeHtml(`${page.metaTitle} | Trichterwerk`);
  const desc = escapeHtml(page.metaDescription);
  const canonical = `${SITE_ORIGIN}${page.path}`;
  return [
    `<meta name="description" content="${desc}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:image" content="${DEFAULT_OG_IMAGE}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
    `<meta name="twitter:image" content="${DEFAULT_OG_IMAGE}" />`,
    `<title>${title}</title>`,
  ].join("\n    ");
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

  app.use(express.static(distPath));

  // Öffentliche Funnels: funnel-spezifische Meta-Tags server-seitig injizieren,
  // damit Share-Bots (LinkedIn/WhatsApp/Google) korrekte Vorschauen sehen. Die SPA
  // setzt Meta-Tags sonst erst nach JS-Ausführung, was Crawler nicht durchlaufen.
  app.get("/f/:identifier", async (req: Request, res: Response) => {
    try {
      const funnel = await storage.getFunnelBySlugOrUuid(String(req.params.identifier));
      if (funnel && funnel.status === "published" && META_MARKER.test(indexHtml)) {
        const html = indexHtml.replace(META_MARKER, buildFunnelMeta(funnel));
        return res.set("Content-Type", "text/html; charset=utf-8").send(html);
      }
    } catch (error) {
      console.error("SSR-Meta injection failed:", error);
    }
    // Fallback: unveränderte SPA (Client setzt Titel selbst).
    res.set("Content-Type", "text/html; charset=utf-8").send(indexHtml);
  });

  // SEO-Marketing-Seiten: Title/Description/OG server-seitig injizieren (Share-Bots,
  // Bing, schnellere Indexierung). Unbekannte Slugs fallen auf die plain SPA zurück
  // (der Client rendert dort seine öffentliche 404).
  const marketingMetaByPath = new Map(seoStaticPages.map((p) => [p.path, p]));
  app.get(["/funnel-builder", "/vergleich/:slug"], (req: Request, res: Response) => {
    const page = marketingMetaByPath.get(req.path);
    if (page && META_MARKER.test(indexHtml)) {
      const html = indexHtml.replace(META_MARKER, buildMarketingMeta(page));
      return res.set("Content-Type", "text/html; charset=utf-8").send(html);
    }
    res.set("Content-Type", "text/html; charset=utf-8").send(indexHtml);
  });

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (_req, res) => {
    res.sendFile(indexPath);
  });
}
