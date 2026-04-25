import { Link } from 'react-router-dom';
import { Boxes, GitBranch } from 'lucide-react';
import { PageHeader, ErrorState, LoadingState } from '@/shared/components/feedback';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui';
import { ROUTES } from '@/shared/config';
import { errorMessage } from '@/shared/lib/api';
import { useListCatalogEntitiesQuery, useReindexCatalogEntityMutation } from '../services/catalogApi';
import type { CatalogEntity } from '../types';

export function CatalogPage() {
  const { data: entities = [], isLoading, error, refetch } = useListCatalogEntitiesQuery();
  const [reindex, reindexState] = useReindexCatalogEntityMutation();

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
      />

      <section aria-label="Catalog entities" className="grid gap-4 xl:grid-cols-2">
        {entities.map((entity) => (
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
