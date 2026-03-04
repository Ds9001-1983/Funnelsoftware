import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails } = this.state;
      const title = this.props.fallbackTitle || "Etwas ist schiefgelaufen";

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
                  <p className="text-sm text-muted-foreground">
                    Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es
                    erneut oder lade die Seite neu.
                  </p>
                </div>

                <Button onClick={this.handleRetry} variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Erneut versuchen
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
