import { baseApi } from '@/shared/lib/api';

// Analytics payloads are loose (backend is still adding fields). Keep
// them `unknown` here and let the consumer narrow via a local type.
type AnalyticsPayload = unknown;

type AnalyticsPeriod = '7d' | '30d' | '90d';

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAnalyticsSummary: build.query<AnalyticsPayload, void>({
      query: () => '/analytics/summary',
      providesTags: [{ type: 'Analytics', id: 'summary' }],
    }),

    getAnalyticsResources: build.query<AnalyticsPayload, void>({
      query: () => '/analytics/resources',
      providesTags: [{ type: 'Analytics', id: 'resources' }],
    }),

    getAnalyticsTeams: build.query<AnalyticsPayload, void>({
      query: () => '/analytics/teams',
      providesTags: [{ type: 'Analytics', id: 'teams' }],
    }),

    getAnalyticsClusters: build.query<AnalyticsPayload, void>({
      query: () => '/analytics/clusters',
      providesTags: [{ type: 'Analytics', id: 'clusters' }],
    }),

    getAnalyticsDomains: build.query<AnalyticsPayload, void>({
      query: () => '/analytics/domains',
      providesTags: [{ type: 'Analytics', id: 'domains' }],
    }),

    getAnalyticsTrends: build.query<AnalyticsPayload, AnalyticsPeriod | void>({
      query: (period) => ({
        url: '/analytics/trends',
        params: { period: period ?? '7d' },
      }),
      providesTags: (_result, _err, period) => [
        { type: 'Analytics', id: `trends-${period ?? '7d'}` },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAnalyticsSummaryQuery,
  useGetAnalyticsResourcesQuery,
  useGetAnalyticsTeamsQuery,
  useGetAnalyticsClustersQuery,
  useGetAnalyticsDomainsQuery,
  useGetAnalyticsTrendsQuery,
} = analyticsApi;
