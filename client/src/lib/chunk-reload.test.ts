import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isChunkLoadError } from "./chunk-reload";

// window.location.reload ist in jsdom nicht implementiert — stubben.
const reloadMock = vi.fn();

function stubLocation(): void {
  Object.defineProperty(window, "location", {
    value: { ...window.location, reload: reloadMock },
    writable: true,
    configurable: true,
  });
}

function setOnline(value: boolean): void {
  Object.defineProperty(window.navigator, "onLine", {
    value,
    configurable: true,
  });
}

/**
 * Guard-Tests brauchen ein frisches Modul, weil chunk-reload einen
 * In-Memory-Fallback (Modul-State) für den letzten Reload-Zeitpunkt hält.
 */
async function importFresh() {
  vi.resetModules();
  return await import("./chunk-reload");
}

describe("isChunkLoadError", () => {
  it.each([
    ["Chrome", "Failed to fetch dynamically imported module: https://trichterwerk.de/assets/new-funnel-BM-E79YB.js"],
    ["Firefox", "error loading dynamically imported module"],
    ["Safari", "Importing a module script failed."],
    ["Vite-CSS-Preload", "Unable to preload CSS for /assets/index-abc.css"],
    ["HTML-statt-JS-Fallback", "'text/html' is not a valid JavaScript MIME type."],
  ])("erkennt Chunk-Fehler (%s)", (_browser, message) => {
    expect(isChunkLoadError(new Error(message))).toBe(true);
  });

  it("erkennt Chunk-Fehler auch als String", () => {
    expect(isChunkLoadError("Failed to fetch dynamically imported module")).toBe(true);
  });

  it.each([
    ["normaler Laufzeitfehler", new Error("Cannot read properties of undefined")],
    ["fremder String", "Irgendein anderer Fehler"],
    ["null", null],
    ["undefined", undefined],
    ["Objekt ohne message", { code: 42 }],
  ])("liefert false für %s", (_label, value) => {
    expect(isChunkLoadError(value)).toBe(false);
  });
});

describe("tryRecoverFromChunkError", () => {
  beforeEach(() => {
    sessionStorage.clear();
    reloadMock.mockClear();
    stubLocation();
    setOnline(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("löst beim ersten Aufruf einen Reload aus und merkt sich den Zeitpunkt", async () => {
    const { tryRecoverFromChunkError, isAutoReloadPending } = await importFresh();

    expect(isAutoReloadPending()).toBe(false);
    expect(tryRecoverFromChunkError()).toBe(true);
    expect(reloadMock).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem("tw-chunk-reload-at")).not.toBeNull();
    expect(isAutoReloadPending()).toBe(true);
  });

  it("blockt einen zweiten Reload innerhalb des Guard-Fensters", async () => {
    const { tryRecoverFromChunkError } = await importFresh();

    expect(tryRecoverFromChunkError()).toBe(true);
    expect(tryRecoverFromChunkError()).toBe(false);
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("erlaubt einen weiteren Reload nach Ablauf des Guard-Fensters", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-02T12:00:00Z"));
    const { tryRecoverFromChunkError } = await importFresh();

    expect(tryRecoverFromChunkError()).toBe(true);
    vi.setSystemTime(new Date("2026-07-02T12:01:01Z"));
    expect(tryRecoverFromChunkError()).toBe(true);
    expect(reloadMock).toHaveBeenCalledTimes(2);
  });

  it("greift über den Reload hinweg (Guard liegt im sessionStorage)", async () => {
    const first = await importFresh();
    expect(first.tryRecoverFromChunkError()).toBe(true);

    // Neues Modul = neue Seite nach dem Reload; sessionStorage überlebt.
    const second = await importFresh();
    expect(second.isAutoReloadPending()).toBe(true);
    expect(second.tryRecoverFromChunkError()).toBe(false);
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("lädt offline nicht neu (würde auf der Browser-Fehlerseite stranden)", async () => {
    setOnline(false);
    const { tryRecoverFromChunkError } = await importFresh();

    expect(tryRecoverFromChunkError()).toBe(false);
    expect(reloadMock).not.toHaveBeenCalled();
  });

  it("lädt ohne funktionierenden sessionStorage nicht neu (Reload-Loop-Gefahr)", async () => {
    const { tryRecoverFromChunkError } = await importFresh();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    expect(tryRecoverFromChunkError()).toBe(false);
    expect(reloadMock).not.toHaveBeenCalled();
  });
});
