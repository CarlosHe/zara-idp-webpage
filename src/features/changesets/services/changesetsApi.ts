import { baseApi } from '@/shared/lib/api';

export interface ChangeSetChange {
  resourceKind?: string;
  resourceName?: string;
  namespace?: string;
  action?: string;
  riskLevel?: string;
  [key: string]: unknown;
}

export interface ChangeSet {
  id: string;
  requestedBy?: string;
  source?: string;
  approvalStatus?: string;
  requiresApproval?: boolean;
  totalRisk?: string;
  environment?: string;
  changes?: ChangeSetChange[];
  resourcesYAML?: string;
  resourcesYaml?: string;
  createdAt?: string;
  updatedAt?: string;
  appliedAt?: string;
  [key: string]: unknown;
}

interface ListChangeSetsResponse {
  changesets: ChangeSet[];
  total: number;
  limit: number;
  offset: number;
}

export const changesetsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listChangeSets: build.query<
      ListChangeSetsResponse,
      { status?: string; environment?: string; limit?: number; offset?: number } | void
    >({
      query: (arg) => ({
        url: '/changesets',
        params: {
          status: arg?.status,
          environment: arg?.environment,
          limit: arg?.limit ?? 50,
          offset: arg?.offset ?? 0,
        },
      }),
      providesTags: (result) =>
        result?.changesets
          ? [
              ...result.changesets.map((cs) => ({ type: 'ChangeSet' as const, id: cs.id })),
              { type: 'ChangeSet' as const, id: 'LIST' },
            ]
          : [{ type: 'ChangeSet' as const, id: 'LIST' }],
    }),

    getChangeSet: build.query<ChangeSet, string>({
      query: (id) => `/changesets/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'ChangeSet', id }],
    }),

    getChangeSetJobs: build.query<{items:Array<{id:string;resourceId:string;resourceKind?:string;resourceName?:string;namespace?:string;action:string;status:string;attempts:number;error?:string}>}, string>({
      query: (id) => `/changesets/${id}/jobs`,
      providesTags: (_r, _e, id) => [{ type: 'ChangeSet', id }],
    }),
    getChangeSetDiff: build.query<unknown, string>({
      query: (id) => `/changesets/${id}/diff`,
      providesTags: (_r, _e, id) => [{ type: 'ChangeSet', id }],
    }),

    approveChangeSet: build.mutation<unknown, { id: string; comment?: string }>({
      extraOptions: { maxRetries: 0 },
      query: ({ id, comment }) => ({
        url: `/changesets/${id}/approve`,
        method: 'POST',
        body: { comment: comment ?? '', auto_apply: true },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'ChangeSet', id: arg.id },
        { type: 'ChangeSet', id: 'LIST' },
        { type: 'Approval', id: 'LIST' },
      ],
    }),

    rejectChangeSet: build.mutation<unknown, { id: string; reason: string }>({
      extraOptions: { maxRetries: 0 },
      query: ({ id, reason }) => ({
        url: `/changesets/${id}/reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'ChangeSet', id: arg.id },
        { type: 'ChangeSet', id: 'LIST' },
        { type: 'Approval', id: 'LIST' },
      ],
    }),
    applyChangeSet: build.mutation<unknown, string>({
      extraOptions: { maxRetries: 0 },
      query: (id) => ({ url: `/changesets/${id}/apply`, method: 'POST', body: {} }),
      invalidatesTags: (_result, _error, id) => [{ type: 'ChangeSet', id }, { type: 'Resource', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetChangeSetJobsQuery,
  useListChangeSetsQuery,
  useGetChangeSetQuery,
  useGetChangeSetDiffQuery,
  useApproveChangeSetMutation,
  useRejectChangeSetMutation,
  useApplyChangeSetMutation,
} = changesetsApi;
