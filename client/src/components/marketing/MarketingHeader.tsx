import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { TEMPLATE_GALLERY_PATH } from "@shared/seo-links";

/**
 * Fixierter Header für alle öffentlichen Marketing-Seiten (Landing, Vergleiche,
 * Funnel-Builder-Guide). Auf der Landing bleiben die Anker reine Fragmente
 * (natives Scrollen, Query-Parameter wie UTM bleiben erhalten); von Unterseiten
 * aus wird die Landing samt Anker geladen. Eingeloggte Nutzer sehen statt der
 * Login-/Trial-CTAs einen Dashboard-Link.
 */
export function MarketingHeader() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const anchor = (id: string) => (location === "/" ? `#${id}` : `/#${id}`);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/images/logo-icon.webp"
            alt="Trichterwerk Logo"
            className="h-9 w-9 rounded-lg"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling?.classList.remove("hidden");
            }}
          />
          <div className="hidden flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold">Trichterwerk</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <a href={anchor("features")} className="text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <Link href={TEMPLATE_GALLERY_PATH} className="text-muted-foreground hover:text-foreground transition-colors">
            Templates
          </Link>
          <a href={anchor("pricing")} className="text-muted-foreground hover:text-foreground transition-colors">
            Preise
          </a>
          <a href={anchor("faq")} className="text-muted-foreground hover:text-foreground transition-colors">
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link href="/funnels">
              <Button>Zum Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Anmelden</Button>
              </Link>
              <Link href="/register">
                <Button>14 Tage testen</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
