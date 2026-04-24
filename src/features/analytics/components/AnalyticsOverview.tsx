import { Activity, Boxes, Clock, Users } from 'lucide-react';
import { StatCard } from '@/shared/components/feedback';
import type { AnalyticsSummary } from '@/features/analytics/hooks/useAnalyticsDashboard';

interface AnalyticsOverviewProps {
  summary: AnalyticsSummary | null;
}

export function AnalyticsOverview({ summary }: AnalyticsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<Boxes className="h-5 w-5 text-blue-400" />}
        iconBgColor="bg-blue-500/20"
        label="Total Resources"
        value={summary?.totalResources || 0}
        trend={summary?.resourcesChange}
        trendLabel="vs last month"
      />
      <StatCard
        icon={<Activity className="h-5 w-5 text-emerald-400" />}
        iconBgColor="bg-emerald-500/20"
        label="Deployments Today"
        value={summary?.deploymentsToday || 0}
        trend={summary?.deploymentsChange}
        trendLabel="vs yesterday"
      />
      <StatCard
        icon={<Users className="h-5 w-5 text-purple-400" />}
        iconBgColor="bg-purple-500/20"
        label="Active Teams"
        value={summary?.activeTeams || 0}
        trend={summary?.teamsChange}
        trendLabel="vs last month"
      />
      <StatCard
        icon={<Clock className="h-5 w-5 text-amber-400" />}
        iconBgColor="bg-amber-500/20"
        label="Avg Deploy Time"
        value={summary?.avgDeployTime || '0m'}
        trend={summary?.deployTimeChange}
        trendLabel="improvement"
      />
    </div>
  );
}
