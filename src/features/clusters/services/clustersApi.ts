import { baseApi, unwrapItems } from '@/shared/lib/api';
import type { Cluster } from '../store/clusterTypes';

interface ClusterCreate {
  name: string;
  namespace?: string;
  displayName?: string;
  provider: string;
  environment: string;
  region: string;
}

interface ClusterUpdate {
  displayName?: string;
  environment?: string;
}

interface ClusterListParams {
  provider?: string;
  environment?: string;
}

export const clustersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listClusters: build.query<Cluster[], ClusterListParams | void>({
      query: (params) => ({ url: '/clusters', params: params ?? {} }),
      transformResponse: (raw: unknown) => unwrapItems<Cluster>(raw),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Cluster' as const, id })),
              { type: 'Cluster' as const, id: 'LIST' },
            ]
          : [{ type: 'Cluster' as const, id: 'LIST' }],
    }),

    getCluster: build.query<Cluster, string>({
      query: (id) => `/clusters/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Cluster', id }],
    }),

    getClusterResources: build.query<unknown, string>({
      query: (id) => `/clusters/${id}/resources`,
    }),

    getClusterHealth: build.query<unknown, string>({
      query: (id) => `/clusters/${id}/health`,
    }),

    createCluster: build.mutation<Cluster, ClusterCreate>({
      query: (body) => ({ url: '/clusters', method: 'POST', body }),
      invalidatesTags: [{ type: 'Cluster', id: 'LIST' }],
    }),

    updateCluster: build.mutation<Cluster, { id: string; data: ClusterUpdate }>({
      query: ({ id, data }) => ({ url: `/clusters/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'Cluster', id: 'LIST' },
        { type: 'Cluster', id: arg.id },
      ],
    }),

    deleteCluster: build.mutation<void, string>({
      query: (id) => ({ url: `/clusters/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'Cluster', id: 'LIST' },
        { type: 'Cluster', id },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListClustersQuery,
  useGetClusterQuery,
  useGetClusterResourcesQuery,
  useGetClusterHealthQuery,
  useCreateClusterMutation,
  useUpdateClusterMutation,
  useDeleteClusterMutation,
} = clustersApi;
