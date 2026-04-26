import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithRetry } from './baseQuery';

// Single root API slice. Every feature injects its endpoints via
// `baseApi.injectEndpoints(...)` — that keeps store wiring to exactly
// one reducer and one middleware, and lets RTK Query share cache state
// across features (e.g. a mutation on `Resource` can invalidate the
// dashboard summary).
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithRetry,
  // Tag types are the shared vocabulary used by `providesTags` /
  // `invalidatesTags` across features. When a new tag is added, include
  // it here so every feature can reference it.
  tagTypes: [
    'Resource',
    'ResourceEvents',
    'ResourceDependencies',
    'Drift',
    'Namespace',
    'Team',
    'Approval',
    'Audit',
    'Freeze',
    'RuntimePolicy',
    'DashboardSummary',
    'DashboardHealth',
    'Correlation',
    'BlastRadius',
    'Cluster',
    'BusinessDomain',
    'Analytics',
    'Catalog',
    'CatalogSource',
    'Search',
    'SavedSearch',
    'TechDocs',
    'Plugin',
    'GoldenPath',
  ],
  endpoints: () => ({}),
  // 60 s default cache window: short enough that pages feel fresh,
  // long enough to dedupe rapid navigation. Individual endpoints can
  // override via `keepUnusedDataFor`.
  keepUnusedDataFor: 60,
  // Refetch on window focus for dashboards / audit views — cheap and
  // avoids the "stale data after switching tabs" class of bugs.
  refetchOnFocus: true,
});
