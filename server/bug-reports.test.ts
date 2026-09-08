import { describe, it, expect } from "vitest";
import { insertBugReportSchema, updateBugReportSchema, BUG_REPORT_MAX_DESCRIPTION } from "@shared/schema";
import { escapeHtml } from "./email";

describe("insertBugReportSchema", () => {
  const valid = { description: "Der Editor speichert nicht", pageUrl: "/funnels/12" };

  it("nimmt eine gültige Meldung an", () => {
    const result = insertBugReportSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("lehnt eine zu kurze Beschreibung ab", () => {
    const result = insertBugReportSchema.safeParse({ ...valid, description: "hm" });
    expect(result.success).toBe(false);
  });

  it("lehnt eine Beschreibung über dem Limit ab", () => {
    const tooLong = "a".repeat(BUG_REPORT_MAX_DESCRIPTION + 1);
    const result = insertBugReportSchema.safeParse({ ...valid, description: tooLong });
    expect(result.success).toBe(false);
  });

  it("verlangt eine Seitenangabe", () => {
    const result = insertBugReportSchema.safeParse({ description: valid.description, pageUrl: "" });
    expect(result.success).toBe(false);
  });

  it("trimmt Leerraum und akzeptiert optionale Kontextfelder", () => {
    const result = insertBugReportSchema.safeParse({
      description: "  Button reagiert nicht  ",
      pageUrl: "/dashboard",
      userAgent: "Mozilla/5.0",
      viewport: "1440x900@2",
      clientErrors: "TypeError: x is not a function",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("Button reagiert nicht");
      expect(result.data.viewport).toBe("1440x900@2");
    }
  });

  it("ignoriert vom Client mitgeschickte Nutzerangaben", () => {
    // Nutzer-ID, Plan und Status setzt ausschließlich der Server.
    const result = insertBugReportSchema.safeParse({ ...valid, userId: 99, status: "done", plan: "pro" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("userId");
      expect(result.data).not.toHaveProperty("status");
      expect(result.data).not.toHaveProperty("plan");
    }
  });
});

describe("updateBugReportSchema", () => {
  it("erlaubt nur die definierten Zustände", () => {
    expect(updateBugReportSchema.safeParse({ status: "done" }).success).toBe(true);
    expect(updateBugReportSchema.safeParse({ status: "open" }).success).toBe(true);
    expect(updateBugReportSchema.safeParse({ status: "geloescht" }).success).toBe(false);
  });
});

describe("escapeHtml in der Meldungs-Mail", () => {
  it("entschärft HTML aus der Nutzerbeschreibung", () => {
    // Die Beschreibung landet ungefiltert im Mail-Template — ohne Escaping
    // könnte ein Nutzer Links oder Markup in das Betreiber-Postfach schreiben.
    const escaped = escapeHtml('<script>alert("x")</script>');
    expect(escaped).not.toContain("<script>");
    expect(escaped).toContain("&lt;script&gt;");
  });
});
