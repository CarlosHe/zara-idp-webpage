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

// Backend resource routes (control-plane REST):
//   GET    /resources                 ?kind=&namespace=
//   GET    /resources/by-kind/:kind
//   GET    /resources/:id
//   PUT    /resources/:id
//   DELETE /resources/:id
//   GET    /resources/:id/events
//   GET    /resources/:id/dependencies
//   POST   /resources/:id/reconcile
//   GET    /resources/:id/drift
//   POST   /resources
//   POST   /apply

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
        const params: Record<string, unknown> = { ...(arg?.pagination ?? {}) };
        if (kind) params.kind = kind;
        return {
          url: '/resources',
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

    getResource: build.query<Resource, string>({
      query: (id) => `/resources/${id}`,
      transformResponse: (raw: unknown) =>
        normalizeResource(raw as Parameters<typeof normalizeResource>[0]),
      providesTags: (_result, _err, id) => [{ type: 'Resource', id }],
    }),

    getResourceEvents: build.query<ResourceEvent[], string>({
      query: (id) => `/resources/${id}/events`,
      transformResponse: (raw: unknown) => unwrapItems<ResourceEvent>(raw),
      providesTags: (_result, _err, id) => [{ type: 'ResourceEvents', id }],
    }),

    getResourceDependencies: build.query<ResourceDependency[], string>({
      query: (id) => `/resources/${id}/dependencies`,
      transformResponse: (raw: unknown) => unwrapItems<ResourceDependency>(raw),
      providesTags: (_result, _err, id) => [{ type: 'ResourceDependencies', id }],
    }),

    createResource: build.mutation<Resource, CreateResourceBody>({
      query: (body) => ({ url: '/resources', method: 'POST', body }),
      transformResponse: (raw: unknown) =>
        normalizeResource(raw as Parameters<typeof normalizeResource>[0]),
      invalidatesTags: [
        { type: 'Resource', id: 'LIST' },
        { type: 'DashboardSummary', id: 'SINGLETON' },
      ],
    }),

    updateResource: build.mutation<Resource, { id: string; body: UpdateResourceBody }>({
      query: ({ id, body }) => ({
        url: `/resources/${id}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (raw: unknown) =>
        normalizeResource(raw as Parameters<typeof normalizeResource>[0]),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'Resource', id: 'LIST' },
        { type: 'Resource', id: arg.id },
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
