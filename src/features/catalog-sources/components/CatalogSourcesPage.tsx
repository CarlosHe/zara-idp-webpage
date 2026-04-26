import { useMemo, useState } from 'react';
import { Database, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui';
import { DataEmptyState, LoadingState } from '@/shared/components/feedback';
import { errorMessage } from '@/shared/lib/api';
import { formatDate } from '@/shared/utils/utils';
import {
  useListCatalogSourcesQuery,
  useSyncCatalogSourceMutation,
} from '../services/catalogSourcesApi';
import type {
  CatalogSource,
  CatalogSyncResponse,
} from '../types';

interface SyncSummary {
  sourceId: string;
  result?: CatalogSyncResponse;
  error?: string;
}

export function CatalogSourcesPage() {
  const { data: sources, isLoading, isError, error, refetch } = useListCatalogSourcesQuery();
  const [syncSource, syncState] = useSyncCatalogSourceMutation();
  const [syncSummary, setSyncSummary] = useState<SyncSummary | null>(null);

  const sortedSources = useMemo(
    () => (sources ?? []).slice().sort((a, b) => a.id.localeCompare(b.id)),
    [sources],
  );

  const handleSync = async (source: CatalogSource, dryRun: boolean) => {
    try {
      const result = await syncSource({ id: source.id, dryRun }).unwrap();
      setSyncSummary({ sourceId: source.id, result });
      void refetch();
    } catch (e) {
      setSyncSummary({ sourceId: source.id, error: errorMessage(e as never) });
    }
  };

  return (
    <main className="space-y-6 p-6">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-primary-600">Catalog</p>
        <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Catalog sources</h1>
        <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-300">
          Trigger discovery against GitHub, GitLab, Bitbucket, or any registered source. Each
          sync produces a reviewable ChangeSet — external mutations never bypass approval.
        </p>
      </section>

      {isLoading ? (
        <LoadingState message="Loading catalog sources..." />
      ) : isError ? (
        <DataEmptyState
          icon={<Database className="h-12 w-12 text-slate-400" aria-hidden="true" />}
          title="Catalog sources unavailable"
          description={errorMessage(error)}
        />
      ) : sortedSources.length === 0 ? (
        <DataEmptyState
          icon={<Database className="h-12 w-12 text-slate-400" aria-hidden="true" />}
          title="No catalog sources registered"
          description="Add sources via the bootstrap config to start ingesting Zara catalog manifests."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-label="Catalog sources">
          {sortedSources.map((source) => {
            const summary = syncSummary?.sourceId === source.id ? syncSummary : null;
            const isSyncing =
              syncState.isLoading && syncState.originalArgs?.id === source.id;
            return (
              <li key={source.id}>
                <Card>
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <CardTitle>{source.id}</CardTitle>
                        <CardDescription>
                          {source.description || 'No description'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{source.provider}</Badge>
                        {source.status.lastSyncOk ? (
                          <Badge variant="success">healthy</Badge>
                        ) : source.status.lastSyncAt ? (
                          <Badge variant="danger">degraded</Badge>
                        ) : (
                          <Badge variant="info">unsynced</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {source.owner ? (
                        <div>
                          <dt className="font-medium text-slate-500 dark:text-slate-400">Owner</dt>
                          <dd>{source.owner}</dd>
                        </div>
                      ) : null}
                      {source.url ? (
                        <div>
                          <dt className="font-medium text-slate-500 dark:text-slate-400">URL</dt>
                          <dd className="truncate">{source.url}</dd>
                        </div>
                      ) : null}
                      <div>
                        <dt className="font-medium text-slate-500 dark:text-slate-400">Manifests</dt>
                        <dd className="font-mono text-xs">
                          {source.manifestGlobs.length === 0
                            ? 'catalog-info.yaml'
                            : source.manifestGlobs.join(', ')}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium text-slate-500 dark:text-slate-400">Last sync</dt>
                        <dd>
                          {source.status.lastSyncAt
                            ? formatDate(source.status.lastSyncAt)
                            : 'Never'}
                        </dd>
                      </div>
                      {source.status.lastChangeSetId ? (
                        <div className="sm:col-span-2">
                          <dt className="font-medium text-slate-500 dark:text-slate-400">
                            Last ChangeSet
                          </dt>
                          <dd className="font-mono text-xs">
                            {source.status.lastChangeSetId}
                          </dd>
                        </div>
                      ) : null}
                      {source.status.lastErrorMessage ? (
                        <div className="sm:col-span-2">
                          <dt className="font-medium text-rose-600">Last error</dt>
                          <dd className="text-rose-600">{source.status.lastErrorMessage}</dd>
                        </div>
                      ) : null}
                    </dl>

                    {summary?.result ? (
                      <SyncSummaryCard summary={summary.result} />
                    ) : summary?.error ? (
                      <div
                        role="alert"
                        className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-700 dark:bg-rose-950/50 dark:text-rose-200"
                      >
                        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                        <span>{summary.error}</span>
                      </div>
                    ) : null}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => void handleSync(source, false)}
                        disabled={isSyncing}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                        {isSyncing ? 'Syncing…' : 'Sync now'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleSync(source, true)}
                        disabled={isSyncing}
                      >
                        Preview (dry-run)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

function SyncSummaryCard({ summary }: { summary: CatalogSyncResponse }) {
  const tone = summary.requiresApproval ? 'warning' : 'success';
  const Icon = summary.requiresApproval ? AlertTriangle : CheckCircle2;
  return (
    <div
      role="status"
      className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span>{summary.message || 'Sync completed'}</span>
        <Badge variant={tone === 'warning' ? 'warning' : 'success'}>
          {summary.records} records
        </Badge>
      </div>
      {summary.changesetId ? (
        <p>
          ChangeSet&nbsp;
          <code className="rounded bg-slate-200 px-1 text-xs dark:bg-slate-800">
            {summary.changesetId}
          </code>
          {summary.requiresApproval ? ' — awaits approval' : ' — auto-applied'}
        </p>
      ) : null}
      {summary.errors && summary.errors.length > 0 ? (
        <details className="rounded-md bg-rose-50 p-2 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-200">
          <summary>{summary.errors.length} record error(s)</summary>
          <ul className="mt-2 space-y-1">
            {summary.errors.map((err, idx) => (
              <li key={`${err.path}-${idx}`}>
                <span className="font-mono">{err.path}</span> — {err.cause}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
