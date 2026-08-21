import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Layers } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui';
import { DataEmptyState, LoadingState } from '@/shared/components/feedback';
import { errorMessage } from '@/shared/lib/api';
import { ROUTES } from '@/shared/config';
import { formatRelativeTime } from '@/shared/utils';
import { useApplyStackMutation, useGetStackQuery } from '../services/stacksApi';

export function StackDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data: stack, isLoading, isError, error, refetch } = useGetStackQuery(id, {
    skip: !id,
  });
  const [apply, applyState] = useApplyStackMutation();

  if (isLoading && !stack) {
    return <LoadingState message="Loading stack..." />;
  }

  if (isError || !stack) {
    return (
      <div className="space-y-4">
        <Link
          to={ROUTES.STACKS.LIST}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to stacks
        </Link>
        <DataEmptyState
          icon={<Layers className="h-6 w-6 text-slate-400" />}
          title="Stack not found"
          description={errorMessage(error) || 'Unknown id'}
          action={
            <Button type="button" size="sm" variant="secondary" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="stack-detail-page">
      <Link
        to={ROUTES.STACKS.LIST}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to stacks
      </Link>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">{stack.name}</h1>
          <p className="text-sm text-slate-400 mt-1 font-mono">{stack.id}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline">{stack.status ?? 'unknown'}</Badge>
            {stack.environment ? <Badge variant="info">{stack.environment}</Badge> : null}
            {stack.provider ? (
              <Badge variant="outline" className="font-mono text-[10px]">
                {stack.provider}
              </Badge>
            ) : null}
            {stack.region ? <Badge variant="outline">{stack.region}</Badge> : null}
          </div>
          {stack.statusMessage ? (
            <p className="text-sm text-slate-400 mt-2">{stack.statusMessage}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={applyState.isLoading}
            onClick={() => void apply({ id: stack.id, dryRun: true })}
          >
            Dry-run apply
          </Button>
          <Button
            size="sm"
            disabled={applyState.isLoading}
            onClick={() => void apply({ id: stack.id, dryRun: false })}
          >
            Apply stack
          </Button>
        </div>
      </header>

      {applyState.isError ? (
        <Alert type="error" title="Apply failed">
          {errorMessage(applyState.error)}
        </Alert>
      ) : null}
      {applyState.isSuccess ? (
        <Alert type="success" title="Apply submitted">
          <pre className="text-xs mt-2 overflow-auto max-h-40">
            {JSON.stringify(applyState.data, null, 2)}
          </pre>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Git</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 font-mono">
            <p>
              <span className="text-slate-500">repo </span>
              {stack.gitRepository || '—'}
            </p>
            <p>
              <span className="text-slate-500">branch </span>
              {stack.gitBranch || '—'}
            </p>
            <p>
              <span className="text-slate-500">path </span>
              {stack.gitPath || '—'}
            </p>
            <p>
              <span className="text-slate-500">last commit </span>
              {stack.lastCommitSHA || '—'}
            </p>
            <p className="text-slate-400 font-sans">
              Updated {stack.updatedAt ? formatRelativeTime(stack.updatedAt) : '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Resources ({stack.resources?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!stack.resources?.length ? (
              <p className="text-sm text-slate-500">No stack resources listed.</p>
            ) : (
              <ul className="space-y-2 text-sm font-mono">
                {stack.resources.map((r, i) => (
                  <li key={`${r.kind}-${r.name}-${i}`}>
                    {r.kind}/{r.name}
                    {r.status ? (
                      <span className="text-slate-500 text-xs ml-2">{r.status}</span>
                    ) : null}
                    {r.resourceId ? (
                      <Link
                        to={ROUTES.RESOURCES.DETAIL(r.resourceId)}
                        className="ml-2 text-blue-400 text-xs"
                      >
                        open
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {stack.outputs && Object.keys(stack.outputs).length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outputs</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-slate-950/50 border border-slate-800 rounded-md p-3 overflow-auto max-h-64">
              {JSON.stringify(stack.outputs, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
