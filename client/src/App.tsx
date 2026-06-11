import { Switch, Route, useLocation } from "wouter";
import { lazy, Suspense, useEffect } from "react";
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
import AGB from "@/pages/agb";
import AVV from "@/pages/avv";
import { CookieConsent } from "@/components/cookie-consent";

// Lazy-loaded pages for code-splitting
const Dashboard = lazy(() => import("@/pages/dashboard"));
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

// Vollbild-Seite (ohne Sidebar) hinter Auth + Lazy-Suspense.
function ProtectedFull({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </RequireAuth>
  );
}

// Seite mit Sidebar (geschützt) + Lazy-Suspense.
function SidebarPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedMainLayout>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </ProtectedMainLayout>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Deklaratives Routing. Reihenfolge in <Switch> ist relevant: spezifischere
  // Pfade (z. B. /funnels/new) müssen vor Parameter-Routen (/funnels/:id) stehen.
  return (
    <Switch>
      {/* Öffentliche Funnel-Ansicht (ohne Auth) */}
      <Route path="/f/:uuid">
        <Suspense fallback={<PageLoader />}>
          <PublicFunnelView />
        </Suspense>
      </Route>

      {/* Owner-Vorschau (mit Auth, zeigt auch Entwürfe) */}
      <Route path="/preview/:id">
        <ProtectedFull>
          <PublicFunnelView />
        </ProtectedFull>
      </Route>

      {/* Auth-Seiten (ohne Sidebar) */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/verify-email" component={VerifyEmail} />

      {/* Rechtliche Seiten (ohne Sidebar, ohne Auth) */}
      <Route path="/impressum" component={Impressum} />
      <Route path="/datenschutz" component={Datenschutz} />
      <Route path="/agb" component={AGB} />
      <Route path="/avv" component={AVV} />
      <Route path="/nutzungsbedingungen" component={AGB} />

      {/* Admin (geschützt, ohne Sidebar) */}
      <Route path="/admin">
        <ProtectedFull>
          <Admin />
        </ProtectedFull>
      </Route>

      {/* Vollbild-Funnel-Seiten ohne Sidebar — spezifisch vor :id */}
      <Route path="/funnels/new">
        <ProtectedFull>
          <NewFunnel />
        </ProtectedFull>
      </Route>
      <Route path="/funnels/:id/metrics">
        <ProtectedFull>
          <FunnelMetrics />
        </ProtectedFull>
      </Route>
      <Route path="/funnels/:id">
        <ProtectedFull>
          <FunnelEditor />
        </ProtectedFull>
      </Route>

      {/* Startseite: Landing für Gäste, sonst Funnel-Liste mit Sidebar */}
      <Route path="/">
        {isAuthenticated ? (
          <SidebarPage>
            <Funnels />
          </SidebarPage>
        ) : (
          <Landing />
        )}
      </Route>

      {/* Seiten mit Sidebar (geschützt) */}
      <Route path="/funnels">
        <SidebarPage>
          <Funnels />
        </SidebarPage>
      </Route>
      {/* Echte Dashboard-Seite (Onboarding-Checkliste, Trial-Hinweis) —
          rendert NICHT mehr fälschlich die Funnel-Liste */}
      <Route path="/dashboard">
        <SidebarPage>
          <Dashboard />
        </SidebarPage>
      </Route>
      <Route path="/leads">
        <SidebarPage>
          <Leads />
        </SidebarPage>
      </Route>
      <Route path="/analytics">
        <SidebarPage>
          <Analytics />
        </SidebarPage>
      </Route>
      <Route path="/settings">
        <SidebarPage>
          <Settings />
        </SidebarPage>
      </Route>

      {/* 404 */}
      <Route>
        <SidebarPage>
          <NotFound />
        </SidebarPage>
      </Route>
    </Switch>
  );
}

// Routen, auf denen anonyme Besucher landen können → hier ist der Cookie-Banner
// DSGVO-relevant. Im eingeloggten Backend/Editor blockiert er nur und wird daher
// nicht gerendert.
function isPublicRoute(location: string, isAuthenticated: boolean): boolean {
  if (location.startsWith("/f/")) return true; // öffentliche Funnel-Ansicht
  if (location.startsWith("/preview/")) return false; // Owner-Vorschau (eingeloggt)
  const publicExact = [
    "/login",
    "/register",
    "/forgot-password",
    "/impressum",
    "/datenschutz",
    "/agb",
    "/nutzungsbedingungen",
  ];
  if (publicExact.includes(location)) return true;
  if (location.startsWith("/reset-password")) return true;
  if (location.startsWith("/verify-email")) return true;
  if (location === "/" && !isAuthenticated) return true; // Landing
  return false;
}

// Kanonische App-Hosts — alle anderen werden als Custom-Domain behandelt.
const CANONICAL_HOSTS = new Set([
  "trichterwerk.de",
  "www.trichterwerk.de",
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
]);

/**
 * Wenn die App unter einer Custom-Domain (CNAME) aufgerufen wird, fragen wir
 * beim Server, welcher Funnel zu diesem Host gehört, und routen direkt auf
 * `/f/<uuid>`. Greift nur einmal pro Mount.
 */
function useCustomDomainResolver() {
  const [location, setLocation] = useLocation();
  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname.toLowerCase();
    if (CANONICAL_HOSTS.has(host)) return;
    // Bereits auf einer Funnel-Route → nichts tun.
    if (location.startsWith("/f/") || location.startsWith("/preview/")) return;
    let cancelled = false;
    fetch(`/api/public/funnel-by-host?host=${encodeURIComponent(host)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.uuid) {
          setLocation(`/f/${data.slug || data.uuid}`);
        }
      })
      .catch(() => {
        // Schweigen — Fallback ist die normale Landing/Route.
      });
    return () => {
      cancelled = true;
    };
  }, [location, setLocation]);
}

function AppShell() {
  // Globale Bremse gegen hängengebliebene Radix-Body-Locks
  // (pointer-events:none / overflow:hidden / data-scroll-locked).
  useGlobalBodyLockGuard();
  useCustomDomainResolver();
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const showCookieConsent = isPublicRoute(location, isAuthenticated);

  return (
    <ErrorBoundary fallbackTitle="Ein unerwarteter Fehler ist aufgetreten">
      <Toaster />
      <GlobalErrorHandler />
      <Router />
      {/* Globale Blocking-Guards: zeigen sich selbst nur, wenn User betroffen */}
      <UpgradeBanner variant="payment-required" />
      <UpgradeBanner variant="expired" />
      {/* Cookie-Banner nur auf öffentlichen Seiten — blockiert sonst den App-Bereich */}
      {showCookieConsent && <CookieConsent />}
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
