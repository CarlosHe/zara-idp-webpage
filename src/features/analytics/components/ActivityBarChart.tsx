import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui';
import { cn } from '@/shared/utils';
import type { TimeSeriesData } from '@/features/analytics/hooks/useAnalyticsDashboard';

interface ActivityBarChartProps {
  data: TimeSeriesData[];
}

export function ActivityBarChart({ data }: ActivityBarChartProps) {
  const maxDeployments = Math.max(...data.map((d) => d.value), 1);
  const totalDeployments = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-400" />
          Deployment Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <>
            <div className="h-48 flex items-end gap-1">
              {data.map((point, index) => {
                const height = (point.value / maxDeployments) * 100;
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-1"
                    title={`${point.date}: ${point.value} deployments`}
                  >
                    <div
                      className={cn(
                        'w-full rounded-t transition-all hover:opacity-80',
                        point.value >= 70
                          ? 'bg-emerald-500'
                          : point.value >= 50
                            ? 'bg-blue-500'
                            : 'bg-slate-500'
                      )}
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[10px] text-slate-500">
                      {new Date(point.date).getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-emerald-500" />
                  <span className="text-xs text-slate-400">High (≥70)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500" />
                  <span className="text-xs text-slate-400">Medium (50-69)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-slate-500" />
                  <span className="text-xs text-slate-400">Low (&lt;50)</span>
                </div>
              </div>
              <span className="text-xs text-slate-500">
                Total: {totalDeployments} deployments
              </span>
            </div>
          </>
        ) : (
          <div className="h-48 flex items-center justify-center">
            <p className="text-slate-500">No deployment data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
