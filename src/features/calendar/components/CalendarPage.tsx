import { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Snowflake,
  AlertTriangle,
  Clock,
  Users,
} from 'lucide-react';
import { useListFreezesQuery } from '@/features/freezes/services/freezesApi';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
} from '@/shared/components/ui';
import { PageHeader } from '@/shared/components/feedback';
import { cn } from '@/shared/utils';
import type { Freeze } from '@/shared/types';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  freezes: Freeze[];
}

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: freezes } = useListFreezesQuery();

  const safeFreezes = useMemo(() => (Array.isArray(freezes) ? freezes : []), [freezes]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add days from previous month
    const prevMonth = new Date(year, month, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonth.getDate() - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        freezes: getFreezesForDate(date, safeFreezes),
      });
    }

    // Add days of current month
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        freezes: getFreezesForDate(date, safeFreezes),
      });
    }

    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        freezes: getFreezesForDate(date, safeFreezes),
      });
    }

    return days;
  }, [currentDate, safeFreezes]);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get active and upcoming freezes
  const activeFreezes = safeFreezes.filter((f) => f.active);
  const upcomingFreezes = safeFreezes.filter((f) => {
    const startDate = new Date(f.createdAt);
    return !f.active && startDate > new Date();
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        icon={<CalendarIcon className="h-6 w-6" />}
        iconClassName="text-blue-400"
        title="Change Calendar"
        description="View freeze windows and plan your deployments"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={goToToday}>
                  Today
                </Button>
                <Button variant="ghost" size="sm" onClick={previousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Week day headers */}
            <div className="grid grid-cols-7 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-slate-500 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <CalendarCell key={index} day={day} />
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-cyan-500/50" />
                <span className="text-sm text-slate-400">Freeze Window</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500/50" />
                <span className="text-sm text-slate-400">Partial Freeze</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-slate-400">Today</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
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
                <span className="text-sm font-medium text-white">
                  {countFreezeDays(calendarDays)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Safe Deploy Days</span>
                <span className="text-sm font-medium text-emerald-400">
                  {calendarDays.filter((d) => d.isCurrentMonth && d.freezes.length === 0).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Total Freezes</span>
                <span className="text-sm font-medium text-white">{safeFreezes.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface CalendarCellProps {
  day: CalendarDay;
}

function CalendarCell({ day }: CalendarCellProps) {
  const hasFreezes = day.freezes.length > 0;
  const hasFullFreeze = day.freezes.some((f) => !f.scope?.namespaces?.length);

  return (
    <div
      className={cn(
        'min-h-[80px] p-2 rounded-lg border transition-colors',
        day.isCurrentMonth
          ? 'border-slate-700 bg-slate-800/30'
          : 'border-transparent bg-slate-800/10',
        day.isToday && 'ring-2 ring-blue-500',
        hasFreezes && (hasFullFreeze ? 'bg-cyan-500/10' : 'bg-amber-500/10')
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            'text-sm font-medium',
            day.isCurrentMonth ? 'text-slate-200' : 'text-slate-600',
            day.isToday && 'text-blue-400'
          )}
        >
          {day.date.getDate()}
        </span>
        {hasFreezes && (
          <Snowflake
            className={cn(
              'h-3 w-3',
              hasFullFreeze ? 'text-cyan-400' : 'text-amber-400'
            )}
          />
        )}
      </div>
      {hasFreezes && (
        <div className="space-y-1">
          {day.freezes.slice(0, 2).map((freeze, i) => (
            <div
              key={i}
              className={cn(
                'text-xs truncate px-1 py-0.5 rounded',
                freeze.scope?.namespaces?.length
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-cyan-500/20 text-cyan-300'
              )}
            >
              {freeze.reason || 'Freeze'}
            </div>
          ))}
          {day.freezes.length > 2 && (
            <span className="text-xs text-slate-500">+{day.freezes.length - 2} more</span>
          )}
        </div>
      )}
    </div>
  );
}

interface FreezeCardProps {
  freeze: Freeze;
}

function FreezeCard({ freeze }: FreezeCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
              : 'bg-amber-500/20 text-amber-400'
          )}
        >
          {freeze.active ? 'Active' : 'Scheduled'}
        </Badge>
      </div>
      <div className="space-y-1 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDate(freeze.createdAt)} - {freeze.expiresAt ? formatDate(freeze.expiresAt) : 'No end date'}
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

// Helper functions
function getFreezesForDate(date: Date, freezes: Freeze[]): Freeze[] {
  return freezes.filter((freeze) => {
    const startDate = new Date(freeze.createdAt);
    const endDate = freeze.expiresAt ? new Date(freeze.expiresAt) : new Date('2099-12-31');
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    return date >= startDate && date <= endDate;
  });
}

function countFreezeDays(days: CalendarDay[]): number {
  return days.filter((d) => d.isCurrentMonth && d.freezes.length > 0).length;
}
