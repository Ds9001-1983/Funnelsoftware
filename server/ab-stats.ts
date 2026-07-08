import type { AnalyticsEvent } from "@shared/schema";

/**
 * Aggregation der A/B-Test-Statistiken aus analytics_events.
 *
 * Die Varianten-Zuweisung reist in metadata.abVariants ({testId: variantId})
 * der view-/submit-Events mit — bewusst NICHT als Inkrement im abTests-jsonb
 * des Funnels: Der Editor PATCHt das komplette abTests-Array, server-seitige
 * Zähler würden dabei per Lost-Update überschrieben. Hier bleibt die
 * Config Config und die Events sind die einzige Wahrheit.
 *
 * JS-Aggregation wie beim /metrics-Endpoint; bei großen Event-Mengen ist
 * eine SQL-Variante (jsonb_each_text) der dokumentierte Ausbaupfad.
 */

export interface AbVariantStats {
  views: number;
  conversions: number;
}

/** { testId: { variantId: { views, conversions } } } */
export type AbTestStats = Record<string, Record<string, AbVariantStats>>;

export function aggregateAbTestStats(events: AnalyticsEvent[]): AbTestStats {
  const stats: AbTestStats = {};

  for (const event of events) {
    if (event.eventType !== "view" && event.eventType !== "submit") continue;

    // metadata ist jsonb — defensiv lesen (kann {}, null oder Fremdformat sein).
    const metadata = event.metadata as { abVariants?: unknown } | null | undefined;
    const abVariants = metadata?.abVariants;
    if (!abVariants || typeof abVariants !== "object" || Array.isArray(abVariants)) continue;

    for (const [testId, variantId] of Object.entries(abVariants as Record<string, unknown>)) {
      if (typeof variantId !== "string" || !variantId) continue;
      const testStats = (stats[testId] ??= {});
      const variantStats = (testStats[variantId] ??= { views: 0, conversions: 0 });
      if (event.eventType === "view") {
        variantStats.views += 1;
      } else {
        variantStats.conversions += 1;
      }
    }
  }

  return stats;
}
