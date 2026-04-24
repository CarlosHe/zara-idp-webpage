import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorFallback } from '@/shared/components/ui';
import { AppError } from '@/shared/errors';
import { logErrorToService } from '@/shared/lib/observability';

interface ErrorBoundaryProps {
  children: ReactNode;
  // Optional renderer that receives the captured AppError + a reset fn so
  // the caller can show a bespoke fallback (a page 500 layout, an inline
  // banner, etc.). When omitted, we fall back to the shared ErrorFallback
  // primitive so 99% of features get "good enough" for free.
  fallback?: (error: AppError, reset: () => void) => ReactNode;
  // Hook for tests + composition: invoked with the raw error + info the
  // moment componentDidCatch fires. Default impl calls logErrorToService.
  onError?: (error: Error, info: ErrorInfo) => void;
  // Identifier used for Sentry scope / telemetry. Two boundaries on the
  // same page (e.g. app-root + a widget) distinguish themselves via this
  // tag so we can spot which one tripped.
  boundaryName?: string;
}

interface ErrorBoundaryState {
  error: AppError | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: AppError.from(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    const { onError, boundaryName } = this.props;
    if (onError) {
      onError(error, info);
      return;
    }
    logErrorToService(error, {
      boundary: boundaryName ?? 'root',
      componentStack: info.componentStack,
    });
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) return this.props.fallback(error, this.reset);

    return (
      <ErrorFallback
        error={error}
        onRetry={this.reset}
        description="The page above hit an error and has been isolated so the rest of the app keeps running."
      />
    );
  }
}
