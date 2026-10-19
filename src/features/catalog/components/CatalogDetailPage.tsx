import { lazy, Suspense, useState } from 'react';
import { ROUTES } from '@/shared/config';
import { useNavigate, useParams } from 'react-router-dom';
import { Network } from 'lucide-react';
import { PageHeader, ErrorState, LoadingState } from '@/shared/components/feedback';
import { Badge, Button, ConfirmModal, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui';
import { errorMessage } from '@/shared/lib/api';
import { useGetCatalogEntityQuery, useDeleteCatalogEntityMutation } from '../services/catalogApi';
import { CatalogEntityGraph } from './CatalogEntityGraph';

const CatalogEntityForm = lazy(() => import('./CatalogEntityForm').then((m) => ({ default: m.CatalogEntityForm })));

export function CatalogDetailPage() {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [remove, removeState] = useDeleteCatalogEntityMutation();
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
        actions={<><Button onClick={() => setEditing(true)}>Edit entity</Button><Button variant="danger" onClick={() => setDeleting(true)}>Delete entity</Button></>}
      />

      {editing && <Suspense fallback={null}><CatalogEntityForm entity={entity} onClose={() => setEditing(false)} /></Suspense>}
      {removeState.error && <p role="alert" className="text-red-400">{errorMessage(removeState.error)}</p>}
      <ConfirmModal isOpen={deleting} onClose={() => setDeleting(false)} title="Delete catalog entity" message="Remove this catalog registration? Provisioned infrastructure is managed from Resources." confirmText="Delete registration" loading={removeState.isLoading} onConfirm={async () => {
        try { await remove(key).unwrap(); navigate(ROUTES.CATALOG.LIST); } catch { /* Error remains visible and dialog stays open. */ }
      }} />
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
