import { Calendar as CalendarIcon } from 'lucide-react';
import { PageHeader } from '@/shared/components/feedback';
import { useCalendarDashboard } from '../hooks/useCalendarDashboard';
import { CalendarGrid } from './CalendarGrid';
import { CalendarEventList } from './CalendarEventList';

export function CalendarPage() {
  const {
    currentDate,
    calendarDays,
    activeFreezes,
    upcomingFreezes,
    stats,
    previousMonth,
    nextMonth,
    goToToday,
  } = useCalendarDashboard();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<CalendarIcon className="h-6 w-6" />}
        iconClassName="text-blue-400"
        title="Change Calendar"
        description="View freeze windows and plan your deployments"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CalendarGrid
          currentDate={currentDate}
          calendarDays={calendarDays}
          onToday={goToToday}
          onPreviousMonth={previousMonth}
          onNextMonth={nextMonth}
        />
        <CalendarEventList
          activeFreezes={activeFreezes}
          upcomingFreezes={upcomingFreezes}
          stats={stats}
        />
      </div>
    </div>
  );
}
