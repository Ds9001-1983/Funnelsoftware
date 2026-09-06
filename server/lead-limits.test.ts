import { describe, it, expect } from "vitest";
import { computeLockedLeadIds, maskLockedLeads, monthKeyUtc } from "./lead-limits";

/** Testhelfer: n Leads im gegebenen Monat, id + Minutenabstand aufsteigend. */
function leadsInMonth(year: number, month: number, count: number, startId = 1) {
  return Array.from({ length: count }, (_, i) => ({
    id: startId + i,
    createdAt: new Date(Date.UTC(year, month - 1, 1, 0, i)),
  }));
}

describe("monthKeyUtc", () => {
  it("bildet den Kalendermonat in UTC", () => {
    expect(monthKeyUtc(new Date(Date.UTC(2026, 8, 15)))).toBe("2026-09");
    // 31.08. 23:30 UTC bleibt August — unabhängig von der Server-Zeitzone.
    expect(monthKeyUtc(new Date(Date.UTC(2026, 7, 31, 23, 30)))).toBe("2026-08");
  });
});

describe("computeLockedLeadIds", () => {
  it("unter dem Limit ist nichts gesperrt", () => {
    expect(computeLockedLeadIds(leadsInMonth(2026, 9, 99), 100).size).toBe(0);
  });

  it("exakt am Limit ist nichts gesperrt", () => {
    expect(computeLockedLeadIds(leadsInMonth(2026, 9, 100), 100).size).toBe(0);
  });

  it("Lead 101 ist gesperrt — und zwar der NEUESTE, nicht der älteste", () => {
    const leads = leadsInMonth(2026, 9, 101);
    const locked = computeLockedLeadIds(leads, 100);
    expect(locked.size).toBe(1);
    expect(locked.has(101)).toBe(true);
    expect(locked.has(1)).toBe(false);
  });

  it("Monatswechsel setzt den Zähler zurück", () => {
    const leads = [
      ...leadsInMonth(2026, 8, 150), // August: 50 gesperrt
      ...leadsInMonth(2026, 9, 100, 1000), // September: alle sichtbar
    ];
    const locked = computeLockedLeadIds(leads, 100);
    expect(locked.size).toBe(50);
    for (let id = 1000; id < 1100; id++) {
      expect(locked.has(id)).toBe(false);
    }
  });

  it("Eingabe-Reihenfolge ist egal (sortiert intern)", () => {
    const leads = leadsInMonth(2026, 9, 101).reverse();
    const locked = computeLockedLeadIds(leads, 100);
    expect(locked.has(101)).toBe(true);
  });

  it("bei identischem createdAt entscheidet die id (stabil)", () => {
    const ts = new Date(Date.UTC(2026, 8, 1));
    const leads = [
      { id: 2, createdAt: ts },
      { id: 1, createdAt: ts },
      { id: 3, createdAt: ts },
    ];
    const locked = computeLockedLeadIds(leads, 2);
    expect(locked.has(3)).toBe(true);
    expect(locked.size).toBe(1);
  });

  it("leere Liste → leeres Set", () => {
    expect(computeLockedLeadIds([], 100).size).toBe(0);
  });
});

describe("maskLockedLeads", () => {
  it("maskiert nur gesperrte Leads und markiert sie mit locked", () => {
    const leads = [
      { id: 1, createdAt: new Date(), name: "Anna", email: "a@example.com", phone: "1", company: "X", message: "Hi", answers: { q: "a" } },
      { id: 2, createdAt: new Date(), name: "Ben", email: "b@example.com", phone: "2", company: "Y", message: "Yo", answers: { q: "b" } },
    ];
    const masked = maskLockedLeads(leads, new Set([2]));
    expect(masked[0].name).toBe("Anna");
    expect(masked[0].locked).toBeUndefined();
    expect(masked[1].name).toBeNull();
    expect(masked[1].email).toBeNull();
    expect(masked[1].answers).toEqual({});
    expect(masked[1].locked).toBe(true);
    // id/createdAt/status bleiben — der Owner sieht, DASS ein Lead ankam.
    expect(masked[1].id).toBe(2);
  });

  it("ohne gesperrte IDs wird die Original-Referenz zurückgegeben", () => {
    const leads = [{ id: 1, createdAt: new Date(), name: "Anna" }];
    expect(maskLockedLeads(leads, new Set())).toBe(leads);
  });
});
