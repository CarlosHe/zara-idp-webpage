import { baseApi, unwrapItems } from '@/shared/lib/api';
import type { CatalogSource, CatalogSyncResponse } from '../types';

interface SyncArgs {
  id: string;
  dryRun?: boolean;
}

export const catalogSourcesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listCatalogSources: build.query<CatalogSource[], void>({
      query: () => ({ url: '/catalog-sources' }),
      transformResponse: (raw: unknown) => unwrapItems<CatalogSource>(raw),
      providesTags: (result) =>
        result
          ? [
              ...result.map((src) => ({
                type: 'CatalogSource' as const,
                id: src.id,
              })),
              { type: 'CatalogSource' as const, id: 'LIST' },
            ]
          : [{ type: 'CatalogSource' as const, id: 'LIST' }],
    }),
    getCatalogSource: build.query<CatalogSource, string>({
      query: (id) => `/catalog-sources/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'CatalogSource', id }],
    }),
    syncCatalogSource: build.mutation<CatalogSyncResponse, SyncArgs>({
      query: ({ id, dryRun }) => ({
        url: `/catalog-sources/${id}/sync`,
        method: 'POST',
        params: dryRun ? { dryRun: 'true' } : undefined,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'CatalogSource', id },
        { type: 'CatalogSource', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListCatalogSourcesQuery,
  useGetCatalogSourceQuery,
  useSyncCatalogSourceMutation,
} = catalogSourcesApi;
