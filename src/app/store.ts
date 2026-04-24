import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from '@/shared/lib/api';
import resourcesReducer from '@/features/resources/store/resourcesSlice';
import approvalsReducer from '@/features/approvals/store/approvalsSlice';
import { themeReducer } from '@/features/theme';

// Single RTK Query slice + the feature slices that still own UI state
// (filters, table selection, user preferences). Every other "slice" from
// the pre-Sprint-7 world was server state and now lives in the RTK Query
// cache under `baseApi.reducerPath`. `theme` (Sprint 8) persists to
// localStorage via `useThemeEffect`.
export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    resources: resourcesReducer,
    approvals: approvalsReducer,
    theme: themeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(baseApi.middleware),
});

// Enables `refetchOnFocus` / `refetchOnReconnect` behaviours. Required
// any time the store is used outside of a Provider-less SSR context.
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
