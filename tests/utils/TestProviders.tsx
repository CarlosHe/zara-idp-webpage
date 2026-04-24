import { configureStore, type Middleware } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import type { ReactElement, ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { baseApi } from '@/shared/lib/api';
import resourcesReducer from '@/features/resources/store/resourcesSlice';
import approvalsReducer from '@/features/approvals/store/approvalsSlice';
import { themeReducer } from '@/features/theme';
import { Toaster } from '@/shared/components/ui';

// Factory: every test gets a fresh store so the RTK Query cache, the
// feature slices and any thunks start empty. Sharing would bleed state
// across specs — particularly the baseApi cache, which caches by serial
// arg + headers and is hostile to test isolation.
export function createTestStore() {
  return configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      resources: resourcesReducer,
      approvals: approvalsReducer,
      theme: themeReducer,
    },
    middleware: (getDefault) =>
      getDefault({ serializableCheck: false }).concat(
        baseApi.middleware as Middleware,
      ),
  });
}

export type TestStore = ReturnType<typeof createTestStore>;

export interface TestProvidersOptions {
  store?: TestStore;
  route?: string;
  withToaster?: boolean;
}

export function TestProviders({
  children,
  store,
  route = '/',
  withToaster = false,
}: { children: ReactNode } & TestProvidersOptions) {
  const effectiveStore = store ?? createTestStore();
  setupListeners(effectiveStore.dispatch);
  return (
    <ReduxProvider store={effectiveStore}>
      <MemoryRouter initialEntries={[route]}>
        {children}
        {withToaster ? <Toaster /> : null}
      </MemoryRouter>
    </ReduxProvider>
  );
}

interface RenderWithProvidersResult extends RenderResult {
  store: TestStore;
  user: ReturnType<typeof userEvent.setup>;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    store,
    route,
    withToaster,
    ...renderOptions
  }: TestProvidersOptions & Omit<RenderOptions, 'wrapper'> = {},
): RenderWithProvidersResult {
  const effectiveStore = store ?? createTestStore();
  const user = userEvent.setup();

  const wrapper = ({ children }: { children: ReactNode }) => (
    <TestProviders store={effectiveStore} route={route} withToaster={withToaster}>
      {children}
    </TestProviders>
  );

  const result = render(ui, { wrapper, ...renderOptions });
  return { ...result, store: effectiveStore, user };
}
