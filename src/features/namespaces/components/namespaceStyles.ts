export function getTierBadgeColor(tier: string): string {
  switch (tier) {
    case 'production':
      return 'bg-red-500/20 text-red-400';
    case 'staging':
      return 'bg-yellow-500/20 text-yellow-400';
    case 'development':
      return 'bg-blue-500/20 text-blue-400';
    default:
      return 'bg-slate-500/20 text-slate-400';
  }
}

export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-500/20 text-emerald-400';
    case 'suspended':
      return 'bg-orange-500/20 text-orange-400';
    case 'archived':
      return 'bg-slate-500/20 text-slate-400';
    default:
      return 'bg-slate-500/20 text-slate-400';
  }
}

export function getQuotaPercentage(used: number | undefined, quota: number): number {
  return ((used ?? 0) / quota) * 100;
}

export function getQuotaTextColor(percentage: number): string {
  if (percentage >= 90) return 'text-red-400';
  if (percentage >= 75) return 'text-yellow-400';
  return 'text-emerald-400';
}

export function getQuotaBarColor(percentage: number): string {
  if (percentage >= 90) return 'bg-red-500';
  if (percentage >= 75) return 'bg-yellow-500';
  return 'bg-emerald-500';
}
