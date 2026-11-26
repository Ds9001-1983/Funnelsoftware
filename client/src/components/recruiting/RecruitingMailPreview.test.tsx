import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RecruitingMailPreview } from "./RecruitingMailPreview";

const props = { senderName: "Recruiting", subject: "Bewerbung {{name}} bei {{funnel}}", body: "Hallo {{name}},\nFirma: {{company}}", funnelName: "Pflege", replyTo: "team@example.com" };

describe("Bewerbermail-Vorschau", () => {
  it("replaces draft variables with editable example data and preserves line breaks", () => {
    const { rerender } = render(<RecruitingMailPreview {...props} />);
    expect(screen.getByTestId("mail-preview-subject")).toHaveTextContent("Bewerbung Alex Beispiel bei Pflege");
    fireEvent.change(screen.getByLabelText("Beispielname"), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText("Beispielfirma"), { target: { value: "Praxis" } });
    expect(screen.getByTestId("mail-preview-body").textContent).toBe("Hallo Ada,\nFirma: Praxis");
    rerender(<RecruitingMailPreview {...props} subject="Danke {{name}}" />);
    expect(screen.getByTestId("mail-preview-subject")).toHaveTextContent("Danke Ada");
  });
  it("uses the worker fallback for missing names and renders HTML as text", () => {
    const { container } = render(<RecruitingMailPreview {...props} body={'{{name}} <img src=x onerror="alert(1)">'} />);
    fireEvent.change(screen.getByLabelText("Beispielname"), { target: { value: "" } });
    expect(screen.getByTestId("mail-preview-body")).toHaveTextContent("Interessent/in <img");
    expect(container.querySelector("img")).toBeNull();
  });
  it("identifies unknown placeholders without changing the draft", () => {
    render(<RecruitingMailPreview {...props} body="{{frist}} {{ name }} {{frist}}" />);
    expect(screen.getByRole("status")).toHaveTextContent("{{frist}}");
    expect(screen.getByTestId("mail-preview-body")).toHaveTextContent("{{frist}} Alex Beispiel {{frist}}");
  });
});
