import { Link } from "wouter";
import { Zap, Mail, Cookie } from "lucide-react";
import { resetCookieConsent } from "@/components/cookie-consent";
import { CONTACT_EMAIL } from "./constants";
import { audiencePages, comparisonLinks, funnelBuilderPage, TEMPLATE_GALLERY_PATH } from "@shared/seo-links";

/**
 * Footer für alle öffentlichen Marketing-Seiten. Die „Vergleiche"-Spalte ist das
 * interne Link-Rückgrat der SEO-Seiten — gespeist aus dem leichten
 * shared/seo-links.ts (NICHT aus der großen Content-Registry, die bleibt im
 * Lazy-Chunk der Vergleichsseiten).
 */
export function MarketingFooter() {
  return (
    <footer className="py-12 px-4 border-t">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-5 gap-8 mb-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img
                src="/images/logo-icon.webp"
                alt="Trichterwerk Logo"
                className="h-8 w-8 rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove("hidden");
                }}
              />
              <div className="hidden flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Zap className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold">Trichterwerk</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Der deutsche Funnel-Builder für Coaches, Berater und Agenturen.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Produkt</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/#features" className="hover:text-foreground">Features</a></li>
              <li><Link href={TEMPLATE_GALLERY_PATH} className="hover:text-foreground">Vorlagen</Link></li>
              {audiencePages.map((p) => (
                <li key={p.path}>
                  <Link href={p.path} className="hover:text-foreground">{p.label}</Link>
                </li>
              ))}
              <li><a href="/#pricing" className="hover:text-foreground">Preise</a></li>
              <li><a href="/#faq" className="hover:text-foreground">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Vergleiche</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href={funnelBuilderPage.path} className="hover:text-foreground">
                  Funnel-Builder
                </Link>
              </li>
              {comparisonLinks.map((link) => (
                <li key={link.path}>
                  <Link href={link.path} className="hover:text-foreground">
                    {link.competitor}-Alternative
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/register" className="hover:text-foreground">Kostenlos testen</Link></li>
              <li><Link href="/login" className="hover:text-foreground">Anmelden</Link></li>
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Kontakt
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Rechtliches</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/impressum" className="hover:text-foreground">Impressum</Link></li>
              <li><Link href="/datenschutz" className="hover:text-foreground">Datenschutz</Link></li>
              <li><Link href="/agb" className="hover:text-foreground">AGB</Link></li>
              <li>
                <button
                  onClick={resetCookieConsent}
                  className="hover:text-foreground flex items-center gap-1"
                >
                  <Cookie className="h-3 w-3" />
                  Cookie-Einstellungen
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Trichterwerk · Ein Produkt von{" "}
            <a
              href="https://superbrand.marketing"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground underline"
            >
              SUPERBRAND.marketing
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
