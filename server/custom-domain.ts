/**
 * Auflösung Custom-Domain → veröffentlichter Funnel. Gemeinsame Logik für
 * die host-aware HTML-/robots-/sitemap-Auslieferung (server/static.ts,
 * server/routes.ts) — Spiegel der Prüfungen aus /api/public/funnel-by-host.
 */

import { storage } from "./storage";
import type { Domain, Funnel } from "@shared/schema";

export interface ResolvedCustomDomain {
  host: string;
  domain: Domain;
  funnel: Funnel;
}

/** Liefert Domain+Funnel, wenn der Host eine verifizierte Custom-Domain mit
 *  veröffentlichtem Funnel eines existierenden Owners ist — sonst null. */
export async function resolveCustomDomainFunnel(
  hostname: string | undefined,
): Promise<ResolvedCustomDomain | null> {
  const host = (hostname ?? "").toLowerCase().split(":")[0].trim();
  if (!host) return null;

  const domain = await storage.getDomainByHostname(host);
  if (!domain?.verified) return null;

  const funnel = await storage.getFunnel(domain.funnelId, domain.userId);
  if (!funnel || funnel.status !== "published") return null;

  const owner = await storage.getUser(domain.userId);
  if (!owner || owner.deletedAt) return null;

  return { host, domain, funnel };
}
