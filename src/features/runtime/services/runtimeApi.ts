import { baseApi, unwrapItems } from '@/shared/lib/api';
import type {
  RuntimeActionResponse,
  RuntimeDeploy,
  RuntimeEvent,
  RuntimeInventory,
  RuntimeLogLine,
  RuntimePod,
  RuntimeRestartRequest,
  RuntimeRollbackRequest,
  RuntimeScaleRequest,
  RuntimeWorkload,
} from '../types';

interface ListClustersResponse {
  items: string[];
  total: number;
}

interface InventoryArgs {
  clusterId: string;
  namespace?: string;
}

interface WorkloadArgs extends InventoryArgs {
  workload?: string;
}

interface LogsArgs extends InventoryArgs {
  podName: string;
  container?: string;
  tail?: number;
}

interface DeploysArgs extends InventoryArgs {
  workloadName: string;
}

export const runtimeApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listRuntimeClusters: build.query<string[], void>({
      query: () => '/runtime/clusters',
      transformResponse: (raw: ListClustersResponse) => raw.items,
      providesTags: () => [{ type: 'RuntimeCluster', id: 'LIST' }],
    }),

    getRuntimeInventory: build.query<RuntimeInventory, InventoryArgs>({
      query: ({ clusterId, namespace }) => ({
        url: `/runtime/clusters/${clusterId}/inventory`,
        params: namespace ? { namespace } : undefined,
      }),
      providesTags: (_result, _err, { clusterId }) => [
        { type: 'RuntimeWorkload', id: clusterId },
      ],
    }),

    listRuntimeWorkloads: build.query<RuntimeWorkload[], InventoryArgs>({
      query: ({ clusterId, namespace }) => ({
        url: `/runtime/clusters/${clusterId}/workloads`,
        params: namespace ? { namespace } : undefined,
      }),
      transformResponse: (raw: unknown) => unwrapItems<RuntimeWorkload>(raw),
      providesTags: (_result, _err, { clusterId }) => [
        { type: 'RuntimeWorkload', id: clusterId },
      ],
    }),

    listRuntimePods: build.query<RuntimePod[], WorkloadArgs>({
      query: ({ clusterId, namespace, workload }) => ({
        url: `/runtime/clusters/${clusterId}/pods`,
        params: { namespace, workload },
      }),
      transformResponse: (raw: unknown) => unwrapItems<RuntimePod>(raw),
      providesTags: () => [{ type: 'RuntimePod', id: 'LIST' }],
    }),

    listRuntimeEvents: build.query<RuntimeEvent[], InventoryArgs & { involved?: string }>({
      query: ({ clusterId, namespace, involved }) => ({
        url: `/runtime/clusters/${clusterId}/events`,
        params: { namespace, involved },
      }),
      transformResponse: (raw: unknown) => unwrapItems<RuntimeEvent>(raw),
      providesTags: () => [{ type: 'RuntimeEvent', id: 'LIST' }],
    }),

    fetchRuntimeLogs: build.query<RuntimeLogLine[], LogsArgs>({
      query: ({ clusterId, namespace, podName, container, tail }) => ({
        url: `/runtime/clusters/${clusterId}/pods/${podName}/logs`,
        params: { namespace, container, tail },
      }),
      transformResponse: (raw: unknown) => unwrapItems<RuntimeLogLine>(raw),
      providesTags: () => [{ type: 'RuntimeLogs', id: 'LIST' }],
    }),

    listRuntimeDeploys: build.query<RuntimeDeploy[], DeploysArgs>({
      query: ({ clusterId, namespace, workloadName }) => ({
        url: `/runtime/clusters/${clusterId}/workloads/${workloadName}/deploys`,
        params: namespace ? { namespace } : undefined,
      }),
      transformResponse: (raw: unknown) => unwrapItems<RuntimeDeploy>(raw),
      providesTags: () => [{ type: 'RuntimeDeploy', id: 'LIST' }],
    }),

    proposeRuntimeRestart: build.mutation<RuntimeActionResponse, RuntimeRestartRequest>({
      query: (body) => ({
        url: '/runtime/actions/restart',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'RuntimeWorkload', id: arg.clusterId },
        { type: 'Approval', id: 'LIST' },
      ],
    }),

    proposeRuntimeScale: build.mutation<RuntimeActionResponse, RuntimeScaleRequest>({
      query: (body) => ({
        url: '/runtime/actions/scale',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'RuntimeWorkload', id: arg.clusterId },
        { type: 'Approval', id: 'LIST' },
      ],
    }),

    proposeRuntimeRollback: build.mutation<RuntimeActionResponse, RuntimeRollbackRequest>({
      query: (body) => ({
        url: '/runtime/actions/rollback',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'RuntimeWorkload', id: arg.clusterId },
        { type: 'Approval', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListRuntimeClustersQuery,
  useGetRuntimeInventoryQuery,
  useListRuntimeWorkloadsQuery,
  useListRuntimePodsQuery,
  useListRuntimeEventsQuery,
  useFetchRuntimeLogsQuery,
  useListRuntimeDeploysQuery,
  useProposeRuntimeRestartMutation,
  useProposeRuntimeScaleMutation,
  useProposeRuntimeRollbackMutation,
} = runtimeApi;
