import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Funnel, Lead } from "@shared/schema";
import { updateOnboardingProgress } from "@/lib/onboarding-progress";
import { OnboardingChecklist } from "./onboarding-checklist";

const funnel = { id: 10, uuid: "first", name: "Mein Funnel", status: "draft", userId: 1 } as Funnel;
const second = { ...funnel, id: 20, uuid: "second", name: "Anderer Funnel", status: "published" } as Funnel;
const lead = { id: 5, funnelId: 20 } as Lead;
beforeEach(() => { localStorage.clear(); });

function step(name: string) { return within(screen.getByTestId(`onboarding-step-${name}`)); }

describe("Dashboard-Einstieg", () => {
  it("starts at zero, offers goal-specific templates and disables actions without a funnel", () => {
    render(<OnboardingChecklist userId={1} funnels={[]} leads={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent("0 von 5");
    expect(screen.getByRole("link", { name: "Bewerber gewinnen" })).toHaveAttribute("href", "/funnels/new?category=recruiting");
    expect(screen.getByRole("link", { name: "Anfragen erhalten" })).toHaveAttribute("href", "/funnels/new?category=leads");
    expect(screen.getByRole("button", { name: "Vorschau testen" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Veröffentlichung prüfen" })).toBeDisabled();
  });

  it("keeps progress and links tied to one funnel and remembers the selection", () => {
    updateOnboardingProgress(1, second.uuid, { edited: true, tested: true });
    const view = render(<OnboardingChecklist userId={1} funnels={[second, funnel]} leads={[lead]} />);
    expect(screen.getByRole("status")).toHaveTextContent("1 von 5");
    expect(screen.getByRole("link", { name: "Inhalte bearbeiten" })).toHaveAttribute("href", "/funnels/10");
    expect(step("lead").queryByText("Erledigt")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Dein Funnel für diese Schritte"), { target: { value: "20" } });
    expect(screen.getByRole("status")).toHaveTextContent("Geschafft!");
    expect(screen.getByRole("link", { name: "Anfrage ansehen" })).toHaveAttribute("href", "/leads?funnel=20&lead=5");
    expect(screen.getByRole("link", { name: "Link teilen" })).toHaveAttribute("href", "/funnels/20?action=publish");
    view.unmount();
    render(<OnboardingChecklist userId={1} funnels={[funnel, second]} leads={[lead]} />);
    expect(screen.getByLabelText("Dein Funnel für diese Schritte")).toHaveValue("20");
  });

  it("updates completed preview progress from another tab and supports explicit content review", () => {
    render(<OnboardingChecklist userId={1} funnels={[funnel]} leads={[]} />);
    expect(step("test").queryByText("Erledigt")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Inhalte sind geprüft" }));
    expect(step("edit").getByText("Erledigt")).toBeVisible();
    act(() => {
      localStorage.setItem("tw-onboarding:v2:1:first", JSON.stringify({ edited: true, tested: true }));
      window.dispatchEvent(new StorageEvent("storage"));
    });
    expect(screen.getByRole("status")).toHaveTextContent("3 von 5");
    expect(step("test").getByText("Erledigt")).toBeVisible();
  });

  it("can reopen after reload and does not share dismissal or progress between accounts", () => {
    const view = render(<OnboardingChecklist userId={1} funnels={[funnel]} leads={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Checkliste ausblenden" }));
    view.unmount();
    const next = render(<OnboardingChecklist userId={1} funnels={[funnel]} leads={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Erste Schritte wieder anzeigen" }));
    expect(screen.getByRole("status")).toHaveTextContent("1 von 5");
    fireEvent.click(screen.getByRole("button", { name: "Inhalte sind geprüft" }));
    fireEvent.click(screen.getByRole("button", { name: "Checkliste ausblenden" }));
    next.rerender(<OnboardingChecklist userId={2} funnels={[funnel]} leads={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent("1 von 5");
  });

  it("ignores archived/deleted selections and handles corrupt storage and unavailable lead data", () => {
    localStorage.setItem("tw-onboarding:v2:1:dashboard", '{"selectedFunnelId":20}');
    localStorage.setItem("tw-onboarding:v2:1:first", 'broken');
    render(<OnboardingChecklist userId={1} funnels={[{ ...second, status: "archived" }, funnel]} leadsError />);
    expect(screen.getByLabelText("Dein Funnel für diese Schritte")).toHaveValue("10");
    expect(step("lead").getByText(/Anfragen konnten nicht geladen werden/)).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("1 von 5");
  });

  it("remains usable when browser storage is blocked", () => {
    const get = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    const set = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    try {
      render(<OnboardingChecklist userId={900} funnels={[]} leads={[]} />);
      fireEvent.click(screen.getByRole("button", { name: "Checkliste ausblenden" }));
      fireEvent.click(screen.getByRole("button", { name: "Erste Schritte wieder anzeigen" }));
      expect(screen.getByRole("status")).toHaveTextContent("0 von 5");
    } finally { get.mockRestore(); set.mockRestore(); }
  });
});
