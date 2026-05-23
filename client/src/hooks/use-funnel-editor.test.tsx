import { describe, it, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFunnelEditor } from "./use-funnel-editor";
import type { Funnel, FunnelPage, Theme } from "@shared/schema";

const theme: Theme = {
  primaryColor: "#7C3AED",
  backgroundColor: "#FFFFFF",
  textColor: "#111827",
} as Theme;

function makePage(id: string, title = "Page"): FunnelPage {
  return {
    id,
    type: "welcome",
    title,
    subtitle: "",
    elements: [],
    buttonText: "Weiter",
    showPageInProgress: true,
  } as unknown as FunnelPage;
}

const sampleFunnel = {
  id: 1,
  uuid: "u1",
  userId: 1,
  name: "Demo-Funnel",
  description: null,
  status: "draft",
  slug: null,
  views: 0,
  leads: 0,
  pages: [makePage("p1", "Erste Seite"), makePage("p2", "Zweite Seite")],
  theme,
  abTests: [],
} as unknown as Funnel;

function createWrapper(seedFunnel: Funnel = sampleFunnel) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, queryFn: async () => seedFunnel },
      mutations: { retry: false },
    },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

describe("useFunnelEditor", () => {
  it("lädt den Funnel und initialisiert localFunnel + History", async () => {
    const { result } = renderHook(() => useFunnelEditor("1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.localFunnel).not.toBeNull());
    expect(result.current.localFunnel?.name).toBe("Demo-Funnel");
    expect(result.current.localFunnel?.pages).toHaveLength(2);
    expect(result.current.hasChanges).toBe(false);
    expect(result.current.saveStatus).toBe("saved");
  });

  it("updateLocalFunnel mergt Felder und setzt hasChanges", async () => {
    const { result } = renderHook(() => useFunnelEditor("1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.localFunnel).not.toBeNull());

    act(() => {
      result.current.updateLocalFunnel({ name: "Neuer Name" });
    });

    expect(result.current.localFunnel?.name).toBe("Neuer Name");
    // Andere Felder bleiben erhalten
    expect(result.current.localFunnel?.pages).toHaveLength(2);
    expect(result.current.hasChanges).toBe(true);
    expect(result.current.saveStatus).toBe("dirty");
  });

  it("updatePage modifiziert nur die Zielseite", async () => {
    const { result } = renderHook(() => useFunnelEditor("1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.localFunnel).not.toBeNull());

    act(() => {
      result.current.updatePage(1, { title: "Geänderte Seite" });
    });

    expect(result.current.localFunnel?.pages[0].title).toBe("Erste Seite");
    expect(result.current.localFunnel?.pages[1].title).toBe("Geänderte Seite");
    expect(result.current.hasChanges).toBe(true);
  });

  it("undo macht eine Änderung rückgängig", async () => {
    const { result } = renderHook(() => useFunnelEditor("1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.localFunnel).not.toBeNull());

    act(() => {
      result.current.updateLocalFunnel({ name: "Versuch 1" });
    });
    expect(result.current.localFunnel?.name).toBe("Versuch 1");
    expect(result.current.canUndo).toBe(true);

    act(() => {
      result.current.undo();
    });
    expect(result.current.localFunnel?.name).toBe("Demo-Funnel");
  });

  it("autoSaveEnabled ist initial true und schaltbar", async () => {
    const { result } = renderHook(() => useFunnelEditor("1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.localFunnel).not.toBeNull());

    expect(result.current.autoSaveEnabled).toBe(true);
    act(() => {
      result.current.setAutoSaveEnabled(false);
    });
    expect(result.current.autoSaveEnabled).toBe(false);
  });
});
