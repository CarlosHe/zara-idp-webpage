import { baseApi } from '@/shared/lib/api';
import { unwrapItems } from '@/shared/lib/api';
import type {
  GoldenPathSummary,
  GoldenPathExecuteRequest,
  GoldenPathExecuteResponse,
} from '../types';

// Sprint-19 / L-1908 — RTK Query slice for the Golden Path marketplace.
//
// The control plane exposes:
//
//   GET    /api/v1/golden-paths        → list of summaries
//   GET    /api/v1/golden-paths/:id    → one summary
//   POST   /api/v1/golden-paths/:id/execute (dryRun supported)
//
// Cache tag `GoldenPath` is invalidated on every execute so the UI
// can refresh marketplace badges (last execution, average risk) when
// the backend later starts publishing those metrics.
export const goldenPathsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listGoldenPaths: builder.query<GoldenPathSummary[], void>({
      query: () => ({ url: '/api/v1/golden-paths' }),
      transformResponse: (response: unknown) => unwrapItems<GoldenPathSummary>(response),
      providesTags: (paths = []) => [
        { type: 'GoldenPath' as const, id: 'LIST' },
        ...paths.map((p) => ({ type: 'GoldenPath' as const, id: p.id })),
      ],
    }),
    getGoldenPath: builder.query<GoldenPathSummary, string>({
      query: (id) => ({ url: `/api/v1/golden-paths/${id}` }),
      providesTags: (_summary, _err, id) => [{ type: 'GoldenPath' as const, id }],
    }),
    executeGoldenPath: builder.mutation<GoldenPathExecuteResponse, GoldenPathExecuteRequest>({
      query: ({ id, parameters, dryRun, requestedBy }) => ({
        url: `/api/v1/golden-paths/${id}/execute`,
        method: 'POST',
        body: { parameters, dryRun, requestedBy },
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'GoldenPath' as const, id },
        { type: 'GoldenPath' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListGoldenPathsQuery,
  useGetGoldenPathQuery,
  useExecuteGoldenPathMutation,
} = goldenPathsApi;
