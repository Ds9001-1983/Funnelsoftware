import { describe, expect, it } from "vitest";
import type { ABTest, FunnelPage, PageElement } from "./schema";
import { campaignValues, needsPersonalizationDocument, personalizationErrors, resolvePersonalizedContent, type PersonalizationContext } from "./funnel-personalization";
import { copyElements, copyPages } from "./funnel-copy";
import { canEditFunnelDocument, documentFromFunnel } from "./funnel-document";
import { removedFieldReference } from "./funnel-layout-edit";

const text: PageElement = { id: "title", type: "heading", content: "Angebot für {{Ort}} · {{Kampagne}} · {{name}}", personalization: { version: 1, bindings: [
  { id: "place", token: "Ort", source: { kind: "answer", fieldId: "place" }, fallback: "deine Region" },
  { id: "campaign", token: "Kampagne", source: { kind: "campaign", key: "utm_campaign" }, fallback: "unser Angebot" },
] } };
const pages: FunnelPage[] = [
  { id: "start", type: "question", title: "Ort", elements: [{ id: "place", type: "radio", label: "Ort", choices: [{ id: "cologne", label: "Köln" }] }] },
  { id: "result", type: "thankyou", title: "Danke", elements: [text] },
];
const context = (): PersonalizationContext => ({ pages: structuredClone(pages), path: ["start"], answers: { place: "cologne" }, campaign: { utm_campaign: "Herbst" } });

describe("explicit text personalization", () => {
  it("keeps unconfigured legacy braces and unsupported properties literal", () => {
    expect(resolvePersonalizedContent({ ...text, personalization: undefined }, context())).toBe(text.content);
    expect(resolvePersonalizedContent(text, context())).toBe("Angebot für Köln · Herbst · {{name}}");
    expect(resolvePersonalizedContent({ ...text, type: "input" }, context())).toBe(text.content);
    const original = structuredClone(text);
    resolvePersonalizedContent(text, context());
    expect(text).toEqual(original);
  });
  it("uses stable field and option IDs after labels or order change", () => {
    const ctx = context(); ctx.pages.reverse();
    ctx.pages[1].elements[0].label = "Dein Standort";
    ctx.pages[1].elements[0].choices![0].label = "Köln & Umgebung";
    expect(resolvePersonalizedContent(text, ctx)).toContain("Köln & Umgebung");
    ctx.answers.place = "unavailable-option";
    expect(resolvePersonalizedContent(text, ctx)).toContain("deine Region");
  });
  it("uses fallbacks for missing, hidden and abandoned sources, never another visitor's values", () => {
    const one = context(), two = context(); two.answers = {}; two.campaign = {};
    expect(resolvePersonalizedContent(text, one)).toContain("Köln · Herbst");
    expect(resolvePersonalizedContent(text, two)).toContain("deine Region · unser Angebot");
    one.path = ["result"];
    expect(resolvePersonalizedContent(text, one)).toContain("deine Region");
    one.path = ["start"]; one.pages[0].hidden = true;
    expect(resolvePersonalizedContent(text, one)).toContain("deine Region");
    one.pages[0].hidden = false; one.pages[0].elements.push({ ...one.pages[0].elements[0] });
    expect(resolvePersonalizedContent(text, one)).toContain("deine Region");
  });
  it("allows exactly configured campaign keys and bounds query/value size", () => {
    expect(campaignValues("?utm_campaign=Herbst&name=Privat&unknown=secret", pages)).toEqual({ utm_campaign: "Herbst" });
    expect(campaignValues("?utm_campaign=A&utm_campaign=B", pages)).toEqual({});
    expect(campaignValues("?utm_campaign=" + "x".repeat(9000), pages)).toEqual({});
    expect(campaignValues("?utm_campaign=" + "x".repeat(250), pages).utm_campaign).toHaveLength(200);
    expect(campaignValues("?utm_campaign=Herbst", [{ ...pages[0], elements: [] }])).toEqual({});
    expect(campaignValues("?" + Array.from({ length: 51 }, (_, i) => `key${i}=x`).join("&"), pages)).toEqual({});
  });
  it("replaces only once and treats special characters and replacement syntax as plain text", () => {
    const ctx = context(); ctx.campaign.utm_campaign = "<img src=x onerror=alert(1)> {{Ort}} $&";
    expect(resolvePersonalizedContent(text, ctx)).toContain("<img src=x onerror=alert(1)> {{Ort}} $&");
    ctx.campaign.utm_campaign = "   \n\t";
    expect(resolvePersonalizedContent(text, ctx)).toContain("unser Angebot");
  });
  it("remaps references across copied pages/sections without changing original text or external IDs", () => {
    const copy = copyPages(pages);
    const binding = copy[1].elements[0].personalization!.bindings[0];
    expect(binding.source).toEqual({ kind: "answer", fieldId: copy[0].elements[0].id });
    expect(binding.id).not.toBe(text.personalization!.bindings[0].id);
    expect(copy[1].elements[0].content).toBe(text.content);
    expect(copyElements([text]).elements[0].personalization!.bindings[0].source).toEqual({ kind: "answer", fieldId: "place" });
    const section = copyElements([pages[0].elements[0], text]);
    expect(section.elements[1].personalization!.bindings[0].source).toEqual({ kind: "answer", fieldId: section.elements[0].id });
    expect(pages[0].elements[0].id).toBe("place");
  });
  it("guards removed sources, duplicate bindings and unsupported destination types", () => {
    expect(personalizationErrors(pages)).toEqual([]);
    expect(removedFieldReference({ pages }, pages[0], { ...pages[0], elements: [] })).toContain("{{Ort}}");
    expect(personalizationErrors([{ ...pages[0], elements: [] }, pages[1]]).join()).toContain("Antwortfeld fehlt");
    const bad = structuredClone(pages); bad[1].elements[0].personalization!.bindings.push({ ...text.personalization!.bindings[0] });
    expect(personalizationErrors(bad).join()).toContain("eindeutig");
    bad[1].elements[0].type = "input";
    expect(personalizationErrors(bad).join()).toContain("Button-Beschriftungen");
  });
  it("recognizes variant-only bindings and requires the v4 writer", () => {
    const tests = [{ id: "test", pageId: "result", status: "running", variants: [{ id: "control" }, { id: "other", elements: [text] }] }] as ABTest[];
    const base = [pages[0], { ...pages[1], elements: [] }];
    expect(needsPersonalizationDocument(base, tests)).toBe(true);
    expect(campaignValues("?utm_campaign=Variante", base, tests)).toEqual({ utm_campaign: "Variante" });
    const doc = { pages: base, abTests: tests, name: "Persönlich", theme: { primaryColor: "#000", backgroundColor: "#fff", textColor: "#111", fontFamily: "Inter" } };
    expect(documentFromFunnel(doc).version).toBe(4);
    expect(canEditFunnelDocument(doc, true, true)).toBe(false);
    expect(canEditFunnelDocument(doc, true, true, true)).toBe(true);
  });
});
