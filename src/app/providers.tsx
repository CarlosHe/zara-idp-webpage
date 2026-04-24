import { Provider as ReduxProvider } from 'react-redux';
import type { ReactNode } from 'react';
import { Toaster } from '@/shared/components/ui';
import { ErrorBoundary } from '@/shared/components/feedback';
import { useThemeEffect } from '@/features/theme';
import { store } from './store';

interface AppProvidersProps {
  children: ReactNode;
}

// ThemeBridge has to live inside the Redux provider so `useThemeEffect`
// can observe the `theme` slice and keep the <html> class + localStorage
// in sync with `prefers-color-scheme` changes.
function ThemeBridge({ children }: { children: ReactNode }) {
  useThemeEffect();
  return <>{children}</>;
}

// AppProviders composes every global provider in one place. The outer
// ErrorBoundary (boundaryName="root") is the last line of defence: any
// render error that escapes the router-level `errorElement` lands here.
// `logErrorToService` flushes to Sentry when a DSN is configured.
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary boundaryName="root">
      <ReduxProvider store={store}>
        <ThemeBridge>
          {children}
          <Toaster />
        </ThemeBridge>
      </ReduxProvider>
    </ErrorBoundary>
  );
}
