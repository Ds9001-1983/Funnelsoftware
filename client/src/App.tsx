import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Funnels from "@/pages/funnels";
import NewFunnel from "@/pages/new-funnel";
import FunnelEditor from "@/pages/funnel-editor";
import Leads from "@/pages/leads";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";

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

function Router() {
  const [location] = useLocation();
  
  // Full-screen pages without sidebar
  if (location.startsWith("/funnels/new") || (location.startsWith("/funnels/") && location !== "/funnels")) {
    const isEditor = location.startsWith("/funnels/") && !location.includes("/new");
    if (isEditor) {
      return <FunnelEditor />;
    }
    return <NewFunnel />;
  }

  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/funnels" component={Funnels} />
        <Route path="/leads" component={Leads} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="funnelflow-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
