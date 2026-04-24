import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from '@/shared/lib/api';
import resourcesReducer from '@/features/resources/store/resourcesSlice';
import approvalsReducer from '@/features/approvals/store/approvalsSlice';

// Single RTK Query slice + the two feature slices that still own UI
// state (filters, table selection). Every other "slice" from the
// pre-Sprint-7 world was server state and now lives in the RTK Query
// cache under `baseApi.reducerPath`.
export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    resources: resourcesReducer,
    approvals: approvalsReducer,
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
