import { baseApi } from '@/shared/lib/api';
export interface RoleSummary { id?: string; name: string; displayName: string; description: string; scope: string; rulesCount: number }
export interface BindingSummary { id: string; name: string; namespace?: string; roleRef: { name: string }; subjects: Array<{ kind: string; name: string }> }
export const accessApi = baseApi.injectEndpoints({ endpoints: (build) => ({
  listAccessRoles: build.query<{ roles: RoleSummary[] }, void>({ query: () => '/rbac/roles' }),
  listAccessBindings: build.query<{ bindings: BindingSummary[] }, void>({ query: () => '/rbac/bindings' }),
  listClusterAccessBindings: build.query<{ bindings: BindingSummary[] }, void>({ query: () => '/rbac/cluster-bindings' }),
  checkCurrentAccess: build.mutation<{ allowed: boolean; reason: string }, { verb: string; resource: string; namespace: string }>({ query: (params) => ({ url: '/rbac/can-i', params }) }),
}) });
export const { useListAccessRolesQuery, useListAccessBindingsQuery, useListClusterAccessBindingsQuery, useCheckCurrentAccessMutation } = accessApi;
