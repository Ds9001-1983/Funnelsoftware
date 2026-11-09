import { describe, expect, it } from "vitest";
import { isPublicationLegalUrl, publicationLegalErrors } from "./funnel-legal";

describe("publication legal addresses", () => {
  it.each([undefined, null, "", " ", "/privacy", "#privacy", "//example.com/privacy", "example.com/privacy", "mailto:legal@example.com", "javascript:alert(1)", "https://", "https://user:password@example.com/privacy", "https://example.com/a b", "https://example.com/\nprivacy", "https://example.com\\privacy"])("rejects incomplete or ambiguous address %s", value => {
    expect(isPublicationLegalUrl(value)).toBe(false);
  });
  it.each(["https://example.com/privacy", "http://example.com/legal", "https://müller.de/datenschutz#bewerbung", "https://example.com/a%20b?lang=de"])("accepts absolute web address %s", value => {
    expect(isPublicationLegalUrl(value)).toBe(true);
  });
  it("reports each missing document independently", () => {
    expect(publicationLegalErrors({})).toHaveLength(2);
    expect(publicationLegalErrors({ impressumUrl: "https://example.com/legal" })).toEqual([expect.stringContaining("Datenschutzerklärung")]);
    expect(publicationLegalErrors({ datenschutzUrl: "https://example.com/privacy" })).toEqual([expect.stringContaining("Impressum")]);
  });
});
