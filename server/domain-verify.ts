/**
 * DNS-Verifizierung für Custom Domains — Perspective-UX: Der Kunde trägt nur
 * einen CNAME auf trichterwerk.de ein (bzw. einen A-Record auf die Server-IP
 * bei Root-Domains), wir prüfen per DNS-Lookup, ob die Domain auf uns zeigt.
 *
 * Der alte TXT-Token-Check bleibt als stiller Fallback bestehen, damit
 * Bestandsdomains mit gesetztem TXT-Record weiterhin verifizierbar sind.
 */

export const CNAME_TARGET = "trichterwerk.de";
const VALID_TARGETS = new Set([CNAME_TARGET, `www.${CNAME_TARGET}`]);

// CNAME-Ketten (z. B. über Provider-Proxies) begrenzt verfolgen — Loop-Schutz.
const MAX_CNAME_DEPTH = 3;

/**
 * Injizierbarer DNS-Resolver (Default: node:dns/promises) — macht die
 * Verifizierungslogik ohne echtes DNS testbar.
 */
export interface DnsResolver {
  resolveCname(hostname: string): Promise<string[]>;
  resolve4(hostname: string): Promise<string[]>;
  resolveTxt(hostname: string): Promise<string[][]>;
}

export type DomainVerifyResult =
  | { ok: true; method: "cname" | "a-record" | "txt" }
  | { ok: false; reason: "nxdomain" | "wrong-target" };

async function defaultResolver(): Promise<DnsResolver> {
  const { promises: dns } = await import("dns");
  return dns;
}

/** DNS-Namen normalisieren: lowercased, ohne trailing dot. */
function normalizeDnsName(name: string): string {
  return name.trim().toLowerCase().replace(/\.$/, "");
}

/**
 * Lookup-Fehler (ENOTFOUND/ENODATA, aber auch transiente SERVFAIL/Timeouts)
 * als "kein Record" behandeln — der Nutzer versucht es in 1–5 Minuten erneut,
 * das Rate-Limit des Endpoints drosselt ohnehin.
 */
async function safeResolve<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

/**
 * Prüft, ob `hostname` per DNS auf Trichterwerk zeigt.
 *
 * Reihenfolge:
 * 1. CNAME auf trichterwerk.de/www (Ketten bis MAX_CNAME_DEPTH verfolgen) —
 *    der dokumentierte Standardweg.
 * 2. A-Record-Vergleich mit trichterwerk.de — deckt Root-Domains (kein CNAME
 *    am Apex möglich) und CNAME-Flattening (z. B. Cloudflare) ab. Die Ziel-IPs
 *    werden dynamisch aufgelöst statt hartkodiert, damit ein Server-Umzug die
 *    Verifizierung nicht bricht.
 * 3. Legacy-TXT-Token (_trichterwerk-verify.<hostname>) — Bestandsdomains.
 */
export async function verifyDomainDns(
  hostname: string,
  verificationToken: string,
  resolver?: DnsResolver,
): Promise<DomainVerifyResult> {
  const dns = resolver ?? (await defaultResolver());
  // Unterscheidet am Ende "gar kein DNS-Eintrag" (nxdomain) von "zeigt woanders
  // hin" (wrong-target) — die Fehlermeldung an den Kunden ist dann hilfreicher.
  let sawAnyRecord = false;

  // 1. CNAME (Kette verfolgen)
  let current = hostname;
  for (let depth = 0; depth < MAX_CNAME_DEPTH; depth++) {
    const targets = await safeResolve(() => dns.resolveCname(current));
    if (!targets?.length) break;
    sawAnyRecord = true;
    const normalized = targets.map(normalizeDnsName);
    if (normalized.some((t) => VALID_TARGETS.has(t))) {
      return { ok: true, method: "cname" };
    }
    // Kette am ersten Ziel weiterverfolgen; Selbstreferenz defensiv abbrechen.
    if (normalized[0] === current) break;
    current = normalized[0];
  }

  // 2. A-Record-Schnittmenge mit dem kanonischen Host
  const [domainIps, canonicalIps] = await Promise.all([
    safeResolve(() => dns.resolve4(hostname)),
    safeResolve(() => dns.resolve4(CNAME_TARGET)),
  ]);
  if (domainIps?.length) {
    sawAnyRecord = true;
    if (canonicalIps?.length && domainIps.some((ip) => canonicalIps.includes(ip))) {
      return { ok: true, method: "a-record" };
    }
  }

  // 3. Legacy-TXT-Token
  const records = await safeResolve(() =>
    dns.resolveTxt(`_trichterwerk-verify.${hostname}`),
  );
  if (records?.length) {
    sawAnyRecord = true;
    const flat = records.map((parts) => parts.join("").trim());
    if (flat.includes(verificationToken)) {
      return { ok: true, method: "txt" };
    }
  }

  return { ok: false, reason: sawAnyRecord ? "wrong-target" : "nxdomain" };
}
