import { useMemo, useState } from 'react';
import { Server } from 'lucide-react';
import {
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
  useDestroyEnvironmentMutation,
  useExtendEnvironmentMutation,
  useListEnvironmentsQuery,
} from '../services/environmentsApi';
import type { Environment } from '../types/environments';
import { EnvironmentRow } from './EnvironmentRow';
import { formatMoneyMinor } from './format';

const STATE_FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Provisioning', value: 'provisioning' },
  { label: 'Ready', value: 'ready' },
  { label: 'Failed', value: 'failed' },
  { label: 'Destroying', value: 'destroying' },
];

// Sprint 27 / L-2705 — governed dev environment dashboard.
//
// Displays the inventory snapshot (totals, stale, expiring soon,
// projected daily spend) and the per-environment list with safe
// destroy / extend actions. Every mutating action submits a typed
// ChangeSet on the backend (the UI never bypasses the apply
// pipeline).
export function EnvironmentsPage() {
  const [stateFilter, setStateFilter] = useState<string>('');
  const { data, isLoading, error, refetch } = useListEnvironmentsQuery(
    stateFilter ? { state: stateFilter } : undefined,
  );
  const [destroy, destroyState] = useDestroyEnvironmentMutation();
  const [extend, extendState] = useExtendEnvironmentMutation();

  const inventory = data?.inventory;
  const environments = data?.environments ?? [];
  const now = useMemo(() => new Date(), []);

  if (error && !data) {
    return (
      <ErrorState
        message={errorMessage(error) || 'Failed to load environments'}
        onRetry={refetch}
      />
    );
  }
  if (isLoading && !data) {
    return <LoadingState message="Loading environments..." />;
  }

  const handleDestroy = (env: Environment) => {
    const reason = window.prompt(
      `Why are you destroying "${env.slug}"? (this submits a teardown ChangeSet)`,
      'Manual teardown',
    );
    if (!reason) return;
    void destroy({ id: env.id, body: { reason } });
  };

  const handleExtend = (env: Environment) => {
    const hoursStr = window.prompt(
      `Extend "${env.slug}" by how many hours?`,
      '24',
    );
    if (!hoursStr) return;
    const hours = Number.parseInt(hoursStr, 10);
    if (Number.isNaN(hours) || hours <= 0) {
      window.alert('Hours must be a positive integer.');
      return;
    }
    const newExpiry = new Date(
      new Date(env.expiresAt).getTime() + hours * 60 * 60 * 1000,
    );
    void extend({
      id: env.id,
      body: { newExpiresAt: newExpiry.toISOString(), reason: 'UI extend' },
    });
  };

  return (
    <div
      className="space-y-6 animate-fade-in"
      aria-label="Dev environments"
      data-testid="environments-page"
    >
      <PageHeader
        icon={<Server className="h-6 w-6" />}
        iconClassName="text-emerald-300"
        title="Dev environments"
        description="Self-service preview / dev / staging environments. Every action is a ChangeSet — the apply pipeline is the only path to provider state."
        onRefresh={refetch}
        actions={
          <div className="flex flex-wrap items-center gap-2" role="tablist">
            {STATE_FILTERS.map((filter) => (
              <button
                type="button"
                key={filter.label}
                role="tab"
                aria-selected={stateFilter === filter.value}
                onClick={() => setStateFilter(filter.value)}
                className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide ${
                  stateFilter === filter.value
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                    : 'border-slate-600 bg-slate-900 text-slate-300'
                }`}
                data-testid={`env-filter-${filter.label.toLowerCase()}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        }
      />

      <div
        className="grid gap-6 md:grid-cols-2 xl:grid-cols-4"
        data-testid="env-inventory"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase text-slate-400">
              Active environments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-200">
              {inventory?.totalEnvironments ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              non-terminal across all teams
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase text-slate-400">
              Stale (&gt; 7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-amber-200">
              {inventory?.staleCount ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              candidates for cleanup or extension
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase text-slate-400">
              Expiring soon (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-orange-200">
              {inventory?.expiringSoonCount ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              TTL controller will reap automatically
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase text-slate-400">
              Projected daily spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-sky-200">
              {inventory && inventory.projectedDailySpendMinorUnits > 0
                ? formatMoneyMinor(
                    inventory.projectedDailySpendMinorUnits,
                    inventory.currency || 'USD',
                  )
                : '—'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              FinOps feed updates daily
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Environments</CardTitle>
        </CardHeader>
        <CardContent>
          {environments.length === 0 ? (
            <p className="text-sm text-slate-400" data-testid="env-empty">
              No environments yet. Open a PR or click "Create" in a Golden Path
              to provision one — preview environments come and go automatically.
            </p>
          ) : (
            <ul className="space-y-3" data-testid="env-list">
              {environments.map((env) => (
                <EnvironmentRow
                  key={env.id}
                  env={env}
                  now={now}
                  onDestroy={handleDestroy}
                  onExtend={handleExtend}
                />
              ))}
            </ul>
          )}
          {(destroyState.error || extendState.error) ? (
            <p
              className="mt-3 text-xs text-red-300"
              data-testid="env-action-error"
              role="alert"
            >
              {errorMessage(destroyState.error ?? extendState.error) ||
                'Action failed'}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
