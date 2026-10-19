import { baseApi, errorMessage, unwrapItems } from '@/shared/lib/api';
import type { CatalogEntity, CatalogGraphResponse, CatalogListParams, CatalogRegistration } from '../types';
import { catalogRateLimit } from '../catalogRateLimit';
import { catalogValuesEqual } from '../catalogImport';

export const catalogApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    createCatalogEntity: build.mutation<CatalogEntity, { kind: string; name: string; namespace: string; spec: Record<string, unknown> }>({
      query: (body) => ({ url: '/catalog', method: 'POST', body }),
      invalidatesTags: [{ type: 'Catalog', id: 'LIST' }, { type: 'Search', id: 'LIST' }],
    }),
    updateCatalogEntity: build.mutation<CatalogEntity, { kind: string; name: string; namespace: string; spec: Record<string, unknown> }>({
      query: ({ kind, name, namespace, spec }) => ({ url: `/catalog/${kind}/${namespace}/${name}`, method: 'PUT', body: { spec } }),
      invalidatesTags: [{ type: 'Catalog' }, { type: 'Search', id: 'LIST' }],
    }),
    deleteCatalogEntity: build.mutation<void, { kind: string; name: string; namespace: string }>({
      query: ({ kind, name, namespace }) => ({ url: `/catalog/${kind}/${namespace}/${name}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Catalog' }, { type: 'Search', id: 'LIST' }],
    }),
    listCatalogEntities: build.query<CatalogEntity[], CatalogListParams | void>({
      async queryFn(params, _api, _extra, fetch) {
        // The server defaults to 100. Follow every page instead of silently
        // hiding the remainder when a cloud inventory is registered.
        const items: CatalogEntity[] = [];
        const size = params?.limit ?? 100;
        let offset = params?.offset ?? 0;
        while (true) {
          const response = await catalogRateLimit(async () => fetch({ url: '/catalog', params: { ...params, limit: size, offset } }), _api.signal);
          if (response.error) return { error: response.error };
          const page = unwrapItems<CatalogEntity>(response.data);
          items.push(...page);
          if (params?.limit !== undefined || page.length < size) break;
          offset += page.length;
        }
        return { data: items };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ key }) => ({ type: 'Catalog' as const, id: key })),
              { type: 'Catalog' as const, id: 'LIST' },
            ]
          : [{ type: 'Catalog' as const, id: 'LIST' }],
    }),
    importCatalogEntities: build.mutation<{ created: number; updated: number; skipped: number; failures: string[] }, { entities: CatalogRegistration[]; updateExisting?: boolean }>({
      async queryFn({ entities, updateExisting }, _api, _extra, fetch) {
        const result = { created: 0, updated: 0, skipped: 0, failures: [] as string[] };
        const existingKeys = new Set<string>();
        const existingEntities = new Map<string, CatalogEntity>();
        let offset = 0;
        while (true) {
          const response = await catalogRateLimit(async () => fetch({ url: '/catalog', params: { limit: 100, offset } }), _api.signal);
          if (response.error) return { error: response.error };
          const page = unwrapItems<CatalogEntity>(response.data);
          for (const item of page) {
            const key = `${item.kind}/${item.metadata.namespace}/${item.metadata.name}`;
            existingKeys.add(key);
            existingEntities.set(key, item);
          }
          if (page.length < 100) break;
          offset += page.length;
        }
        // Registrations are independent catalog writes. Bound concurrency so
        // large snapshots do not take one network round trip per entity while
        // keeping database load predictable. Relationships are metadata only.
        const register = async (entity: CatalogRegistration) => {
          const key = `${entity.kind}/${entity.namespace}/${entity.name}`;
          if (existingKeys.has(key)) {
            if (!updateExisting) { result.skipped++; return; }
            const previous = existingEntities.get(key);
            if (previous && catalogValuesEqual(previous.spec, entity.spec)
              && (entity.relationships === undefined || catalogValuesEqual(previous.relationships, entity.relationships))) {
              result.skipped++; return;
            }
            const path = [entity.kind, entity.namespace, entity.name].map(encodeURIComponent).join('/');
            const updated = await catalogRateLimit(async () => fetch({ url: `/catalog/${path}`, method: 'PUT', body: { spec: entity.spec, ...(entity.relationships ? { relationships: entity.relationships } : {}) } }), _api.signal);
            if (updated.error) result.failures.push(`${entity.namespace}/${entity.name}: ${errorMessage(updated.error)}`);
            else result.updated++;
            return;
          }
          const response = await catalogRateLimit(async () => fetch({ url: '/catalog', method: 'POST', body: entity }), _api.signal);
          if (response.error) result.failures.push(`${entity.namespace}/${entity.name}: ${errorMessage(response.error)}`);
          else { result.created++; existingKeys.add(key); }
        };
        for (let index = 0; index < entities.length; index += 4) {
          await Promise.all(entities.slice(index, index + 4).map(register));
        }
        return { data: result };
      },
      invalidatesTags: [{ type: 'Catalog' }, { type: 'Search', id: 'LIST' }],
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
  useImportCatalogEntitiesMutation,
  useUpdateCatalogEntityMutation,
  useDeleteCatalogEntityMutation,
  useListCatalogEntitiesQuery,
  useGetCatalogEntityQuery,
  useReindexCatalogEntityMutation,
  useGetCatalogEntityGraphQuery,
} = catalogApi;
