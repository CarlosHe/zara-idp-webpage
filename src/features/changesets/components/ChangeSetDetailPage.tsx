import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, GitBranch } from 'lucide-react';
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
import {
  useApproveChangeSetMutation,
  useGetChangeSetDiffQuery,
  useGetChangeSetQuery,
  useRejectChangeSetMutation,
} from '../services/changesetsApi';

export function ChangeSetDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data: cs, isLoading, isError, error, refetch } = useGetChangeSetQuery(id, {
    skip: !id,
  });
  const { data: diff } = useGetChangeSetDiffQuery(id, { skip: !id });
  const [approve, approveState] = useApproveChangeSetMutation();
  const [reject, rejectState] = useRejectChangeSetMutation();
  const [reason, setReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  if (isLoading && !cs) {
    return <LoadingState message="Loading change set..." />;
  }

  if (isError || !cs) {
    return (
      <div className="space-y-4">
        <Link
          to={ROUTES.CHANGESETS.LIST}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to change sets
        </Link>
        <DataEmptyState
          icon={<GitBranch className="h-6 w-6 text-slate-400" />}
          title="Change set not found"
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

  const pending =
    (cs.approvalStatus || '').toLowerCase() === 'pending' || cs.requiresApproval === true;
  const actionError = errorMessage(approveState.error) || errorMessage(rejectState.error);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="changeset-detail-page">
      <Link
        to={ROUTES.CHANGESETS.LIST}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to change sets
      </Link>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-mono text-slate-50">{cs.id}</h1>
          <p className="text-sm text-slate-400 mt-1">
            {cs.source ?? '—'} · {cs.requestedBy ?? '—'}
            {cs.updatedAt ? ` · ${formatRelativeTime(String(cs.updatedAt))}` : null}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline">{cs.approvalStatus ?? 'unknown'}</Badge>
            {cs.totalRisk ? <Badge variant="warning">risk:{cs.totalRisk}</Badge> : null}
            {cs.environment ? <Badge variant="outline">{cs.environment}</Badge> : null}
          </div>
        </div>
        {pending ? (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={approveState.isLoading}
              onClick={() => void approve({ id: cs.id })}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowReject((v) => !v)}
            >
              Reject
            </Button>
          </div>
        ) : null}
      </header>

      {actionError ? (
        <Alert type="error" title="Action failed">
          {actionError}
        </Alert>
      ) : null}

      {showReject ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reject change set</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason required"
            />
            <Button
              size="sm"
              variant="danger"
              disabled={!reason.trim() || rejectState.isLoading}
              onClick={() => void reject({ id: cs.id, reason: reason.trim() })}
            >
              Confirm reject
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Changes ({cs.changes?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!cs.changes?.length ? (
            <p className="text-sm text-slate-500">No change entries.</p>
          ) : (
            <ul className="space-y-2 text-sm font-mono">
              {cs.changes.map((ch, i) => (
                <li key={i} className="flex flex-wrap gap-2 items-center">
                  <Badge variant="outline">{ch.action ?? '?'}</Badge>
                  <span>
                    {ch.resourceKind}/{ch.namespace}/{ch.resourceName}
                  </span>
                  {ch.riskLevel ? (
                    <span className="text-xs text-slate-500">risk={ch.riskLevel}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {cs.resourcesYAML ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">YAML</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-slate-950/50 border border-slate-800 rounded-md p-3 overflow-auto max-h-96 whitespace-pre-wrap">
              {cs.resourcesYAML}
            </pre>
          </CardContent>
        </Card>
      ) : null}

      {diff != null ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Diff</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-slate-950/50 border border-slate-800 rounded-md p-3 overflow-auto max-h-96">
              {JSON.stringify(diff, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
