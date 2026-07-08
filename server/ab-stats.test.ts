import { describe, it, expect } from "vitest";
import { aggregateAbTestStats } from "./ab-stats";
import type { AnalyticsEvent } from "@shared/schema";

let idCounter = 0;

function event(
  eventType: AnalyticsEvent["eventType"],
  metadata: AnalyticsEvent["metadata"] = null,
): AnalyticsEvent {
  return {
    id: ++idCounter,
    funnelId: 1,
    eventType,
    pageId: null,
    metadata,
    timestamp: "2026-07-08T12:00:00.000Z",
  };
}

describe("aggregateAbTestStats", () => {
  it("zählt Views und Conversions pro Test und Variante", () => {
    const events = [
      event("view", { abVariants: { "test-1": "variant-a" } }),
      event("view", { abVariants: { "test-1": "variant-a" } }),
      event("view", { abVariants: { "test-1": "variant-b" } }),
      event("submit", { abVariants: { "test-1": "variant-b" } }),
    ];

    expect(aggregateAbTestStats(events)).toEqual({
      "test-1": {
        "variant-a": { views: 2, conversions: 0 },
        "variant-b": { views: 1, conversions: 1 },
      },
    });
  });

  it("verarbeitet mehrere parallele Tests in einem Event", () => {
    const events = [
      event("view", { abVariants: { "test-1": "a", "test-2": "x" } }),
      event("submit", { abVariants: { "test-1": "a", "test-2": "x" } }),
    ];

    const stats = aggregateAbTestStats(events);
    expect(stats["test-1"].a).toEqual({ views: 1, conversions: 1 });
    expect(stats["test-2"].x).toEqual({ views: 1, conversions: 1 });
  });

  it("ignoriert Events ohne abVariants und irrelevante Event-Typen", () => {
    const events = [
      event("view"),
      event("view", {}),
      event("view", { abVariants: null }),
      event("pageView", { abVariants: { "test-1": "a" } }),
      event("complete", { abVariants: { "test-1": "a" } }),
      event("click", { abVariants: { "test-1": "a" } }),
    ];

    expect(aggregateAbTestStats(events)).toEqual({});
  });

  it("ist robust gegen fehlgeformte metadata (jsonb kann alles enthalten)", () => {
    const events = [
      event("view", { abVariants: "kaputt" }),
      event("view", { abVariants: ["array"] }),
      event("view", { abVariants: { "test-1": 42 } }),
      event("view", { abVariants: { "test-1": "" } }),
      event("submit", { abVariants: { "test-1": "a" } }),
    ];

    expect(aggregateAbTestStats(events)).toEqual({
      "test-1": { a: { views: 0, conversions: 1 } },
    });
  });

  it("liefert ein leeres Objekt für leere Eingaben", () => {
    expect(aggregateAbTestStats([])).toEqual({});
  });
});
