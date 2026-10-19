import { TENANT_KEY, useTenantAccess } from './useTenantAccess';

export function TenantSelector({ label = 'Tenant' }: { label?: string }) {
  const { selected, tenants, isLoading, isError } = useTenantAccess();
  return <select aria-label={label} value={selected} disabled={isLoading || isError}
    className="max-w-48 rounded-md border border-slate-700 bg-slate-800 p-2 text-sm text-slate-200"
    onChange={(event) => {
      if (event.target.value) localStorage.setItem(TENANT_KEY, event.target.value);
      else localStorage.removeItem(TENANT_KEY);
      // A tenant switch must discard every cached query and local conversation
      // selection before the next tenant can render. Reload also handles deep links.
      window.location.reload();
    }}>
    <option value="">{isLoading ? 'Loading tenants…' : isError ? 'Tenants unavailable' : 'Choose tenant'}</option>
    {selected && !tenants.some((tenant) => tenant.id === selected) && <option value={selected} disabled>Unavailable tenant</option>}
    {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.displayName}</option>)}
  </select>;
}
