import { baseApi, unwrapItems } from '@/shared/lib/api';
import type { BusinessDomain } from '../store/businessDomainTypes';

interface BusinessDomainCreate {
  name: string;
  namespace?: string;
  displayName?: string;
  description?: string;
  team: string;
}

interface BusinessDomainUpdate {
  displayName?: string;
  description?: string;
  team?: string;
}

export const businessDomainsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listBusinessDomains: build.query<BusinessDomain[], void>({
      query: () => '/domains',
      transformResponse: (raw: unknown) => unwrapItems<BusinessDomain>(raw),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'BusinessDomain' as const, id })),
              { type: 'BusinessDomain' as const, id: 'LIST' },
            ]
          : [{ type: 'BusinessDomain' as const, id: 'LIST' }],
    }),

    getBusinessDomain: build.query<BusinessDomain, string>({
      query: (id) => `/domains/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'BusinessDomain', id }],
    }),

    getBusinessDomainResources: build.query<unknown, string>({
      query: (id) => `/domains/${id}/resources`,
    }),

    createBusinessDomain: build.mutation<BusinessDomain, BusinessDomainCreate>({
      query: (body) => ({ url: '/domains', method: 'POST', body }),
      invalidatesTags: [{ type: 'BusinessDomain', id: 'LIST' }],
    }),

    updateBusinessDomain: build.mutation<
      BusinessDomain,
      { id: string; data: BusinessDomainUpdate }
    >({
      query: ({ id, data }) => ({ url: `/domains/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'BusinessDomain', id: 'LIST' },
        { type: 'BusinessDomain', id: arg.id },
      ],
    }),

    deleteBusinessDomain: build.mutation<void, string>({
      query: (id) => ({ url: `/domains/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'BusinessDomain', id: 'LIST' },
        { type: 'BusinessDomain', id },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListBusinessDomainsQuery,
  useGetBusinessDomainQuery,
  useGetBusinessDomainResourcesQuery,
  useCreateBusinessDomainMutation,
  useUpdateBusinessDomainMutation,
  useDeleteBusinessDomainMutation,
} = businessDomainsApi;
