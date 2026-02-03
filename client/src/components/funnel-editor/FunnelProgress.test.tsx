import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import { FunnelProgress } from "./FunnelProgress";

describe("FunnelProgress", () => {
  it("zeigt den korrekten Fortschritt an", () => {
    render(
      <FunnelProgress
        currentPage={1}
        totalPages={4}
        primaryColor="#7C3AED"
      />
    );

    // Prüfe, ob der Fortschrittstext korrekt angezeigt wird
    expect(screen.getByText("Schritt 2 von 4")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("zeigt 100% bei der letzten Seite", () => {
    render(
      <FunnelProgress
        currentPage={3}
        totalPages={4}
        primaryColor="#7C3AED"
      />
    );

    expect(screen.getByText("Schritt 4 von 4")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("zeigt den Fortschrittsbalken mit korrekter Farbe", () => {
    const { container } = render(
      <FunnelProgress
        currentPage={0}
        totalPages={4}
        primaryColor="#FF0000"
      />
    );

    // Finde den Fortschrittsbalken
    const progressBar = container.querySelector('[style*="background-color"]');
    expect(progressBar).toHaveStyle({ backgroundColor: "#FF0000" });
  });

  it("berechnet den Fortschritt korrekt für verschiedene Seitenzahlen", () => {
    const { rerender } = render(
      <FunnelProgress
        currentPage={0}
        totalPages={5}
        primaryColor="#7C3AED"
      />
    );

    expect(screen.getByText("20%")).toBeInTheDocument();

    rerender(
      <FunnelProgress
        currentPage={2}
        totalPages={5}
        primaryColor="#7C3AED"
      />
    );

    expect(screen.getByText("60%")).toBeInTheDocument();
  });
});
