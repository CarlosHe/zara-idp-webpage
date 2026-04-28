// Sprint 28 / L-2805 — RTK Query slice for the executive analytics
// dashboard. Endpoints map 1:1 onto the REST handlers in
// `internal/adapters/rest/handlers_analytics_dora.go`.
import { baseApi } from '@/shared/lib/api';
import type {
  AnalyticsQuery,
  ApprovalSLADTO,
  CatalogQualityDTO,
  DORAMetricsDTO,
  RecommendationsResponse,
  RemediationEffectivenessDTO,
} from '../types/types';

function buildQuery(args?: AnalyticsQuery): string {
  if (!args) return '';
  const params = new URLSearchParams();
  if (args.scope) params.set('scope', args.scope);
  if (args.key) params.set('key', args.key);
  if (args.from) params.set('from', args.from);
  if (args.to) params.set('to', args.to);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const executiveAnalyticsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDORA: build.query<DORAMetricsDTO, AnalyticsQuery | void>({
      query: (args) => `/analytics/dora${buildQuery(args ?? undefined)}`,
      providesTags: [{ type: 'AnalyticsDORA', id: 'platform' }],
    }),

    getCatalogQuality: build.query<CatalogQualityDTO, AnalyticsQuery | void>({
      query: (args) => `/analytics/catalog-quality${buildQuery(args ?? undefined)}`,
      providesTags: [{ type: 'AnalyticsCatalogQuality', id: 'platform' }],
    }),

    getApprovalSLA: build.query<ApprovalSLADTO, AnalyticsQuery | void>({
      query: (args) => `/analytics/approval-sla${buildQuery(args ?? undefined)}`,
      providesTags: [{ type: 'AnalyticsApprovalSLA', id: 'platform' }],
    }),

    getRemediationEffectiveness: build.query<
      RemediationEffectivenessDTO,
      AnalyticsQuery | void
    >({
      query: (args) =>
        `/analytics/remediation${buildQuery(args ?? undefined)}`,
      providesTags: [{ type: 'AnalyticsRemediation', id: 'platform' }],
    }),

    getRecommendations: build.query<
      RecommendationsResponse,
      { scope?: string; key?: string } | void
    >({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.scope) params.set('scope', args.scope);
        if (args?.key) params.set('key', args.key);
        const qs = params.toString();
        return qs
          ? `/analytics/recommendations?${qs}`
          : '/analytics/recommendations';
      },
      providesTags: [{ type: 'AnalyticsRecommendations', id: 'platform' }],
    }),

    refreshRecommendations: build.mutation<
      { refreshed: number },
      AnalyticsQuery | void
    >({
      query: (args) => ({
        url: `/analytics/recommendations/refresh${buildQuery(args ?? undefined)}`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'AnalyticsRecommendations', id: 'platform' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetDORAQuery,
  useGetCatalogQualityQuery,
  useGetApprovalSLAQuery,
  useGetRemediationEffectivenessQuery,
  useGetRecommendationsQuery,
  useRefreshRecommendationsMutation,
} = executiveAnalyticsApi;
