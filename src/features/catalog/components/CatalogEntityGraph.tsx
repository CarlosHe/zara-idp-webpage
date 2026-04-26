import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui';
import { ErrorState, LoadingState } from '@/shared/components/feedback';
import { errorMessage } from '@/shared/lib/api';
import { useGetCatalogEntityGraphQuery } from '../services/catalogApi';
import type { CatalogGraphRelationship, QualityFinding, QualitySeverity } from '../types';

interface CatalogEntityGraphProps {
  kind: string;
  namespace: string;
  name: string;
}

const SEVERITY_CLASSES: Record<QualitySeverity, string> = {
  high: 'bg-red-500/20 text-red-200',
  medium: 'bg-amber-500/20 text-amber-200',
  low: 'bg-slate-600/40 text-slate-200',
};

function scoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-300';
  if (score >= 70) return 'text-amber-300';
  return 'text-red-300';
}

function RelationshipList({
  title,
  relationships,
  emptyMessage,
}: {
  title: string;
  relationships: CatalogGraphRelationship[];
  emptyMessage: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {relationships.length === 0 ? (
          <p className="text-sm text-slate-400">{emptyMessage}</p>
        ) : (
          <ul className="space-y-2" aria-label={title}>
            {relationships.map((rel) => (
              <li
                key={`${rel.type}-${rel.kind}-${rel.namespace}-${rel.name}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-700/60 p-3"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-slate-200">
                    {rel.namespace}/{rel.name}
                  </span>
                  <span className="text-xs text-slate-400">{rel.kind}</span>
                </div>
                <Badge>{rel.type}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function QualityFindingItem({ finding }: { finding: QualityFinding }) {
  return (
    <li
      className="flex items-start gap-3 rounded-lg border border-slate-700/60 p-3"
      data-testid={`finding-${finding.code}`}
    >
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${SEVERITY_CLASSES[finding.severity]}`}
        aria-label={`Severity ${finding.severity}`}
      >
        {finding.severity}
      </span>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-slate-200">{finding.message}</span>
        <span className="text-xs text-slate-400">
          {finding.code}
          {finding.field ? ` · ${finding.field}` : null}
        </span>
      </div>
    </li>
  );
}

export function CatalogEntityGraph({ kind, namespace, name }: CatalogEntityGraphProps) {
  const { data, isLoading, error, refetch } = useGetCatalogEntityGraphQuery(
    { kind, namespace, name },
    { skip: !kind || !namespace || !name },
  );

  if (isLoading) return <LoadingState message="Loading entity graph..." />;
  if (error || !data) {
    return (
      <ErrorState
        message={errorMessage(error) || 'Catalog entity graph unavailable'}
        onRetry={refetch}
      />
    );
  }

  return (
    <section aria-label="Catalog entity graph" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Quality</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span
              className={`text-3xl font-semibold ${scoreColor(data.quality.score)}`}
              aria-label={`Quality score ${data.quality.score} of 100`}
            >
              {data.quality.score}
            </span>
            <span className="text-sm text-slate-400">
              {data.quality.findings.length === 0
                ? 'No quality findings'
                : `${data.quality.findings.length} finding${data.quality.findings.length === 1 ? '' : 's'}`}
            </span>
          </div>
          {data.quality.findings.length > 0 ? (
            <ul className="mt-4 space-y-2" aria-label="Quality findings">
              {data.quality.findings.map((finding) => (
                <QualityFindingItem key={finding.code} finding={finding} />
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Owners</CardTitle>
        </CardHeader>
        <CardContent>
          {data.owners.length === 0 ? (
            <p className="text-sm text-slate-400">No owners declared.</p>
          ) : (
            <ul className="space-y-2" aria-label="Owners">
              {data.owners.map((owner, index) => (
                <li
                  key={`${owner.source}-${owner.ref}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-700/60 p-3"
                >
                  <span className="text-sm text-slate-200">{owner.ref}</span>
                  <span className="text-xs text-slate-400">{owner.source}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <RelationshipList
          title="Dependencies"
          relationships={data.dependencies}
          emptyMessage="No declared dependencies."
        />
        <RelationshipList
          title="Dependents"
          relationships={data.dependents}
          emptyMessage="No dependents discovered."
        />
      </div>
    </section>
  );
}
