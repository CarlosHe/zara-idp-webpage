import { Shield } from 'lucide-react';
import { PageHeader, ErrorState } from '@/shared/components/feedback';
import { usePoliciesDashboard } from '@/features/policies/hooks/usePoliciesDashboard';
import { PolicyListView } from './PolicyListView';

export function PoliciesPage() {
  const { enabledPolicies, disabledPolicies, loading, errorText, refetch } =
    usePoliciesDashboard();

  if (errorText) {
    return <ErrorState message={errorText} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<Shield className="h-6 w-6" />}
        iconClassName="text-blue-400"
        title="Runtime Policies"
        description="Manage policies that control runtime behavior and change restrictions"
        onRefresh={refetch}
      />

      <PolicyListView
        enabledPolicies={enabledPolicies}
        disabledPolicies={disabledPolicies}
        loading={loading}
      />
    </div>
  );
}
