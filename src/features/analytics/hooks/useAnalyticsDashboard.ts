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
  deploymentsToday: number;
  activeTeams: number;
  avgDeployTime: string;
  resourcesChange: number;
  deploymentsChange: number;
  teamsChange: number;
  deployTimeChange: number;
  successRate: number;
  mttr: string;
  changeFrequency: number;
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
  const trendsQuery = useGetAnalyticsTrendsQuery(timeRange);
  const resourcesQuery = useGetAnalyticsResourcesQuery();

  const loading =
    summaryQuery.isLoading || trendsQuery.isLoading || resourcesQuery.isLoading;
  const rtkError = summaryQuery.error || trendsQuery.error || resourcesQuery.error;
  const error = rtkError ? errorMessage(rtkError) || 'Failed to load analytics' : null;

  const refetch = () => {
    summaryQuery.refetch();
    trendsQuery.refetch();
    resourcesQuery.refetch();
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
    return {
      totalResources: raw.resources?.total || 0,
      deploymentsToday: 0,
      activeTeams: raw.teams?.total || 0,
      avgDeployTime: '0m',
      resourcesChange: raw.resources?.growth?.daily || 0,
      deploymentsChange: 0,
      teamsChange: 0,
      deployTimeChange: 0,
      successRate: 0,
      mttr: '0m',
      changeFrequency: 0,
    };
  }, [summaryQuery.data]);

  const healthDistribution = useMemo<HealthDistribution>(() => {
    const byStatus =
      (summaryQuery.data as { resources?: { byStatus?: Record<string, number> } } | undefined)
        ?.resources?.byStatus || {};
    return {
      healthy: byStatus.Healthy || 0,
      degraded: byStatus.Degraded || 0,
      unhealthy: byStatus.Unhealthy || 0,
    };
  }, [summaryQuery.data]);

  const deploymentsData = useMemo<TimeSeriesData[]>(() => {
    const raw = trendsQuery.data as
      | { deployments?: Array<{ date: string; value?: number; count?: number }> }
      | undefined;
    const deployments = raw?.deployments ?? [];
    if (!Array.isArray(deployments)) return [];
    return deployments.map((d) => ({ date: d.date, value: d.value ?? d.count ?? 0 }));
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
  const recentActivity: ActivityItem[] = [];

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
