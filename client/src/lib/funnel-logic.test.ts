import { describe, it, expect } from "vitest";
import { getNextPageIndex } from "./funnel-logic";
import type { FunnelPage } from "@shared/schema";

/** Minimaler Seiten-Factory-Helper für Tests — alle erforderlichen Felder leer/Defaults. */
function page(overrides: Partial<FunnelPage> & { id: string }): FunnelPage {
  return {
    type: "welcome",
    title: "",
    subtitle: "",
    elements: [],
    buttonText: "Weiter",
    showPageInProgress: true,
    ...overrides,
  } as unknown as FunnelPage;
}

describe("getNextPageIndex — sequentielle Navigation", () => {
  it("springt zur nächsten Seite, wenn keine Regel matcht", () => {
    const pages = [page({ id: "p1" }), page({ id: "p2" }), page({ id: "p3" })];
    expect(getNextPageIndex(pages, 0, {})).toBe(1);
    expect(getNextPageIndex(pages, 1, {})).toBe(2);
  });

  it("liefert null am Ende des Funnels", () => {
    const pages = [page({ id: "p1" }), page({ id: "p2" })];
    expect(getNextPageIndex(pages, 1, {})).toBeNull();
  });

  it("liefert null bei ungültigem Page-Index", () => {
    const pages = [page({ id: "p1" })];
    expect(getNextPageIndex(pages, 5, {})).toBeNull();
  });
});

describe("getNextPageIndex — feste Routing-Regeln", () => {
  it("folgt nextPageId, wenn gesetzt", () => {
    const pages = [
      page({ id: "p1", nextPageId: "p3" }),
      page({ id: "p2" }),
      page({ id: "p3" }),
    ];
    expect(getNextPageIndex(pages, 0, {})).toBe(2);
  });

  it("fällt zurück auf sequentiell, wenn nextPageId-Ziel nicht existiert", () => {
    const pages = [page({ id: "p1", nextPageId: "ghost" }), page({ id: "p2" })];
    expect(getNextPageIndex(pages, 0, {})).toBe(1);
  });
});

describe("getNextPageIndex — Operator-Semantik (conditions)", () => {
  const target = page({ id: "target" });

  it("operator equals matcht bei exakter Übereinstimmung", () => {
    const p = page({
      id: "p1",
      conditions: [{ elementId: "e1", operator: "equals", value: "ja", targetPageId: "target" }],
    });
    const pages = [p, page({ id: "p2" }), target];
    expect(getNextPageIndex(pages, 0, { e1: "ja" })).toBe(2);
    expect(getNextPageIndex(pages, 0, { e1: "nein" })).toBe(1); // fällt zurück
  });

  it("operator notEquals matcht bei Abweichung", () => {
    const p = page({
      id: "p1",
      conditions: [{ elementId: "e1", operator: "notEquals", value: "ja", targetPageId: "target" }],
    });
    const pages = [p, page({ id: "p2" }), target];
    expect(getNextPageIndex(pages, 0, { e1: "nein" })).toBe(2);
    expect(getNextPageIndex(pages, 0, { e1: "ja" })).toBe(1);
  });

  it("operator contains matcht bei Teil-Übereinstimmung", () => {
    const p = page({
      id: "p1",
      conditions: [{ elementId: "e1", operator: "contains", value: "test", targetPageId: "target" }],
    });
    const pages = [p, page({ id: "p2" }), target];
    expect(getNextPageIndex(pages, 0, { e1: "testdaten" })).toBe(2);
    expect(getNextPageIndex(pages, 0, { e1: "anderes" })).toBe(1);
  });

  it("operator isEmpty matcht bei leerem/whitespace-only Wert", () => {
    const p = page({
      id: "p1",
      conditions: [{ elementId: "e1", operator: "isEmpty", targetPageId: "target" }],
    });
    const pages = [p, page({ id: "p2" }), target];
    expect(getNextPageIndex(pages, 0, {})).toBe(2);
    expect(getNextPageIndex(pages, 0, { e1: "" })).toBe(2);
    expect(getNextPageIndex(pages, 0, { e1: "   " })).toBe(2);
    expect(getNextPageIndex(pages, 0, { e1: "x" })).toBe(1);
  });
});

describe("getNextPageIndex — Routing-Priorität", () => {
  it("optionRouting schlägt conditionalRouting + conditions + nextPageId", () => {
    const pages = [
      page({
        id: "p1",
        elements: [
          {
            id: "select1",
            type: "select",
            optionRouting: { a: "byOption" },
          } as FunnelPage["elements"][number],
        ],
        conditionalRouting: { a: "byCond" },
        conditions: [
          { elementId: "select1", operator: "equals", value: "a", targetPageId: "byCondAdvanced" },
        ],
        nextPageId: "fixed",
      }),
      page({ id: "byOption" }),
      page({ id: "byCond" }),
      page({ id: "byCondAdvanced" }),
      page({ id: "fixed" }),
    ];
    expect(getNextPageIndex(pages, 0, { select1: "a" })).toBe(1); // byOption
  });

  it("conditionalRouting schlägt conditions + nextPageId", () => {
    const pages = [
      page({
        id: "p1",
        elements: [
          { id: "in1", type: "input" } as FunnelPage["elements"][number],
        ],
        conditionalRouting: { ja: "byCond" },
        conditions: [
          { elementId: "in1", operator: "equals", value: "ja", targetPageId: "byCondAdvanced" },
        ],
        nextPageId: "fixed",
      }),
      page({ id: "byCond" }),
      page({ id: "byCondAdvanced" }),
      page({ id: "fixed" }),
    ];
    expect(getNextPageIndex(pages, 0, { in1: "ja" })).toBe(1); // byCond
  });

  it("conditionalRouting ist deterministisch: erstes passendes Element in Reihenfolge gewinnt", () => {
    const pages = [
      page({
        id: "p1",
        elements: [
          { id: "first", type: "radio" } as FunnelPage["elements"][number],
          { id: "second", type: "radio" } as FunnelPage["elements"][number],
        ],
        // Beide Werte sind Keys in der Map → das erste Element (first) entscheidet.
        conditionalRouting: { a: "pA", b: "pB" },
      }),
      page({ id: "pA" }),
      page({ id: "pB" }),
    ];
    expect(getNextPageIndex(pages, 0, { first: "a", second: "b" })).toBe(1); // pA (first gewinnt)
    expect(getNextPageIndex(pages, 0, { first: "b", second: "a" })).toBe(2); // pB (first gewinnt)
  });
});
