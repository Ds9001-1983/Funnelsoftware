import { describe, expect, it } from "vitest";
import { publicDemoSlugs, cleanMarketingPath, isMarketingPath, demoSlugForPath } from "./platform-tracking";
import { templateMetas } from "./template-meta";
import { trackEventSchema } from "./schema";

describe("public marketing tracking boundaries", () => {
  it("covers every registered public demo and excludes private/unknown routes", () => {
    expect([...publicDemoSlugs].sort()).toEqual(templateMetas.map(template => template.slug).sort());
    for (const slug of publicDemoSlugs) {
      expect(isMarketingPath(`/vorlagen/${slug}`)).toBe(true);
      expect(demoSlugForPath(`/vorlagen/${slug}/?utm_source=example#preview`)).toBe(slug);
    }
    for (const path of ["/dashboard", "/f/private", "/vorlagen/unknown", "/vorlagen/termin-buchen/private"]) {
      expect(isMarketingPath(path)).toBe(false);
      expect(demoSlugForPath(path)).toBeUndefined();
    }
    expect(cleanMarketingPath("/vorlagen/termin-buchen/?email=private#answer")).toBe("/vorlagen/termin-buchen");
  });
  it("allows demo events but never client-supplied account activation", () => {
    expect(trackEventSchema.safeParse({ path: "/vorlagen/termin-buchen", eventType: "demo_start" }).success).toBe(true);
    for (const eventType of ["register", "first_publish", "first_published", "purchase"]) {
      expect(trackEventSchema.safeParse({ path: "/", eventType }).success).toBe(false);
    }
  });
});
