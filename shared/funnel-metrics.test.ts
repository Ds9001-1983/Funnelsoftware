import { describe, expect, it } from "vitest";
import { aggregateFunnelMetrics } from "./funnel-metrics";
import { funnelSchema, type AnalyticsEvent, type Lead } from "./schema";
const now = new Date("2026-10-02T12:00:00Z");
const funnel = funnelSchema.parse({ id: 1, uuid: "f", userId: 1, name: "Test", description: null, status: "published", pages: [
  { id: "start", title: "Start", type: "welcome", elements: [] }, { id: "a", title: "A", type: "question", elements: [] },
  { id: "b", title: "B", type: "question", elements: [] }, { id: "end", title: "Danke", type: "thankyou", elements: [] },
], theme: { primaryColor: "#000000", backgroundColor: "#ffffff", textColor: "#000000", fontFamily: "Inter", borderRadius: "8px" }, views: 0, leads: 0, createdAt: now, updatedAt: now });
function event(id: number, pageId: string, previousPageId: string | null, visitId = "one", eventType: AnalyticsEvent["eventType"] = "pageView"): AnalyticsEvent {
  return { id, funnelId: 1, pageId, eventType, metadata: { visitId, sequence: id, previousPageId }, timestamp: "2026-10-02T10:00:00Z" };
}
describe("period and observed visitor paths", () => {
  it("uses a common rolling period for views and leads, including the boundary", () => {
    const events = [event(1, "start", null, "one", "view"), { ...event(2, "start", null, "two", "view"), timestamp: "2026-09-25T11:59:59Z" }];
    const leads = [{ createdAt: "2026-09-25T12:00:00Z" }, { createdAt: "2026-09-25T11:59:59Z" }] as Lead[];
    expect(aggregateFunnelMetrics(funnel, events, leads, "7d", now)).toMatchObject({ totalViews: 1, totalLeads: 1, conversionRate: 100 });
    expect(aggregateFunnelMetrics(funnel, events, leads, "all", now)).toMatchObject({ totalViews: 2, totalLeads: 2 });
  });
  it("counts actual branches and back navigation once per edge and visit", () => {
    const result = aggregateFunnelMetrics(funnel, [event(1, "start", null), event(2, "b", "start"), event(3, "start", "b"), event(4, "b", "start")], [], "7d", now);
    expect(result.paths.transitions).toEqual([{ from: "start", to: "b", visits: 1, fromTitle: "Start", toTitle: "B" }, { from: "b", to: "start", visits: 1, fromTitle: "B", toTitle: "Start" }]);
    expect(result.paths.exits).toEqual([{ pageId: "b", title: "B", visits: 1 }]);
  });
  it("does not infer paths for historical events", () => {
    const result = aggregateFunnelMetrics(funnel, [{ ...event(1, "a", null), metadata: {} }], [], "all", now);
    expect(result.paths).toEqual({ trackedVisits: 0, legacyPageViews: 1, transitions: [], exits: [] });
    expect(result.stepConversion.find(page => page.pageId === "start")?.visitors).toBe(0);
  });
  it("ignores completed and active visits when showing possible exits", () => {
    const events = [event(1, "a", null), event(2, "a", null, "one", "submit"), { ...event(3, "b", null, "two"), timestamp: now }, event(4, "end", null, "three")];
    expect(aggregateFunnelMetrics(funnel, events, [], "30d", now).paths.exits).toEqual([]);
  });
  it("uses client sequence when network delivery reordered page events", () => {
    const events = [{ ...event(3, "start", null), metadata: { visitId: "one", sequence: 1 } }, { ...event(2, "b", "start"), metadata: { visitId: "one", sequence: 2, previousPageId: "start" } }];
    expect(aggregateFunnelMetrics(funnel, events, [], "30d", now).paths.exits[0]?.pageId).toBe("b");
  });
  it("retains removed-page events without displaying draft titles", () => {
    const result = aggregateFunnelMetrics(funnel, [event(1, "removed", null)], [], "all", now);
    expect(result.stepConversion.at(-1)).toMatchObject({ title: "Frühere Seite", visitors: 1 });
  });
});
