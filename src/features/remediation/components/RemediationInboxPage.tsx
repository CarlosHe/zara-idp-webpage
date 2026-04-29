import { useMemo, useState } from 'react';
import { Wrench, ShieldAlert, Calendar, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui';
import {
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/components/feedback';
import { errorMessage } from '@/shared/lib/api';
import {
  useApproveRemediationBatchMutation,
  useApproveRemediationProposalMutation,
  useCreateRemediationBatchMutation,
  useListRemediationProposalsQuery,
  useRejectRemediationProposalMutation,
} from '../services/remediationApi';
import type {
  RemediationProposal,
  RemediationRisk,
  RemediationSource,
  RemediationStatus,
} from '../types/remediation';

// Sprint 31 / L-3104 — remediation inbox.
//
// The inbox is a thin shell over the REST surface:
//   - left rail: filter by status / source,
//   - centre: list of proposals with select-to-batch checkboxes,
//   - right rail: detail of the selected proposal with approve /
//     reject / schedule / batch actions.
//
// Every action routes through the application service. The UI never
// exposes a "execute" button — execution happens via the linked
// ChangeSet's approve/apply pipeline. The "Approve" button on this
// page is equivalent to "approve the remediation proposal so the
// linked ChangeSet can run", which is a separate decision from the
// ChangeSet's own approval.

const SOURCE_LABEL: Record<RemediationSource, string> = {
  scorecard: 'Scorecard',
  cost: 'Cost',
  incident: 'Incident',
  docs: 'Docs',
  drift: 'Drift',
  slo: 'SLO',
};

const RISK_TONE: Record<RemediationRisk, string> = {
  low: 'border-slate-400 bg-slate-700/40 text-slate-200',
  medium: 'border-amber-400 bg-amber-500/20 text-amber-200',
  high: 'border-orange-400 bg-orange-500/20 text-orange-200',
  critical: 'border-red-400 bg-red-500/20 text-red-200',
};

const STATUS_TONE: Record<RemediationStatus, string> = {
  pending: 'border-blue-400 bg-blue-500/20 text-blue-200',
  scheduled: 'border-purple-400 bg-purple-500/20 text-purple-200',
  approved: 'border-emerald-400 bg-emerald-500/20 text-emerald-200',
  executed: 'border-emerald-300 bg-emerald-500/30 text-emerald-100',
  rolled_back: 'border-rose-400 bg-rose-500/20 text-rose-200',
  rejected: 'border-slate-500 bg-slate-700/40 text-slate-300',
  expired: 'border-slate-500 bg-slate-800/40 text-slate-400',
};

const STATUS_LABEL: Record<RemediationStatus, string> = {
  pending: 'Pending',
  scheduled: 'Scheduled',
  approved: 'Approved',
  executed: 'Executed',
  rolled_back: 'Rolled back',
  rejected: 'Rejected',
  expired: 'Expired',
};

const STATUS_FILTERS: Array<RemediationStatus | ''> = [
  '',
  'pending',
  'scheduled',
  'approved',
  'executed',
  'rejected',
];

const SOURCE_FILTERS: Array<RemediationSource | ''> = [
  '',
  'scorecard',
  'cost',
  'incident',
  'docs',
  'drift',
  'slo',
];

export function RemediationInboxPage() {
  const [statusFilter, setStatusFilter] = useState<RemediationStatus | ''>('pending');
  const [sourceFilter, setSourceFilter] = useState<RemediationSource | ''>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [batchSet, setBatchSet] = useState<Set<string>>(new Set());

  const filters = useMemo(
    () => ({
      status: statusFilter || undefined,
      source: sourceFilter || undefined,
    }),
    [statusFilter, sourceFilter],
  );

  const { data, isFetching, error, refetch } = useListRemediationProposalsQuery(filters);

  const items = data?.items ?? [];
  const active = items.find((p) => p.id === selectedId) ?? items[0];

  const [approveProposal, approveState] = useApproveRemediationProposalMutation();
  const [rejectProposal, rejectState] = useRejectRemediationProposalMutation();
  const [createBatch, createBatchState] = useCreateRemediationBatchMutation();
  const [approveBatch, approveBatchState] = useApproveRemediationBatchMutation();

  const toggleBatch = (id: string) => {
    setBatchSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isFetching && !data) {
    return <LoadingState message="Loading remediation inbox..." />;
  }
  if (error && !data) {
    return (
      <ErrorState
        message={errorMessage(error) || 'Failed to load remediation inbox'}
        onRetry={refetch}
      />
    );
  }

  return (
    <div
      className="space-y-6 animate-fade-in"
      aria-label="Remediation inbox"
      data-testid="remediation-page"
    >
      <PageHeader
        icon={<Wrench className="h-6 w-6" />}
        iconClassName="text-emerald-400"
        title="Remediation"
        description="Reviewable proposals from scorecards, cost, incidents, docs, drift and SLOs. Every action backs onto a ChangeSet — nothing here mutates state directly."
        onRefresh={refetch}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((s) => (
              <button
                type="button"
                key={s || 'all-status'}
                aria-pressed={statusFilter === s}
                onClick={() => setStatusFilter(s)}
                data-testid={`remediation-status-filter-${s || 'all'}`}
                className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide ${
                  statusFilter === s
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                    : 'border-slate-600 bg-slate-900 text-slate-300'
                }`}
              >
                {s ? STATUS_LABEL[s] : 'All'}
              </button>
            ))}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Source filter">
        {SOURCE_FILTERS.map((s) => (
          <button
            type="button"
            key={s || 'all-source'}
            role="tab"
            aria-selected={sourceFilter === s}
            onClick={() => setSourceFilter(s)}
            data-testid={`remediation-source-filter-${s || 'all'}`}
            className={`rounded-full border px-3 py-1 text-xs ${
              sourceFilter === s
                ? 'border-blue-400 bg-blue-500/20 text-blue-200'
                : 'border-slate-700 bg-slate-900 text-slate-300'
            }`}
          >
            {s ? SOURCE_LABEL[s] : 'All sources'}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card role="region" aria-label="Proposal list" className="lg:col-span-2" data-testid="remediation-list">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline">{items.length}</Badge>
              Proposals
              {batchSet.size > 0 ? (
                <Badge className="ml-3 bg-emerald-500/30 text-emerald-100">
                  {batchSet.size} selected
                </Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-slate-400">No proposals match the current filter.</p>
            ) : (
              <ul className="space-y-2">
                {items.map((p) => (
                  <li key={p.id}>
                    <ProposalRow
                      proposal={p}
                      active={(active?.id ?? null) === p.id}
                      checked={batchSet.has(p.id)}
                      onSelect={() => setSelectedId(p.id)}
                      onToggleBatch={() => toggleBatch(p.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
            {batchSet.size > 0 ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-700/40 pt-4">
                <Button
                  size="sm"
                  data-testid="remediation-batch-create"
                  disabled={createBatchState.isLoading}
                  onClick={async () => {
                    const ids = Array.from(batchSet);
                    const created = await createBatch({ ids }).unwrap().catch(() => null);
                    if (created) {
                      await approveBatch({ batchId: created.batchId, reason: 'inbox batch' })
                        .unwrap()
                        .catch(() => null);
                      setBatchSet(new Set());
                    }
                  }}
                >
                  Approve selected ({batchSet.size})
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setBatchSet(new Set())}
                  data-testid="remediation-batch-clear"
                >
                  Clear
                </Button>
                {approveBatchState.error ? (
                  <span className="text-xs text-rose-300">
                    {errorMessage(approveBatchState.error)}
                  </span>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="lg:col-span-1">
          {active ? (
            <ProposalDetail
              proposal={active}
              isApproving={approveState.isLoading}
              isRejecting={rejectState.isLoading}
              onApprove={async (reason) => {
                await approveProposal({ id: active.id, reason }).unwrap().catch(() => null);
              }}
              onReject={async (reason) => {
                await rejectProposal({ id: active.id, reason }).unwrap().catch(() => null);
              }}
            />
          ) : (
            <Card role="region" aria-label="Proposal detail">
              <CardContent>
                <p className="py-8 text-center text-sm text-slate-400">
                  Select a proposal to review its impact, owner, and ChangeSet preview.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

interface ProposalRowProps {
  proposal: RemediationProposal;
  active: boolean;
  checked: boolean;
  onSelect: () => void;
  onToggleBatch: () => void;
}

function ProposalRow({ proposal, active, checked, onSelect, onToggleBatch }: ProposalRowProps) {
  return (
    <div
      className={`flex w-full items-start gap-3 rounded-md border px-3 py-2 transition ${
        active
          ? 'border-emerald-400 bg-slate-800/70'
          : 'border-slate-700/60 bg-slate-800/30 hover:border-emerald-500/40'
      }`}
      data-testid={`remediation-row-${proposal.id}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggleBatch}
        aria-label={`Add ${proposal.id} to batch`}
        data-testid={`remediation-batch-${proposal.id}`}
        className="mt-1"
      />
      <button
        type="button"
        onClick={onSelect}
        className="flex-1 text-left"
        aria-pressed={active}
      >
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`rounded-full border px-2 py-0.5 uppercase ${RISK_TONE[proposal.risk]}`}
          >
            {proposal.risk}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 ${STATUS_TONE[proposal.status]}`}
          >
            {STATUS_LABEL[proposal.status]}
          </span>
          <span className="rounded-full border border-slate-600 bg-slate-900/60 px-2 py-0.5 text-slate-300">
            {SOURCE_LABEL[proposal.source]}
          </span>
          {proposal.batchId ? (
            <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-2 py-0.5 text-blue-200">
              batch {proposal.batchId}
            </span>
          ) : null}
        </div>
        <div className="mt-1 truncate text-sm text-slate-100">{proposal.title}</div>
        <div className="mt-1 truncate text-[11px] text-slate-400">
          {proposal.finding.entityKey} · owner: {proposal.owner.team || proposal.owner.subject || 'unassigned'}
        </div>
      </button>
    </div>
  );
}

interface ProposalDetailProps {
  proposal: RemediationProposal;
  isApproving: boolean;
  isRejecting: boolean;
  onApprove: (reason: string) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
}

function ProposalDetail({ proposal, isApproving, isRejecting, onApprove, onReject }: ProposalDetailProps) {
  const [reason, setReason] = useState('');
  const canApprove =
    !!proposal.changeSet &&
    (proposal.status === 'pending' || proposal.status === 'scheduled');
  return (
    <Card role="region" aria-label="Proposal detail" data-testid={`remediation-detail-${proposal.id}`}>
      <CardHeader>
        <CardTitle className="flex items-start justify-between gap-3 text-base">
          <span className="leading-snug">{proposal.title}</span>
          <span
            className={`rounded-full border px-2 py-0.5 text-xs uppercase ${STATUS_TONE[proposal.status]}`}
          >
            {STATUS_LABEL[proposal.status]}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-slate-200">
        <div>
          <p className="text-xs uppercase text-slate-400">Finding</p>
          <p className="mt-1">
            <span className="font-mono text-xs text-slate-300">{proposal.finding.code}</span>
            {' · '}
            <span className="text-slate-400">{proposal.finding.entityKey}</span>
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-400">Owner</p>
          <p className="mt-1">
            {proposal.owner.team || 'no team'} ·{' '}
            {proposal.owner.subject || 'no subject'}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-400">Impact</p>
          <p className="mt-1">{proposal.impact.description || '—'}</p>
        </div>
        {proposal.followups && proposal.followups.length > 0 ? (
          <div>
            <p className="text-xs uppercase text-slate-400">Follow-ups</p>
            <ul className="mt-1 list-disc pl-5 text-xs text-slate-300">
              {proposal.followups.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div>
          <p className="text-xs uppercase text-slate-400">ChangeSet</p>
          {proposal.changeSet ? (
            <Link
              to={`/approvals/${proposal.changeSet.id}`}
              className="mt-1 inline-flex items-center gap-1 text-emerald-300 hover:underline"
              data-testid="remediation-changeset-link"
            >
              <ExternalLink className="h-3 w-3" aria-hidden />
              Review preview · {proposal.changeSet.id}
            </Link>
          ) : (
            <p className="mt-1 flex items-center gap-1 text-rose-300">
              <ShieldAlert className="h-4 w-4" aria-hidden />
              No ChangeSet attached — approval blocked
            </p>
          )}
        </div>
        {proposal.scheduledFor ? (
          <p className="flex items-center gap-1 text-xs text-slate-300">
            <Calendar className="h-3 w-3" aria-hidden />
            Scheduled for {proposal.scheduledFor}
          </p>
        ) : null}
        <label className="block text-xs uppercase text-slate-400">
          Reason
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Optional approval note · required for rejection"
            data-testid="remediation-reason"
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900/60 p-2 text-sm text-slate-100"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            disabled={!canApprove || isApproving}
            data-testid="remediation-approve"
            onClick={() => onApprove(reason)}
            title={
              canApprove
                ? 'Approve the remediation proposal'
                : 'A ChangeSet must be attached before approval'
            }
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={!reason.trim() || isRejecting}
            data-testid="remediation-reject"
            onClick={() => onReject(reason)}
          >
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
