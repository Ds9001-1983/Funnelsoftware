import { Link, useLocation } from "wouter";
import { Zap, Settings, LogOut, Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { label: "Funnels", href: "/funnels" },
  { label: "Analytics", href: "/analytics" },
  { label: "Leads", href: "/leads" },
  { label: "Kundenbereiche", href: "/workspaces" },
];

export function TopNavigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-screen-2xl mx-auto px-4 min-h-14 flex flex-wrap items-center justify-between gap-x-4">
        {/* Left: Logo */}
        <Link href="/funnels" className="flex items-center gap-2 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg hidden sm:block">Trichterwerk</span>
        </Link>

        {/* Center: Navigation */}
        <nav aria-label="Hauptnavigation" className="order-last sm:order-none w-full sm:w-auto flex items-center gap-1 overflow-x-auto py-1">
          {navItems.map((item) => {
            const isActive =
              location === item.href || location.startsWith(`${item.href}/`) ||
              (item.href === "/funnels" && location === "/");
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </button>
              </Link>
            );
          })}
        </nav>

        {/* Right: New Funnel + User */}
        <div className="flex items-center gap-3 shrink-0 py-2">
          {/* Einziger „Neuer Funnel"-Einstieg der App: Dashboard und Funnel-Liste
              hatten den Button zusätzlich im Seitenkopf — direkt unterhalb von
              diesem hier, was doppelt wirkte. Leere Listen führen weiter über
              ihren eigenen Empty-State-CTA zum Anlegen. */}
          <Link href="/funnels/new">
            <Button size="sm" className="gap-1.5 hidden sm:flex" data-testid="button-new-funnel">
              <Plus className="h-3.5 w-3.5" />
              Neuer Funnel
            </Button>
            <Button size="icon" className="sm:hidden h-8 w-8" data-testid="button-new-funnel-mobile" aria-label="Neuer Funnel">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-bold">
                  {user?.displayName?.[0] || user?.username?.[0] || "U"}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <p className="font-medium text-sm">{user?.displayName || user?.username}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" />
                  Einstellungen
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={() => logout()}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Abmelden
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
