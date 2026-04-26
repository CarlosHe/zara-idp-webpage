import { baseApi, unwrapItems } from '@/shared/lib/api';
import type {
  GovernanceKPIs,
  PermissionProposal,
  RemediationPlan,
  Scorecard,
  ScorecardEvaluation,
  ScorecardRule,
  Waiver,
} from '../types';

interface ListResponse<T> {
  items: T[];
  total: number;
}

interface CreateScorecardArgs {
  slug: string;
  title: string;
  owner: string;
  description?: string;
  appliesToKinds?: string[];
  rules: ScorecardRule[];
  activate?: boolean;
}

interface EvaluateArgs {
  scorecardSlug?: string;
  entityKind: string;
  namespace: string;
  entityName: string;
}

interface CreateWaiverArgs {
  entityKey: string;
  scorecardSlug: string;
  ruleCode: string;
  reason: string;
  owner: string;
  expiresAt: string;
}

interface ApproveWaiverArgs {
  id: string;
  approver: string;
}

interface RevokeWaiverArgs {
  id: string;
  revoker: string;
  reason: string;
}

interface ProposePermissionArgs {
  action: 'grant' | 'revoke' | 'update';
  bindingName: string;
  roleName?: string;
  subject?: { kind: string; name: string; namespace?: string };
  namespace?: string;
  requestedBy: string;
  justification: string;
}

export const scorecardsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listScorecards: build.query<Scorecard[], void>({
      query: () => '/scorecards',
      transformResponse: (raw: ListResponse<Scorecard>) => unwrapItems<Scorecard>(raw),
      providesTags: () => [{ type: 'Scorecard', id: 'LIST' }],
    }),

    getScorecard: build.query<Scorecard, string>({
      query: (slug) => `/scorecards/${slug}`,
      providesTags: (_result, _err, slug) => [{ type: 'Scorecard', id: slug }],
    }),

    createScorecard: build.mutation<Scorecard, CreateScorecardArgs>({
      query: (body) => ({ url: '/scorecards', method: 'POST', body }),
      invalidatesTags: [{ type: 'Scorecard', id: 'LIST' }],
    }),

    evaluateScorecard: build.mutation<ScorecardEvaluation, EvaluateArgs & { scorecardSlug: string }>({
      query: ({ scorecardSlug, ...body }) => ({
        url: `/scorecards/${scorecardSlug}:evaluate`,
        method: 'POST',
        body,
      }),
    }),

    evaluateAllScorecards: build.mutation<ScorecardEvaluation[], EvaluateArgs>({
      query: (body) => ({ url: '/scorecards:evaluateAll', method: 'POST', body }),
      transformResponse: (raw: ListResponse<ScorecardEvaluation>) =>
        unwrapItems<ScorecardEvaluation>(raw),
    }),

    listWaivers: build.query<Waiver[], { entityKey?: string; scorecardSlug?: string; includeExpired?: boolean } | void>({
      query: (args) => {
        const params: Record<string, string> = {};
        if (args && args.entityKey) params.entityKey = args.entityKey;
        if (args && args.scorecardSlug) params.scorecardSlug = args.scorecardSlug;
        if (args && args.includeExpired) params.includeExpired = 'true';
        return { url: '/waivers', params };
      },
      transformResponse: (raw: ListResponse<Waiver>) => unwrapItems<Waiver>(raw),
      providesTags: () => [{ type: 'Waiver', id: 'LIST' }],
    }),

    createWaiver: build.mutation<Waiver, CreateWaiverArgs>({
      query: (body) => ({ url: '/waivers', method: 'POST', body }),
      invalidatesTags: [{ type: 'Waiver', id: 'LIST' }, { type: 'GovernanceKPI', id: 'KPI' }],
    }),

    approveWaiver: build.mutation<Waiver, ApproveWaiverArgs>({
      query: ({ id, approver }) => ({
        url: `/waivers/${id}:approve`,
        method: 'POST',
        body: { approver },
      }),
      invalidatesTags: [{ type: 'Waiver', id: 'LIST' }, { type: 'GovernanceKPI', id: 'KPI' }],
    }),

    revokeWaiver: build.mutation<Waiver, RevokeWaiverArgs>({
      query: ({ id, revoker, reason }) => ({
        url: `/waivers/${id}:revoke`,
        method: 'POST',
        body: { revoker, reason },
      }),
      invalidatesTags: [{ type: 'Waiver', id: 'LIST' }, { type: 'GovernanceKPI', id: 'KPI' }],
    }),

    planRemediation: build.mutation<RemediationPlan[], EvaluateArgs & { scorecardSlug: string }>({
      query: (body) => ({ url: '/remediation/plan', method: 'POST', body }),
      transformResponse: (raw: ListResponse<RemediationPlan>) =>
        unwrapItems<RemediationPlan>(raw),
    }),

    proposePermission: build.mutation<PermissionProposal, ProposePermissionArgs>({
      query: (body) => ({ url: '/permissions:propose', method: 'POST', body }),
    }),

    governanceKPIs: build.query<GovernanceKPIs, void>({
      query: () => '/governance/kpis',
      providesTags: () => [{ type: 'GovernanceKPI', id: 'KPI' }],
    }),
  }),
});

export const {
  useListScorecardsQuery,
  useGetScorecardQuery,
  useCreateScorecardMutation,
  useEvaluateScorecardMutation,
  useEvaluateAllScorecardsMutation,
  useListWaiversQuery,
  useCreateWaiverMutation,
  useApproveWaiverMutation,
  useRevokeWaiverMutation,
  usePlanRemediationMutation,
  useProposePermissionMutation,
  useGovernanceKPIsQuery,
} = scorecardsApi;
