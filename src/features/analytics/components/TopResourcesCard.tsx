import { Activity, ArrowDownRight, ArrowUpRight, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui';
import type { TopResource } from '@/features/analytics/hooks/useAnalyticsDashboard';

interface TopResourcesCardProps {
  resources: TopResource[];
}

function TrendIcon({ trend }: { trend: TopResource['trend'] }) {
  switch (trend) {
    case 'up':
      return <ArrowUpRight className="h-4 w-4 text-emerald-400" />;
    case 'down':
      return <ArrowDownRight className="h-4 w-4 text-red-400" />;
    default:
      return <Activity className="h-4 w-4 text-slate-400" />;
  }
}

export function TopResourcesCard({ resources }: TopResourcesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-cyan-400" />
          Most Active Resources
        </CardTitle>
      </CardHeader>
      <CardContent>
        {resources.length > 0 ? (
          <div className="space-y-3">
            {resources.map((resource, index) => (
              <div
                key={resource.name}
                className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50"
              >
                <span className="text-xs font-medium text-slate-500 w-4">{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{resource.name}</p>
                  <p className="text-xs text-slate-500">
                    {resource.namespace} • {resource.kind}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-300">{resource.count}</span>
                  <TrendIcon trend={resource.trend} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-4">No active resources</p>
        )}
      </CardContent>
    </Card>
  );
}
