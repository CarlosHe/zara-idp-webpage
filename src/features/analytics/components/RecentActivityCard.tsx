import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui';
import type { ActivityItem } from '@/features/analytics/hooks/useAnalyticsDashboard';

interface RecentActivityCardProps {
  activities: ActivityItem[];
}

function StatusIcon({ status }: { status: ActivityItem['status'] }) {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    case 'failure':
      return <XCircle className="h-4 w-4 text-red-400" />;
    case 'blocked':
      return <AlertTriangle className="h-4 w-4 text-amber-400" />;
  }
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-400" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-2 rounded-lg bg-slate-800/50"
              >
                <StatusIcon status={activity.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">
                    <span className="font-medium">{activity.action}</span>{' '}
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
  );
}
