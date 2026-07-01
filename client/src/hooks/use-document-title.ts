import { useEffect } from "react";

const SUFFIX = "Trichterwerk";
const DEFAULT_TITLE = "Trichterwerk - Funnel Builder";
const SITE_ORIGIN = "https://trichterwerk.de";

/** Setzt nur den Dokumenttitel (Bestands-API, weiterhin von vielen Seiten genutzt). */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} | ${SUFFIX}` : DEFAULT_TITLE;
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}

interface PageMeta {
  /** Seitentitel (ohne " | Trichterwerk"-Suffix). */
  title: string;
  /** Meta-Description (auch für og:/twitter:description). */
  description?: string;
  /** Canonical: relativer Pfad ("/impressum") oder absolute URL. */
  canonical?: string;
}

function upsertMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  const created = !el;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  const prev = el.getAttribute("content");
  el.setAttribute("content", content);
  return () => {
    if (created) el!.remove();
    else if (prev !== null) el!.setAttribute("content", prev);
  };
}

/**
 * Setzt Titel, Meta-Description, og:/twitter:-Pendants und Canonical pro Seite —
 * und stellt beim Unmount die vorherigen Werte (aus index.html) wieder her.
 * Leichtgewichtig, ohne zusätzliche Dependency (kein react-helmet).
 */
export function usePageMeta({ title, description, canonical }: PageMeta) {
  useEffect(() => {
    const prevTitle = document.title;
    const fullTitle = title ? `${title} | ${SUFFIX}` : DEFAULT_TITLE;
    document.title = fullTitle;

    const restores: Array<() => void> = [];

    restores.push(upsertMeta('meta[property="og:title"]', "property", "og:title", fullTitle));
    restores.push(upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", fullTitle));

    if (description) {
      restores.push(upsertMeta('meta[name="description"]', "name", "description", description));
      restores.push(upsertMeta('meta[property="og:description"]', "property", "og:description", description));
      restores.push(upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", description));
    }

    if (canonical) {
      const href = canonical.startsWith("http")
        ? canonical
        : `${SITE_ORIGIN}${canonical.startsWith("/") ? "" : "/"}${canonical}`;
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      const created = !link;
      const prev = link?.getAttribute("href") ?? null;
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", href);
      restores.push(() => {
        if (created) link!.remove();
        else if (prev !== null) link!.setAttribute("href", prev);
      });
    }

    return () => {
      document.title = prevTitle;
      restores.forEach((r) => r());
    };
  }, [title, description, canonical]);
}
