export interface BusinessDomain {
  id: string;
  name: string;
  displayName: string;
  description: string;
  owner: string;
  team: string;
  teams: string[];
  resourceCount: number;
  healthySummary: {
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
  tier: 1 | 2 | 3;
  tags: string[];
  dependencies: string[];
  createdAt: string;
}

export function getTierColor(tier: number): string {
  switch (tier) {
    case 1:
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 2:
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 3:
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
}

export function getHealthPercentage(domain: BusinessDomain): number {
  const total =
    domain.healthySummary.healthy +
    domain.healthySummary.degraded +
    domain.healthySummary.unhealthy;
  return total > 0 ? Math.round((domain.healthySummary.healthy / total) * 100) : 100;
}
