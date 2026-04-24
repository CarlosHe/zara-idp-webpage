import { forwardRef, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/shared/utils';
import { Button } from './Button';

interface ErrorFallbackProps {
  error?: Error | string;
  title?: ReactNode;
  description?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

const ErrorFallback = forwardRef<HTMLDivElement, ErrorFallbackProps>(
  (
    {
      error,
      title = 'Something went wrong',
      description,
      onRetry,
      retryLabel = 'Try again',
      className,
    },
    ref,
  ) => {
    const message =
      typeof error === 'string'
        ? error
        : error instanceof Error
          ? error.message
          : undefined;

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-6 text-center',
          className,
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-6 w-6 text-red-400" aria-hidden />
        </div>
        <h3 className="text-base font-semibold text-slate-100">{title}</h3>
        {description ? (
          <p className="max-w-md text-sm text-slate-400">{description}</p>
        ) : null}
        {message ? (
          <pre className="max-w-lg overflow-auto rounded-md bg-slate-900/60 p-3 text-left text-xs text-red-200">
            {message}
          </pre>
        ) : null}
        {onRetry ? (
          <Button variant="secondary" onClick={onRetry} className="mt-2">
            <RefreshCw className="h-4 w-4" aria-hidden />
            {retryLabel}
          </Button>
        ) : null}
      </div>
    );
  },
);
ErrorFallback.displayName = 'ErrorFallback';

export { ErrorFallback };
export type { ErrorFallbackProps };
