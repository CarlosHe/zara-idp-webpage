import { baseApi } from '@/shared/lib/api';
import type {
  Tenant,
  TenantList,
  TenantLifecycle,
  TenantQuota,
  TenantSLO,
  TenantSLOList,
} from '../types/tenants';

// Sprint 29 / L-2904 — RTK Query slice for the tenant admin surface.

interface ListArgs {
  lifecycle?: TenantLifecycle | '';
  q?: string;
}

interface CreateArgs {
  id: string;
  slug: string;
  displayName: string;
  owner: string;
  admins?: string[];
}

interface MutationArgs {
  id: string;
}

interface RenameArgs extends MutationArgs {
  displayName: string;
}

interface AddAdminArgs extends MutationArgs {
  email: string;
}

interface RemoveAdminArgs extends MutationArgs {
  email: string;
}

interface SuspendArgs extends MutationArgs {
  reason: string;
}

interface ArchiveArgs extends MutationArgs {
  reason: string;
}

interface SetQuotaArgs extends MutationArgs {
  key: string;
  limit: number;
}

export const tenantsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listTenants: build.query<TenantList, ListArgs | void>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.lifecycle) params.set('lifecycle', args.lifecycle);
        if (args?.q) params.set('q', args.q);
        const qs = params.toString();
        return qs ? `/tenants?${qs}` : '/tenants';
      },
      providesTags: (result) =>
        result
          ? [
              { type: 'Tenant', id: 'LIST' },
              ...result.items.map(
                (t: Tenant) => ({ type: 'Tenant', id: t.id }) as const,
              ),
            ]
          : [{ type: 'Tenant', id: 'LIST' }],
    }),

    getTenant: build.query<Tenant, string>({
      query: (id) => `/tenants/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Tenant', id }],
    }),

    createTenant: build.mutation<Tenant, CreateArgs>({
      query: (body) => ({ url: '/tenants', method: 'POST', body }),
      invalidatesTags: [{ type: 'Tenant', id: 'LIST' }],
    }),

    renameTenant: build.mutation<Tenant, RenameArgs>({
      query: ({ id, displayName }) => ({
        url: `/tenants/${id}/rename`,
        method: 'POST',
        body: { displayName },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Tenant', id: 'LIST' },
        { type: 'Tenant', id },
      ],
    }),

    addTenantAdmin: build.mutation<Tenant, AddAdminArgs>({
      query: ({ id, email }) => ({
        url: `/tenants/${id}/admins`,
        method: 'POST',
        body: { email },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Tenant', id: 'LIST' },
        { type: 'Tenant', id },
      ],
    }),

    removeTenantAdmin: build.mutation<Tenant, RemoveAdminArgs>({
      query: ({ id, email }) => ({
        url: `/tenants/${id}/admins/${encodeURIComponent(email)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Tenant', id: 'LIST' },
        { type: 'Tenant', id },
      ],
    }),

    suspendTenant: build.mutation<Tenant, SuspendArgs>({
      query: ({ id, reason }) => ({
        url: `/tenants/${id}/suspend`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Tenant', id: 'LIST' },
        { type: 'Tenant', id },
      ],
    }),

    reinstateTenant: build.mutation<Tenant, MutationArgs>({
      query: ({ id }) => ({ url: `/tenants/${id}/reinstate`, method: 'POST' }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Tenant', id: 'LIST' },
        { type: 'Tenant', id },
      ],
    }),

    archiveTenant: build.mutation<Tenant, ArchiveArgs>({
      query: ({ id, reason }) => ({
        url: `/tenants/${id}/archive`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Tenant', id: 'LIST' },
        { type: 'Tenant', id },
      ],
    }),

    getTenantQuota: build.query<TenantQuota, string>({
      query: (id) => `/tenants/${id}/quota`,
      providesTags: (_r, _e, id) => [{ type: 'TenantQuota', id }],
    }),

    setTenantQuota: build.mutation<TenantQuota, SetQuotaArgs>({
      query: ({ id, key, limit }) => ({
        url: `/tenants/${id}/quota`,
        method: 'PUT',
        body: { key, limit },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'TenantQuota', id }],
    }),

    getTenantSLO: build.query<TenantSLO, string>({
      query: (id) => `/tenants/${id}/slo`,
      providesTags: (_r, _e, id) => [{ type: 'TenantSLO', id }],
    }),

    listTenantSLO: build.query<TenantSLOList, void>({
      query: () => '/tenants/slo',
      providesTags: [{ type: 'TenantSLO', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListTenantsQuery,
  useGetTenantQuery,
  useCreateTenantMutation,
  useRenameTenantMutation,
  useAddTenantAdminMutation,
  useRemoveTenantAdminMutation,
  useSuspendTenantMutation,
  useReinstateTenantMutation,
  useArchiveTenantMutation,
  useGetTenantQuotaQuery,
  useSetTenantQuotaMutation,
  useGetTenantSLOQuery,
  useListTenantSLOQuery,
} = tenantsApi;
