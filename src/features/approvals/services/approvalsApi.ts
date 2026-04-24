import { baseApi, unwrapItems } from '@/shared/lib/api';
import type { Approval, ApprovalStatus, PaginationParams } from '@/shared/types';

export const approvalsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listApprovals: build.query<
      Approval[],
      { status?: ApprovalStatus | 'all'; pagination?: PaginationParams } | void
    >({
      query: (arg) => {
        const status = arg?.status;
        const params: Record<string, unknown> = { ...(arg?.pagination ?? {}) };
        if (status && status !== 'all') params.status = status;
        return { url: '/approvals', params };
      },
      transformResponse: (raw: unknown) => unwrapItems<Approval>(raw),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Approval' as const, id })),
              { type: 'Approval' as const, id: 'LIST' },
            ]
          : [{ type: 'Approval' as const, id: 'LIST' }],
    }),

    getApproval: build.query<Approval, string>({
      query: (id) => `/approvals/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Approval', id }],
    }),

    approveRequest: build.mutation<Approval, { id: string; comment?: string }>({
      query: ({ id, comment }) => ({
        url: `/approvals/${id}/approve`,
        method: 'POST',
        body: { comment },
      }),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'Approval', id: 'LIST' },
        { type: 'Approval', id: arg.id },
        { type: 'DashboardSummary', id: 'SINGLETON' },
      ],
    }),

    rejectRequest: build.mutation<Approval, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/approvals/${id}/reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'Approval', id: 'LIST' },
        { type: 'Approval', id: arg.id },
        { type: 'DashboardSummary', id: 'SINGLETON' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListApprovalsQuery,
  useGetApprovalQuery,
  useApproveRequestMutation,
  useRejectRequestMutation,
} = approvalsApi;
