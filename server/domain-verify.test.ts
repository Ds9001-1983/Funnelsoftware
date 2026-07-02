import { describe, expect, it } from "vitest";
import { verifyDomainDns, type DnsResolver } from "./domain-verify";

const TOKEN = "abc123token";

/** Resolver-Stub: nicht gesetzte Lookups werfen wie node:dns bei NXDOMAIN. */
function makeResolver(overrides: Partial<DnsResolver>): DnsResolver {
  const reject = () => Promise.reject(new Error("ENOTFOUND"));
  return {
    resolveCname: overrides.resolveCname ?? reject,
    resolve4: overrides.resolve4 ?? reject,
    resolveTxt: overrides.resolveTxt ?? reject,
  };
}

describe("verifyDomainDns", () => {
  it("akzeptiert CNAME auf trichterwerk.de", async () => {
    const resolver = makeResolver({
      resolveCname: async () => ["trichterwerk.de"],
    });
    expect(await verifyDomainDns("funnel.kunde.de", TOKEN, resolver)).toEqual({
      ok: true,
      method: "cname",
    });
  });

  it("akzeptiert CNAME auf www.trichterwerk.de mit trailing dot und Großschreibung", async () => {
    const resolver = makeResolver({
      resolveCname: async () => ["WWW.Trichterwerk.DE."],
    });
    expect(await verifyDomainDns("funnel.kunde.de", TOKEN, resolver)).toEqual({
      ok: true,
      method: "cname",
    });
  });

  it("folgt einer CNAME-Kette bis zum Ziel", async () => {
    const chain: Record<string, string[]> = {
      "funnel.kunde.de": ["proxy.provider.net"],
      "proxy.provider.net": ["trichterwerk.de"],
    };
    const resolver = makeResolver({
      resolveCname: async (host) => {
        const t = chain[host];
        if (!t) throw new Error("ENOTFOUND");
        return t;
      },
    });
    expect(await verifyDomainDns("funnel.kunde.de", TOKEN, resolver)).toEqual({
      ok: true,
      method: "cname",
    });
  });

  it("bricht CNAME-Ketten nach der Maximaltiefe ab (Loop-Schutz)", async () => {
    // a → b → a → b … würde ohne Tiefenlimit endlos laufen.
    const loop: Record<string, string[]> = {
      "a.kunde.de": ["b.kunde.de"],
      "b.kunde.de": ["a.kunde.de"],
    };
    const resolver = makeResolver({
      resolveCname: async (host) => loop[host] ?? [],
    });
    expect(await verifyDomainDns("a.kunde.de", TOKEN, resolver)).toEqual({
      ok: false,
      reason: "wrong-target",
    });
  });

  it("akzeptiert Apex-Domain per A-Record-Schnittmenge", async () => {
    const resolver = makeResolver({
      resolve4: async (host) =>
        host === "trichterwerk.de" ? ["116.203.40.49"] : ["116.203.40.49"],
    });
    expect(await verifyDomainDns("kunde.de", TOKEN, resolver)).toEqual({
      ok: true,
      method: "a-record",
    });
  });

  it("akzeptiert CNAME-Flattening: CNAME-Lookup wirft, aber A-Record passt", async () => {
    const resolver = makeResolver({
      resolveCname: () => Promise.reject(new Error("ENODATA")),
      resolve4: async () => ["116.203.40.49"],
    });
    expect(await verifyDomainDns("funnel.kunde.de", TOKEN, resolver)).toEqual({
      ok: true,
      method: "a-record",
    });
  });

  it("akzeptiert Legacy-TXT-Token als Fallback", async () => {
    const resolver = makeResolver({
      resolveTxt: async (host) =>
        host === `_trichterwerk-verify.funnel.kunde.de` ? [["abc123", "token"]] : [],
    });
    expect(await verifyDomainDns("funnel.kunde.de", TOKEN, resolver)).toEqual({
      ok: true,
      method: "txt",
    });
  });

  it("meldet nxdomain, wenn gar keine Records existieren", async () => {
    const resolver = makeResolver({});
    expect(await verifyDomainDns("funnel.kunde.de", TOKEN, resolver)).toEqual({
      ok: false,
      reason: "nxdomain",
    });
  });

  it("meldet wrong-target, wenn der CNAME woanders hinzeigt", async () => {
    const resolver = makeResolver({
      resolveCname: async () => ["irgendwo-anders.example.com"],
    });
    expect(await verifyDomainDns("funnel.kunde.de", TOKEN, resolver)).toEqual({
      ok: false,
      reason: "wrong-target",
    });
  });

  it("meldet wrong-target, wenn A-Records existieren aber nicht passen", async () => {
    const resolver = makeResolver({
      resolve4: async (host) =>
        host === "trichterwerk.de" ? ["116.203.40.49"] : ["93.184.216.34"],
    });
    expect(await verifyDomainDns("kunde.de", TOKEN, resolver)).toEqual({
      ok: false,
      reason: "wrong-target",
    });
  });

  it("meldet wrong-target bei TXT-Record mit falschem Token", async () => {
    const resolver = makeResolver({
      resolveTxt: async () => [["falscher-token"]],
    });
    expect(await verifyDomainDns("funnel.kunde.de", TOKEN, resolver)).toEqual({
      ok: false,
      reason: "wrong-target",
    });
  });
});
