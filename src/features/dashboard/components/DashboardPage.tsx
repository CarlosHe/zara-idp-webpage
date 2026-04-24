import { Link } from 'react-router-dom';
import {
  Box,
  Users,
  AlertCircle,
  CheckSquare,
  Snowflake,
  Activity,
  Clock,
  LayoutDashboard,
} from 'lucide-react';
import {
  useGetDashboardSummaryQuery,
  useGetDashboardHealthQuery,
} from '@/features/dashboard/services/dashboardApi';
import { useListAuditLogsQuery } from '@/features/audit/services/auditApi';
import { errorMessage } from '@/shared/lib/api';
import { ROUTES } from '@/shared/config';
import { Card, CardHeader, CardTitle, CardContent, StatusBadge } from '@/shared/components/ui';
import { PageHeader, LoadingState, ErrorState, StatCard } from '@/shared/components/feedback';
import { cn, formatRelativeTime } from '@/shared/utils';
import type { HealthStatus } from '@/shared/types';

export function DashboardPage() {
  const summaryQuery = useGetDashboardSummaryQuery();
  const healthQuery = useGetDashboardHealthQuery();
  const auditQuery = useListAuditLogsQuery();

  const summary = summaryQuery.data;
  const health = healthQuery.data;
  const auditLogs = auditQuery.data;
  const loading = summaryQuery.isLoading || healthQuery.isLoading;
  const error = summaryQuery.error || healthQuery.error;

  const refreshDashboard = () => {
    summaryQuery.refetch();
    healthQuery.refetch();
  };

  if (loading && !summary && !health) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (error) {
    const message = errorMessage(error) || 'Failed to load dashboard';
    return <ErrorState message={message} onRetry={refreshDashboard} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        icon={<LayoutDashboard className="h-6 w-6" />}
        iconClassName="text-blue-400"
        title="Dashboard"
        description="Overview of your infrastructure state"
        onRefresh={() => {
          dispatch(fetchDashboardSummary());
          dispatch(fetchDashboardHealth());
        }}
      />

      {/* Stats Grid */}
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

      {/* Health Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Health */}
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

            {/* Health Bar */}
            <HealthBar summary={summary?.healthSummary} health={health} />
          </CardContent>
        </Card>

        {/* System Components */}
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

      {/* Health by Namespace */}
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

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-400" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Array.isArray(auditLogs) && auditLogs.length > 0 ? (
            <div className="space-y-3">
              {auditLogs.slice(0, 5).map((log, index) => (
                <div
                  key={log.id || index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30"
                >
                  <div
                    className={cn(
                      'mt-0.5 h-2 w-2 rounded-full',
                      log.result === 'success' ? 'bg-emerald-400' : 
                      log.result === 'failure' ? 'bg-red-400' : 'bg-blue-400'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200">
                      <span className="font-medium">{log.action || 'Action'}</span>
                      {' on '}
                      <span className="text-blue-400">{log.resourceKind}/{log.resourceName}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {log.actor || 'system'} • {formatRelativeTime(log.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              <Link
                to={ROUTES.AUDIT.LIST}
                className="block text-center text-sm text-blue-400 hover:text-blue-300 pt-2"
              >
                View all activity →
              </Link>
            </div>
          ) : summary?.recentEvents && summary.recentEvents.length > 0 ? (
            <div className="space-y-3">
              {summary.recentEvents.slice(0, 5).map((event, index) => (
                <div
                  key={event.id || index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30"
                >
                  <div
                    className={cn(
                      'mt-0.5 h-2 w-2 rounded-full',
                      event.type === 'Warning' ? 'bg-yellow-400' : 'bg-blue-400'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200">{event.message}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {event.reason} • {formatRelativeTime(event.lastTimestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No recent activity</p>
              <p className="text-xs text-slate-500 mt-1">Activity will appear here as changes are made</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Components
interface HealthBarProps {
  summary?: {
    healthy: number;
    progressing: number;
    degraded: number;
    unknown: number;
    suspended: number;
  };
  health?: {
    resources?: {
      total: number;
      healthy: number;
      unhealthy: number;
    };
  } | null;
}

function HealthBar({ summary, health }: HealthBarProps) {
  // Use health data if available, fallback to summary
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
            style={{ width: `${width}%` }}
          />
        );
      })}
    </div>
  );
}

function getOverallHealth(summary: { healthy: number; degraded: number; progressing: number }): HealthStatus {
  if (summary.degraded > 0) return 'Degraded';
  if (summary.progressing > 0) return 'Progressing';
  return 'Healthy';
}
