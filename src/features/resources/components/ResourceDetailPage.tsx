import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Box,
  GitCompare,
  RefreshCw,
  Server,
} from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  StatusBadge,
} from '@/shared/components/ui';
import { DataEmptyState, LoadingState } from '@/shared/components/feedback';
import { errorMessage } from '@/shared/lib/api';
import { ROUTES } from '@/shared/config';
import { formatRelativeTime } from '@/shared/utils';
import type { HealthStatus } from '@/shared/types';
import {
  useGetResourceDependenciesQuery,
  useGetResourceEventsQuery,
  useGetResourceQuery,
  useLazyDetectDriftQuery,
  useReconcileResourceMutation,
} from '../services/resourcesApi';
import { asApplicationSpec, resolvePlatformLabel } from '../types/applicationSpec';

export function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const resourceId = id ?? '';

  const {
    data: resource,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetResourceQuery(resourceId, { skip: !resourceId });

  const { data: events = [] } = useGetResourceEventsQuery(resourceId, {
    skip: !resourceId,
  });
  const { data: deps = [] } = useGetResourceDependenciesQuery(resourceId, {
    skip: !resourceId,
  });

  const [detectDrift, driftState] = useLazyDetectDriftQuery();
  const [reconcile, reconcileState] = useReconcileResourceMutation();

  if (!resourceId) {
    return (
      <DataEmptyState
        icon={<Box className="h-6 w-6 text-slate-400" />}
        title="Missing resource id"
        description="Open a resource from the list to see its detail page."
      />
    );
  }

  if (isLoading && !resource) {
    return <LoadingState message="Loading resource..." />;
  }

  if (isError || !resource) {
    return (
      <div className="space-y-4">
        <Link
          to={ROUTES.RESOURCES.LIST}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to resources
        </Link>
        <Alert type="error" title="Resource not found">
          {errorMessage(error) || 'The requested resource could not be loaded.'}
        </Alert>
      </div>
    );
  }

  const name = resource.metadata?.name || resource.name || resource.id;
  const namespace = resource.metadata?.namespace || resource.namespace || '';
  const platformLabel = resolvePlatformLabel(resource.spec, resource.provider);
  const app = resource.kind === 'Application' ? asApplicationSpec(resource.spec) : null;
  const labels = resource.metadata?.labels ?? resource.labels ?? {};
  const annotations = resource.metadata?.annotations ?? resource.annotations ?? {};

  return (
    <div className="space-y-6 animate-fade-in" data-testid="resource-detail-page">
      <Link
        to={ROUTES.RESOURCES.LIST}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to resources
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-slate-50 font-mono">{name}</h1>
            <Badge variant="outline">{resource.kind}</Badge>
            {platformLabel ? <Badge variant="info">{platformLabel}</Badge> : null}
            {resource.provider ? (
              <Badge variant="outline" className="font-mono text-[10px]">
                provider:{resource.provider}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-slate-400">
            {namespace ? (
              <>
                namespace <span className="font-mono text-slate-300">{namespace}</span>
                {' · '}
              </>
            ) : null}
            id <span className="font-mono text-slate-300">{resource.id}</span>
            {' · '}
            v{resource.version}
            {' · '}
            updated {formatRelativeTime(resource.updatedAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={driftState.isFetching}
            onClick={() => void detectDrift({ resourceId: resource.id })}
          >
            <GitCompare className="h-4 w-4 mr-1" />
            Detect drift
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={reconcileState.isLoading}
            onClick={() => void reconcile({ resourceId: resource.id })}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Reconcile
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void refetch()}>
            Refresh
          </Button>
        </div>
      </header>

      {(driftState.isError || reconcileState.isError) && (
        <Alert type="error" title="Action failed">
          {errorMessage(driftState.error) || errorMessage(reconcileState.error)}
        </Alert>
      )}
      {driftState.data && (
        <Alert type="info" title="Drift report">
          <pre className="text-xs overflow-auto max-h-40 mt-2">
            {JSON.stringify(driftState.data, null, 2)}
          </pre>
        </Alert>
      )}
      {reconcileState.isSuccess && (
        <Alert type="success" title="Reconcile queued">
          Job submitted for this resource.
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Phase</span>
              <StatusBadge
                type="health"
                status={(resource.status || 'Unknown') as HealthStatus}
              />
            </div>
            {resource.health?.status ? (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Health</span>
                <span className="font-mono">{resource.health.status}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Generation</span>
              <span className="font-mono">{resource.generation ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Created</span>
              <span>{formatRelativeTime(resource.createdAt)}</span>
            </div>
          </CardContent>
        </Card>

        {app ? (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="h-4 w-4" />
                Application runtime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <SpecItem label="Image" value={app.image} mono />
                <SpecItem label="Port" value={app.port != null ? String(app.port) : undefined} mono />
                <SpecItem
                  label="Replicas"
                  value={app.replicas != null ? String(app.replicas) : undefined}
                  mono
                />
                <SpecItem label="CPU" value={app.cpu} mono />
                <SpecItem label="Memory" value={app.memory} mono />
                <SpecItem label="Cluster" value={app.cluster} mono />
                <SpecItem label="Region" value={app.region} mono />
                <SpecItem label="Platform" value={app.platform} />
                <SpecItem label="Team" value={app.team} />
                <SpecItem label="Log group" value={app.log_group} mono />
              </dl>
              {app.env && Object.keys(app.env).length > 0 ? (
                <div className="mt-4">
                  <h3 className="text-xs uppercase tracking-wide text-slate-500 mb-2">Env</h3>
                  <pre className="text-xs bg-slate-950/50 border border-slate-800 rounded-md p-3 overflow-auto max-h-48">
                    {JSON.stringify(app.env, null, 2)}
                  </pre>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Spec</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-slate-950/50 border border-slate-800 rounded-md p-3 overflow-auto max-h-80">
                {JSON.stringify(resource.spec ?? {}, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Labels & annotations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <KeyValueMap title="Labels" data={labels} />
            <KeyValueMap title="Annotations" data={annotations} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dependencies</CardTitle>
          </CardHeader>
          <CardContent>
            {deps.length === 0 ? (
              <p className="text-sm text-slate-500">No dependencies recorded.</p>
            ) : (
              <ul className="space-y-2 text-sm font-mono">
                {deps.map((d, i) => (
                  <li key={`${d.sourceName}-${d.targetName}-${i}`} className="text-slate-300">
                    {d.sourceKind}/{d.sourceNamespace}/{d.sourceName}
                    <span className="text-slate-500"> → </span>
                    {d.targetKind}/{d.targetNamespace}/{d.targetName}
                    <span className="text-slate-500 text-xs ml-2">({d.dependencyType})</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Events</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-slate-500">No recent events.</p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {events.map((ev) => (
                <li key={ev.id} className="py-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={ev.type === 'Warning' ? 'danger' : 'outline'}>
                      {ev.type}
                    </Badge>
                    <span className="font-medium text-slate-200">{ev.reason}</span>
                    <span className="text-slate-500 text-xs">
                      ×{ev.count} · {formatRelativeTime(ev.lastTimestamp)}
                    </span>
                  </div>
                  <p className="text-slate-400 mt-1">{ev.message}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {resource.conditions && resource.conditions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {resource.conditions.map((c) => (
                <li key={`${c.type}-${c.status}`} className="flex flex-wrap gap-2">
                  <span className="font-mono text-slate-300">{c.type}</span>
                  <Badge variant="outline">{c.status}</Badge>
                  {c.reason ? <span className="text-slate-500">{c.reason}</span> : null}
                  {c.message ? <span className="text-slate-400">{c.message}</span> : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {app ? null : null}
      {resource.kind === 'Application' ? null : (
        <details className="text-sm">
          <summary className="cursor-pointer text-slate-400 hover:text-slate-200">
            Raw resource JSON
          </summary>
          <pre className="mt-2 text-xs bg-slate-950/50 border border-slate-800 rounded-md p-3 overflow-auto max-h-96">
            {JSON.stringify(resource, null, 2)}
          </pre>
        </details>
      )}
      {resource.kind === 'Application' ? (
        <details className="text-sm">
          <summary className="cursor-pointer text-slate-400 hover:text-slate-200">
            Full spec JSON
          </summary>
          <pre className="mt-2 text-xs bg-slate-950/50 border border-slate-800 rounded-md p-3 overflow-auto max-h-96">
            {JSON.stringify(resource.spec ?? {}, null, 2)}
          </pre>
        </details>
      ) : null}
    </div>
  );
}

function SpecItem({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={`mt-0.5 text-slate-200 ${mono ? 'font-mono text-xs break-all' : ''}`}>
        {value && value.length > 0 ? value : '—'}
      </dd>
    </div>
  );
}

function KeyValueMap({ title, data }: { title: string; data: Record<string, string> }) {
  const entries = Object.entries(data);
  return (
    <div>
      <h3 className="text-xs uppercase tracking-wide text-slate-500 mb-2">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-slate-500">None</p>
      ) : (
        <ul className="space-y-1 font-mono text-xs">
          {entries.map(([k, v]) => (
            <li key={k}>
              <span className="text-slate-400">{k}</span>
              <span className="text-slate-600">=</span>
              <span className="text-slate-200">{v}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
