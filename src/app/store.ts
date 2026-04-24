import { configureStore } from '@reduxjs/toolkit';
import resourcesReducer from '@/features/resources/store/resourcesSlice';
import namespacesReducer from '@/features/namespaces/store/namespacesSlice';
import teamsReducer from '@/features/teams/store/teamsSlice';
import approvalsReducer from '@/features/approvals/store/approvalsSlice';
import auditReducer from '@/features/audit/store/auditSlice';
import freezesReducer from '@/features/freezes/store/freezesSlice';
import policiesReducer from '@/features/policies/store/policiesSlice';
import dashboardReducer from '@/features/dashboard/store/dashboardSlice';
import clustersReducer from '@/features/clusters/store/clustersSlice';
import businessDomainsReducer from '@/features/business-domains/store/businessDomainsSlice';

export const store = configureStore({
  reducer: {
    resources: resourcesReducer,
    namespaces: namespacesReducer,
    teams: teamsReducer,
    approvals: approvalsReducer,
    audit: auditReducer,
    freezes: freezesReducer,
    policies: policiesReducer,
    dashboard: dashboardReducer,
    clusters: clustersReducer,
    businessDomains: businessDomainsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
