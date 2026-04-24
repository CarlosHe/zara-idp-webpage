import { Snowflake } from 'lucide-react';
import { useListFreezesQuery } from '@/features/freezes/services/freezesApi';
import { errorMessage } from '@/shared/lib/api';
import { Alert } from '@/shared/components/ui';
import { PageHeader, ErrorState } from '@/shared/components/feedback';
import { FreezeListView } from './FreezeListView';

export function FreezesPage() {
  const { data: freezes, isLoading: loading, error, refetch } = useListFreezesQuery();

  const safeFreezes = Array.isArray(freezes) ? freezes : [];
  const activeFreezes = safeFreezes.filter((f) => f.active);
  const inactiveFreezes = safeFreezes.filter((f) => !f.active);

  if (error) {
    const message = errorMessage(error) || 'Failed to load freezes';
    return <ErrorState message={message} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        icon={<Snowflake className="h-6 w-6" />}
        iconClassName="text-cyan-400"
        title="Freezes"
        description="View active deployment freezes and change restrictions"
        onRefresh={refetch}
      />

      {/* Active Freezes Warning */}
      {activeFreezes.length > 0 && (
        <Alert type="warning" title={`${activeFreezes.length} Active Freeze${activeFreezes.length > 1 ? 's' : ''}`}>
          Changes may be restricted. Review active freezes below.
        </Alert>
      )}

      <FreezeListView
        activeFreezes={activeFreezes}
        inactiveFreezes={inactiveFreezes}
        loading={loading}
      />
    </div>
  );
}
