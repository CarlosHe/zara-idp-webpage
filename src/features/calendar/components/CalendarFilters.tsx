import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/components/ui';

interface CalendarFiltersProps {
  onToday: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function CalendarFilters({ onToday, onPrevious, onNext }: CalendarFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={onToday}>
        Today
      </Button>
      <Button variant="ghost" size="sm" onClick={onPrevious}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={onNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
