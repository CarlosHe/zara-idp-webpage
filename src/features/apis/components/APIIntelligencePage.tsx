import { useMemo, useState } from 'react';
import { Plug } from 'lucide-react';
import { ErrorState, LoadingState, PageHeader } from '@/shared/components/feedback';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui';
import { errorMessage } from '@/shared/lib/api';
import { useGetAPIEntryQuery, useListAPIEntriesQuery } from '../services/apisApi';
import type { APIEntry, APISummary } from '../types';
import { APIDetail } from './APIDetail';

export function APIIntelligencePage() {
  const { data: apis = [], isLoading, error, refetch } = useListAPIEntriesQuery();
  const [selected, setSelected] = useState<APISummary | null>(null);

  const ordered = useMemo(
    () => [...apis].sort((a, b) => (a.namespace + '/' + a.name).localeCompare(b.namespace + '/' + b.name)),
    [apis],
  );

  if (isLoading) return <LoadingState message="Loading APIs..." />;
  if (error) return <ErrorState message={errorMessage(error) || 'Failed to load API registry'} onRetry={refetch} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<Plug className="h-6 w-6" />}
        iconClassName="text-blue-400"
        title="API Intelligence"
        description="API registry, semver versions, breaking-change diffs, and consumer impact"
        onRefresh={refetch}
      />

      {ordered.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-slate-400">
              No APIs registered yet. Once a service emits an API manifest the registry will list it
              here with its versions, owner, and consumer impact.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>APIs ({ordered.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ordered.map((api) => (
                <Button
                  key={api.id}
                  type="button"
                  variant={selected?.id === api.id ? 'primary' : 'secondary'}
                  className="w-full justify-start"
                  onClick={() => setSelected(api)}
                  aria-label={`Select ${api.namespace}/${api.name}`}
                >
                  <span className="flex items-center justify-between gap-2 w-full">
                    <span className="truncate text-left">
                      <strong className="text-slate-100">{api.name}</strong>
                      <span className="text-slate-400 text-xs ml-2">{api.namespace}</span>
                    </span>
                    {api.latestSemver ? <Badge variant="outline">v{api.latestSemver}</Badge> : null}
                  </span>
                </Button>
              ))}
            </CardContent>
          </Card>

          {selected ? (
            <ConnectedAPIDetail summary={selected} />
          ) : (
            <Card>
              <CardContent>
                <p className="text-sm text-slate-400">Select an API on the left to see its detail.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function ConnectedAPIDetail({ summary }: { summary: APISummary }) {
  const { data, isLoading, error, refetch } = useGetAPIEntryQuery({
    namespace: summary.namespace,
    name: summary.name,
  });
  if (isLoading) return <LoadingState message="Loading API..." />;
  if (error) return <ErrorState message={errorMessage(error) || 'Failed to load API'} onRetry={refetch} />;
  if (!data) return null;
  return <APIDetail entry={data as APIEntry} />;
}
