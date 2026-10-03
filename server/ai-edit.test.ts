import { afterEach, describe, expect, it, vi } from "vitest";
import { rewriteTexts } from "./ai";
import { aiEditInputSchema } from "@shared/ai-edit";
const credential = { provider: "openai" as const, apiKey: "test-only", model: "configured-model" };
const input = aiEditInputSchema.parse({ intent: "shorten", items: [{ id: "text", type: "text", content: "Hallo {{Name}}, wir freuen uns auf dich." }] });
afterEach(() => vi.unstubAllGlobals());
describe("AI text provider boundary", () => {
  it("uses the stored provider and sends only the requested text input", async () => {
    const output = { suggestions: [{ id: "text", variants: ["Hallo {{Name}}!"] }] };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(output) } }] })));
    vi.stubGlobal("fetch", fetchMock);
    expect(await rewriteTexts(credential, input)).toEqual(output);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(JSON.parse(body.messages[1].content)).toEqual(input);
    expect(body.model).toBe("configured-model");
  });
  it("rejects provider output that loses a variable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: '{"suggestions":[{"id":"text","variants":["Hallo!"]}]}' } }] }))));
    await expect(rewriteTexts(credential, input)).rejects.toMatchObject({ code: "AI_INVALID_OUTPUT" });
  });
  it("does not expose raw provider errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("secret raw detail", { status: 429 })));
    await expect(rewriteTexts(credential, input)).rejects.toMatchObject({ code: "AI_PROVIDER_QUOTA" });
  });
});
