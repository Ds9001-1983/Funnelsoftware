import { Switch, Route, useLocation } from "wouter";
import { lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { TopNavigation } from "@/components/top-navigation";
import { EmailVerificationBanner } from "@/components/email-verification-banner";
import { GlobalErrorHandler } from "@/components/global-error-handler";
import { UpgradeBanner } from "@/components/upgrade-banner";
import { AuthProvider, RequireAuth, useAuth } from "@/hooks/use-auth";
import { ErrorBoundary } from "@/components/funnel-editor/ErrorBoundary";
import { useGlobalBodyLockGuard } from "@/hooks/use-ensure-body-unlocked";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Funnels from "@/pages/funnels";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import VerifyEmail from "@/pages/verify-email";
import Impressum from "@/pages/impressum";
import Datenschutz from "@/pages/datenschutz";
import { CookieConsent } from "@/components/cookie-consent";

// Lazy-loaded pages for code-splitting
const NewFunnel = lazy(() => import("@/pages/new-funnel"));
const FunnelEditor = lazy(() => import("@/pages/funnel-editor"));
const FunnelMetrics = lazy(() => import("@/pages/funnel-metrics"));
const Leads = lazy(() => import("@/pages/leads"));
const Analytics = lazy(() => import("@/pages/analytics"));
const Settings = lazy(() => import("@/pages/settings"));
const Admin = lazy(() => import("@/pages/admin"));
const PublicFunnelView = lazy(() => import("@/pages/public-funnel"));

// Loading spinner component for Suspense fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen w-full">
      <TopNavigation />
      <main className="flex-1 overflow-auto">
        <EmailVerificationBanner />
        {children}
      </main>
    </div>
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

  // Public funnel view (no auth required)
  if (location.startsWith("/f/")) {
    return (
      <Suspense fallback={<PageLoader />}>
        <PublicFunnelView />
      </Suspense>
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
  if (location === "/forgot-password") {
    return <ForgotPassword />;
  }
  if (location.startsWith("/reset-password")) {
    return <ResetPassword />;
  }
  if (location.startsWith("/verify-email")) {
    return <VerifyEmail />;
  }

  // Admin page (protected)
  if (location === "/admin") {
    return (
      <RequireAuth>
        <Suspense fallback={<PageLoader />}>
          <Admin />
        </Suspense>
      </RequireAuth>
    );
  }
  // Legal pages (no sidebar, no auth required)
  if (location === "/impressum") {
    return <Impressum />;
  }
  if (location === "/datenschutz") {
    return <Datenschutz />;
  }

  // Full-screen pages without sidebar (but protected)
  if (location.startsWith("/funnels/new") || (location.startsWith("/funnels/") && location !== "/funnels")) {
    // Metrics page for a specific funnel
    if (location.match(/^\/funnels\/\d+\/metrics/)) {
      return (
        <RequireAuth>
          <Suspense fallback={<PageLoader />}>
            <FunnelMetrics />
          </Suspense>
        </RequireAuth>
      );
    }
    const isEditor = location.startsWith("/funnels/") && !location.includes("/new") && !location.includes("/metrics");
    if (isEditor) {
      return (
        <RequireAuth>
          <Suspense fallback={<PageLoader />}>
            <FunnelEditor />
          </Suspense>
        </RequireAuth>
      );
    }
    return (
      <RequireAuth>
        <Suspense fallback={<PageLoader />}>
          <NewFunnel />
        </Suspense>
      </RequireAuth>
    );
  }

  return (
    <ProtectedMainLayout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={Funnels} />
          <Route path="/funnels" component={Funnels} />
          <Route path="/dashboard" component={Funnels} />
          <Route path="/leads" component={Leads} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </ProtectedMainLayout>
  );
}

function AppShell() {
  // Globale Bremse gegen hängengebliebene Radix-Body-Locks
  // (pointer-events:none / overflow:hidden / data-scroll-locked).
  useGlobalBodyLockGuard();

  return (
    <ErrorBoundary fallbackTitle="Ein unerwarteter Fehler ist aufgetreten">
      <Toaster />
      <GlobalErrorHandler />
      <Router />
      {/* Globale Blocking-Guards: zeigen sich selbst nur, wenn User betroffen */}
      <UpgradeBanner variant="payment-required" />
      <UpgradeBanner variant="expired" />
      <CookieConsent />
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="trichterwerk-theme">
        <TooltipProvider>
          <AuthProvider>
            <AppShell />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
