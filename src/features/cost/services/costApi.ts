import { baseApi } from '@/shared/lib/api';
import type {
  BudgetUpsertRequest,
  CostBudgetListResponse,
  CostDashboard,
  CostFindingsResponse,
  CostRemediationsResponse,
} from '../types/cost';

// Sprint-26 / L-2604..L-2607 — RTK Query slice for cost dashboards.
// Endpoints map 1:1 onto the REST handlers in
// `internal/adapters/rest/handlers_cost.go`.

interface DashboardArgs {
  since?: string;
  until?: string;
}

export const costApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCostDashboard: build.query<CostDashboard, DashboardArgs | void>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.since) params.set('since', args.since);
        if (args?.until) params.set('until', args.until);
        const qs = params.toString();
        return qs ? `/cost/dashboard?${qs}` : '/cost/dashboard';
      },
      providesTags: [
        { type: 'CostDashboard', id: 'LIST' },
        { type: 'CostBudget', id: 'LIST' },
        { type: 'CostFinding', id: 'LIST' },
      ],
    }),

    listCostBudgets: build.query<CostBudgetListResponse, void>({
      query: () => '/cost/budgets',
      providesTags: [{ type: 'CostBudget', id: 'LIST' }],
    }),

    upsertCostBudget: build.mutation<{ id: string }, BudgetUpsertRequest>({
      query: (body) => ({ url: '/cost/budgets', method: 'POST', body }),
      invalidatesTags: [
        { type: 'CostBudget', id: 'LIST' },
        { type: 'CostDashboard', id: 'LIST' },
      ],
    }),

    deleteCostBudget: build.mutation<void, string>({
      query: (id) => ({ url: `/cost/budgets/${id}`, method: 'DELETE' }),
      invalidatesTags: [
        { type: 'CostBudget', id: 'LIST' },
        { type: 'CostDashboard', id: 'LIST' },
      ],
    }),

    listCostFindings: build.query<CostFindingsResponse, void>({
      query: () => '/cost/findings',
      providesTags: [{ type: 'CostFinding', id: 'LIST' }],
    }),

    listCostRemediations: build.query<CostRemediationsResponse, void>({
      query: () => '/cost/remediations',
      providesTags: [{ type: 'CostFinding', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCostDashboardQuery,
  useListCostBudgetsQuery,
  useUpsertCostBudgetMutation,
  useDeleteCostBudgetMutation,
  useListCostFindingsQuery,
  useListCostRemediationsQuery,
} = costApi;
