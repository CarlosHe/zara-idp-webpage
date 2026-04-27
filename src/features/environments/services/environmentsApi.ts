import { baseApi } from '@/shared/lib/api';
import type {
  DestroyRequest,
  DestroyResponse,
  Environment,
  EnvironmentListResponse,
  ExtendRequest,
  ProvisionRequest,
  ProvisionResponse,
} from '../types/environments';

// Sprint 27 / L-2705 — RTK Query slice for the dev environments
// dashboard. Endpoints map 1:1 onto the REST handlers in
// `internal/adapters/rest/handlers_environments.go`.

interface ListArgs {
  owner?: string;
  team?: string;
  state?: string;
}

export const environmentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listEnvironments: build.query<EnvironmentListResponse, ListArgs | void>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.owner) params.set('owner', args.owner);
        if (args?.team) params.set('team', args.team);
        if (args?.state) params.set('state', args.state);
        const qs = params.toString();
        return qs ? `/environments?${qs}` : '/environments';
      },
      providesTags: [{ type: 'Environment', id: 'LIST' }],
    }),

    getEnvironment: build.query<Environment, string>({
      query: (id) => `/environments/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Environment', id }],
    }),

    provisionEnvironment: build.mutation<ProvisionResponse, ProvisionRequest>({
      query: (body) => ({ url: '/environments', method: 'POST', body }),
      invalidatesTags: [{ type: 'Environment', id: 'LIST' }],
    }),

    destroyEnvironment: build.mutation<
      DestroyResponse,
      { id: string; body: DestroyRequest }
    >({
      query: ({ id, body }) => ({
        url: `/environments/${id}/destroy`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Environment', id: 'LIST' },
        { type: 'Environment', id },
      ],
    }),

    extendEnvironment: build.mutation<
      Environment,
      { id: string; body: ExtendRequest }
    >({
      query: ({ id, body }) => ({
        url: `/environments/${id}/extend`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Environment', id: 'LIST' },
        { type: 'Environment', id },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListEnvironmentsQuery,
  useGetEnvironmentQuery,
  useProvisionEnvironmentMutation,
  useDestroyEnvironmentMutation,
  useExtendEnvironmentMutation,
} = environmentsApi;
