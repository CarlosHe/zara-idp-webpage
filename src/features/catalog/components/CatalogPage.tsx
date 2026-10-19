import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, GitBranch } from 'lucide-react';
import { PageHeader, ErrorState, LoadingState } from '@/shared/components/feedback';
import { Badge, Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui';
import { ROUTES } from '@/shared/config';
import { errorMessage } from '@/shared/lib/api';
import { useListCatalogEntitiesQuery, useReindexCatalogEntityMutation } from '../services/catalogApi';
import type { CatalogEntity } from '../types';

const CatalogEntityForm = lazy(() => import('./CatalogEntityForm').then((m) => ({ default: m.CatalogEntityForm })));
const CatalogImportForm = lazy(() => import('./CatalogImportForm').then((m) => ({ default: m.CatalogImportForm })));

export function CatalogPage() {
  const { data: entities = [], isLoading, error, refetch } = useListCatalogEntitiesQuery();
  const [registering, setRegistering] = useState(false);
  const [importing, setImporting] = useState(false);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [reindex, reindexState] = useReindexCatalogEntityMutation();
  const filtered = entities.filter((e) => `${e.kind} ${e.metadata.namespace}/${e.metadata.name} ${String(e.spec.type ?? '')} ${String(e.spec.description ?? '')}`.toLowerCase().includes(filter.toLowerCase()));
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / 50) - 1));

  if (isLoading) return <LoadingState message="Loading catalog..." />;
  if (error) {
    return <ErrorState message={errorMessage(error) || 'Failed to load catalog'} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<Boxes className="h-6 w-6" />}
        iconClassName="text-blue-400"
        title="Catalog"
        description="Control-plane backed catalog entities with versions, generations, and relationships"
        onRefresh={refetch}
        actions={<><Button variant="secondary" onClick={() => setImporting(true)}>Import inventory</Button><Button onClick={() => setRegistering(true)}>Register entity</Button></>}
      />

      {reindexState.error && <p role="alert" className="text-red-400">{errorMessage(reindexState.error)}</p>}
      {registering && <Suspense fallback={null}><CatalogEntityForm onClose={() => setRegistering(false)} /></Suspense>}
      {importing && <Suspense fallback={null}><CatalogImportForm onClose={() => setImporting(false)} /></Suspense>}
      <Input label="Filter catalog" value={filter} onChange={(event) => { setFilter(event.target.value); setPage(0); }} placeholder="Namespace, name, kind or resource type" />
      <div className="flex items-center gap-3">
        <p role="status">{filtered.length} of {entities.length} catalog entities · Page {currentPage + 1} of {Math.max(1, Math.ceil(filtered.length / 50))}</p>
        <Button variant="secondary" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</Button>
        <Button variant="secondary" disabled={(currentPage + 1) * 50 >= filtered.length} onClick={() => setPage(currentPage + 1)}>Next</Button>
      </div>
      {entities.length === 0 && <p className="text-slate-300">No catalog entities yet. Register a service, API, or resource to enable search and scorecard evaluation.</p>}
      <section aria-label="Catalog entities" className="grid gap-4 xl:grid-cols-2">
        {filtered.slice(currentPage * 50, (currentPage + 1) * 50).map((entity) => (
          <CatalogEntityCard
            key={entity.key}
            entity={entity}
            reindexing={reindexState.isLoading}
            onReindex={() =>
              reindex({
                kind: entity.kind,
                namespace: entity.metadata.namespace,
                name: entity.metadata.name,
              })
            }
          />
        ))}
      </section>
    </div>
  );
}

interface CatalogEntityCardProps {
  entity: CatalogEntity;
  reindexing: boolean;
  onReindex: () => void;
}

function CatalogEntityCard({ entity, reindexing, onReindex }: CatalogEntityCardProps) {
  const relationshipCount = entity.relationships.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-white">
              <Link
                className="hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                to={ROUTES.CATALOG.DETAIL(entity.kind, entity.metadata.namespace, entity.metadata.name)}
              >
                {entity.metadata.namespace}/{entity.metadata.name}
              </Link>
            </CardTitle>
            <p className="mt-1 text-sm text-slate-400">{entity.key}</p>
          </div>
          <Badge variant="info">{entity.kind}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {entity.spec.managementMode === 'catalog-only' && <Badge variant="warning">Inventory snapshot · Metadata only</Badge>}
        {typeof entity.spec.description === 'string' && <p className="break-words text-sm text-slate-300">{entity.spec.description}</p>}
        {typeof entity.spec.type === 'string' && <p className="text-sm text-slate-400">{entity.spec.type}</p>}
        <div className="grid grid-cols-3 gap-3 text-sm">
          <Metric label="Version" value={entity.version.toString()} />
          <Metric label="Generation" value={entity.generation.toString()} />
          <Metric label="Relations" value={relationshipCount.toString()} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-sm text-slate-300">
            <GitBranch className="h-4 w-4" aria-hidden />
            {relationshipCount} typed relationship{relationshipCount === 1 ? '' : 's'}
          </span>
          <Button type="button" size="sm" variant="secondary" loading={reindexing} onClick={onReindex}>
            Reindex
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricProps {
  label: string;
  value: string;
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-900/60 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-100">{value}</p>
    </div>
  );
}
