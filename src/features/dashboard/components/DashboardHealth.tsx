import { Link } from 'react-router-dom';
import { Activity, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, StatusBadge } from '@/shared/components/ui';
import { ROUTES } from '@/shared/config';
import { cn } from '@/shared/utils';
import type {
  DashboardHealth as DashboardHealthData,
  DashboardSummary,
  HealthStatus,
  HealthSummary,
} from '@/shared/types';

interface DashboardHealthProps {
  summary: DashboardSummary | undefined;
  health: DashboardHealthData | undefined;
}

export function DashboardHealth({ summary, health }: DashboardHealthProps) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-400" />
              Health Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-400">
                  {health?.resources?.healthy ?? summary?.healthSummary?.healthy ?? 0}
                </div>
                <div className="text-xs text-slate-400 mt-1">Healthy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">
                  {summary?.healthSummary?.progressing ?? 0}
                </div>
                <div className="text-xs text-slate-400 mt-1">Progressing</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400">
                  {health?.resources?.unhealthy ?? summary?.healthSummary?.degraded ?? 0}
                </div>
                <div className="text-xs text-slate-400 mt-1">Unhealthy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-400">
                  {health?.resources?.total ?? summary?.totalResources ?? 0}
                </div>
                <div className="text-xs text-slate-400 mt-1">Total</div>
              </div>
            </div>

            <HealthBar summary={summary?.healthSummary} health={health} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {health?.components ? (
              Object.entries(health.components).map(([name, status]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 capitalize">{name}</span>
                  <span className={`text-sm font-medium ${status === 'healthy' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {status === 'healthy' ? '● Healthy' : '● Unhealthy'}
                  </span>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">API</span>
                  <span className="text-sm font-medium text-slate-500">N/A</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Database</span>
                  <span className="text-sm font-medium text-slate-500">N/A</span>
                </div>
              </>
            )}
            <div className="pt-2 border-t border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Overall Status</span>
                <span className={`text-sm font-medium ${health?.overall === 'healthy' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {health?.overall ? (health.overall === 'healthy' ? '● Healthy' : '● ' + health.overall) : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {health?.byNamespace && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-400" />
              Health by Namespace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(health.byNamespace).map(([namespace, healthSummary]) => (
                <Link
                  key={namespace}
                  to={`${ROUTES.RESOURCES.LIST}?namespace=${namespace}`}
                  className="p-4 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-200">{namespace}</span>
                    <StatusBadge status={getOverallHealth(healthSummary)} type="health" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="text-emerald-400">{healthSummary.healthy} healthy</span>
                    <span>•</span>
                    <span className="text-red-400">{healthSummary.degraded} degraded</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

interface HealthBarProps {
  summary?: HealthSummary;
  health?: DashboardHealthData | null;
}

function HealthBar({ summary, health }: HealthBarProps) {
  const healthy = health?.resources?.healthy ?? summary?.healthy ?? 0;
  const unhealthy = health?.resources?.unhealthy ?? summary?.degraded ?? 0;
  const progressing = summary?.progressing ?? 0;
  const unknown = summary?.unknown ?? 0;
  const suspended = summary?.suspended ?? 0;

  const total = health?.resources?.total ?? (healthy + unhealthy + progressing + unknown + suspended);
  if (total === 0) return null;

  const segments = [
    { value: healthy, color: 'bg-emerald-500' },
    { value: progressing, color: 'bg-blue-500' },
    { value: unhealthy, color: 'bg-red-500' },
    { value: unknown, color: 'bg-slate-500' },
    { value: suspended, color: 'bg-yellow-500' },
  ];

  return (
    <div className="h-2 rounded-full bg-slate-700 overflow-hidden flex">
      {segments.map((segment, index) => {
        const width = (segment.value / total) * 100;
        if (width === 0) return null;
        return (
          <div
            key={index}
            className={cn(segment.color, 'transition-all')}
            // eslint-disable-next-line no-restricted-syntax -- dynamic stacked health bar segment
            style={{ width: `${width}%` }}
          />
        );
      })}
    </div>
  );
}

function getOverallHealth(summary: HealthSummary): HealthStatus {
  if (summary.degraded > 0) return 'Degraded';
  if (summary.progressing > 0) return 'Progressing';
  return 'Healthy';
}
