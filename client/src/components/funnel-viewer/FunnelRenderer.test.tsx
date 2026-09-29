import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { funnelPageSchema, type Theme } from "@shared/schema";
import { FunnelRenderer } from "./FunnelRenderer";

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
vi.mock("@/lib/font-loader", () => ({ loadFont: vi.fn() }));

const theme: Theme = { primaryColor: "#123456", textColor: "#111111", backgroundColor: "#ffffff", fontFamily: "Inter" };
function contact() {
  return funnelPageSchema.parse({ id: "contact", type: "contact", title: "Kontakt", elements: [
    { id: "name", type: "input", placeholder: "Dein Name", label: "Name", required: true, mapToLeadField: "name" },
    { id: "email", type: "input", placeholder: "Deine E-Mail", label: "E-Mail", required: true, mapToLeadField: "email", validation: { type: "email" } },
  ], layout: { version: 1, sections: [{ id: "section", columns: [
    { id: "left", elementIds: ["email"] }, { id: "right", elementIds: ["name"] },
  ] }] } });
}

describe("FunnelRenderer mit Layouts", () => {
  it("zeigt Felder in Layout-Reihenfolge und prüft Pflichtfelder in beiden Spalten", async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const { container } = render(<FunnelRenderer funnel={{ pages: [contact()], theme }} mode="preview" onSubmit={onSubmit} />);
    expect(screen.getAllByRole("textbox").map(input => input.getAttribute("placeholder"))).toEqual(["Deine E-Mail", "Dein Name"]);
    expect(container.querySelectorAll("[data-layout-column]")).toHaveLength(2);
    fireEvent.click(screen.getByTestId("button-funnel-submit"));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getAllByText("Dieses Feld ist erforderlich")).toHaveLength(2);
    fireEvent.change(screen.getByPlaceholderText("Deine E-Mail"), { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByTestId("button-funnel-submit"));
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.change(screen.getByPlaceholderText("Dein Name"), { target: { value: "Testperson" } });
    fireEvent.click(screen.getByTestId("button-funnel-submit"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: "Testperson", email: "test@example.com", answers: { Name: "Testperson", "E-Mail": "test@example.com" } }));
  });

  it("erhält die Darstellung alter flacher Seiten", () => {
    const page = contact();
    delete page.layout;
    const { container } = render(<FunnelRenderer funnel={{ pages: [page], theme }} mode="preview" />);
    expect(screen.getAllByRole("textbox").map(input => input.getAttribute("placeholder"))).toEqual(["Dein Name", "Deine E-Mail"]);
    expect(container.querySelector(".funnel-layout")).toBeNull();
    expect(container.querySelector(".max-w-lg")).toHaveStyle({ maxWidth: "512px" });
    expect(screen.getByTestId("button-funnel-submit")).toHaveStyle({ backgroundColor: "#123456" });
  });

  it("verliert in einer beschädigten Entwurfs-Vorschau keine Elemente", () => {
    const page = contact();
    page.layout!.sections[0].columns[0].elementIds = ["deleted"];
    const { container } = render(<FunnelRenderer funnel={{ pages: [page], theme }} mode="preview" />);
    expect(screen.getAllByRole("textbox")).toHaveLength(2);
    expect(container.querySelector(".funnel-layout")).toBeNull();
  });

  it("wendet Designvorgaben an und lässt Element-Überschreibungen vorgehen", () => {
    const page = funnelPageSchema.parse({ id: "page", type: "welcome", title: "Titel", elements: [
      { id: "heading", type: "heading", content: "Überschrift" },
      { id: "text", type: "text", content: "Eigener Text", styles: { fontSize: "19px", color: "#ff0000" } },
      { id: "button", type: "button", content: "Eigener Button", buttonVariant: "primary", styles: { borderRadius: "3px" } },
    ], layout: { version: 1, width: "wide", sections: [{ id: "s", textColor: "#00ff00", columns: [{ id: "c", elementIds: ["heading", "text", "button"] }] }] } });
    const design: Theme["design"] = { version: 1, headingSize: 40, bodySize: 18, radius: 0, spacing: 24, buttonStyle: "outline" };
    render(<FunnelRenderer funnel={{ pages: [page], theme: { ...theme, design } }} mode="preview" />);
    expect(screen.getByRole("heading", { name: "Titel" })).toHaveStyle({ fontSize: "40px" });
    expect(screen.getByRole("heading", { name: "Überschrift" })).toHaveStyle({ fontSize: "40px", color: "#00ff00" });
    expect(screen.getByText("Eigener Text")).toHaveStyle({ fontSize: "19px", color: "#ff0000" });
    expect(screen.getByRole("button", { name: "Eigener Button" })).toHaveStyle({ borderRadius: "3px", backgroundColor: "#123456", color: "#ffffff" });
    const submit = screen.getByTestId("button-funnel-submit");
    expect(submit).toHaveStyle({ borderRadius: "0", color: "#123456" });
    expect(submit.style.backgroundColor).toBe("transparent");
  });
});
