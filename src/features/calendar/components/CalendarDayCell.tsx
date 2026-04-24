import { Snowflake } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { CalendarDay } from '../hooks/useCalendarDashboard';

interface CalendarDayCellProps {
  day: CalendarDay;
}

export function CalendarDayCell({ day }: CalendarDayCellProps) {
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
        hasFreezes && (hasFullFreeze ? 'bg-cyan-500/10' : 'bg-amber-500/10'),
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            'text-sm font-medium',
            day.isCurrentMonth ? 'text-slate-200' : 'text-slate-600',
            day.isToday && 'text-blue-400',
          )}
        >
          {day.date.getDate()}
        </span>
        {hasFreezes && (
          <Snowflake
            className={cn(
              'h-3 w-3',
              hasFullFreeze ? 'text-cyan-400' : 'text-amber-400',
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
                  : 'bg-cyan-500/20 text-cyan-300',
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
