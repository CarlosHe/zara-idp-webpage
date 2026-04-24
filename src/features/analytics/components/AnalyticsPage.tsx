import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Select,
} from '@/shared/components/ui';
import { PageHeader, LoadingState, ErrorState, StatCard } from '@/shared/components/feedback';
import { cn } from '@/shared/utils';
import { api } from '@/shared/lib/api';

interface TimeSeriesData {
  date: string;
  value: number;
}

interface TopResource {
  name: string;
  namespace: string;
  kind: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

interface ActivityItem {
  id: string;
  action: string;
  resource: string;
  actor: string;
  timestamp: string;
  status: 'success' | 'failure' | 'blocked';
}

interface HealthDistribution {
  healthy: number;
  degraded: number;
  unhealthy: number;
}

interface ResourceByKind {
  kind: string;
  count: number;
  percentage: number;
}

interface AnalyticsSummary {
  totalResources: number;
  deploymentsToday: number;
  activeTeams: number;
  avgDeployTime: string;
  resourcesChange: number;
  deploymentsChange: number;
  teamsChange: number;
  deployTimeChange: number;
  successRate: number;
  mttr: string;
  changeFrequency: number;
}

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for all analytics data
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [deploymentsData, setDeploymentsData] = useState<TimeSeriesData[]>([]);
  const [topResources, setTopResources] = useState<TopResource[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [healthDistribution, setHealthDistribution] = useState<HealthDistribution>({ healthy: 0, degraded: 0, unhealthy: 0 });
  const [resourcesByKind, setResourcesByKind] = useState<ResourceByKind[]>([]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all analytics data in parallel
      const [summaryRes, trendsRes, resourcesRes] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getAnalyticsTrends(timeRange),
        api.getAnalyticsResources(),
      ]);

      // Map summary data
      if (summaryRes) {
        const s = summaryRes;
        setSummary({
          totalResources: s.resources?.total || 0,
          deploymentsToday: 0, // Not available in current API
          activeTeams: s.teams?.total || 0,
          avgDeployTime: '0m', // Not available in current API
          resourcesChange: s.resources?.growth?.daily || 0,
          deploymentsChange: 0, // Not available in current API
          teamsChange: 0, // Not available in current API
          deployTimeChange: 0, // Not available in current API
          successRate: 0, // Not available in current API
          mttr: '0m', // Not available in current API
          changeFrequency: 0, // Not available in current API
        });
        
        // Health distribution from resources byStatus
        const byStatus = s.resources?.byStatus || {};
        setHealthDistribution({
          healthy: byStatus.Healthy || 0,
          degraded: byStatus.Degraded || 0,
          unhealthy: byStatus.Unhealthy || 0,
        });
        
        // Top resources - not available in current structure
        setTopResources([]);
        
        // Recent activity - not available in current structure
        setRecentActivity([]);
      }

      // Map trends data
      if (trendsRes) {
        const deployments = trendsRes.deployments || [];
        if (Array.isArray(deployments)) {
          setDeploymentsData(deployments.map((d: any) => ({
            date: d.date,
            value: d.value || d.count || 0,
          })));
        }
      }

      // Map resources by kind
      if (resourcesRes) {
        const byKind = resourcesRes.byKind || {};
        const total = resourcesRes.total || 0;
        const kindEntries = Object.entries(byKind).map(([kind, count]) => ({
          kind,
          count: count as number,
          percentage: total > 0 ? Math.round((count as number / total) * 100) : 0,
        }));
        setResourcesByKind(kindEntries);
      }
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getStatusIcon = (status: ActivityItem['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case 'failure':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'blocked':
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    }
  };

