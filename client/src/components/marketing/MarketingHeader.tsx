import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Zap } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { TEMPLATE_GALLERY_PATH } from "@shared/seo-links";

export function MarketingHeader() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const anchor = (id: string) => (location === "/" ? `#${id}` : `/#${id}`);
  const links = [
    { href: anchor("features"), label: "Funktionen" },
    { href: TEMPLATE_GALLERY_PATH, label: "Vorlagen" },
    { href: anchor("pricing"), label: "Preise" },
    { href: anchor("faq"), label: "FAQ" },
  ];
  useEffect(() => { setMenuOpen(false); }, [location]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/95 backdrop-blur-md" data-testid="marketing-header">
    <div className="container mx-auto flex h-16 items-center justify-between gap-2 px-3 sm:px-6">
      <Link href="/" aria-label="Trichterwerk Startseite" className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <img src="/images/logo-icon.webp" alt="" width={32} height={32} className="h-6 w-6 rounded-md sm:h-8 sm:w-8" onError={event => { event.currentTarget.style.display = "none"; event.currentTarget.nextElementSibling?.classList.remove("hidden"); }} />
        <span className="hidden rounded-md bg-primary p-1 text-primary-foreground"><Zap className="h-4 w-4" /></span>
        <span className="text-sm font-bold sm:text-xl">Trichterwerk</span>
      </Link>
      <nav aria-label="Hauptnavigation" className="hidden items-center gap-6 lg:flex">
        {links.map(link => {
          const NavLink = link.href.includes("#") ? "a" : Link;
          return <NavLink key={link.label} href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{link.label}</NavLink>;
        })}
      </nav>
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        {!isAuthenticated && <Button variant="ghost" asChild className="hidden lg:inline-flex"><Link href="/login">Anmelden</Link></Button>}
        <Button asChild className="min-h-10 px-2 text-xs sm:px-4 sm:text-sm"><Link href={isAuthenticated ? "/funnels" : "/register"}>{isAuthenticated ? "Zum Dashboard" : "Kostenlos starten"}</Link></Button>
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild><Button variant="ghost" className="h-11 w-10 p-0 lg:hidden" aria-label="Menü öffnen"><Menu className="h-5 w-5" /></Button></SheetTrigger>
          <SheetContent className="w-[min(90vw,360px)]" onKeyDown={event => { if (event.key === "Escape") setMenuOpen(false); }}>
            <SheetHeader className="text-left"><SheetTitle>Trichterwerk</SheetTitle><SheetDescription>Dein nächster Schritt zum eigenen Funnel.</SheetDescription></SheetHeader>
            <nav aria-label="Mobile Navigation" className="mt-6 flex flex-col gap-2">
              {links.map(link => {
                const NavLink = link.href.includes("#") ? "a" : Link;
                return <SheetClose key={link.label} asChild><NavLink href={link.href} className="rounded-md px-3 py-3 font-medium hover:bg-muted">{link.label}</NavLink></SheetClose>;
              })}
              {!isAuthenticated && <SheetClose asChild><Link href="/login" className="mt-2 border-t px-3 py-3">Anmelden</Link></SheetClose>}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  </header>;
}
