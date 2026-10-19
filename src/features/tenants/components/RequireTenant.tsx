import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useGetMeQuery } from '@/features/auth/services/authApi';
import { ErrorState, LoadingState } from '@/shared/components/feedback';
import { errorMessage } from '@/shared/lib/api';
import { ROUTES } from '@/shared/config';
import { TenantSelector } from './TenantSelector';
import { useTenantAccess } from './useTenantAccess';

// Mount tenant-scoped features only after validating the stored selection.
// The API still authorizes every request; this guard provides the missing
// onboarding/recovery flow for new sessions and suspended or revoked tenants.
export function RequireTenant({ children }: { children: ReactNode }) {
  const { isLoading, error, refetch, selected, tenants, hasAccess } = useTenantAccess();
  const { data: principal } = useGetMeQuery();
  if (isLoading) return <LoadingState message="Loading tenant access..." />;
  if (error) return <ErrorState message={errorMessage(error)} onRetry={refetch} />;
  if (hasAccess) return <>{children}</>;
  return <section aria-label="Tenant selection required" className="space-y-4 rounded-lg border border-slate-700 bg-slate-800/50 p-6">
    <h2 className="text-xl font-semibold">{selected ? 'Tenant unavailable' : 'Choose a tenant to continue'}</h2>
    <p className="text-slate-300">
      {selected
        ? 'The selected tenant is inactive or your account no longer has access. Choose an active tenant.'
        : 'Assistant and Remediation belong to a tenant. Select your workspace before opening this feature.'}
    </p>
    {tenants.length > 0 ? <TenantSelector label="Select tenant" /> : <p className="text-slate-300">
      {principal?.isAdmin ? 'Create an active tenant in Tenants, then select it here.' : 'Ask a tenant owner or platform administrator to grant your account access.'}
    </p>}
    {principal?.isAdmin && <Link to={ROUTES.TENANTS} className="inline-block text-blue-300 underline">Manage tenants</Link>}
  </section>;
}
