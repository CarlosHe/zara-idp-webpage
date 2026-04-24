import { Provider as ReduxProvider } from 'react-redux';
import type { ReactNode } from 'react';
import { Toaster } from '@/shared/components/ui';
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

// AppProviders is the single place where global providers (Redux, theme
// side-effects, toasts, future ErrorBoundary) are composed. Keeping them
// in one file means the composition order (outer → inner) is visible at
// a glance.
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ReduxProvider store={store}>
      <ThemeBridge>
        {children}
        <Toaster />
      </ThemeBridge>
    </ReduxProvider>
  );
}
