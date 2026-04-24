import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui';
import type { CalendarDay } from '../hooks/useCalendarDashboard';
import { CalendarDayCell } from './CalendarDayCell';
import { CalendarFilters } from './CalendarFilters';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarGridProps {
  currentDate: Date;
  calendarDays: CalendarDay[];
  onToday: () => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

export function CalendarGrid({
  currentDate,
  calendarDays,
  onToday,
  onPreviousMonth,
  onNextMonth,
}: CalendarGridProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </CardTitle>
          <CalendarFilters
            onToday={onToday}
            onPrevious={onPreviousMonth}
            onNext={onNextMonth}
          />
        </div>
      </CardHeader>
      <CardContent>
        {/* Week day headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEK_DAYS.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-slate-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <CalendarDayCell key={index} day={day} />
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
  );
}
