import { baseApi, unwrapItems } from '@/shared/lib/api';
import type { Namespace, PaginationParams, Resource, ApiResponse } from '@/shared/types';

type NamespaceCreate = Omit<Namespace, 'createdAt' | 'updatedAt' | 'status'>;

export const namespacesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listNamespaces: build.query<Namespace[], void>({
      query: () => '/namespaces',
      transformResponse: (raw: unknown) => unwrapItems<Namespace>(raw),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Namespace' as const, id })),
              { type: 'Namespace' as const, id: 'LIST' },
            ]
          : [{ type: 'Namespace' as const, id: 'LIST' }],
    }),

    getNamespace: build.query<Namespace, string>({
      query: (id) => `/namespaces/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Namespace', id }],
    }),

    getNamespaceResources: build.query<
      ApiResponse<Resource[]>,
      { id: string; pagination?: PaginationParams }
    >({
      query: ({ id, pagination }) => ({
        url: `/namespaces/${id}/resources`,
        params: pagination,
      }),
    }),

    createNamespace: build.mutation<Namespace, NamespaceCreate>({
      query: (body) => ({ url: '/namespaces', method: 'POST', body }),
      invalidatesTags: [{ type: 'Namespace', id: 'LIST' }],
    }),

    updateNamespace: build.mutation<Namespace, { id: string; data: Partial<Namespace> }>({
      query: ({ id, data }) => ({ url: `/namespaces/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'Namespace', id: 'LIST' },
        { type: 'Namespace', id: arg.id },
      ],
    }),

    deleteNamespace: build.mutation<void, string>({
      query: (id) => ({ url: `/namespaces/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'Namespace', id: 'LIST' },
        { type: 'Namespace', id },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListNamespacesQuery,
  useGetNamespaceQuery,
  useGetNamespaceResourcesQuery,
  useCreateNamespaceMutation,
  useUpdateNamespaceMutation,
  useDeleteNamespaceMutation,
} = namespacesApi;
