import { Activity, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui';
import type { AnalyticsSummary } from '@/features/analytics/hooks/useAnalyticsDashboard';

interface AnalyticsSummaryCardsProps {
  summary: AnalyticsSummary | null;
}

export function AnalyticsSummaryCards({ summary }: AnalyticsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-400">Success Rate</p>
              <p className="text-3xl font-bold text-white mt-1">
                {summary?.successRate === undefined ? '—' : `${summary.successRate.toFixed(1)}%`}
              </p>
              <p className="text-xs text-slate-400 mt-2">Selected period</p>
            </div>
            <CheckCircle2 className="h-12 w-12 text-emerald-500/50" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-400">MTTR</p>
              <p className="text-3xl font-bold text-white mt-1">{summary?.mttr ?? '—'}</p>
              <p className="text-xs text-slate-400 mt-2">Mean Time to Recovery</p>
            </div>
            <Clock className="h-12 w-12 text-blue-500/50" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-400">Change Frequency</p>
              <p className="text-3xl font-bold text-white mt-1">
                {summary?.changeFrequency === undefined ? '—' : `${summary.changeFrequency.toFixed(2)}/day`}
              </p>
              <p className="text-xs text-slate-400 mt-2">Avg deploys per day</p>
            </div>
            <Activity className="h-12 w-12 text-purple-500/50" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
