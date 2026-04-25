import { baseApi, unwrapItems } from '@/shared/lib/api';
import type { CatalogEntity, CatalogListParams } from '../types';

export const catalogApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listCatalogEntities: build.query<CatalogEntity[], CatalogListParams | void>({
      query: (params) => ({ url: '/catalog', params: params ?? {} }),
      transformResponse: (raw: unknown) => unwrapItems<CatalogEntity>(raw),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ key }) => ({ type: 'Catalog' as const, id: key })),
              { type: 'Catalog' as const, id: 'LIST' },
            ]
          : [{ type: 'Catalog' as const, id: 'LIST' }],
    }),
    getCatalogEntity: build.query<
      CatalogEntity,
      { kind: string; namespace: string; name: string }
    >({
      query: ({ kind, namespace, name }) => `/catalog/${kind}/${namespace}/${name}`,
      providesTags: (_result, _err, arg) => [
        { type: 'Catalog', id: `${arg.kind}/${arg.namespace}/${arg.name}` },
      ],
    }),
    reindexCatalogEntity: build.mutation<
      { status: string; entityKey: string },
      { kind: string; namespace: string; name: string }
    >({
      query: ({ kind, namespace, name }) => ({
        url: `/catalog/${kind}/${namespace}/${name}/reindex`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'Catalog', id: `${arg.kind}/${arg.namespace}/${arg.name}` },
        { type: 'Search', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListCatalogEntitiesQuery,
  useGetCatalogEntityQuery,
  useReindexCatalogEntityMutation,
} = catalogApi;
