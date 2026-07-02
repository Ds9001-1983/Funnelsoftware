import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@/test/test-utils";
import { ErrorBoundary } from "./ErrorBoundary";
import {
  isAutoReloadPending,
  isChunkLoadError,
  tryRecoverFromChunkError,
} from "@/lib/chunk-reload";

vi.mock("@/lib/chunk-reload", () => ({
  isChunkLoadError: vi.fn(),
  isAutoReloadPending: vi.fn(),
  tryRecoverFromChunkError: vi.fn(),
}));

const isChunkLoadErrorMock = vi.mocked(isChunkLoadError);
const isAutoReloadPendingMock = vi.mocked(isAutoReloadPending);
const tryRecoverMock = vi.mocked(tryRecoverFromChunkError);

// window.location.reload ist in jsdom nicht implementiert — stubben.
const reloadMock = vi.fn();

let shouldThrow = true;
function Bomb({ error }: { error: Error }) {
  if (shouldThrow) {
    throw error;
  }
  return <div>Alles ok</div>;
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    // restoreAllMocks räumt nur vi.spyOn auf — die vi.fn()-Modulmocks
    // behalten sonst ihre Aufruf-Historie über Tests hinweg.
    vi.clearAllMocks();
    shouldThrow = true;
    isChunkLoadErrorMock.mockReturnValue(false);
    isAutoReloadPendingMock.mockReturnValue(false);
    tryRecoverMock.mockReturnValue(false);
    Object.defineProperty(window, "location", {
      value: { ...window.location, reload: reloadMock },
      writable: true,
      configurable: true,
    });
    // React loggt gefangene Render-Fehler laut — im Test stummschalten.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("zeigt bei normalen Fehlern die generische Meldung und resettet per Button", () => {
    render(
      <ErrorBoundary fallbackTitle="Ein unerwarteter Fehler ist aufgetreten">
        <Bomb error={new Error("Kaputt")} />
      </ErrorBoundary>,
    );

    expect(
      screen.getByText("Ein unerwarteter Fehler ist aufgetreten"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Erneut versuchen/ })).toBeInTheDocument();
    expect(tryRecoverMock).not.toHaveBeenCalled();

    // Nach behobenem Fehler stellt der Retry-Button die Children wieder her.
    shouldThrow = false;
    fireEvent.click(screen.getByRole("button", { name: /Erneut versuchen/ }));
    expect(screen.getByText("Alles ok")).toBeInTheDocument();
    expect(reloadMock).not.toHaveBeenCalled();
  });

  it("zeigt bei Chunk-Fehlern die Update-Meldung und versucht den Auto-Reload", () => {
    isChunkLoadErrorMock.mockReturnValue(true);

    render(
      <ErrorBoundary>
        <Bomb error={new Error("Failed to fetch dynamically imported module")} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Neue Version verfügbar")).toBeInTheDocument();
    expect(
      screen.getByText(/Trichterwerk wurde gerade aktualisiert/),
    ).toBeInTheDocument();
    expect(tryRecoverMock).toHaveBeenCalledTimes(1);
  });

  it("macht bei Chunk-Fehlern einen echten Reload statt State-Reset", () => {
    isChunkLoadErrorMock.mockReturnValue(true);

    render(
      <ErrorBoundary>
        <Bomb error={new Error("Importing a module script failed.")} />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Seite neu laden/ }));
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("behandelt Folgefehler während eines laufenden Auto-Reloads als Chunk-Fall", () => {
    // Nach preventDefault() im vite:preloadError-Handler resolvet der Import
    // mit undefined — der resultierende TypeError matcht die Patterns nicht.
    isChunkLoadErrorMock.mockReturnValue(false);
    isAutoReloadPendingMock.mockReturnValue(true);

    render(
      <ErrorBoundary>
        <Bomb error={new TypeError("Cannot read properties of undefined")} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Neue Version verfügbar")).toBeInTheDocument();
    // Kein Auto-Reload-Versuch: der Fehler selbst ist kein Chunk-Fehler.
    expect(tryRecoverMock).not.toHaveBeenCalled();
  });
});
