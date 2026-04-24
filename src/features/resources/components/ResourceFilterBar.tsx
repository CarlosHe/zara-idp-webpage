import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Select,
  Button,
} from '@/shared/components/ui';
import type { Namespace, ResourceKind } from '@/shared/types';
import { kindOptions } from './constants';

interface ResourceFilterBarProps {
  kindFilter: ResourceKind | null;
  namespaceFilter: string | null;
  namespaces: Namespace[];
  onKindChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onNamespaceChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onClearFilters: () => void;
}

export function ResourceFilterBar({
  kindFilter,
  namespaceFilter,
  namespaces,
  onKindChange,
  onNamespaceChange,
  onClearFilters,
}: ResourceFilterBarProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            id="kind-filter"
            label="Resource Kind"
            value={kindFilter || ''}
            onChange={onKindChange}
          >
            {kindOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <Select
            id="namespace-filter"
            label="Namespace"
            value={namespaceFilter || ''}
            onChange={onNamespaceChange}
          >
            <option value="">All Namespaces</option>
            {namespaces.map((ns) => (
              <option key={ns.name} value={ns.name}>
                {ns.name}
              </option>
            ))}
          </Select>

          <div className="flex items-end">
            <Button variant="secondary" onClick={onClearFilters} className="w-full">
              Clear Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
