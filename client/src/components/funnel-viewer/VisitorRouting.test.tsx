import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { FunnelPage } from "@shared/schema";
import { FunnelRenderer } from "./FunnelRenderer";

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
vi.mock("@/lib/font-loader", () => ({ loadFont: vi.fn() }));
beforeAll(() => { HTMLElement.prototype.scrollTo = vi.fn(); });
const theme = { primaryColor: "#123456", backgroundColor: "#ffffff", textColor: "#111111", fontFamily: "Inter" };
function fixture(): FunnelPage[] { return [
  { id: "start", type: "question", title: "Bedarf", elements: [{ id: "choice", type: "radio", required: true, label: "Wunsch", choices: [{ id: "a", label: "Beratung" }, { id: "b", label: "Informationen" }] }], routing: { version: 1, fallbackPageId: "info", rules: [{ id: "r", name: "Beratung", match: "all", targetPageId: "consult", conditions: [{ id: "c", kind: "choice", fieldId: "choice", operator: "equals", value: "a" }] }] } },
  { id: "consult", type: "question", title: "Beratungsdetails", elements: [{ id: "details", type: "input", placeholder: "Details" }], nextPageId: "contact" },
  { id: "info", type: "question", title: "Infodetails", elements: [{ id: "info-value", type: "input", placeholder: "Interesse" }], nextPageId: "contact" },
  { id: "contact", type: "contact", title: "Kontakt", elements: [{ id: "email", type: "input", placeholder: "E-Mail", required: true, mapToLeadField: "email", validation: { type: "email" } }, { id: "direct", type: "button", content: "Direkt absenden", buttonAction: "page", buttonNextPageId: "done-info" }], routing: { version: 1, fallbackPageId: "done-info", rules: [{ id: "result", name: "Ergebnis", match: "all", targetPageId: "done-consult", conditions: [{ id: "result-c", fieldId: "choice", kind: "choice", operator: "equals", value: "a" }] }] } },
  { id: "done-consult", type: "thankyou", title: "Beratung angefragt", elements: [] },
  { id: "done-info", type: "thankyou", title: "Informationen angefragt", elements: [] },
]; }
const heading = async (name: string) => waitFor(() => expect(screen.getByRole("heading", { name })).toBeVisible());
const next = () => fireEvent.click(screen.getByTestId("button-funnel-next"));
const back = () => fireEvent.click(screen.getByTestId("button-funnel-back"));
describe("visitor journey and submission", () => {
  it("records the control journey when fixed options exist only in an A/B alternative", async () => {
    const submit = vi.fn().mockResolvedValue(true);
    render(<FunnelRenderer funnel={{ theme, pages: [
      { id: "contact", type: "contact", title: "Kontakt", elements: [{ id: "email", type: "input", placeholder: "E-Mail", mapToLeadField: "email" }] },
      { id: "done", type: "thankyou", title: "Danke", elements: [] },
    ], abTests: [{ id: "test", name: "Auswahl", pageId: "contact", status: "running", variants: [
      { id: "control", name: "Kontrolle", trafficAllocation: 50, views: 0, conversions: 0 },
      { id: "alternative", name: "Alternative", trafficAllocation: 50, views: 0, conversions: 0, elements: [{ id: "choice", type: "radio", choices: [{ id: "option", label: "Beratung" }] }] },
    ] }] }} mode="preview" onSubmit={submit} />);
    fireEvent.change(screen.getByPlaceholderText("E-Mail"), { target: { value: "control@example.test" } });
    fireEvent.click(screen.getByTestId("button-funnel-submit")); await heading("Danke");
    expect(submit.mock.calls[0][0].answerSnapshot).toMatchObject({ path: ["contact"], fields: [{ elementId: "email", value: "control@example.test" }] });
  });
  it("goes back along the visited path and discards stale branch answers", async () => {
    const submit = vi.fn().mockResolvedValue(true);
    render(<FunnelRenderer funnel={{ pages: fixture(), theme, publishedRevisionId: 77 }} mode="preview" onSubmit={submit} />);
    fireEvent.click(screen.getByLabelText("Beratung")); next(); await heading("Beratungsdetails");
    fireEvent.change(screen.getByPlaceholderText("Details"), { target: { value: "Verwerfen" } }); next(); await heading("Kontakt");
    fireEvent.change(screen.getByPlaceholderText("E-Mail"), { target: { value: "old@example.test" } });
    back(); await heading("Beratungsdetails"); back(); await heading("Bedarf");
    fireEvent.click(screen.getByLabelText("Informationen")); next(); await heading("Infodetails");
    fireEvent.change(screen.getByPlaceholderText("Interesse"), { target: { value: "Behalten" } }); next(); await heading("Kontakt");
    expect(screen.getByPlaceholderText("E-Mail")).toHaveValue("");
    fireEvent.change(screen.getByPlaceholderText("E-Mail"), { target: { value: "new@example.test" } });
    fireEvent.click(screen.getByTestId("button-funnel-submit")); await heading("Informationen angefragt");
    expect(submit).toHaveBeenCalledTimes(1);
    const payload = submit.mock.calls[0][0];
    expect(payload.answers).toEqual({ Wunsch: "Informationen", "info-value": "Behalten", email: "new@example.test" });
    expect(payload.answerSnapshot).toMatchObject({ contentRevisionId: 77, path: ["start", "info", "contact"] });
    expect(JSON.stringify(payload)).not.toContain("Verwerfen");
    expect(JSON.stringify(payload)).not.toContain("old@example.test");
  });
  it("validates direct jumps and shows a rule-selected result only after a successful submit", async () => {
    const submit = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    render(<FunnelRenderer funnel={{ pages: fixture(), theme }} mode="preview" onSubmit={submit} />);
    next(); expect(screen.getByRole("heading", { name: "Bedarf" })).toBeVisible();
    fireEvent.click(screen.getByLabelText("Beratung")); next(); await heading("Beratungsdetails"); next(); await heading("Kontakt");
    fireEvent.click(screen.getByRole("button", { name: "Direkt absenden" }));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByText("Dieses Feld ist erforderlich")).toBeVisible();
    fireEvent.change(screen.getByPlaceholderText("E-Mail"), { target: { value: "valid@example.test" } });
    fireEvent.click(screen.getByTestId("button-funnel-submit"));
    await screen.findByText("Absenden fehlgeschlagen. Bitte versuche es erneut.");
    expect(screen.queryByRole("heading", { name: "Beratung angefragt" })).toBeNull();
    fireEvent.click(screen.getByTestId("button-funnel-submit")); await heading("Beratung angefragt");
    expect(submit).toHaveBeenCalledTimes(2);
    expect(screen.queryByTestId("button-funnel-back")).toBeNull();
  });
  it("prevents duplicate sends while a direct result jump is pending", async () => {
    let finish!: (value: boolean) => void;
    const submit = vi.fn(() => new Promise<boolean>(resolve => { finish = resolve; }));
    const p = fixture().slice(3);
    p[0].routing = { version: 1, rules: [], fallbackPageId: "done-info" };
    render(<FunnelRenderer funnel={{ pages: p, theme }} mode="preview" onSubmit={submit} />);
    fireEvent.change(screen.getByPlaceholderText("E-Mail"), { target: { value: "valid@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Direkt absenden" }));
    fireEvent.click(screen.getByRole("button", { name: "Direkt absenden" }));
    expect(submit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("heading", { name: "Kontakt" })).toBeVisible();
    finish(true); await heading("Informationen angefragt");
  });
});
