import { baseApi, unwrapItems } from '@/shared/lib/api';
import type { CatalogEntity, CatalogGraphResponse, CatalogListParams } from '../types';

export const catalogApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    createCatalogEntity: build.mutation<CatalogEntity, { kind: string; name: string; namespace: string; spec: Record<string, unknown> }>({
      query: (body) => ({ url: '/catalog', method: 'POST', body }),
      invalidatesTags: [{ type: 'Catalog', id: 'LIST' }, { type: 'Search', id: 'LIST' }],
    }),
    updateCatalogEntity: build.mutation<CatalogEntity, { kind: string; name: string; namespace: string; spec: Record<string, unknown> }>({
      query: ({ kind, name, namespace, spec }) => ({ url: `/catalog/${kind}/${namespace}/${name}`, method: 'PUT', body: { spec } }),
      invalidatesTags: (_r, _e, a) => [{ type: 'Catalog', id: 'LIST' }, { type: 'Catalog', id: `${a.kind}/${a.namespace}/${a.name}` }, { type: 'Search', id: 'LIST' }],
    }),
    deleteCatalogEntity: build.mutation<void, { kind: string; name: string; namespace: string }>({
      query: ({ kind, name, namespace }) => ({ url: `/catalog/${kind}/${namespace}/${name}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Catalog', id: 'LIST' }, { type: 'Search', id: 'LIST' }],
    }),
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
    getCatalogEntityGraph: build.query<
      CatalogGraphResponse,
      { kind: string; namespace: string; name: string }
    >({
      query: ({ kind, namespace, name }) =>
        `/catalog/${kind}/${namespace}/${name}/graph`,
      providesTags: (_result, _err, arg) => [
        { type: 'Catalog', id: `graph:${arg.kind}/${arg.namespace}/${arg.name}` },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateCatalogEntityMutation,
  useUpdateCatalogEntityMutation,
  useDeleteCatalogEntityMutation,
  useListCatalogEntitiesQuery,
  useGetCatalogEntityQuery,
  useReindexCatalogEntityMutation,
  useGetCatalogEntityGraphQuery,
} = catalogApi;
