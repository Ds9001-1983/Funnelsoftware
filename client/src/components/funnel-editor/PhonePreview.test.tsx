import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PhonePreview } from "./PhonePreview";
import { DEFAULT_DESIGN } from "@shared/funnel-design";
import type { FunnelPage, Theme } from "@shared/schema";
vi.mock("@/lib/font-loader", () => ({ loadFont: vi.fn() }));
beforeAll(() => vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} }));
afterAll(() => vi.unstubAllGlobals());
const theme: Theme = { primaryColor: "#123456", backgroundColor: "#eeeeee", textColor: "#222222", fontFamily: "Inter" };
const page: FunnelPage = { id: "p", type: "welcome", title: "Willkommen", buttonText: "Weiter", elements: [{ id: "e", type: "heading", content: "Individuell", styles: { color: "#ff0000", fontSize: "21px" } }] };
describe("canvas theme parity", () => {
  it("uses existing live colors for legacy welcome pages rather than inferred inverse colors", () => {
    render(<PhonePreview page={page} theme={theme} primaryColor={theme.primaryColor} pageIndex={0} totalPages={1} />);
    expect(screen.getByTestId("phone-preview-content")).toHaveStyle({ backgroundColor: "#eeeeee", color: "#222222", fontFamily: "Inter" });
    expect(screen.getByRole("heading", { name: "Willkommen" })).toHaveStyle({ color: "#222222" });
    expect(screen.getByRole("button", { name: "Weiter" })).toHaveStyle({ backgroundColor: "#123456" });
    expect(page).not.toHaveProperty("backgroundColor");
  });
  it("applies global tokens while preserving page and element overrides", () => {
    render(<PhonePreview page={{ ...page, backgroundColor: "#abcdef", pageStyles: { fontFamily: "Lora" } }} theme={{ ...theme, design: { ...DEFAULT_DESIGN, headingSize: 40, buttonStyle: "outline", radius: 4 } }} primaryColor={theme.primaryColor} pageIndex={0} totalPages={1} />);
    expect(screen.getByTestId("phone-preview-content")).toHaveStyle({ backgroundColor: "#abcdef", fontFamily: "Lora" });
    expect(screen.getByRole("heading", { name: "Willkommen" })).toHaveStyle({ fontSize: "40px" });
    expect(screen.getByRole("heading", { name: "Individuell" })).toHaveStyle({ fontSize: "21px", color: "#ff0000" });
    const button = screen.getByRole("button", { name: "Weiter" });
    expect(button).toHaveStyle({ color: "#123456", borderRadius: "4px" });
    expect(button.style.backgroundColor).toBe("transparent");
  });
});
