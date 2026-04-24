import { Snowflake, AlertTriangle, Clock, Users } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from '@/shared/components/ui';
import { cn } from '@/shared/utils';
import type { Freeze } from '@/shared/types';
import type { CalendarStats } from '../hooks/useCalendarDashboard';

interface CalendarEventListProps {
  activeFreezes: Freeze[];
  upcomingFreezes: Freeze[];
  stats: CalendarStats;
}

export function CalendarEventList({
  activeFreezes,
  upcomingFreezes,
  stats,
}: CalendarEventListProps) {
  return (
    <div className="space-y-6">
      {/* Active Freezes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <Snowflake className="h-5 w-5" />
            Active Freezes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeFreezes.length > 0 ? (
            <div className="space-y-3">
              {activeFreezes.map((freeze) => (
                <FreezeCard key={freeze.id} freeze={freeze} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">
              No active freezes
            </p>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Freezes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-400">
            <Clock className="h-5 w-5" />
            Upcoming Freezes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingFreezes.length > 0 ? (
            <div className="space-y-3">
              {upcomingFreezes.slice(0, 3).map((freeze) => (
                <FreezeCard key={freeze.id} freeze={freeze} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">
              No upcoming freezes scheduled
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>This Month</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Freeze Days</span>
            <span className="text-sm font-medium text-white">{stats.freezeDays}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Safe Deploy Days</span>
            <span className="text-sm font-medium text-emerald-400">
              {stats.safeDeployDays}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Total Freezes</span>
            <span className="text-sm font-medium text-white">{stats.totalFreezes}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface FreezeCardProps {
  freeze: Freeze;
}

function FreezeCard({ freeze }: FreezeCardProps) {
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-medium text-white">
          {freeze.reason || 'Freeze Window'}
        </span>
        <Badge
          className={cn(
            freeze.active
              ? 'bg-red-500/20 text-red-400'
              : 'bg-amber-500/20 text-amber-400',
          )}
        >
          {freeze.active ? 'Active' : 'Scheduled'}
        </Badge>
      </div>
      <div className="space-y-1 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDate(freeze.createdAt)} -{' '}
          {freeze.expiresAt ? formatDate(freeze.expiresAt) : 'No end date'}
        </div>
        {freeze.scope?.namespaces && freeze.scope.namespaces.length > 0 && (
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            <span>Namespaces: {freeze.scope.namespaces.join(', ')}</span>
          </div>
        )}
        {freeze.scope?.teams && freeze.scope.teams.length > 0 && (
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>Teams: {freeze.scope.teams.join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
