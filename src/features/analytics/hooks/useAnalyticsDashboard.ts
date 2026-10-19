import { useGetDORAQuery } from '@/features/analytics/executive/services/executiveApi';
import { useListAuditLogsQuery } from '@/features/audit/services/auditApi';
import { useMemo, useState } from 'react';
import {
  useGetAnalyticsSummaryQuery,
  useGetAnalyticsTrendsQuery,
  useGetAnalyticsResourcesQuery,
} from '@/features/analytics/services/analyticsApi';
import { errorMessage } from '@/shared/lib/api';

export type AnalyticsTimeRange = '7d' | '30d' | '90d';

export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface TopResource {
  name: string;
  namespace: string;
  kind: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ActivityItem {
  id: string;
  action: string;
  resource: string;
  actor: string;
  timestamp: string;
  status: 'success' | 'failure' | 'blocked';
}

export interface HealthDistribution {
  healthy: number;
  degraded: number;
  unhealthy: number;
}

export interface ResourceByKind {
  kind: string;
  count: number;
  percentage: number;
}

export interface AnalyticsSummary {
  totalResources: number;
  deploymentsToday: number | undefined;
  activeTeams: number;
  avgDeployTime: string;
  resourcesChange: number | undefined;
  deploymentsChange: number | undefined;
  teamsChange: number | undefined;
  deployTimeChange: number | undefined;
  successRate: number | undefined;
  mttr: string;
  changeFrequency: number | undefined;
}

interface UseAnalyticsDashboardResult {
  timeRange: AnalyticsTimeRange;
  setTimeRange: (value: AnalyticsTimeRange) => void;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  summary: AnalyticsSummary | null;
  healthDistribution: HealthDistribution;
  deploymentsData: TimeSeriesData[];
  resourcesByKind: ResourceByKind[];
  topResources: TopResource[];
  recentActivity: ActivityItem[];
}

export function useAnalyticsDashboard(): UseAnalyticsDashboardResult {
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('7d');
  const summaryQuery = useGetAnalyticsSummaryQuery();
  const auditQuery = useListAuditLogsQuery();
  const window = useMemo(() => {
    const to = new Date();
    return { from: new Date(to.getTime() - Number.parseInt(timeRange, 10) * 86400000).toISOString(), to: to.toISOString() };
  }, [timeRange]);
  const doraQuery = useGetDORAQuery(window);
  const trendsQuery = useGetAnalyticsTrendsQuery(timeRange);
  const resourcesQuery = useGetAnalyticsResourcesQuery();

  const loading =
    summaryQuery.isLoading || trendsQuery.isLoading || resourcesQuery.isLoading || doraQuery.isLoading;
  const rtkError = summaryQuery.error || trendsQuery.error || resourcesQuery.error || doraQuery.error;
  const error = rtkError ? errorMessage(rtkError) || 'Failed to load analytics' : null;

  const refetch = () => {
    summaryQuery.refetch();
    trendsQuery.refetch();
    resourcesQuery.refetch();
    doraQuery.refetch();
    auditQuery.refetch();
  };

  const summary = useMemo<AnalyticsSummary | null>(() => {
    const raw = summaryQuery.data as
      | {
          resources?: {
            total?: number;
            growth?: { daily?: number };
            byStatus?: Record<string, number>;
          };
          teams?: { total?: number };
        }
      | undefined;
    if (!raw) return null;
    const dora = doraQuery.data;
    const sampled = !!dora && dora.sampleSize > 0;
    return {
      totalResources: raw.resources?.total || 0,
      deploymentsToday: undefined,
      activeTeams: raw.teams?.total || 0,
      avgDeployTime: '—',
      resourcesChange: undefined,
      deploymentsChange: undefined,
      teamsChange: undefined,
      deployTimeChange: undefined,
      successRate: sampled && dora.changeFailureRate >= 0 ? (1 - dora.changeFailureRate) * 100 : undefined,
      mttr: sampled && dora.mttrMs >= 0 ? `${Math.round(dora.mttrMs / 60000)}m` : '—',
      changeFrequency: sampled ? dora.deployFrequencyPerDay : undefined,
    };
  }, [summaryQuery.data, doraQuery.data]);

  const healthDistribution = useMemo<HealthDistribution>(() => {
    const byStatus =
      (summaryQuery.data as { resources?: { byStatus?: Record<string, number> } } | undefined)
        ?.resources?.byStatus || {};
    return {
      healthy: (byStatus.READY ?? byStatus.Healthy) || 0,
      degraded: (byStatus.DRIFTED ?? byStatus.Degraded ?? 0) + (byStatus.BLOCKED ?? 0),
      unhealthy: (byStatus.ERROR ?? byStatus.Unhealthy ?? 0) + (byStatus.FAILED ?? 0),
    };
  }, [summaryQuery.data]);

  const deploymentsData = useMemo<TimeSeriesData[]>(() => {
    const raw = trendsQuery.data as
      | { deployments?: Array<{ date: string; value?: number; count?: number }> }
      | undefined;
    const deployments = (trendsQuery.data as { resources?: Array<{ timestamp: string; value: number }> } | undefined)?.resources?.map((point) => ({ date: point.timestamp, value: point.value })) ?? raw?.deployments ?? [];
    if (!Array.isArray(deployments)) return [];
    return deployments.map((d) => ({ date: d.date, value: d.value ?? ('count' in d ? d.count : 0) ?? 0 }));
  }, [trendsQuery.data]);

  const resourcesByKind = useMemo<ResourceByKind[]>(() => {
    const raw = resourcesQuery.data as
      | { byKind?: Record<string, number>; total?: number }
      | undefined;
    const byKind = raw?.byKind ?? {};
    const total = raw?.total ?? 0;
    return Object.entries(byKind).map(([kind, count]) => ({
      kind,
      count: count as number,
      percentage: total > 0 ? Math.round(((count as number) / total) * 100) : 0,
    }));
  }, [resourcesQuery.data]);

  // Top resources and recent activity are not yet exposed by the backend.
  const topResources: TopResource[] = [];
  const recentActivity: ActivityItem[] = (auditQuery.data ?? []).slice(0, 5).map((entry) => ({
    id: entry.id, action: entry.action, resource: `${entry.resourceKind}/${entry.resourceName}`,
    actor: entry.actor, timestamp: entry.timestamp,
    status: entry.result === 'failure' ? 'failure' : entry.result === 'blocked' ? 'blocked' : 'success',
  }));

  return {
    timeRange,
    setTimeRange,
    loading,
    error,
    refetch,
    summary,
    healthDistribution,
    deploymentsData,
    resourcesByKind,
    topResources,
    recentActivity,
  };
}
