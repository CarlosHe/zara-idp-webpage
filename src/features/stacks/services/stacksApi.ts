import { baseApi } from '@/shared/lib/api';
import { unwrapItems } from '@/shared/lib/api';

export interface StackResource {
  kind?: string;
  name?: string;
  status?: string;
  resourceId?: string;
  outputs?: Record<string, string>;
}

export interface InfrastructureStack {
  id: string;
  name: string;
  namespace: string;
  description?: string;
  environment?: string;
  provider?: string;
  region?: string;
  status?: string;
  statusMessage?: string;
  gitRepository?: string;
  gitBranch?: string;
  gitPath?: string;
  lastCommitSHA?: string;
  lastApplyRunID?: string;
  dependencies?: string[];
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  tags?: Record<string, string>;
  resources?: StackResource[];
  outputs?: Record<string, { value?: unknown; sensitive?: boolean; type?: string; description?: string }>;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  lastDeployedBy?: string;
  lastDeployedAt?: string;
}

export const stacksApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listStacks: build.query<
      InfrastructureStack[],
      { namespace?: string; environment?: string; status?: string; limit?: number } | void
    >({
      query: (arg) => ({
        url: '/stacks',
        params: {
          namespace: arg?.namespace,
          environment: arg?.environment,
          status: arg?.status,
          limit: arg?.limit ?? 50,
        },
      }),
      transformResponse: (raw: unknown) => {
        if (Array.isArray(raw)) return raw as InfrastructureStack[];
        if (raw && typeof raw === 'object') {
          const obj = raw as Record<string, unknown>;
          if (Array.isArray(obj.stacks)) return obj.stacks as InfrastructureStack[];
          if (Array.isArray(obj.items)) return obj.items as InfrastructureStack[];
        }
        return unwrapItems<InfrastructureStack>(raw);
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((s) => ({ type: 'InfrastructureStack' as const, id: s.id })),
              { type: 'InfrastructureStack' as const, id: 'LIST' },
            ]
          : [{ type: 'InfrastructureStack' as const, id: 'LIST' }],
    }),

    getStack: build.query<InfrastructureStack, string>({
      query: (id) => `/stacks/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'InfrastructureStack', id }],
    }),

    applyStack: build.mutation<
      unknown,
      { id: string; dryRun?: boolean; force?: boolean; message?: string }
    >({
      query: ({ id, dryRun, force, message }) => ({
        url: `/stacks/${id}/apply`,
        method: 'POST',
        body: {
          dryRun: dryRun ?? false,
          force: force ?? false,
          message: message ?? '',
        },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'InfrastructureStack', id: arg.id },
        { type: 'InfrastructureStack', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListStacksQuery,
  useGetStackQuery,
  useApplyStackMutation,
} = stacksApi;
