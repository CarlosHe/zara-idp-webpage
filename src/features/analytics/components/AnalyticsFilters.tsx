import { Select } from '@/shared/components/ui';
import type { AnalyticsTimeRange } from '@/features/analytics/hooks/useAnalyticsDashboard';

interface AnalyticsFiltersProps {
  value: AnalyticsTimeRange;
  onChange: (value: AnalyticsTimeRange) => void;
}

export function AnalyticsFilters({ value, onChange }: AnalyticsFiltersProps) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value as AnalyticsTimeRange)}
      className="w-32"
      options={[
        { value: '7d', label: 'Last 7 days' },
        { value: '30d', label: 'Last 30 days' },
        { value: '90d', label: 'Last 90 days' },
      ]}
    />
  );
}
