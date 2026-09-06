/**
 * Auflösung Custom-Domain → veröffentlichter Funnel. Gemeinsame Logik für
 * die host-aware HTML-/robots-/sitemap-Auslieferung (server/static.ts,
 * server/routes.ts) UND /api/public/funnel-by-host.
 *
 * Custom Domains sind ein Pro-Feature: Nach einem Downgrade auf Free wird die
 * Kundendomain nicht mehr bedient (der Funnel selbst bleibt unter /f/<slug>
 * erreichbar) — genau das kündigen Preisseite und Downgrade-Mail an.
 *
 * Ein kleiner In-Memory-TTL-Cache (positiv UND negativ) verhindert, dass
 * jeder Request — auch Scanner mit beliebigen Host-Headern — drei DB-Queries
 * auslöst; Änderungen (Verify, Downgrade, Unpublish) greifen binnen 60 s.
 */

import { storage } from "./storage";
import { hasProFeatures } from "./auth";
import type { Domain, Funnel } from "@shared/schema";

export interface ResolvedCustomDomain {
  host: string;
  domain: Domain;
  funnel: Funnel;
}

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map<string, { value: ResolvedCustomDomain | null; expiresAt: number }>();

/** Nur für Tests: Cache leeren. */
export function clearCustomDomainCache(): void {
  cache.clear();
}

/** Liefert Domain+Funnel, wenn der Host eine verifizierte Custom-Domain mit
 *  veröffentlichtem Funnel eines existierenden PRO-Owners ist — sonst null. */
export async function resolveCustomDomainFunnel(
  hostname: string | undefined,
): Promise<ResolvedCustomDomain | null> {
  const host = (hostname ?? "").toLowerCase().split(":")[0].trim();
  if (!host) return null;

  const cached = cache.get(host);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const value = await resolveUncached(host);

  // Cache begrenzen (Scanner können beliebig viele Hosts probieren).
  if (cache.size > 1000) cache.clear();
  cache.set(host, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

async function resolveUncached(host: string): Promise<ResolvedCustomDomain | null> {
  const domain = await storage.getDomainByHostname(host);
  if (!domain?.verified) return null;

  const funnel = await storage.getFunnel(domain.funnelId, domain.userId);
  if (!funnel || funnel.status !== "published") return null;

  const owner = await storage.getUser(domain.userId);
  if (!owner || owner.deletedAt) return null;
  // Pro-Gate: Free-Accounts behalten den Funnel (unter /f/), aber nicht die Domain.
  if (!hasProFeatures(owner)) return null;

  return { host, domain, funnel };
}
