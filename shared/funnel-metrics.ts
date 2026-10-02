import { z } from "zod";
import type { AnalyticsEvent, Funnel, Lead } from "./schema";

export const metricRangeSchema = z.enum(["7d", "30d", "90d", "all"]);
export type MetricRange = z.infer<typeof metricRangeSchema>;
export function metricSince(range: MetricRange, now = new Date()): Date | undefined {
  return range === "all" ? undefined : new Date(now.getTime() - Number.parseInt(range) * 86400000);
}

/** Events have an ephemeral per-load visit ID, never a cookie or a person ID. */
export function aggregateFunnelMetrics(funnel: Funnel, events: AnalyticsEvent[], leads: Lead[], range: MetricRange, now = new Date()) {
  const since = metricSince(range, now)?.getTime() ?? -Infinity;
  const inside = (value: string | Date) => { const time = new Date(value).getTime(); return time >= since && time <= now.getTime(); };
  events = events.filter(event => inside(event.timestamp));
  leads = leads.filter(lead => inside(lead.createdAt));
  const title = (id: string) => funnel.pages.find(page => page.id === id)?.title ?? "Frühere Seite";
  const views = events.filter(event => event.eventType === "view");
  const totalViews = views.length;
  const pageViews = events.filter(event => event.eventType === "pageView" && event.pageId);
  const sessions = new Map<string, AnalyticsEvent[]>();
  for (const event of events) {
    if (typeof event.metadata?.visitId !== "string") continue;
    const key = event.metadata.visitId;
    sessions.set(key, [...(sessions.get(key) ?? []), event]);
  }
  const edges = new Map<string, { from: string; to: string; visits: number }>();
  const exits = new Map<string, number>();
  for (const session of Array.from(sessions.values())) {
    const pages = session.filter(event => event.eventType === "pageView" && event.pageId)
      .sort((a, b) => (Number(a.metadata?.sequence) - Number(b.metadata?.sequence)) || a.id - b.id);
    const seenEdges = new Set<string>();
    for (const page of pages) {
      const from = page.metadata?.previousPageId;
      if (typeof from !== "string" || !from || from === page.pageId) continue;
      const key = JSON.stringify([from, page.pageId]);
      if (seenEdges.has(key)) continue;
      seenEdges.add(key);
      const edge = edges.get(key) ?? { from, to: page.pageId!, visits: 0 };
      edge.visits++; edges.set(key, edge);
    }
    const last = pages.at(-1);
    const latestActivity = Math.max(...session.map(event => new Date(event.timestamp).getTime()));
    if (last && latestActivity <= now.getTime() - 30 * 60000
      && !session.some(event => event.eventType === "submit" || event.eventType === "complete")
      && funnel.pages.find(page => page.id === last.pageId)?.type !== "thankyou") {
      exits.set(last.pageId!, (exits.get(last.pageId!) ?? 0) + 1);
    }
  }
  const ids = Array.from(new Set([...funnel.pages.filter(page => !page.hidden).map(page => page.id), ...pageViews.map(event => event.pageId!)]));
  const stepConversion = ids.map((pageId, index) => ({ pageId, title: title(pageId), stepNumber: index + 1,
    visitors: pageViews.filter(event => event.pageId === pageId).length,
  }));
  const days = range === "all" ? 90 : Number.parseInt(range);
  const dayCounts = new Map<string, { date: string; views: number; leads: number }>();
  // UTC day buckets; range itself is a rolling interval with one shared instant.
  for (let i = days; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10);
    dayCounts.set(date, { date, views: 0, leads: 0 });
  }
  for (const view of views) { const day = dayCounts.get(new Date(view.timestamp).toISOString().slice(0, 10)); if (day) day.views++; }
  for (const lead of leads) { const day = dayCounts.get(new Date(lead.createdAt).toISOString().slice(0, 10)); if (day) day.leads++; }
  const answerDistribution = funnel.pages.flatMap(page => page.elements.filter(el => ["radio", "select", "checkbox"].includes(el.type)).flatMap(el => {
    const counts = new Map<string, number>(); let total = 0;
    for (const lead of leads) {
      const captured = lead.answerSnapshot?.fields.find(field => field.elementId === el.id && field.pageId === page.id);
      const answer = captured ? captured.optionText ?? captured.value : lead.answers?.[el.id];
      if (answer !== undefined && answer !== null && answer !== "") { const text = String(answer); counts.set(text, (counts.get(text) ?? 0) + 1); total++; }
    }
    return total ? [{ pageId: page.id, elementId: el.id, title: `${page.title} · ${el.label || el.placeholder || "Antworten"}`, totalResponses: total,
      answers: Array.from(counts).map(([text, count]) => ({ text, count, percentage: Math.round(count / total * 100) })).sort((a, b) => b.count - a.count),
    }] : [];
  }));
  return {
    totalViews, totalLeads: leads.length, conversionRate: totalViews ? Number((leads.length / totalViews * 100).toFixed(1)) : 0,
    stepConversion, answerDistribution, viewsOverTime: Array.from(dayCounts.values()), range,
    paths: {
      trackedVisits: sessions.size, legacyPageViews: pageViews.filter(event => !event.metadata?.visitId).length,
      transitions: Array.from(edges.values()).map(edge => ({ ...edge, fromTitle: title(edge.from), toTitle: title(edge.to) })).sort((a, b) => b.visits - a.visits),
      exits: Array.from(exits).map(([pageId, visits]) => ({ pageId, title: title(pageId), visits })).sort((a, b) => b.visits - a.visits),
    },
  };
}
export type FunnelMetrics = ReturnType<typeof aggregateFunnelMetrics>;
export interface AnalyticsOverview {
  totalViews: number; totalLeads: number; conversionRate: number;
  funnels: Array<{ id: number; name: string; status: string; views: number; leads: number; conversionRate: number }>;
  sources: Array<{ source: string; count: number }>;
  statuses: Record<string, number>;
}
