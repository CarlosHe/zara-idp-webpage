import { Input } from '@/shared/components/ui';
import type { AdvancedFiltersState } from './useSearchPage';

interface AdvancedFiltersProps {
  value: AdvancedFiltersState;
  onChange: (partial: Partial<AdvancedFiltersState>) => void;
}

export function AdvancedFilters({ value, onChange }: AdvancedFiltersProps) {
  const fields: Array<{ key: keyof AdvancedFiltersState; label: string; placeholder: string }> = [
    { key: 'kind', label: 'Kind', placeholder: 'Service / API / Database' },
    { key: 'namespace', label: 'Namespace', placeholder: 'default' },
    { key: 'owner', label: 'Owner', placeholder: '@team-x' },
    { key: 'lifecycle', label: 'Lifecycle', placeholder: 'production / staging' },
  ];

  return (
    <fieldset className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Advanced filters">
      <legend className="sr-only">Advanced filters</legend>
      {fields.map((field) => {
        const id = `advanced-${field.key}`;
        return (
          <div key={field.key} className="flex flex-col gap-1">
            <label htmlFor={id} className="text-xs uppercase text-slate-400">
              {field.label}
            </label>
            <Input
              id={id}
              value={value[field.key]}
              onChange={(event) => onChange({ [field.key]: event.target.value })}
              placeholder={field.placeholder}
            />
          </div>
        );
      })}
    </fieldset>
  );
}
