import { BarChart3 } from 'lucide-react';
import { ErrorState, LoadingState, PageHeader } from '@/shared/components/feedback';
import { useAnalyticsDashboard } from '@/features/analytics/hooks/useAnalyticsDashboard';
import { ActivityBarChart } from './ActivityBarChart';
import { AnalyticsFilters } from './AnalyticsFilters';
import { AnalyticsOverview } from './AnalyticsOverview';
import { AnalyticsSummaryCards } from './AnalyticsSummaryCards';
import { HealthDistributionCard } from './HealthDistributionCard';
import { RecentActivityCard } from './RecentActivityCard';
import { ResourcesByKindCard } from './ResourcesByKindCard';
import { TopResourcesCard } from './TopResourcesCard';

export function AnalyticsPage() {
  const {
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
  } = useAnalyticsDashboard();

  if (loading) {
    return <LoadingState message="Loading analytics..." iconClassName="text-indigo-400" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<BarChart3 className="h-6 w-6" />}
        iconClassName="text-indigo-400"
        title="Analytics"
        description="Platform metrics and insights"
        onRefresh={refetch}
        actions={<AnalyticsFilters value={timeRange} onChange={setTimeRange} />}
      />

      <AnalyticsOverview summary={summary} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActivityBarChart data={deploymentsData} />
        <HealthDistributionCard distribution={healthDistribution} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ResourcesByKindCard resources={resourcesByKind} />
        <TopResourcesCard resources={topResources} />
        <RecentActivityCard activities={recentActivity} />
      </div>

      <AnalyticsSummaryCards summary={summary} />
    </div>
  );
}
