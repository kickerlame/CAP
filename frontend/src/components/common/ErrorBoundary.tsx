import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '../ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React component tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-vppt-crimson/15 border border-vppt-crimson/40 flex items-center justify-center text-vppt-crimson mb-6 shadow-inner">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-cinzel font-semibold text-vppt-ivory tracking-wide uppercase mb-2">
            An Unexpected Error Occurred
          </h2>

          <p className="text-xs text-vppt-ash max-w-md leading-relaxed mb-6">
            Something went wrong while rendering this section. You can try refreshing the view, retrying the operation, or returning to the dashboard.
          </p>

          {this.state.error?.message && (
            <div className="mb-6 p-3 rounded bg-vppt-surface border border-vppt-border text-[11px] font-mono text-vppt-crimson/80 max-w-lg text-left overflow-x-auto">
              {this.state.error.message}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="outline" size="sm" onClick={this.handleReset}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Try Again
            </Button>
            <Button variant="outline" size="sm" onClick={this.handleReload}>
              Reload Page
            </Button>
            <Button variant="gold" size="sm" onClick={this.handleGoHome}>
              <Home className="w-3.5 h-3.5 mr-1.5" />
              Return to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