  const getTrendIcon = (trend: TopResource['trend']) => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-4 w-4 text-emerald-400" />;
      case 'down':
        return <ArrowDownRight className="h-4 w-4 text-red-400" />;
      default:
        return <Activity className="h-4 w-4 text-slate-400" />;
    }
  };

  if (loading) {
    return <LoadingState message="Loading analytics..." iconClassName="text-indigo-400" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchAnalytics} />;
  }

  const maxDeployments = Math.max(...deploymentsData.map((d) => d.value), 1);
  const totalHealth = healthDistribution.healthy + healthDistribution.degraded + healthDistribution.unhealthy;
  const healthPercentage = totalHealth > 0 ? Math.round((healthDistribution.healthy / totalHealth) * 100) : 100;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        icon={<BarChart3 className="h-6 w-6" />}
        iconClassName="text-indigo-400"
        title="Analytics"
        description="Platform metrics and insights"
        onRefresh={fetchAnalytics}
        actions={
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
            className="w-32"
            options={[
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: '90d', label: 'Last 90 days' },
            ]}
          />
        }
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Boxes className="h-5 w-5 text-blue-400" />}
          iconBgColor="bg-blue-500/20"
          label="Total Resources"
          value={summary?.totalResources || 0}
          trend={summary?.resourcesChange}
          trendLabel="vs last month"
        />
        <StatCard
          icon={<Activity className="h-5 w-5 text-emerald-400" />}
          iconBgColor="bg-emerald-500/20"
          label="Deployments Today"
          value={summary?.deploymentsToday || 0}
          trend={summary?.deploymentsChange}
          trendLabel="vs yesterday"
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-purple-400" />}
          iconBgColor="bg-purple-500/20"
          label="Active Teams"
          value={summary?.activeTeams || 0}
          trend={summary?.teamsChange}
          trendLabel="vs last month"
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-amber-400" />}
          iconBgColor="bg-amber-500/20"
          label="Avg Deploy Time"
          value={summary?.avgDeployTime || '0m'}
          trend={summary?.deployTimeChange}
          trendLabel="improvement"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deployments Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-400" />
              Deployment Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deploymentsData.length > 0 ? (
              <>
                <div className="h-48 flex items-end gap-1">
                  {deploymentsData.map((data, index) => {
                    const height = (data.value / maxDeployments) * 100;
                    return (
                      <div
                        key={index}
                        className="flex-1 flex flex-col items-center gap-1"
                        title={`${data.date}: ${data.value} deployments`}
                      >
                        <div
                          className={cn(
                            'w-full rounded-t transition-all hover:opacity-80',
                            data.value >= 70 ? 'bg-emerald-500' : data.value >= 50 ? 'bg-blue-500' : 'bg-slate-500'
                          )}
                          style={{ height: `${height}%` }}
                        />
                        <span className="text-[10px] text-slate-500">
                          {new Date(data.date).getDate()}
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
                    Total: {deploymentsData.reduce((sum, d) => sum + d.value, 0)} deployments
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

        {/* Health Distribution */}
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
                <span className="text-sm font-medium text-white">{healthDistribution.healthy}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Degraded
                </span>
                <span className="text-sm font-medium text-white">{healthDistribution.degraded}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-400" />
                  Unhealthy
                </span>
                <span className="text-sm font-medium text-white">{healthDistribution.unhealthy}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resources by Kind */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-purple-400" />
              Resources by Kind
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resourcesByKind.length > 0 ? (
              <div className="space-y-4">
                {resourcesByKind.map((item) => (
                  <div key={item.kind}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-300">{item.kind}</span>
                      <span className="text-sm text-slate-400">{item.count}</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">No resource data available</p>
            )}
          </CardContent>
        </Card>

        {/* Top Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
              Most Active Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topResources.length > 0 ? (
              <div className="space-y-3">
                {topResources.map((resource, index) => (
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
                      {getTrendIcon(resource.trend)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">No active resources</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-2 rounded-lg bg-slate-800/50"
                  >
                    {getStatusIcon(activity.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">
                        <span className="font-medium">{activity.action}</span>
                        {' '}
                        <span className="text-blue-400">{activity.resource}</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {activity.actor} • {formatRelativeTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-400">Success Rate</p>
                <p className="text-3xl font-bold text-white mt-1">{summary?.successRate || 0}%</p>
                <p className="text-xs text-slate-400 mt-2">Last 7 days</p>
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
                <p className="text-3xl font-bold text-white mt-1">{summary?.mttr || '0m'}</p>
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
                <p className="text-3xl font-bold text-white mt-1">{summary?.changeFrequency || 0}/day</p>
                <p className="text-xs text-slate-400 mt-2">Avg deploys per day</p>
              </div>
              <Activity className="h-12 w-12 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
