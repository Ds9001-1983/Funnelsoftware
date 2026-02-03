import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Erstellt einen neuen QueryClient für Tests.
 * Deaktiviert Retries und Refetch-Verhalten für deterministische Tests.
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface AllProvidersProps {
  children: React.ReactNode;
}

/**
 * Wrapper-Komponente mit allen notwendigen Providern für Tests.
 */
function AllProviders({ children }: AllProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

/**
 * Custom render-Funktion, die alle Provider einschließt.
 * Verwende diese Funktion anstelle von `render` aus @testing-library/react.
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export alles von @testing-library/react
export * from "@testing-library/react";
export { userEvent } from "@testing-library/user-event";

// Override render mit custom render
export { customRender as render };
