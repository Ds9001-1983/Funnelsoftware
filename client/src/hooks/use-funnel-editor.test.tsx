import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useFunnelEditor } from "./use-funnel-editor";
import type { Funnel, FunnelPage, Theme } from "@shared/schema";

vi.mock("@/lib/queryClient", () => ({ apiRequest: vi.fn() }));
beforeEach(() => { localStorage.clear(); vi.mocked(apiRequest).mockReset(); });

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
  editVersion: 0,
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

it("behält Änderungen während eines Saves als ungespeichert und sendet sie mit der nächsten Version", async () => {
  let respond!: (value: Response) => void;
  vi.mocked(apiRequest).mockImplementationOnce(() => new Promise(resolve => { respond = resolve; }));
  const { result } = renderHook(() => useFunnelEditor("1"), { wrapper: createWrapper() });
  await waitFor(() => expect(result.current.localFunnel).not.toBeNull());
  act(() => result.current.updateLocalFunnel({ name: "Erster Entwurf", metaCapiToken: "privates-geheimnis" }));
  let saving!: Promise<Funnel>;
  act(() => { saving = result.current.saveCurrent(); });
  await waitFor(() => expect(apiRequest).toHaveBeenCalledTimes(1));
  act(() => result.current.updateLocalFunnel({ name: "Zweiter Entwurf" }));
  await act(async () => {
    respond({ json: async () => ({ ...sampleFunnel, name: "Erster Entwurf", metaCapiToken: "privates-geheimnis", editVersion: 1 }) } as Response);
    await saving;
  });
  expect(result.current.localFunnel?.name).toBe("Zweiter Entwurf");
  expect(result.current.hasChanges).toBe(true);
  expect(JSON.stringify(localStorage)).not.toContain("privates-geheimnis");
  vi.mocked(apiRequest).mockResolvedValueOnce({ json: async () => ({ ...sampleFunnel, name: "Zweiter Entwurf", metaCapiToken: "privates-geheimnis", editVersion: 2 }) } as Response);
  await act(async () => { await result.current.saveCurrent(); });
  expect(apiRequest).toHaveBeenLastCalledWith("PATCH", "/api/funnels/1", expect.objectContaining({ name: "Zweiter Entwurf", expectedVersion: 1, documentVersion: 1, mutationId: expect.any(String) }));
  expect(result.current.hasChanges).toBe(false);
});

it("wartet beim Verlassen auch auf Änderungen, die während des ersten Saves entstehen", async () => {
  let respond!: (value: Response) => void;
  vi.mocked(apiRequest).mockImplementationOnce(() => new Promise(resolve => { respond = resolve; }));
  const { result } = renderHook(() => useFunnelEditor("1"), { wrapper: createWrapper() });
  await waitFor(() => expect(result.current.localFunnel).not.toBeNull());
  act(() => result.current.updateLocalFunnel({ name: "A" }));
  let leaving!: Promise<void>;
  act(() => { leaving = result.current.saveBeforeLeave(); });
  await waitFor(() => expect(apiRequest).toHaveBeenCalledTimes(1));
  act(() => result.current.updateLocalFunnel({ name: "B" }));
  vi.mocked(apiRequest).mockResolvedValueOnce({ json: async () => ({ ...sampleFunnel, name: "B", editVersion: 2 }) } as Response);
  await act(async () => {
    respond({ json: async () => ({ ...sampleFunnel, name: "A", editVersion: 1 }) } as Response);
    await leaving;
  });
  expect(apiRequest).toHaveBeenCalledTimes(2);
  expect(result.current.hasChanges).toBe(false);
  expect(result.current.localFunnel?.name).toBe("B");
});
