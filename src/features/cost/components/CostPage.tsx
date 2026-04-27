import { useState } from 'react';
import { DollarSign } from 'lucide-react';
import {
  Badge,
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
import { useGetCostDashboardQuery } from '../services/costApi';
import { Showback } from './Showback';
import { Chargeback } from './Chargeback';
import { BudgetsCard } from './BudgetsCard';
import { AnomaliesCard } from './AnomaliesCard';
import { IdleResourcesCard } from './IdleResourcesCard';
import { FindingsCard } from './FindingsCard';
import { formatMoney } from './costFormat';

const WINDOWS = [
  { label: '7d', days: 7 },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

// Sprint-26 / L-2605 — FinOps dashboard. Joins showback /
// chargeback / budgets / anomalies / idle resources / cost-driven
// findings into a single role-aware view. Every action card
// links to a safe surface (preview / ChangeSet / planner) — no
// direct mutations from the cost page.
export function CostPage() {
  const [windowDays, setWindowDays] = useState<number>(30);
  const since = isoDaysAgo(windowDays);
  const until = isoDaysAgo(0);
  const { data, isLoading, error, refetch } = useGetCostDashboardQuery({
    since,
    until,
  });

  if (error && !data) {
    return (
      <ErrorState
        message={errorMessage(error) || 'Failed to load cost dashboard'}
        onRetry={refetch}
      />
    );
  }
  if (isLoading && !data) {
    return <LoadingState message="Loading cost dashboard..." />;
  }

  const dashboard = data;

  return (
    <div
      className="space-y-6 animate-fade-in"
      aria-label="Cost dashboard"
      data-testid="cost-page"
    >
      <PageHeader
        icon={<DollarSign className="h-6 w-6" />}
        iconClassName="text-emerald-300"
        title="Cost & FinOps"
        description="Showback, chargeback, budgets, anomalies, and idle resources. Remediations are proposals — never direct mutations."
        onRefresh={refetch}
        actions={
          <div className="flex items-center gap-2" role="tablist">
            {WINDOWS.map((window) => (
              <button
                type="button"
                key={window.label}
                role="tab"
                aria-selected={windowDays === window.days}
                onClick={() => setWindowDays(window.days)}
                className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide ${
                  windowDays === window.days
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                    : 'border-slate-600 bg-slate-900 text-slate-300'
                }`}
                data-testid={`cost-window-${window.label}`}
              >
                {window.label}
              </button>
            ))}
          </div>
        }
      />

      <div
        className="grid gap-6 md:grid-cols-2 xl:grid-cols-4"
        data-testid="cost-stat-row"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase text-slate-400">
              Total spend (window)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-200">
              {formatMoney(dashboard?.totalSpend)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {dashboard?.allocationsCount ?? 0} allocations ingested
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase text-slate-400">
              Anomalies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-orange-200">
              {dashboard?.anomalies.length ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              detected over the selected window
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase text-slate-400">
              Idle resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-sky-200">
              {dashboard?.idleResources.length ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              candidates for TTL cleanup
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase text-slate-400">
              Budgets in trouble
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-red-200">
              {(dashboard?.budgets ?? []).filter((b) => b.state !== 'healthy').length}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              warning + breach states
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Showback
          title="Showback by team"
          buckets={(dashboard?.showback ?? []).filter(
            (b) => b.dimension === 'team',
          )}
        />
        <Showback
          title="Showback by service"
          buckets={(dashboard?.showback ?? []).filter(
            (b) => b.dimension === 'service',
          )}
        />
      </div>

      <Chargeback rows={dashboard?.chargeback ?? []} />

      <div className="grid gap-6 lg:grid-cols-2">
        <BudgetsCard budgets={dashboard?.budgets ?? []} />
        <AnomaliesCard anomalies={dashboard?.anomalies ?? []} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <IdleResourcesCard buckets={dashboard?.idleResources ?? []} />
        <FindingsCard findings={dashboard?.findings ?? []} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase text-slate-400">
            Top services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm" data-testid="cost-top-services">
            {(dashboard?.topServices ?? []).length === 0 ? (
              <li className="text-slate-400">No services ingested yet.</li>
            ) : (
              dashboard?.topServices.map((b) => (
                <li
                  key={`${b.dimension}:${b.label}`}
                  className="flex items-center justify-between"
                >
                  <span>
                    <Badge variant="outline" className="mr-2">
                      {b.dimension}
                    </Badge>
                    {b.label}
                  </span>
                  <span className="font-mono text-emerald-200">
                    {formatMoney(b.total)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}
