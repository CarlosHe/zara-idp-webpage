import { baseApi, unwrapItems } from '@/shared/lib/api';
import type { RuntimePolicy } from '@/shared/types';

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

    getRuntimePolicy: build.query<RuntimePolicy, { namespace: string; name: string }>({
      query: ({ namespace, name }) => `/policies/runtime/${namespace}/${name}`,
      providesTags: (_result, _err, arg) => [
        { type: 'RuntimePolicy', id: `${arg.namespace}-${arg.name}` },
      ],
    }),
  }),
  overrideExisting: false,
});

export const { useListRuntimePoliciesQuery, useGetRuntimePolicyQuery } = policiesApi;
