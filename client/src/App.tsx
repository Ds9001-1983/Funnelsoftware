import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider, RequireAuth, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Funnels from "@/pages/funnels";
import NewFunnel from "@/pages/new-funnel";
import FunnelEditor from "@/pages/funnel-editor";
import Leads from "@/pages/leads";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Admin from "@/pages/admin";

function MainLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-2 p-2 border-b border-border bg-background shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function ProtectedMainLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <MainLayout>{children}</MainLayout>
    </RequireAuth>
  );
}

function Router() {
  const [location] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Landing page for non-authenticated users
  if (location === "/" && !isAuthenticated) {
    return <Landing />;
  }

  // Auth pages (no sidebar)
  if (location === "/login") {
    return <Login />;
  }
  if (location === "/register") {
    return <Register />;
  }

  // Admin page (has its own auth)
  if (location === "/admin") {
    return <Admin />;
  }

  // Full-screen pages without sidebar (but protected)
  if (location.startsWith("/funnels/new") || (location.startsWith("/funnels/") && location !== "/funnels")) {
    const isEditor = location.startsWith("/funnels/") && !location.includes("/new");
    if (isEditor) {
      return (
        <RequireAuth>
          <FunnelEditor />
        </RequireAuth>
      );
    }
    return (
      <RequireAuth>
        <NewFunnel />
      </RequireAuth>
    );
  }

  return (
    <ProtectedMainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/funnels" component={Funnels} />
        <Route path="/leads" component={Leads} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </ProtectedMainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="trichterwerk-theme">
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
