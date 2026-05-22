import { describe, it, expect } from "vitest";
import { getContrastColor, getMutedContrastColor } from "./utils";

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
