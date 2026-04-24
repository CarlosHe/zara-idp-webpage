import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui';
import type { HealthDistribution } from '@/features/analytics/hooks/useAnalyticsDashboard';

interface HealthDistributionCardProps {
  distribution: HealthDistribution;
}

export function HealthDistributionCard({ distribution }: HealthDistributionCardProps) {
  const total = distribution.healthy + distribution.degraded + distribution.unhealthy;
  const healthPercentage = total > 0 ? Math.round((distribution.healthy / total) * 100) : 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          Health Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-slate-700"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray={`${healthPercentage * 3.52} 352`}
                className="text-emerald-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{healthPercentage}%</p>
                <p className="text-xs text-slate-400">Healthy</p>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Healthy
            </span>
            <span className="text-sm font-medium text-white">{distribution.healthy}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Degraded
            </span>
            <span className="text-sm font-medium text-white">{distribution.degraded}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-400" />
              Unhealthy
            </span>
            <span className="text-sm font-medium text-white">{distribution.unhealthy}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
