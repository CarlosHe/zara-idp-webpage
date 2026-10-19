import { useState } from 'react';
import { useGetMeQuery } from '@/features/auth/services/authApi';
import { useListTenantsQuery } from '../services/tenantsApi';

export const TENANT_KEY = 'zara.tenant';

export function useTenantAccess() {
  const query = useListTenantsQuery();
  const principal = useGetMeQuery();
  const email = principal.data?.email?.toLowerCase();
  const tenants = (query.data?.items ?? []).filter((tenant) => tenant.lifecycle === 'active' &&
    (principal.data?.isAdmin || tenant.owner.toLowerCase() === email || tenant.admins.some((admin) => admin.toLowerCase() === email)));
  const [selected] = useState(() => localStorage.getItem(TENANT_KEY) ?? '');
  return {
    ...query,
    isLoading: query.isLoading || principal.isLoading,
    tenants,
    selected,
    hasAccess: tenants.some((tenant) => tenant.id === selected),
  };
}

