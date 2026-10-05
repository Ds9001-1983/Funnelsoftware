import { Link } from "wouter";
import type { ReactNode } from "react";
import { Zap, Mail, Cookie, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { resetCookieConsent } from "@/components/cookie-consent";
import { audiencePages, comparisonLinks, funnelBuilderPage, TEMPLATE_GALLERY_PATH } from "@shared/seo-links";

function FooterLinkGroup({ title, children }: { title: string; children: ReactNode }) {
  return <Collapsible className="col-span-2 border-b md:col-span-1 md:border-0">
    <h4 className="hidden font-semibold md:mb-4 md:block">{title}</h4>
    <CollapsibleTrigger className="group flex min-h-12 w-full items-center justify-between rounded-sm text-left font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden">
      {title}<ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
    </CollapsibleTrigger>
    {/* One copy of the links: hidden when collapsed on mobile, always visible on desktop. */}
    <CollapsibleContent forceMount className="pb-4 data-[state=closed]:hidden md:pb-0 md:data-[state=closed]:block">
      {children}
    </CollapsibleContent>
  </Collapsible>;
}

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
        <div className="mb-8 grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-5 md:gap-8 [&_li>a]:flex [&_li>a]:min-h-11 [&_li>a]:items-center [&_li>button]:min-h-11 md:[&_li>a]:min-h-0 md:[&_li>button]:min-h-0">
          <div className="col-span-2 mb-2 md:col-span-1 md:mb-0">
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
              Der deutsche Funnel-Builder für Kundenanfragen und Bewerbungen.
            </p>
          </div>
          <FooterLinkGroup title="Produkt">
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
          </FooterLinkGroup>
          <FooterLinkGroup title="Vergleiche">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href={funnelBuilderPage.path} className="hover:text-foreground">
                  Funnel-Builder
                </Link>
              </li>
              {/* Bei inzwischen 8 Vergleichsseiten: Top 3 + Link auf die Übersicht,
                  sonst bläht der Footer auf. Die Registry bleibt vollständig
                  (Konsistenztest), nur die UI kürzt. */}
              {comparisonLinks.slice(0, 3).map((link) => (
                <li key={link.path}>
                  <Link href={link.path} className="hover:text-foreground">
                    {link.competitor}-Alternative
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/vergleich" className="hover:text-foreground">
                  Alle Vergleiche
                </Link>
              </li>
            </ul>
          </FooterLinkGroup>
          <div>
            <h4 className="font-semibold mb-4">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/register" className="hover:text-foreground">Kostenlos starten</Link></li>
              <li><Link href="/login" className="hover:text-foreground">Anmelden</Link></li>
              <li>
                <Link href="/kontakt" className="hover:text-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
                  Kontakt
                </Link>
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
                  className="hover:text-foreground flex items-center gap-1 text-left"
                >
                  <Cookie className="h-3 w-3 shrink-0" aria-hidden="true" />
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
