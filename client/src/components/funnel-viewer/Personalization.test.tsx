import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { FunnelPage, PageElement } from "@shared/schema";
import { FunnelRenderer } from "./FunnelRenderer";
import { ElementPreviewRenderer } from "../funnel-editor/ElementPreviewRenderer";

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
vi.mock("@/lib/font-loader", () => ({ loadFont: vi.fn() }));
beforeAll(() => { HTMLElement.prototype.scrollTo = vi.fn(); });
const theme = { primaryColor: "#123456", backgroundColor: "#ffffff", textColor: "#111111", fontFamily: "Inter" };
const content: PageElement = { id: "text", type: "heading", content: "Hallo {{Name}}", personalization: { version: 1, bindings: [{ id: "binding", token: "Name", source: { kind: "answer", fieldId: "name" }, fallback: "Gast" }] } };
const heading = async (name: string) => waitFor(() => expect(screen.getByRole("heading", { name })).toBeVisible());

describe("personalized rendering", () => {
  it("updates the canvas when test values are enabled, changed or disabled", () => {
    const props = { element: content, textColor: "#111", primaryColor: "#123" };
    const context = { pages: [{ id: "p", type: "question" as const, title: "Frage", elements: [{ id: "name", type: "input" as const }] }], path: ["p"], answers: { name: "Anna" }, campaign: {} };
    const { rerender } = render(<ElementPreviewRenderer {...props} />);
    expect(screen.getByRole("heading")).toHaveTextContent("Hallo {{Name}}");
    rerender(<ElementPreviewRenderer {...props} personalizationContext={context} />);
    expect(screen.getByRole("heading")).toHaveTextContent("Hallo Anna");
    rerender(<ElementPreviewRenderer {...props} personalizationContext={{ ...context, answers: { name: "Berta" } }} />);
    expect(screen.getByRole("heading")).toHaveTextContent("Hallo Berta");
    rerender(<ElementPreviewRenderer {...props} personalizationContext={{ ...context, path: [] }} />);
    expect(screen.getByRole("heading")).toHaveTextContent("Hallo Gast");
    rerender(<ElementPreviewRenderer {...props} />);
    expect(screen.getByRole("heading")).toHaveTextContent("Hallo {{Name}}");
  });
  it("displays visitor values as text and keeps inline editing on the original template", () => {
    const commit = vi.fn();
    const malicious = "<img src=x onerror=alert(1)> {{Name}}";
    const { container } = render(<ElementPreviewRenderer element={content} textColor="#111" primaryColor="#123" onContentCommit={commit} personalizationContext={{ pages: [{ id: "p", type: "question", title: "Frage", elements: [{ id: "name", type: "input" }] }], path: ["p"], answers: { name: malicious }, campaign: {} }} />);
    expect(screen.getByRole("heading")).toHaveTextContent(`Hallo ${malicious}`);
    expect(container.querySelector("img")).toBeNull();
    fireEvent.doubleClick(screen.getByRole("heading"));
    expect(screen.getByRole("textbox")).toHaveValue("Hallo {{Name}}");
    fireEvent.blur(screen.getByRole("textbox"));
    expect(commit).not.toHaveBeenCalled();
    fireEvent.doubleClick(screen.getByRole("heading"));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Willkommen {{Name}}" } });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(commit).toHaveBeenCalledWith("Willkommen {{Name}}");
  });
  it("uses the visited branch and keeps submitted answers independent of personalized labels", async () => {
    const pages: FunnelPage[] = [
      { id: "start", type: "question", title: "Start", elements: [{ id: "choice", type: "radio", choices: [{ id: "yes", label: "Beratung" }, { id: "no", label: "Direkt" }] }], routing: { version: 1, fallbackPageId: "contact", rules: [{ id: "branch", name: "Beratung", match: "all", targetPageId: "details", conditions: [{ id: "c", fieldId: "choice", kind: "choice", operator: "equals", value: "yes" }] }] } },
      { id: "details", type: "question", title: "Details", elements: [{ id: "name", type: "input", label: "Name", placeholder: "Dein Name" }], nextPageId: "contact" },
      { id: "contact", type: "contact", title: "Kontakt", elements: [content, { id: "email", type: "input", placeholder: "E-Mail", required: true, mapToLeadField: "email" }] },
      { id: "done", type: "thankyou", title: "Danke", elements: [{ ...content, id: "final", content: "Danke {{Name}}" }] },
    ];
    const submit = vi.fn().mockResolvedValue(true);
    render(<FunnelRenderer funnel={{ pages, theme, documentVersion: 4 }} mode="preview" onSubmit={submit} />);
    fireEvent.click(screen.getByLabelText("Beratung")); fireEvent.click(screen.getByTestId("button-funnel-next")); await heading("Details");
    fireEvent.change(screen.getByPlaceholderText("Dein Name"), { target: { value: "Anna" } });
    fireEvent.click(screen.getByTestId("button-funnel-next")); await heading("Hallo Anna");
    fireEvent.click(screen.getByTestId("button-funnel-back")); await heading("Details");
    fireEvent.click(screen.getByTestId("button-funnel-back")); await heading("Start");
    fireEvent.click(screen.getByLabelText("Direkt")); fireEvent.click(screen.getByTestId("button-funnel-next")); await heading("Hallo Gast");
    fireEvent.change(screen.getByPlaceholderText("E-Mail"), { target: { value: "a@example.test" } });
    fireEvent.click(screen.getByTestId("button-funnel-submit")); await heading("Danke Gast");
    expect(submit.mock.calls[0][0].answerSnapshot).toMatchObject({ documentVersion: 4, path: ["start", "contact"] });
    expect(JSON.stringify(submit.mock.calls[0][0])).not.toContain("Anna");
    expect(pages[2].elements[0].content).toBe("Hallo {{Name}}");
  });
  it("personalizes button text without changing its URL, options or other fields", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const button: PageElement = { ...content, type: "button", content: "Angebot {{Campaign}}", buttonAction: "url", buttonUrl: "https://example.test/{{Campaign}}", personalization: { version: 1, bindings: [{ id: "c", token: "Campaign", source: { kind: "campaign", key: "campaign" }, fallback: "Standard" }] } };
    const pages: FunnelPage[] = [{ id: "p", type: "question", title: "{{Campaign}}", elements: [button, { id: "f", type: "radio", label: "{{Campaign}}", options: ["{{Campaign}}"] }] }];
    const { container } = render(<FunnelRenderer funnel={{ pages, theme }} personalizationSearch="?campaign=Sommer&name=Privat" mode="preview" />);
    expect(screen.getByRole("button", { name: "Angebot Sommer" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "{{Campaign}}" })).toBeVisible();
    expect(screen.getByLabelText("{{Campaign}}")).toBeVisible();
    expect(container.textContent).not.toContain("Privat");
    expect(button.buttonUrl).toBe("https://example.test/{{Campaign}}");
    fireEvent.click(screen.getByRole("button", { name: "Angebot Sommer" }));
    expect(open).toHaveBeenCalledWith("https://example.test/{{Campaign}}", "_self", "noopener,noreferrer");
    open.mockRestore();
  });
});
