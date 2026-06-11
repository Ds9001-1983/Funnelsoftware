import { describe, it, expect } from "vitest";
import { getContrastColor, getMutedContrastColor, sanitizeUrl, remapElementIds } from "./utils";

describe("getContrastColor", () => {
  it("liefert dunklen Text auf hellem Hintergrund", () => {
    expect(getContrastColor("#FFFFFF")).toBe("#111827");
    expect(getContrastColor("#f8f9fa")).toBe("#111827");
  });

  it("liefert weißen Text auf dunklem Hintergrund", () => {
    expect(getContrastColor("#7C3AED")).toBe("#FFFFFF");
    expect(getContrastColor("#000000")).toBe("#FFFFFF");
  });

  it("akzeptiert Kurz-Hex und fehlendes #", () => {
    expect(getContrastColor("000")).toBe("#FFFFFF");
    expect(getContrastColor("fff")).toBe("#111827");
  });

  it("fällt bei ungültigen Werten auf dunklen Text zurück", () => {
    expect(getContrastColor("")).toBe("#111827");
    expect(getContrastColor("not-a-color")).toBe("#111827");
    // @ts-expect-error absichtlich ungültiger Typ
    expect(getContrastColor(undefined)).toBe("#111827");
  });
});

describe("getMutedContrastColor", () => {
  it("liefert helles Grau auf dunklem Hintergrund", () => {
    expect(getMutedContrastColor("#7C3AED")).toBe("rgba(255, 255, 255, 0.7)");
    expect(getMutedContrastColor("#000000")).toBe("rgba(255, 255, 255, 0.7)");
  });

  it("liefert dunkles Grau auf hellem Hintergrund", () => {
    expect(getMutedContrastColor("#FFFFFF")).toBe("rgba(17, 24, 39, 0.55)");
  });
});

describe("sanitizeUrl", () => {
  it("erlaubt sichere absolute Protokolle", () => {
    expect(sanitizeUrl("https://example.com")).toBe("https://example.com");
    expect(sanitizeUrl("http://example.com/pfad?a=1")).toBe("http://example.com/pfad?a=1");
    expect(sanitizeUrl("mailto:info@example.com")).toBe("mailto:info@example.com");
    expect(sanitizeUrl("tel:+4912345")).toBe("tel:+4912345");
  });

  it("erlaubt relative URLs und Anker", () => {
    expect(sanitizeUrl("/danke")).toBe("/danke");
    expect(sanitizeUrl("#abschnitt")).toBe("#abschnitt");
    expect(sanitizeUrl("seite2")).toBe("seite2");
    expect(sanitizeUrl("./bild.png")).toBe("./bild.png");
  });

  it("blockt javascript:/data:/vbscript: (auch obfuskiert)", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe("");
    expect(sanitizeUrl("JaVaScRiPt:alert(1)")).toBe("");
    expect(sanitizeUrl("  javascript:alert(1)")).toBe("");
    expect(sanitizeUrl("java\tscript:alert(1)")).toBe("");
    expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBe("");
    expect(sanitizeUrl("vbscript:msgbox(1)")).toBe("");
  });

  it("liefert leeren String für leere Eingaben", () => {
    expect(sanitizeUrl("")).toBe("");
    expect(sanitizeUrl("   ")).toBe("");
    expect(sanitizeUrl(null)).toBe("");
    expect(sanitizeUrl(undefined)).toBe("");
  });
});

describe("remapElementIds", () => {
  const pages = [
    {
      id: "page-1",
      type: "question" as const,
      title: "Frage 1",
      elements: [{ id: "el-1", type: "radio" as const, options: ["A", "B"] }],
      conditions: [{ id: "c1", elementId: "el-1", operator: "equals" as const, value: "A", targetPageId: "page-2" }],
    },
    {
      id: "page-2",
      type: "contact" as const,
      title: "Kontakt",
      elements: [
        { id: "el-1", type: "input" as const, placeholder: "Name" },
        { id: "el-2", type: "input" as const, placeholder: "E-Mail" },
      ],
    },
  ];

  it("vergibt funnel-weit eindeutige Element-IDs", () => {
    const result = remapElementIds(pages);
    const ids = result.flatMap((p) => p.elements.map((e) => e.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain("el-1");
  });

  it("remappt conditions[].elementId auf die neue ID", () => {
    const result = remapElementIds(pages);
    expect(result[0].conditions?.[0].elementId).toBe(result[0].elements[0].id);
    // Seiten-Verweis bleibt unangetastet
    expect(result[0].conditions?.[0].targetPageId).toBe("page-2");
  });

  it("lässt Element-Inhalte und Seiten unverändert", () => {
    const result = remapElementIds(pages);
    expect(result[0].elements[0].options).toEqual(["A", "B"]);
    expect(result[1].elements.map((e) => e.placeholder)).toEqual(["Name", "E-Mail"]);
    expect(result.map((p) => p.id)).toEqual(["page-1", "page-2"]);
  });
});
