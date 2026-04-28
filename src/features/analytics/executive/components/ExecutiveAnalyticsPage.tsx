// Sprint 28 / L-2805 — executive analytics dashboard.
//
// Composes the four DORA / catalog quality / approval SLA / remediation
// panels with the recommendations inbox. Window defaults to "last 30
// days"; the user can shift it via the time-range selector.
import { useMemo, useState } from 'react';
import { Activity } from 'lucide-react';
import { ErrorState, PageHeader } from '@/shared/components/feedback';
import {
  useGetApprovalSLAQuery,
  useGetCatalogQualityQuery,
  useGetDORAQuery,
  useGetRecommendationsQuery,
  useGetRemediationEffectivenessQuery,
  useRefreshRecommendationsMutation,
} from '../services/executiveApi';
import type { AnalyticsQuery } from '../types/types';
import { ApprovalSLAPanel } from './ApprovalSLAPanel';
import { CatalogQualityPanel } from './CatalogQualityPanel';
import { DORAPanel } from './DORAPanel';
import { RecommendationsList } from './RecommendationsList';
import { RemediationPanel } from './RemediationPanel';

const DEFAULT_WINDOW_DAYS = 30;

const RANGE_OPTIONS: { label: string; days: number }[] = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

export function ExecutiveAnalyticsPage() {
  const [days, setDays] = useState(DEFAULT_WINDOW_DAYS);
  const args = useMemo<AnalyticsQuery>(() => {
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    return {
      scope: 'platform',
      from: from.toISOString(),
      to: to.toISOString(),
    };
  }, [days]);

  const dora = useGetDORAQuery(args);
  const quality = useGetCatalogQualityQuery(args);
  const sla = useGetApprovalSLAQuery(args);
  const remediation = useGetRemediationEffectivenessQuery(args);
  const recommendations = useGetRecommendationsQuery();
  const [refreshRecommendations, refreshState] =
    useRefreshRecommendationsMutation();

  const handleRefresh = () => {
    void refreshRecommendations(args);
  };

  const hardError =
    dora.error && quality.error && sla.error && remediation.error;

  if (hardError) {
    return (
      <ErrorState
        message="Failed to load executive analytics."
        onRetry={() => {
          void dora.refetch();
          void quality.refetch();
          void sla.refetch();
          void remediation.refetch();
          void recommendations.refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<Activity className="h-6 w-6" />}
        iconClassName="text-emerald-400"
        title="Platform analytics"
        description="DORA, catalog quality, approval SLA, remediation, and recommendations."
        actions={
          <div className="flex gap-1 rounded-md border border-slate-200 p-1 dark:border-slate-700">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                type="button"
                onClick={() => setDays(opt.days)}
                className={`rounded px-3 py-1 text-xs ${
                  days === opt.days
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
                aria-pressed={days === opt.days}
              >
                {opt.label}
              </button>
            ))}
          </div>
        }
      />

      <DORAPanel data={dora.data} loading={dora.isLoading} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CatalogQualityPanel data={quality.data} loading={quality.isLoading} />
        <ApprovalSLAPanel data={sla.data} loading={sla.isLoading} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RemediationPanel
          data={remediation.data}
          loading={remediation.isLoading}
        />
        <RecommendationsList
          items={recommendations.data?.items ?? []}
          loading={recommendations.isLoading}
          onRefresh={handleRefresh}
          refreshing={refreshState.isLoading}
        />
      </div>
    </div>
  );
}
