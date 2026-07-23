/**
 * Läuft die App gerade unter einem unserer eigenen Hosts — oder unter der
 * Domain eines Kunden?
 *
 * Veröffentlichte Funnels sind über CNAME unter eigenen Domains erreichbar.
 * Dort ist die App zwar dieselbe Anwendung, der Besucher aber ein Besucher des
 * KUNDEN. Unser eigenes Tracking (Reichweiten-Beacon und Meta-Pixel) hat auf
 * fremden Domains nichts zu suchen.
 *
 * Der Routen-Ausschluss allein reicht dafür nicht: Auf einer Custom-Domain
 * bootet die App unter "/" und wird erst nach der Host-Auflösung nach "/f/…"
 * umgeleitet. In diesem Fenster sieht "/" wie unsere eigene Landingpage aus.
 */
export const CANONICAL_HOSTS = new Set([
  "trichterwerk.de",
  "www.trichterwerk.de",
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
]);

/** True, wenn die Seite unter einem kanonischen Trichterwerk-Host läuft. */
export function isPlatformHost(hostname?: string): boolean {
  const host = (
    hostname ?? (typeof window === "undefined" ? "" : window.location.hostname)
  )
    .toLowerCase()
    .trim();
  return CANONICAL_HOSTS.has(host);
}
