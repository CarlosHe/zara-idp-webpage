import { useState } from 'react';
import { useListTenantsQuery } from '@/features/tenants/services/tenantsApi';
import { useGetMeQuery } from '@/features/auth/services/authApi';
import { ThemeToggle } from '@/features/theme/components/ThemeToggle';

export function WorkspaceControls() {
  const { data, isLoading } = useListTenantsQuery();
  const { data: principal } = useGetMeQuery();
  const [selected] = useState(() => localStorage.getItem('zara.tenant') ?? '');
  const email = principal?.email?.toLowerCase();
  const tenants = (data?.items ?? []).filter((tenant) => tenant.lifecycle === 'active' &&
    (principal?.isAdmin || tenant.owner.toLowerCase() === email || tenant.admins.some((admin) => admin.toLowerCase() === email)));

  return <>
    <select aria-label="Tenant" value={selected} disabled={isLoading}
      className="max-w-48 rounded-md border border-slate-700 bg-slate-800 p-2 text-sm text-slate-200"
      onChange={(event) => {
        if (event.target.value) localStorage.setItem('zara.tenant', event.target.value);
        else localStorage.removeItem('zara.tenant');
        window.location.reload();
      }}>
      <option value="">Choose tenant</option>
      {selected && !tenants.some((tenant) => tenant.id === selected) && <option value={selected} disabled>Unavailable tenant</option>}
      {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.displayName}</option>)}
    </select>
    <ThemeToggle />
    <span className="text-sm text-slate-300">{principal?.username}</span>
  </>;
}
