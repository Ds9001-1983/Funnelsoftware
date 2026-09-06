/**
 * Lead-Sichtbarkeits-Limit des Free-Plans (Soft-Store / Hard-View):
 * Leads werden IMMER gespeichert — Endkunden-Daten wegzuwerfen ist keine
 * Option. Oberhalb von FREE_MONTHLY_LEAD_LIMIT pro Kalendermonat (UTC)
 * werden die Kontaktfelder in den Lese-Endpunkten maskiert; ein Upgrade
 * schaltet rückwirkend frei, weil die Berechnung zur Lesezeit passiert.
 *
 * Pure Funktionen ohne DB-Zugriff — getestet in server/lead-limits.test.ts.
 */

import { FREE_MONTHLY_LEAD_LIMIT } from "@shared/schema";

interface LeadLike {
  id: number;
  createdAt: Date | string;
}

/** Kalendermonats-Schlüssel in UTC ("2026-09") — bewusst UTC, damit das Limit
 *  nicht von der Server-Zeitzone abhängt. */
export function monthKeyUtc(createdAt: Date | string): string {
  const d = new Date(createdAt);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Liefert die IDs der Leads, die für einen Free-Account maskiert werden:
 * pro Kalendermonat werden die Leads nach createdAt aufsteigend gezählt
 * (bei Gleichstand stabil nach id), alles über dem Limit ist gesperrt.
 * Die Eingabe-Reihenfolge ist egal — sortiert wird intern.
 */
export function computeLockedLeadIds(
  leads: LeadLike[],
  limit: number = FREE_MONTHLY_LEAD_LIMIT,
): Set<number> {
  const byMonth = new Map<string, LeadLike[]>();
  for (const lead of leads) {
    const key = monthKeyUtc(lead.createdAt);
    const bucket = byMonth.get(key);
    if (bucket) bucket.push(lead);
    else byMonth.set(key, [lead]);
  }

  const locked = new Set<number>();
  for (const bucket of Array.from(byMonth.values())) {
    if (bucket.length <= limit) continue;
    bucket.sort((a: LeadLike, b: LeadLike) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return diff !== 0 ? diff : a.id - b.id;
    });
    for (const lead of bucket.slice(limit)) {
      locked.add(lead.id);
    }
  }
  return locked;
}

/**
 * Maskiert die Kontaktfelder gesperrter Leads (Rest bleibt sichtbar, damit
 * der Owner sieht, DASS Leads ankommen — nur nicht WER). `locked: true`
 * markiert die Zeile fürs Client-Rendering.
 */
export function maskLockedLeads<T extends LeadLike & Record<string, unknown>>(
  leads: T[],
  lockedIds: Set<number>,
): (T & { locked?: boolean })[] {
  if (lockedIds.size === 0) return leads;
  return leads.map((lead) =>
    lockedIds.has(lead.id)
      ? {
          ...lead,
          name: null,
          email: null,
          phone: null,
          company: null,
          message: null,
          answers: {},
          locked: true,
        }
      : lead,
  );
}
