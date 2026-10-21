import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExternalEmbed } from "./external-embed";

describe("Externe Inhalte", () => {
  it("lädt erst nach Aktivierung und entfernt das iframe bei Widerruf", () => {
    const view = render(<ExternalEmbed src="https://calendly.com/example/30min" title="Terminbuchung" />);
    expect(view.container.querySelector("iframe")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Inhalt laden" }));
    expect(view.container.querySelector("iframe")?.src).toBe("https://calendly.com/example/30min");
    act(() => window.dispatchEvent(new CustomEvent("cookieConsentChanged")));
    expect(view.container.querySelector("iframe")).toBeNull();
  });
  it("überträgt eine Aktivierung nicht auf einen anderen Inhalt", () => {
    const view = render(<ExternalEmbed src="https://www.youtube-nocookie.com/embed/example1" title="Video" />);
    fireEvent.click(screen.getByRole("button", { name: "Inhalt laden" }));
    view.rerender(<ExternalEmbed src="https://player.vimeo.com/video/123" title="Video" />);
    expect(view.container.querySelector("iframe")).toBeNull();
    expect(screen.getByText("Video von Vimeo")).toBeInTheDocument();
  });
});
