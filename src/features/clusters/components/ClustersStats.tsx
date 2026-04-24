import { Globe, CheckCircle2, Server, Boxes } from 'lucide-react';
import { StatCard } from '@/shared/components/feedback';
import type { ClusterStats } from '../types';

interface ClustersStatsProps {
  totalClusters: number;
  stats: ClusterStats;
}

export function ClustersStats({ totalClusters, stats }: ClustersStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        icon={<Globe className="h-5 w-5 text-cyan-400" />}
        iconBgColor="bg-cyan-500/20"
        value={totalClusters}
        label="Total Clusters"
      />
      <StatCard
        icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
        iconBgColor="bg-emerald-500/20"
        value={stats.healthyClusters}
        label="Healthy Clusters"
      />
      <StatCard
        icon={<Server className="h-5 w-5 text-blue-400" />}
        iconBgColor="bg-blue-500/20"
        value={stats.totalNodes}
        label="Total Nodes"
      />
      <StatCard
        icon={<Boxes className="h-5 w-5 text-purple-400" />}
        iconBgColor="bg-purple-500/20"
        value={stats.totalResources}
        label="Total Resources"
      />
    </div>
  );
}
