import { Snowflake } from 'lucide-react';
import { useState } from 'react';
import { useGetMeQuery } from '@/features/auth/services/authApi';
import { useListFreezesQuery } from '@/features/freezes/services/freezesApi';
import { errorMessage } from '@/shared/lib/api';
import { Alert, Button } from '@/shared/components/ui';
import { PageHeader, ErrorState } from '@/shared/components/feedback';
import { FreezeListView } from './FreezeListView';
import { FreezeEditor } from './FreezeEditor';

export function FreezesPage() {
  const [editing, setEditing] = useState(false);
  const { data: principal } = useGetMeQuery();
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
        actions={principal?.isAdmin && <Button onClick={() => setEditing(true)}>Create freeze</Button>}
      />
      {editing && <FreezeEditor onClose={() => setEditing(false)} />}

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
