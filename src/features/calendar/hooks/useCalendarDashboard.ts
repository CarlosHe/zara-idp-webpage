import { useMemo, useState } from 'react';
import { useListFreezesQuery } from '@/features/freezes/services/freezesApi';
import type { Freeze } from '@/shared/types';

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  freezes: Freeze[];
}

export interface CalendarStats {
  freezeDays: number;
  safeDeployDays: number;
  totalFreezes: number;
}

export interface UseCalendarDashboardResult {
  currentDate: Date;
  calendarDays: CalendarDay[];
  activeFreezes: Freeze[];
  upcomingFreezes: Freeze[];
  stats: CalendarStats;
  previousMonth: () => void;
  nextMonth: () => void;
  goToToday: () => void;
}

function getFreezesForDate(date: Date, freezes: Freeze[]): Freeze[] {
  return freezes.filter((freeze) => {
    const startDate = new Date(freeze.createdAt);
    const endDate = freeze.expiresAt ? new Date(freeze.expiresAt) : new Date('2099-12-31');
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    return date >= startDate && date <= endDate;
  });
}

export function useCalendarDashboard(): UseCalendarDashboardResult {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: freezes } = useListFreezesQuery();

  const safeFreezes = useMemo(
    () => (Array.isArray(freezes) ? freezes : []),
    [freezes],
  );

  const calendarDays = useMemo<CalendarDay[]>(() => {
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

  const activeFreezes = useMemo(
    () => safeFreezes.filter((f) => f.active),
    [safeFreezes],
  );

  const upcomingFreezes = useMemo(
    () =>
      safeFreezes.filter((f) => {
        const startDate = new Date(f.createdAt);
        return !f.active && startDate > new Date();
      }),
    [safeFreezes],
  );

  const stats = useMemo<CalendarStats>(() => {
    const freezeDays = calendarDays.filter(
      (d) => d.isCurrentMonth && d.freezes.length > 0,
    ).length;
    const safeDeployDays = calendarDays.filter(
      (d) => d.isCurrentMonth && d.freezes.length === 0,
    ).length;
    return {
      freezeDays,
      safeDeployDays,
      totalFreezes: safeFreezes.length,
    };
  }, [calendarDays, safeFreezes]);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return {
    currentDate,
    calendarDays,
    activeFreezes,
    upcomingFreezes,
    stats,
    previousMonth,
    nextMonth,
    goToToday,
  };
}
