import { Boxes, Building2, Shield, Users } from 'lucide-react';
import { StatCard } from '@/shared/components/feedback';
import type { BusinessDomainsDashboardStats } from '@/features/business-domains/hooks/useBusinessDomainsDashboard';

export interface BusinessDomainsStatsProps {
  domainCount: number;
  stats: BusinessDomainsDashboardStats;
}

export function BusinessDomainsStats({ domainCount, stats }: BusinessDomainsStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        icon={<Building2 className="h-5 w-5 text-purple-400" />}
        iconBgColor="bg-purple-500/20"
        value={domainCount}
        label="Business Domains"
      />
      <StatCard
        icon={<Boxes className="h-5 w-5 text-blue-400" />}
        iconBgColor="bg-blue-500/20"
        value={stats.totalResources}
        label="Total Resources"
      />
      <StatCard
        icon={<Users className="h-5 w-5 text-emerald-400" />}
        iconBgColor="bg-emerald-500/20"
        value={stats.totalTeams}
        label="Teams"
      />
      <StatCard
        icon={<Shield className="h-5 w-5 text-red-400" />}
        iconBgColor="bg-red-500/20"
        value={stats.tier1Count}
        label="Tier 1 (Critical)"
      />
    </div>
  );
}
