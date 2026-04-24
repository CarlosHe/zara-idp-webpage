import { baseApi, unwrapItems } from '@/shared/lib/api';
import type { Team, Resource, ApiResponse, PaginationParams, OnCallInfo } from '@/shared/types';

interface TeamCreate {
  name: string;
  namespace?: string;
  displayName?: string;
  slackChannel?: string;
}

interface TeamUpdate {
  displayName?: string;
  slackChannel?: string;
}

// Backend historically returned `{ primary: string, secondary?: string }`
// but today ships full `OnCallInfo` shapes. Accept both until the server
// settles on one contract; consumers narrow as needed.
type OnCallResponse = OnCallInfo;

export const teamsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listTeams: build.query<Team[], void>({
      query: () => '/teams',
      transformResponse: (raw: unknown) => unwrapItems<Team>(raw),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Team' as const, id })),
              { type: 'Team' as const, id: 'LIST' },
            ]
          : [{ type: 'Team' as const, id: 'LIST' }],
    }),

    getTeam: build.query<Team, string>({
      query: (id) => `/teams/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Team', id }],
    }),

    getTeamResources: build.query<
      ApiResponse<Resource[]>,
      { id: string; pagination?: PaginationParams }
    >({
      query: ({ id, pagination }) => ({
        url: `/teams/${id}/resources`,
        params: pagination,
      }),
    }),

    getTeamOnCall: build.query<OnCallResponse, string>({
      query: (id) => `/teams/${id}/oncall`,
      providesTags: (_result, _err, id) => [{ type: 'Team', id: `oncall-${id}` }],
    }),

    createTeam: build.mutation<Team, TeamCreate>({
      query: (body) => ({ url: '/teams', method: 'POST', body }),
      invalidatesTags: [{ type: 'Team', id: 'LIST' }],
    }),

    updateTeam: build.mutation<Team, { id: string; data: TeamUpdate }>({
      query: ({ id, data }) => ({ url: `/teams/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'Team', id: 'LIST' },
        { type: 'Team', id: arg.id },
      ],
    }),

    deleteTeam: build.mutation<void, string>({
      query: (id) => ({ url: `/teams/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'Team', id: 'LIST' },
        { type: 'Team', id },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListTeamsQuery,
  useGetTeamQuery,
  useGetTeamResourcesQuery,
  useGetTeamOnCallQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
} = teamsApi;
