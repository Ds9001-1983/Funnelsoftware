import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  isAutoReloadPending,
  isChunkLoadError,
  tryRecoverFromChunkError,
} from "@/lib/chunk-reload";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  isChunkError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      isChunkError: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Auch "Auto-Reload läuft bereits" als Chunk-Fall behandeln: Nach
    // preventDefault() im vite:preloadError-Handler resolvet der Import mit
    // undefined und React wirft kurz vor dem Reload einen Folgefehler, der
    // die Chunk-Patterns nicht matcht — kein echter App-Bug.
    const isChunkError = isChunkLoadError(error) || isAutoReloadPending();
    return { hasError: true, error, isChunkError };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
    this.setState({ errorInfo });

    // Fehlgeschlagener Chunk-Import = veralteter Tab nach einem Deploy.
    // React.lazy cached die Rejection dauerhaft, ein State-Reset kann das
    // nie heilen — nur ein voller Reload holt den frischen Build. Greift
    // der Guard (frisch neu geladen / offline), bleibt die Chunk-Fallback-UI
    // mit manuellem Reload-Button stehen.
    if (isChunkLoadError(error)) {
      tryRecoverFromChunkError();
    }
  }

  handleRetry = (): void => {
    // Bei Chunk-Fehlern wäre ein State-Reset eine Sackgasse (s. o.) — hier
    // hilft nur der echte Reload. Der explizite Klick darf den Guard umgehen.
    if (this.state.isChunkError) {
      window.location.reload();
      return;
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails, isChunkError } = this.state;
      const title = isChunkError
        ? "Neue Version verfügbar"
        : this.props.fallbackTitle || "Etwas ist schiefgelaufen";
      const description = isChunkError
        ? "Trichterwerk wurde gerade aktualisiert. Bitte lade die Seite neu, um die neue Version zu verwenden."
        : "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut oder lade die Seite neu.";
      const buttonLabel = isChunkError ? "Seite neu laden" : "Erneut versuchen";

      return (
        <div className="flex items-center justify-center min-h-[300px] p-6">
          <Card className="w-full max-w-lg border-destructive/50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="rounded-full bg-destructive/10 p-3">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>

                <Button onClick={this.handleRetry} variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  {buttonLabel}
                </Button>

                {error && (
                  <div className="w-full">
                    <button
                      onClick={() => this.setState({ showDetails: !showDetails })}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showDetails ? "Details ausblenden" : "Fehler-Details anzeigen"}
                    </button>

                    {showDetails && (
                      <div className="mt-2 rounded-md bg-muted p-3 text-left">
                        <p className="text-xs font-mono text-destructive break-all">
                          {error.message}
                        </p>
                        {errorInfo?.componentStack && (
                          <pre className="mt-2 text-xs font-mono text-muted-foreground overflow-auto max-h-32">
                            {errorInfo.componentStack}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
