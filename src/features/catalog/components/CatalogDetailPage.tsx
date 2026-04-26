import { useParams } from 'react-router-dom';
import { Network } from 'lucide-react';
import { PageHeader, ErrorState, LoadingState } from '@/shared/components/feedback';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui';
import { errorMessage } from '@/shared/lib/api';
import { useGetCatalogEntityQuery } from '../services/catalogApi';
import { CatalogEntityGraph } from './CatalogEntityGraph';

export function CatalogDetailPage() {
  const params = useParams<{ kind: string; namespace: string; name: string }>();
  const key = {
    kind: params.kind ?? '',
    namespace: params.namespace ?? '',
    name: params.name ?? '',
  };
  const { data: entity, isLoading, error, refetch } = useGetCatalogEntityQuery(key, {
    skip: !key.kind || !key.namespace || !key.name,
  });

  if (isLoading) return <LoadingState message="Loading catalog entity..." />;
  if (error || !entity) {
    return <ErrorState message={errorMessage(error) || 'Catalog entity not found'} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<Network className="h-6 w-6" />}
        iconClassName="text-cyan-400"
        title={`${entity.metadata.namespace}/${entity.metadata.name}`}
        description={`${entity.kind} catalog entity backed by the control plane`}
        onRefresh={refetch}
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Desired specification</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-200">
              {JSON.stringify(entity.spec, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relationships</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {entity.relationships.length === 0 ? (
              <p className="text-sm text-slate-400">No relationships declared.</p>
            ) : (
              entity.relationships.map((relationship) => (
                <div
                  key={`${relationship.type}-${relationship.targetKind}-${relationship.namespace}-${relationship.targetName}`}
                  className="rounded-lg border border-slate-700/60 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Badge>{relationship.type}</Badge>
                    <span className="text-xs text-slate-400">{relationship.targetKind}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-200">
                    {relationship.namespace}/{relationship.targetName}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <CatalogEntityGraph kind={key.kind} namespace={key.namespace} name={key.name} />
    </div>
  );
}
