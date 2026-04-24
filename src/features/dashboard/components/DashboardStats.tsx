import { AlertCircle, Box, CheckSquare, Snowflake } from 'lucide-react';
import { StatCard } from '@/shared/components/feedback';
import type { DashboardHealth, DashboardSummary } from '@/shared/types';

interface DashboardStatsProps {
  summary: DashboardSummary | undefined;
  health: DashboardHealth | undefined;
}

export function DashboardStats({ summary, health }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Resources"
        value={health?.resources?.total ?? summary?.totalResources ?? 0}
        icon={<Box className="h-5 w-5 text-blue-400" />}
        iconBgColor="bg-blue-500/20"
        trend={5}
      />
      <StatCard
        label="Healthy Resources"
        value={health?.resources?.healthy ?? summary?.healthSummary?.healthy ?? 0}
        icon={<CheckSquare className="h-5 w-5 text-emerald-400" />}
        iconBgColor="bg-emerald-500/20"
        href="/resources"
      />
      <StatCard
        label="Active Freezes"
        value={health?.freezes?.active ?? summary?.activeFreezes ?? 0}
        icon={<Snowflake className="h-5 w-5 text-cyan-400" />}
        iconBgColor="bg-cyan-500/20"
        href="/freezes"
      />
      <StatCard
        label="Unhealthy Resources"
        value={health?.resources?.unhealthy ?? summary?.healthSummary?.degraded ?? 0}
        icon={<AlertCircle className="h-5 w-5 text-red-400" />}
        iconBgColor="bg-red-500/20"
      />
    </div>
  );
}
