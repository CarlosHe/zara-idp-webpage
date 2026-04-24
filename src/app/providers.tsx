import { Provider as ReduxProvider } from 'react-redux';
import type { ReactNode } from 'react';
import { store } from './store';

interface AppProvidersProps {
  children: ReactNode;
}

// AppProviders is the single place where global providers (Redux,
// future ErrorBoundary, theme, toast) are composed. Keeping them in
// one file means the composition order (outer → inner) is always
// visible at a glance.
export function AppProviders({ children }: AppProvidersProps) {
  return <ReduxProvider store={store}>{children}</ReduxProvider>;
}
