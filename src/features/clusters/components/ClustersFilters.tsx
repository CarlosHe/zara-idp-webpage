import { Search } from 'lucide-react';
import { Button, Input } from '@/shared/components/ui';

interface ClustersFiltersProps {
  searchQuery: string;
  selectedEnvironment: string | null;
  onSearchChange: (value: string) => void;
  onEnvironmentChange: (value: string | null) => void;
}

const ENVIRONMENTS: Array<{ value: string | null; label: string }> = [
  { value: null, label: 'All' },
  { value: 'production', label: 'Production' },
  { value: 'staging', label: 'Staging' },
  { value: 'development', label: 'Development' },
];

export function ClustersFilters({
  searchQuery,
  selectedEnvironment,
  onSearchChange,
  onEnvironmentChange,
}: ClustersFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search clusters by name, region, or provider..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex gap-2">
        {ENVIRONMENTS.map((env) => (
          <Button
            key={env.label}
            variant={selectedEnvironment === env.value ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onEnvironmentChange(env.value)}
          >
            {env.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
