import { baseApi } from '@/shared/lib/api';
import { normalizeResource, normalizeResources, unwrapItems } from '@/shared/lib/api';
import type {
  Resource,
  ResourceEvent,
  ResourceDependency,
  ResourceKind,
  PaginationParams,
  DriftReport,
  ReconcileJobResponse,
} from '@/shared/types';

interface ResourceKey {
  kind: ResourceKind;
  namespace: string;
  name: string;
}

interface CreateResourceBody {
  kind: string;
  name: string;
  namespace: string;
  spec?: Record<string, unknown>;
  metadata?: {
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
}

interface UpdateResourceBody {
  spec?: Record<string, unknown>;
  metadata?: {
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
}

interface ApplyYamlResponse {
  results: Array<{
    kind: string;
    name: string;
    namespace: string;
    action: 'CREATED' | 'UPDATED' | 'ERROR';
    error?: string;
  }>;
  summary: {
    total: number;
    created: number;
    updated: number;
    failed: number;
  };
}

export const resourcesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listResources: build.query<
      Resource[],
      { kind?: ResourceKind | null; pagination?: PaginationParams } | void
    >({
      query: (arg) => {
        const kind = arg?.kind ?? null;
        const params = arg?.pagination ?? {};
        return {
          url: kind ? `/resources/${kind}` : '/resources',
          params,
        };
      },
      transformResponse: (raw: unknown) => normalizeResources(unwrapItems(raw)),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Resource' as const, id })),
              { type: 'Resource' as const, id: 'LIST' },
            ]
          : [{ type: 'Resource' as const, id: 'LIST' }],
    }),

    getResource: build.query<Resource, ResourceKey>({
      query: ({ kind, namespace, name }) => `/resources/${kind}/${namespace}/${name}`,
      transformResponse: (raw: unknown) => normalizeResource(raw as Parameters<typeof normalizeResource>[0]),
      providesTags: (_result, _err, arg) => [
        { type: 'Resource', id: `${arg.kind}-${arg.namespace}-${arg.name}` },
      ],
    }),

    getResourceEvents: build.query<ResourceEvent[], ResourceKey>({
      query: ({ kind, namespace, name }) =>
        `/resources/${kind}/${namespace}/${name}/events`,
      transformResponse: (raw: unknown) => unwrapItems<ResourceEvent>(raw),
      providesTags: (_result, _err, arg) => [
        { type: 'ResourceEvents', id: `${arg.kind}-${arg.namespace}-${arg.name}` },
      ],
    }),

    getResourceDependencies: build.query<ResourceDependency[], ResourceKey>({
      query: ({ kind, namespace, name }) =>
        `/resources/${kind}/${namespace}/${name}/dependencies`,
      transformResponse: (raw: unknown) => unwrapItems<ResourceDependency>(raw),
      providesTags: (_result, _err, arg) => [
        { type: 'ResourceDependencies', id: `${arg.kind}-${arg.namespace}-${arg.name}` },
      ],
    }),

    createResource: build.mutation<Resource, CreateResourceBody>({
      query: (body) => ({ url: '/resources', method: 'POST', body }),
      transformResponse: (raw: unknown) => normalizeResource(raw as Parameters<typeof normalizeResource>[0]),
      invalidatesTags: [
        { type: 'Resource', id: 'LIST' },
        { type: 'DashboardSummary', id: 'SINGLETON' },
      ],
    }),

    updateResource: build.mutation<Resource, { key: ResourceKey; body: UpdateResourceBody }>({
      query: ({ key, body }) => ({
        url: `/resources/${key.kind}/${key.namespace}/${key.name}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (raw: unknown) => normalizeResource(raw as Parameters<typeof normalizeResource>[0]),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'Resource', id: 'LIST' },
        { type: 'Resource', id: `${arg.key.kind}-${arg.key.namespace}-${arg.key.name}` },
        { type: 'DashboardSummary', id: 'SINGLETON' },
      ],
    }),

    deleteResource: build.mutation<void, { id: string }>({
      query: ({ id }) => ({ url: `/resources/${id}`, method: 'DELETE' }),
      invalidatesTags: [
        { type: 'Resource', id: 'LIST' },
        { type: 'DashboardSummary', id: 'SINGLETON' },
      ],
    }),

    applyYaml: build.mutation<ApplyYamlResponse, { yaml: string }>({
      query: (body) => ({ url: '/apply', method: 'POST', body }),
      invalidatesTags: [
        { type: 'Resource', id: 'LIST' },
        { type: 'DashboardSummary', id: 'SINGLETON' },
      ],
    }),

    detectDrift: build.query<DriftReport, { resourceId: string }>({
      query: ({ resourceId }) => `/resources/${resourceId}/drift`,
      providesTags: (_result, _err, arg) => [{ type: 'Drift', id: arg.resourceId }],
    }),

    reconcileResource: build.mutation<ReconcileJobResponse, { resourceId: string }>({
      query: ({ resourceId }) => ({
        url: `/resources/${resourceId}/reconcile`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'Resource', id: 'LIST' },
        { type: 'Resource', id: arg.resourceId },
        { type: 'Drift', id: arg.resourceId },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListResourcesQuery,
  useGetResourceQuery,
  useGetResourceEventsQuery,
  useGetResourceDependenciesQuery,
  useCreateResourceMutation,
  useUpdateResourceMutation,
  useDeleteResourceMutation,
  useApplyYamlMutation,
  useLazyDetectDriftQuery,
  useReconcileResourceMutation,
} = resourcesApi;
