import { Link } from 'react-router-dom';
import { Activity, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui';
import { ROUTES } from '@/shared/config';
import { cn, formatRelativeTime } from '@/shared/utils';
import type { AuditEntry, DashboardSummary } from '@/shared/types';

interface DashboardActivityProps {
  auditLogs: AuditEntry[] | undefined;
  summary: DashboardSummary | undefined;
}

export function DashboardActivity({ auditLogs, summary }: DashboardActivityProps) {
  const hasAuditLogs = Array.isArray(auditLogs) && auditLogs.length > 0;
  const hasSummaryEvents = !hasAuditLogs && !!summary?.recentEvents && summary.recentEvents.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-slate-400" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasAuditLogs ? (
          <div className="space-y-3">
            {auditLogs!.slice(0, 5).map((log, index) => (
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
                  <p className="text-xs text-slate-400 mt-1">
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
        ) : hasSummaryEvents ? (
          <div className="space-y-3">
            {summary!.recentEvents.slice(0, 5).map((event, index) => (
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
                  <p className="text-xs text-slate-400 mt-1">
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
            <p className="text-xs text-slate-400 mt-1">Activity will appear here as changes are made</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
