import { baseApi, unwrapItems } from '@/shared/lib/api';
import type { RuntimePolicy } from '@/shared/types';

// Backend routes:
//   GET /policies/runtime
//   GET /policies/runtime/:id
export const policiesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listRuntimePolicies: build.query<RuntimePolicy[], void>({
      query: () => '/policies/runtime',
      transformResponse: (raw: unknown) => unwrapItems<RuntimePolicy>(raw),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'RuntimePolicy' as const, id })),
              { type: 'RuntimePolicy' as const, id: 'LIST' },
            ]
          : [{ type: 'RuntimePolicy' as const, id: 'LIST' }],
    }),

    getRuntimePolicy: build.query<RuntimePolicy, string>({
      query: (id) => `/policies/runtime/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'RuntimePolicy', id }],
    }),
  }),
  overrideExisting: false,
});

export const { useListRuntimePoliciesQuery, useGetRuntimePolicyQuery } = policiesApi;
