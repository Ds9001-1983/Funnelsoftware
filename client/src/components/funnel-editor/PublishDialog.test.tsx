import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Funnel } from "@shared/schema";
import { PublishDialog } from "./PublishDialog";
import { apiRequest } from "@/lib/queryClient";

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/lib/queryClient", () => ({ apiRequest: vi.fn() }));
const funnel = { id: 1, name: "Test", slug: "test-funnel", status: "draft", impressumUrl: "https://example.test/legal", datenschutzUrl: "https://example.test/privacy" } as Funnel;
const props = { open: true, onOpenChange: vi.fn(), onEditLegal: vi.fn(), onPublish: vi.fn().mockResolvedValue(undefined) };
afterEach(() => { cleanup(); vi.useRealTimers(); vi.clearAllMocks(); });

describe("publication review", () => {
  it("blocks missing legal links and lets the user review complete links before publishing", async () => {
    const view = render(<PublishDialog {...props} funnel={{ ...funnel, datenschutzUrl: null }} />);
    expect(screen.getByTestId("button-confirm-publish")).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Datenschutzerklärung-URL");
    fireEvent.click(screen.getByRole("button", { name: "Rechtliche Links bearbeiten" }));
    expect(props.onEditLegal).toHaveBeenCalledOnce();
    view.rerender(<PublishDialog {...props} funnel={funnel} />);
    expect(screen.getByRole("link", { name: "Impressum prüfen" })).toHaveAttribute("href", funnel.impressumUrl);
    expect(screen.getByTestId("button-confirm-publish")).toBeEnabled();
    await act(async () => { fireEvent.click(screen.getByTestId("button-confirm-publish")); });
    expect(props.onPublish).toHaveBeenCalledWith("test-funnel");
  });

  it("keeps the typed URL across autosave metadata changes and initializes the next opening", () => {
    vi.useFakeTimers();
    const view = render(<PublishDialog {...props} funnel={funnel} />);
    fireEvent.change(screen.getByTestId("input-publish-slug"), { target: { value: "meine-neue-url" } });
    const saved = { ...funnel, slug: "server-stand", name: "Gespeicherter Name" };
    view.rerender(<PublishDialog {...props} funnel={saved} />);
    expect(screen.getByTestId("input-publish-slug")).toHaveValue("meine-neue-url");
    view.rerender(<PublishDialog {...props} open={false} funnel={saved} />);
    view.rerender(<PublishDialog {...props} funnel={saved} />);
    expect(screen.getByTestId("input-publish-slug")).toHaveValue("server-stand");
    expect(screen.getByTestId("button-confirm-publish")).toBeEnabled();
  });

  it("ignores an outdated URL check arriving after the current result", async () => {
    vi.useFakeTimers();
    let finishOld!: (response: Response) => void;
    vi.mocked(apiRequest).mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve; }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ available: true })));
    render(<PublishDialog {...props} funnel={funnel} />);
    fireEvent.change(screen.getByTestId("input-publish-slug"), { target: { value: "alte-url" } });
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    fireEvent.change(screen.getByTestId("input-publish-slug"), { target: { value: "aktuelle-url" } });
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    expect(screen.getByTestId("button-confirm-publish")).toBeEnabled();
    await act(async () => { finishOld(new Response(JSON.stringify({ available: false }))); });
    expect(screen.getByTestId("button-confirm-publish")).toBeEnabled();
  });
});
