import { baseApi } from '@/shared/lib/api';
import type {
  RemediationBatchResponse,
  RemediationChangeSet,
  RemediationListFilters,
  RemediationListResponse,
  RemediationProposal,
} from '../types/remediation';

// Sprint 31 / L-3104 — RTK Query slice for the remediation inbox.
//
// Endpoints mirror `internal/adapters/rest/handlers_remediation.go`.
// Every mutation invalidates both the list cache and the affected
// proposal so the inbox stays consistent without a manual refetch.

export const remediationApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listRemediationProposals: build.query<RemediationListResponse, RemediationListFilters | void>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters?.status) params.set('status', filters.status);
        if (filters?.source) params.set('source', filters.source);
        if (filters?.owner) params.set('owner', filters.owner);
        if (filters?.batchId) params.set('batchId', filters.batchId);
        if (filters?.minRisk) params.set('minRisk', filters.minRisk);
        const qs = params.toString();
        return qs ? `/remediation/proposals?${qs}` : '/remediation/proposals';
      },
      providesTags: (result) =>
        result
          ? [
              { type: 'RemediationProposal', id: 'LIST' },
              ...result.items.map(
                (p) => ({ type: 'RemediationProposal', id: p.id }) as const,
              ),
            ]
          : [{ type: 'RemediationProposal', id: 'LIST' }],
    }),

    getRemediationProposal: build.query<RemediationProposal, string>({
      query: (id) => `/remediation/proposals/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'RemediationProposal', id }],
    }),

    approveRemediationProposal: build.mutation<RemediationProposal, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/remediation/proposals/${id}/approve`,
        method: 'POST',
        body: { reason: reason ?? '' },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'RemediationProposal', id: 'LIST' },
        { type: 'RemediationProposal', id },
      ],
    }),

    rejectRemediationProposal: build.mutation<RemediationProposal, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/remediation/proposals/${id}/reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'RemediationProposal', id: 'LIST' },
        { type: 'RemediationProposal', id },
      ],
    }),

    scheduleRemediationProposal: build.mutation<RemediationProposal, { id: string; when: string }>({
      query: ({ id, when }) => ({
        url: `/remediation/proposals/${id}/schedule`,
        method: 'POST',
        body: { when },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'RemediationProposal', id: 'LIST' },
        { type: 'RemediationProposal', id },
      ],
    }),

    reassignRemediationProposal: build.mutation<
      RemediationProposal,
      { id: string; team?: string; subject?: string }
    >({
      query: ({ id, team, subject }) => ({
        url: `/remediation/proposals/${id}/reassign`,
        method: 'POST',
        body: { owner: { team: team ?? '', subject: subject ?? '' } },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'RemediationProposal', id: 'LIST' },
        { type: 'RemediationProposal', id },
      ],
    }),

    attachChangeSetToRemediation: build.mutation<
      RemediationProposal,
      { id: string; ref: RemediationChangeSet }
    >({
      query: ({ id, ref }) => ({
        url: `/remediation/proposals/${id}/changeset`,
        method: 'POST',
        body: ref,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'RemediationProposal', id: 'LIST' },
        { type: 'RemediationProposal', id },
      ],
    }),

    createRemediationBatch: build.mutation<RemediationBatchResponse, { ids: string[] }>({
      query: ({ ids }) => ({
        url: '/remediation/batches',
        method: 'POST',
        body: { ids },
      }),
      invalidatesTags: () => [{ type: 'RemediationProposal', id: 'LIST' }],
    }),

    approveRemediationBatch: build.mutation<RemediationBatchResponse, { batchId: string; reason?: string }>({
      query: ({ batchId, reason }) => ({
        url: `/remediation/batches/${batchId}/approve`,
        method: 'POST',
        body: { reason: reason ?? '' },
      }),
      invalidatesTags: () => [{ type: 'RemediationProposal', id: 'LIST' }],
    }),
  }),
});

export const {
  useListRemediationProposalsQuery,
  useGetRemediationProposalQuery,
  useApproveRemediationProposalMutation,
  useRejectRemediationProposalMutation,
  useScheduleRemediationProposalMutation,
  useReassignRemediationProposalMutation,
  useAttachChangeSetToRemediationMutation,
  useCreateRemediationBatchMutation,
  useApproveRemediationBatchMutation,
} = remediationApi;
