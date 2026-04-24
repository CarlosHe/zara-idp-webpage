import { baseApi } from '@/shared/lib/api';
import type {
  DashboardSummary,
  DashboardHealth,
  CorrelationResult,
  BlastRadius,
  ResourceKind,
} from '@/shared/types';

interface ResourceKey {
  kind: ResourceKind;
  namespace: string;
  name: string;
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDashboardSummary: build.query<DashboardSummary, void>({
      query: () => '/dashboard/summary',
      providesTags: [{ type: 'DashboardSummary', id: 'SINGLETON' }],
    }),

    getDashboardHealth: build.query<DashboardHealth, void>({
      query: () => '/dashboard/health',
      providesTags: [{ type: 'DashboardHealth', id: 'SINGLETON' }],
    }),

    getCorrelation: build.query<CorrelationResult, ResourceKey>({
      query: ({ kind, namespace, name }) => `/correlate/${kind}/${namespace}/${name}`,
      providesTags: (_result, _err, arg) => [
        { type: 'Correlation', id: `${arg.kind}-${arg.namespace}-${arg.name}` },
      ],
    }),

    getBlastRadius: build.query<BlastRadius, ResourceKey>({
      query: ({ kind, namespace, name }) => `/blast-radius/${kind}/${namespace}/${name}`,
      providesTags: (_result, _err, arg) => [
        { type: 'BlastRadius', id: `${arg.kind}-${arg.namespace}-${arg.name}` },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetDashboardSummaryQuery,
  useGetDashboardHealthQuery,
  useGetCorrelationQuery,
  useGetBlastRadiusQuery,
  useLazyGetCorrelationQuery,
  useLazyGetBlastRadiusQuery,
} = dashboardApi;
